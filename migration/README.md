# Portfolio v2 migration

The public design must retain the existing markup, class strings, CSS, assets,
animations, and contact form behavior specified in `prd.md`.

`static-baseline.json` captures the expanded HTML source for the portfolio and
overview pages, the original stylesheet and client script, and SHA-256 hashes
for referenced local assets. It is a source reference, not proof of rendered
or visual parity. Browser DOM comparisons and screenshots at 375, 768, and
1440 pixels remain required after the Next.js port.

Capture once with `node scripts/capture-static-baseline.mjs`. The script refuses
to overwrite the reference unless explicitly run with `--update`.

## Reviewable commit sequence

1. HTML section extraction (already completed).
2. Capture migration source and asset baseline.
3. Next.js App Router foundation and public portfolio port.
4. Overview route and public behavior/visual parity checks.
5. Prisma schema and database access.
6. Seed existing content, projects, stack icons, and admin.
7. Session authentication, login/logout, and protected routes.
8. Authenticated content API and validation.
9. Inline text editing, save/retry, and navigation guard.
10. Project API, validation, and shared public project board.
11. Inline project controls, uploads, and add tile.
12. Stack management and text picker with icon mapping.
13. Final acceptance checks and setup documentation.

Each slice is verified and paused for the owner to commit. Additional fixes
can be separate commits when warranted. No commits are made automatically.

## Seed reference

`prisma/seed-data.json` records every nonempty text node outside SVG/script/style
subtrees in the two frozen public pages, plus placeholder, alt, title, and
aria-label attributes. Original whitespace is retained. Keys and source paths
are fixed to this reference so removing legacy HTML does not affect seeding.
The original four project IDs and 20 stack IDs are stable seed identities;
reruns create missing rows while preserving existing edits and passwords.
The seed does not change the public rendering in this commit.

## Authentication boundary

Next 16's Proxy verifies the signed cookie before admin routes; every current
admin page and logout handler also checks the live SQLite account. The login
route compares bcrypt hashes, checks the configured Origin, and limits attempts.
Login and `/admin` open the complete portfolio editor. The shared provider wraps
all admin pages, while each page also checks the live session. Public section
markup and global CSS remain unchanged.

`npm run test:auth` checks authentication through unit tests, direct production
HTTP requests, and a headless Chrome login/logout, using disposable data.

## Content API boundary

`PATCH /api/blocks/[key]` updates only an existing block's value after checking
the live admin session and trusted Origin in the handler. JSON is bounded to
64 KiB, plain text to 10,000 JavaScript string units, and keys/labels remain
immutable. Invalid requests do not write; missing blocks are not recreated.
`npm run test:content` exercises persistence, validation, and guards through
HTTP and direct handler calls with isolated data.

## Inline editing boundary

The eight section components bind all 218 seeded text/attribute keys. Public
providers return the same native markup with saved values; admin providers add
click-to-edit affordances and guarded navigation. Both public routes read fresh
database content per request. `/admin/edit/portfolio` reuses all seven portfolio
sections; `/admin/edit/overview` preserves the original light layout. The owner
requested the full portfolio as the landing page after login instead of Projects.
`npm run test:editor` verifies editing and persistence with isolated data; visual
parity uses a separately seeded test database.

## Blog finding

The repository contains `blog.html`, an incomplete HTML fragment containing
engagement and skills markup. The current Vite build includes only `index.html`
and `overview.html`; no blog framework or post store was found. No active blog
CTA was found in the portfolio markup. Blog implementation and content migration
remain pending owner clarification, as required by PRD section 9.

## Implementation decisions to resolve in later slices

- The PRD mixes an implicit Project/Stack relation with an explicit ordered
  ProjectStack model. Use the explicit join relation to preserve chip order.
- Verify supported framework commands against the selected Next.js version;
  use its supported lint tooling rather than assuming `next lint` exists.
- Preserve existing EmailJS environment values while adapting the public
  variable names required by Next.js. Never capture secret environment files.
