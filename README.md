# Portfolio v2

Migration of the existing portfolio to Next.js App Router and TypeScript.
The original markup, classes, assets, global stylesheet, AOS configuration,
and EmailJS contact behavior are preserved. See `prd.md` for the complete scope
and `migration/README.md` for the commit sequence and static reference.

## Local development

Use Node.js 20.9 or newer, then:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Copy `.env.example` to `.env.local` and fill in
the three public EmailJS identifiers for a new setup. Existing `.env` files
using `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and
`VITE_EMAILJS_PUBLIC_KEY` remain supported. Restart Next.js after changing them.

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

The database layer uses SQLite and matching Prisma 6 CLI/client versions to
retain the schema syntax specified in the PRD. Prisma commands load `.env`
and `.env.local` with the same precedence as Next.js. Set `DATABASE_URL` in
`.env.local`; the development default is `file:./dev.db`, relative to the
schema directory (`prisma/dev.db`). A production database connection requires
an explicit URL. For deployment, use an absolute `file:` URL on a persistent,
writable disk; the database file is not committed to Git.

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
use committed migrations for shared and production databases. Builds generate
the client but do not migrate or seed a database.

The models cover the single admin, plain-text content blocks, projects, stack
definitions, and ordered project/stack memberships. Project deletion removes
its memberships. Referenced stacks cannot be deleted. The five-stack limit
will be enforced in the project API and editor in their respective slices.
Read memberships by `order` and then `stackId` to keep ties deterministic.

`src/lib/db.ts` is restricted to server imports and reuses its Prisma client
during development reloads. Database-backed public rendering will be added
with the content APIs and shared editor components in later slices.

Run `npm run test:db` to apply the migrations to a unique temporary SQLite
file and check uniqueness, foreign keys, deletion behavior, and persisted
icon order through a second client connection. The tests never touch your
configured database.

## Seed existing content

Before managing content, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` privately in
`.env.local`, using `.env.example` for the variable names. The password must
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

## Migration status

The public portfolio and `/overview.html` are ported, with separate layouts
preserving each page's original body styles and metadata. The schema, database
client, and content seed are ready. Authentication and the inline editor are
planned in subsequent commits. Blog work awaits clarification.

The original HTML components and Vite tools are retained as a reference until
the migration comparisons are needed. React components under
`src/components/portfolio` and `src/components/overview` are the active Next.js
implementation. `npm run port:html` regenerates them
from the original HTML and **overwrites edits**; it is a migration tool only.

Next.js uses the existing global CSS with Tailwind v4 via PostCSS. Linting runs
ESLint directly; it is separate from the production build.
