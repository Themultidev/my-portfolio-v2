# Portfolio v2

Migration of the existing portfolio to Next.js App Router and TypeScript.
The original markup, classes, assets, global stylesheet, AOS configuration,
and EmailJS contact behavior are preserved. See `prd.md` for the complete scope
and `migration/README.md` for the commit sequence and static reference.

## Local development

Use Node.js 20.9 or newer. For a fresh setup, copy `.env.example` to `.env`
(or `.env.local`) and fill in the public EmailJS identifiers and private
`ADMIN_EMAIL`/`ADMIN_PASSWORD` before running
the commands below. Keep your existing environment file if you already have one.

Then:

```sh
npm ci
npm run auth:setup
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Existing `.env` files using
`VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and
`VITE_EMAILJS_PUBLIC_KEY` remain supported. Restart Next.js after changing them.

Next.js can generate `AGENTS.md` and `CLAUDE.md` during development. These files
direct coding assistants to the installed framework documentation and do not
affect the website.

## Verification

```sh
npm run typecheck
npm run lint
npm run check:parity
npm run build
npm run check:visual
npm run start
```

The parity check compares the rendered React sections to the captured static
source for structure, class strings, attributes, and text. It also verifies
the original global CSS is unchanged. Comments and indentation-only text are
ignored, inline style serialization is normalized, React image preloads are
ignored, and the original empty `minlength` is treated as absent. Browser
screenshots at the three required widths are checked by `npm run check:visual`.

The browser check launches the original Vite site and the built Next.js site,
then compares both public pages at 375, 768, and 1440 pixels. Install Google
Chrome locally; the tests use its headless channel. Run the production build
before these checks. Images are compared with a 0.1 color threshold and
anti-aliasing differences excluded; differing non-antialiased pixels fail.

Animations are frozen and the third-party embedded map is masked in both
screenshots. DOM comparisons ignore Next's nonvisual metadata placeholder and
route announcer, normalize CSS values through the browser, and compare the
original section classes and visible content. A separate test exercises AOS.

