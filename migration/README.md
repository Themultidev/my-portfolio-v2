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