Google Fonts may be inaccessible in automated browser environments. Tests
replay the same font families from test-only Fontsource packages for
[Michroma](https://fontsource.org/fonts/michroma/about) and
[Google Sans Code](https://fontsource.org/fonts/google-sans-code).
The public Google Fonts links are unchanged. Test artifacts under
`test-results/` include before/after screenshots and loaded-font status.
This verifies layout using these font fixtures, not availability of Google's
font service or the live map. Contact tests mock EmailJS responses; no email
is sent.

## Database setup

The database layer supports local SQLite and hosted PostgreSQL with Prisma 6.
Prisma commands load `.env` and `.env.local` with the same precedence as Next.js.
The local default is `file:./dev.db`, relative to `prisma/schema.prisma`.
A `postgres://` or `postgresql://` `DATABASE_URL` selects the PostgreSQL schema
and its separate migration history. Run `npm run db:generate` whenever changing
database providers. Neither database credentials nor SQLite files belong in Git.

Vercel uses Neon PostgreSQL and a **public** Vercel Blob store. Local SQLite and
filesystem uploads remain available for development; Vercel rejects that setup
before deployment because its functions cannot persist those files.

Prisma CLI commands use `RUST_LOG=info` so missing-file errors are parsed
correctly even in environments that suppress engine logs. This works around
the Prisma 6 CLI's [first-stderr-line parsing issue](https://github.com/prisma/orm/pull/29845)
and does not change application logging.

```sh
npm run db:generate
npm run db:migrate
```

`db:migrate` applies the committed migration history. During development,
`npm run db:push` can synchronize a disposable database with the schema;
use committed migrations for shared and production databases. Local builds
generate the client. Vercel builds also migrate and initialize an empty database;
existing populated databases are retained without restoring deleted seed rows.
The PostgreSQL models mirror SQLite. After changing models, regenerate the
PostgreSQL schema with `node scripts/sync-postgres-schema.mjs` and add migrations
for both providers before deploying.

## Deploy on Vercel

Connect Neon and a **public** Blob store to the Vercel project. In the environment
settings for the deployment, configure:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled PostgreSQL connection string, including SSL settings |
| `DIRECT_URL` | Neon direct/unpooled connection string for migrations |
| `BLOB_READ_WRITE_TOKEN` | Token supplied by the connected public Blob store |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Initial admin credentials; password at least 12 characters, at most 72 UTF-8 bytes |
| `SESSION_SECRET` | Private random secret of at least 32 UTF-8 bytes |
| `APP_ORIGIN` | `https://worluprincesoftwareengineer.vercel.app` |

Keep existing public EmailJS settings too. Set the Vercel build command to
`npm run build`. Push the code and redeploy after saving environment settings.
The build generates the matching Prisma client, applies PostgreSQL migrations,
and seeds only an entirely empty database. Missing storage settings or failed
database initialization stop the build with diagnostics instead of deploying an
unusable homepage. Partial database initialization must be resolved before retrying.

For a custom domain, change `APP_ORIGIN` to the exact HTTPS origin used to sign in,
without a path or trailing slash, then redeploy. Login checks the stored password
hash; changing `ADMIN_PASSWORD` does not reset an existing account.

### Transfer existing local edits

Do this **before the first cloud deployment initializes Neon** if you want your
current local account, edits, deleted cards, stack memberships and uploaded files.
The importer accepts only an empty migrated database and never overwrites rows.

1. Keep your local SQLite settings and run `npm run db:export`. It creates a
   private `.tmp/portfolio-export-<timestamp>.json` containing data, password hash
   and referenced PNG/PDF uploads. Keep this backup private and outside Git.
2. Configure Neon `DATABASE_URL`, `DIRECT_URL` and `BLOB_READ_WRITE_TOKEN` locally
   in the ignored environment file, or in your shell, using the same cloud services
   as Vercel. Then run `npm run db:generate` and `npm run db:migrate`.
3. Run `npm run db:import -- .tmp/portfolio-export-<timestamp>.json` with the actual
   backup filename. It preserves IDs, timestamps and the original login, uploads
   referenced files to Blob, and advances PostgreSQL sequences for future CRUD.
4. Deploy. Bootstrap retains the imported portfolio. Keep the original SQLite file
   and `public/uploads` backup until the deployed portfolio is verified.

To return to local SQLite development, restore the local environment settings and
run `npm run db:generate` again. Fresh cloud deployments can skip the transfer and
use the original seeded portfolio instead. Check migrations and runtime logs in
Vercel after deployment. `npm run test:deployment` verifies the schema, bootstrap
preservation, backup validation and Blob adapter with disposable local fixtures;
it does not connect to Neon or your real Blob store.

The models cover the single admin, plain-text content blocks, projects, stack
definitions, and ordered project/stack memberships. Project deletion removes
its memberships. Referenced stacks cannot be deleted. The five-stack limit
will be enforced in the project API and editor in their respective slices.
Read memberships by `order` and then `stackId` to keep ties deterministic.

`src/lib/db.ts` is restricted to server imports and reuses its Prisma client
during development reloads. Public pages read the content blocks on each request;
React's request-scoped cache deduplicates reads without retaining stale content.

Run `npm run test:db` to apply the migrations to a unique temporary SQLite
file and check uniqueness, foreign keys, deletion behavior, and persisted
icon order through a second client connection. The tests never touch your
configured database.

## Seed existing content

Before managing content, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` privately in
your existing `.env` (or `.env.local`), using `.env.example` for the variable names. The password must
have at least 12 characters and at most 72 UTF-8 bytes (bcrypt's input limit).
Intentional spaces are preserved. There is no default password. Never commit
your environment file or send the password in chat.

```sh
npm run db:migrate
npm run db:seed
```

The seed imports 218 plain-text blocks from the portfolio and overview, all
four projects in their original order, 20 stack definitions, and their ordered
project memberships. Text whitespace, mixed inline copy, placeholders, image
descriptions, and Native Cuts' existing feature list are retained. Existing
SVG artwork is bundled under `public/stacks/`, including the original mismatches
between some technology labels and their icons. Metadata and SVG titles stay
in the original components. The Portfolio card's absent link remains `null`.

The admin email is trimmed and lowercased; the password is hashed with bcrypt
cost 12. Missing or invalid credentials fail before writes. All imports run
in one transaction, so a conflict leaves no partial seed. Existing admin email
must match `ADMIN_EMAIL`, and more than one admin is rejected. Re-running the
seed preserves saved copy, renamed stacks, replacement icons, project fields,
chip selections/order, and the existing password hash. Changing the environment
password and seeding again does **not** reset the account password.

Seed a fresh database before creating content: project IDs 1–4 and stack IDs
1–20 identify the original entries. Missing original entries are restored on
an explicit re-run; existing entries are never overwritten. New entries use
auto-incremented IDs beyond these originals.

`prisma/seed-data.json` is the checked-in source manifest. Each block has a stable
key and its source location in the frozen baseline. Do not regenerate it from
edited content: `node scripts/capture-seed-data.mjs` deliberately derives it and
the bundled icons from `migration/static-baseline.json`, without using the
legacy standalone HTML pages. Project titles/descriptions are also represented
in the source text inventory; the upcoming project renderer will use Project
fields as their authoritative editable values.

`npm run test:seed` checks baseline coverage, bundled artwork, initial database
content, password hashes, repeat-run preservation, and atomic failures using
temporary SQLite files. It never seeds your configured database.
`npx prisma db seed` uses the same script through `prisma.config.ts`.

## Admin authentication

```sh
npm run auth:setup
npm run dev
```

`auth:setup` adds a random `SESSION_SECRET`, a local `APP_ORIGIN`, and an explicit
local `DATABASE_URL` to your ignored `.env` (or `.env.local` when present). It
preserves existing values and does not print the secret. Restart Next.js after
changing environment settings. Open `http://localhost:3000/login` and sign in
with the credentials you seeded. Login and `/admin` now open
`/admin/edit/portfolio`, the complete portfolio in edit mode. Use the fixed toolbar
to switch to `/admin/edit/overview` or `/admin/projects`, or view the public site.
Sign out appears only on admin pages as a fixed control.

The signed session expires after eight hours. The cookie is HttpOnly and
SameSite=Strict, with Secure and a `__Host-` name in production. Development over
local HTTP uses the development cookie without Secure; use `npm run dev` for
local browser testing. Authenticated pages and the logout handler also verify
the admin still exists and its password hash matches the session. A password
hash change or session-secret rotation invalidates older cookies. Sign out
clears the browser cookie; this stateless design does not revoke a previously
copied token before expiry or credential rotation.

Set `APP_ORIGIN` to the exact address used in the browser, such as
`http://localhost:3000` in development or your HTTPS origin when deployed.
Do not add a trailing slash or path. Login and logout reject missing, null,
or different Origin headers. Production startup requires valid `ADMIN_EMAIL`,
`ADMIN_PASSWORD`, `SESSION_SECRET` (at least 32 UTF-8 bytes), and `APP_ORIGIN`.
Keep these private; no secret uses a `NEXT_PUBLIC_` variable. Login checks the
database password hash, so changing `ADMIN_PASSWORD` alone does not reset it.

Login accepts JSON with `email` and `password`, limited to 4 KiB. Failed known
and unknown accounts receive the same response. Email is normalized; password
spaces are preserved and bcrypt inputs are limited to 72 UTF-8 bytes. Attempts
are limited to five per normalized email per 15 minutes and 60 total per minute
in each server process. Rejected limits return HTTP 429 with `Retry-After`.
Limiter state is bounded and stays through development reloads; it resets on
process restart and is not shared between server instances.

Next 16 uses [`src/proxy.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
for the preliminary admin/API cookie checks. Server page guards and the
`requireSession()` helper separately check the current database admin. Every
new mutation handler must call that helper and check the trusted origin.
The content-block handler repeats both checks. Project, stack, and upload API
namespaces are already gated by Proxy; their handlers follow in later slices.
No admin link or logout control appears publicly.

Run `npm run build` and then `npm run test:auth`. Authentication tests use an
isolated migrated/seeded SQLite file and a production server with dummy
environment values, plus headless Chrome for login/logout. They never use your
account or database. Public parity tests supply their own dummy startup settings.

## Text content API

`PATCH /api/blocks/[key]` updates the value of an existing content block. Send
`Content-Type: application/json` with `{"value":"Your text"}`, using the signed
session cookie and an Origin matching `APP_ORIGIN`. Keys are the stable values
in `prisma/seed-data.json`; the API does not create blocks or change their keys
or labels.

Successful requests return `{"block":{"key":"...","value":"...","label":"...","updatedAt":"..."}}`,
with an ISO timestamp. PATCH responses use `Cache-Control: no-store`.

Text is preserved exactly, including empty strings, leading/trailing spaces,
tabs, newlines, and literal markup. There is no rich-text interpretation.
Values are limited to 10,000 JavaScript string units (an emoji can occupy two),
and the complete JSON body is limited to 65,536 UTF-8 bytes. Invalid UTF-8,
unpaired surrogates, and ASCII control characters other than tab, LF, and CR
are rejected. Only the `value` field is accepted.

Errors use `{"error":{"code":"...","message":"...","fields":{"value":["..."]}}}`;
`fields` is present for validation errors and can identify `body`, `key`, or
`value`.

| Status | Code           | Meaning                                       |
| ------ | -------------- | --------------------------------------------- |
| 400    | `VALIDATION`   | Invalid key, JSON, fields, encoding, or size  |
| 401    | `UNAUTHORIZED` | Missing, invalid, expired, or revoked session |
| 403    | `ORIGIN`       | Missing or different request Origin           |
| 404    | `NOT_FOUND`    | Content block does not exist                  |
| 503    | `UNAVAILABLE`  | Request failed; database details are withheld |

Run `npm run build`, then `npm run test:content`. The tests use a temporary
migrated/seeded database and production server, plus direct handler calls to
verify protection without Proxy. They never edit your configured database.

## Inline editor

`/admin/edit/portfolio` renders navigation, hero, about, projects, contact, and
footer using the same sections as `/`. `/admin/edit/overview` uses the same
content and light layout as `/overview.html`. All 218 seeded blocks are bound:
203 text fragments and 15 image descriptions/contact placeholders. Public views
render saved values without editor wrappers or controls.

Click text to edit it where it appears. Blur, the Save button, or Ctrl/Cmd+Enter
saves it; Escape or Cancel restores the prior value. Long text and code blocks
use a textarea overlay. Failed saves retain the draft with an error and Retry.
Changes are stored as plain text and appear on public pages after refresh.
Image clicks edit their descriptions, and contact inputs edit placeholders.
The contact form sends messages only in the public view.
Cleared text keeps a small dashed marker in edit mode so it can be restored.

Unsaved edits prompt before leaving the page or signing out. Section links keep
the draft open while scrolling. A request already sent can finish after leaving.
Hover/edit outlines and the fixed toolbar appear only in edit mode.

Run `npm run build`, then `npm run test:editor`. Eight Chrome checks use a
disposable database and account to verify complete page coverage, text and
attribute persistence, exact code whitespace, safe text display, cancellation,
failed-save retry, navigation, and logout. Public visual checks now seed their
own temporary database so your content edits do not affect the frozen baseline.

`scripts/bind-content-components.mjs` regenerates the eight section components
from the frozen baseline and their stable seed paths, checking complete coverage
before writes. It preserves SVGs, classes, and inner whitespace. This is a
development generator and overwrites those component files, not database edits.
The generator also rebuilds the shared project board and its original card/icon
variants. Project titles and descriptions retain their existing editor keys;
those keys and the Project fields save together in one transaction.

## Project data and API

Run `npm run db:migrate` when updating from the text-editor version. Its one-time
data migration copies saved original project titles and descriptions into the
Project table, preserving whitespace and cleared fields. Repeated migration
runs do not overwrite subsequent edits. Other content, accounts, and stack
memberships remain unchanged.

Public and admin project views share `ProjectBoard`. Cards read Project fields
and ordered stack memberships from the configured database on each request. Public pages render
only published cards and omit unpublished/deleted card copy from their content
payload. Admin views include unpublished cards. Original seeded cards retain
their individual markup, classes, SVG artwork, and feature lists.

The authenticated project endpoints are:

| Method | Route | Result |
| ------ | ----- | ------ |
| GET | `/api/projects` | All projects and the stack catalog |
| GET | `/api/projects/[id]` | One project |
| POST | `/api/projects` | Create a project (201) |
| PATCH | `/api/projects/[id]` | Update supplied fields |
| DELETE | `/api/projects/[id]` | Delete the project and its memberships |

Mutations require a live session and trusted Origin. Supported JSON fields are
`title`, `description`, `photoUrl`, `link`, `repoUrl`, `order`, `published`, and
`stackIds`. A new title is required; omitted fields default to null, published
true, no stacks, and an order after the last card. Text is plain text with the
same 10,000-unit limit as content blocks. URLs accept HTTP(S) or local paths;
photos accept local JPG/PNG/WebP/GIF/AVIF paths. Use null to clear optional fields.
At most five distinct existing stack IDs are accepted, in display order.
Invalid updates leave both project fields and memberships unchanged. Deleting
a project preserves its stacks and existing content aliases.

Run `npm run build`, then `npm run test:projects`. Twenty checks use disposable
databases to exercise CRUD, validation, permissions, publication, ordering,
public rendering, inline-key synchronization, and the historical data upgrade.
The shared board includes an admin-only trailing add tile. Its photo dropzone,
title input, and stack picker create a project without leaving the page. Clicking
an existing photo replaces it; titles and descriptions save inline. Project
options edit destination/repository URLs, publication and display order, and
delete after confirmation. Failed saves retain drafts for retry. Seeding creates missing
original cards, so rerunning seed after deliberately deleting an original card
restores it.

## Stack icons and selection

The project editor shows a labeled Add stack pill. Its popover has searchable
technology names, a selection count and a prominent link to the SVG catalog.
The catalog's bordered Add a stack pane creates reusable name/icon pairs.

Open `/admin/stacks`, choose Stack icons in the admin toolbar, or use Manage
stack names and SVG icons inside the project picker. Add a name with a
bundled icon or upload an SVG/PNG/JPEG/WebP/GIF/AVIF image. Each catalog row can
rename the stack, change its catalog order, replace its icon, or delete it when
unused. Referenced stacks show their project count and cannot be deleted until
removed from those projects. Failed saves retain the form values; Cancel or
Escape restores the saved values, and leaving with a draft prompts first.

Use the plus control in a project's stack row to choose technologies by name.
The picker loads the current catalog, supports search and removal, and blocks
a sixth selection. Selecting a name immediately commits and renders its icon;
clicking a chip removes it. Done closes the picker, with no separate save step. The API
also enforces the five-stack cap. Catalog edits appear on linked public project
cards after refresh.

`GET/POST /api/stacks`, `PATCH/DELETE /api/stacks/[id]`, and
`POST /api/upload?kind=stack` require live admin sessions. Mutations also verify
the Origin. Duplicate names return 409; referenced-stack deletion returns
409 `IN_USE`. Uploaded icons are decoded and stored as proportion-preserving,
transparent 128×128 PNGs using [Sharp](https://sharp.pixelplumbing.com/api-resize/).
SVG input is restricted to self-contained artwork before conversion; raw SVG
uploads are never served. Files are limited to 5 MiB and decoded images to
16 million pixels. Local uploads live under `public/uploads`, excluded from Git;
back up that directory with the SQLite database. With `BLOB_READ_WRITE_TOKEN`,
uploads persist in Blob and the existing `/uploads/...` links redirect there.
A public handler serves newly uploaded files immediately.
Deleting a stack retains uploaded files so other references remain valid.

On Vercel, files upload directly to Blob as inert `.bin` staging objects because
the supported 5 MiB limit exceeds the function request limit. Token generation
requires a live admin session and trusted Origin, restricts the exact admin-owned
path, size and MIME type, expires after five minutes and forbids overwrite.
The finalize API verifies ownership, type and size, validates/normalizes the file,
then publishes the PNG/PDF and removes staging. No upload webhook is used.
Failed or abandoned uploads can leave staging objects; periodically remove old
objects under `portfolio-staging/` in the Blob dashboard. Final published files
are public, as required for portfolio images and résumé links.

`npm run test:stacks` uses a disposable account/database and removes only its
own generated images. It checks API guards, CRUD, icon conversion, upload
validation, and the browser catalog/picker workflow.

## Résumé and profile links

In `/admin/edit/portfolio`, click the résumé icon to upload a PDF (up to 5 MB),
view it, replace it, or remove it after confirmation. Uploads save immediately;
failed saves retain the uploaded PDF for retry. Removing the résumé disables
its public link. Replaced/removed PDFs remain in upload storage so undo can restore
their links. Uploaded files are retained when resetting the portfolio too.

Click the X or LinkedIn icon to change its destination URL. Save link or
Ctrl/Cmd+Enter persists it; Cancel or Escape discards the draft. Mobile and
desktop navigation share the same saved destination. Leaving with unsaved
changes prompts first. URLs must use HTTP(S); uploads and link mutations require
a live admin session and trusted Origin. No database schema migration is needed;
link settings are stored as dedicated content records when first saved.

## Undo, redo and original defaults

The admin toolbar provides Undo, Redo and Restore defaults on portfolio, overview,
project and stack pages. The database retains the latest 50 saved changes across
refreshes and sign-ins. Text, project CRUD and memberships, stack CRUD, profile
links and résumé changes are recorded atomically with their revisions. A new save
after undo discards the redo branch. The account and password are never included
in history. Concurrent tab changes cause a conflict instead of a stale restore.

Outside text inputs, Ctrl/Cmd+Z undoes the latest saved change; Ctrl/Cmd+Shift+Z
or Ctrl+Y redoes it. Inside inputs, native text undo continues to work. Save or
cancel open drafts before using portfolio history. A successful history action
reloads the page so all sections, cards and catalog rows agree with the database.

Restore defaults requires typing `RESTORE ORIGINAL PORTFOLIO`. It replaces all
current content, projects, memberships, stack definitions and custom site links
with the checked-in original portfolio, removing additions and country tags.
The admin account remains unchanged. The reset is itself undoable. Changes made
before this feature was deployed have no individual revisions; a full reset can
still restore the originals and records the current state so that reset can be
undone. Existing edits are not reset merely by deploying or running migrations.

Run `npm run db:migrate` locally after pulling this update. Vercel applies the
new migrations during its build. `npm run test:history` verifies reset, durable
history, guards, country/state filtering and injection messages with isolated data.

## Nearby client projects

All published projects stay visible on the main page. A separate prompt between
About and Projects uses Vercel's country estimate, plus the state estimate for
Nigeria, to introduce work built for people near the visitor. Its button expands
the matching list without filtering the main portfolio. When no state matches
exist it offers country-level work, with an explicit fallback message. When no
country projects exist it says so and points to all projects. Unknown locations
hide the prompt. No manual visitor picker, browser GPS request or third-party IP
lookup is used; raw IP addresses are neither read nor stored by this feature.

In Project options, select Client country and, for Nigeria, one of the 36 states
or FCT. New projects can be tagged after creation. Original projects start without
tags; assigning a location does not claim the client exists until you add one.
The public `/api/nearby` response contains only published matches and uses
`Cache-Control: no-store` to avoid sharing country-specific responses. Vercel's
`x-vercel-ip-country` and `x-vercel-ip-country-region` are consulted only on Vercel.
IP-based location is approximate and can reflect a mobile carrier or VPN instead
of the visitor's actual state; the prompt describes it as an estimate.

## Custom SQL-probe response

Clear SQL-comment/UNION/stacked-statement probes in failed login fields and admin
query parameters receive the owner's custom message. Normal `--` punctuation,
portfolio text and successful logins with SQL-looking passwords remain supported.
The response is cosmetic: Prisma's parameterized queries, session validation,
trusted-origin checks, bounded parsing and rate limits remain the protections.
TLS/SSL negotiation happens before the application and is not handled by this
SQL-probe message.

## Migration status

The public portfolio and `/overview.html` are ported, with separate layouts
preserving each page's original body styles and metadata. The schema, database
client, content seed, authentication, inline editor, project API, and shared
database-backed project board, stack icon CRUD, uploads, and project stack picker
are ready, including project creation, photo replacement, inline copy, order,
publication and confirmed deletion. Blog work
awaits clarification.

The original HTML components and Vite tools are retained as a reference until
the migration comparisons are needed. React components under
`src/components/portfolio` and `src/components/overview` are the active Next.js
implementation. `npm run port:html` regenerates them
from the original HTML and **overwrites edits**; it is a migration tool only.

Next.js uses the existing global CSS with Tailwind v4 via PostCSS. Linting runs
ESLint directly; it is separate from the production build.
