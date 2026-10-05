# PRD — Portfolio v2: Static → Dynamic with Auth + Inline Admin Editor

## 0. Mission (read first)

Rebuild the existing static portfolio as a Next.js app that renders **pixel-identical
output** to the current site, then layer on authentication and an admin editor that is
**the same page** with click-to-edit affordances. The public view must look exactly like
today's site. No redesign, no restyling, no "improvements" to layout, spacing, typography,
color, animation, or copy placement.

**Non-negotiable rule:** if a change is not required to make content dynamic, do not make
it. Port markup and CSS as-is.

---

## 1. Stack & Migration

| Concern   | Decision |
|-----------|----------|
| Framework | Next.js (App Router), TypeScript |
| Styling   | Tailwind CSS v4 via `@tailwindcss/postcss` for Next. Same config/tokens as current project. Do NOT introduce CSS Modules, styled-components, or a UI kit. |
| DB        | SQLite via Prisma |
| Auth      | Cookie-based session auth, hand-rolled (bcrypt password hash + signed HttpOnly cookie). No NextAuth unless explicitly requested later. Single admin user seeded from env. |
| Validation| Zod |
| Rich text | None. Plain text fields only. See §5. |

### 1.1 Preserve these existing dependencies
- `aos` — keep scroll animations, initialize in a client component exactly as today.
- `chart.js` — keep charts working identically.
- `@emailjs/browser` — keep contact form behavior identical, same keys/env vars.

### 1.2 Package.json target
{
  "name": "mytail",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" }
}

Move `devDependencies` / `dependencies` accordingly; add `next`, `react`, `react-dom`,
`typescript`, `prisma`, `@prisma/client`, `zod`, `bcryptjs`, `tsx`. Drop Vite-specific
scripts.

### 1.3 Migration procedure (do this literally)
1. Copy every HTML section into App Router components **without editing class strings**.
2. Copy global CSS / Tailwind theme tokens verbatim.
3. Convert `<script>` blocks to client components; keep inline styles.
4. Snapshot rendered HTML of the static site, snapshot rendered HTML of v2 public pages,
   diff them. Structural/class diffs are bugs. Fix until the only diffs are hydration
   attributes.
5. Asset parity check: every image/SVG path from the static site resolves in v2.

**Acceptance for §1:** side-by-side screenshots at 375px, 768px, 1440px are visually
indistinguishable.

---

## 2. Scope

### In scope
- Full port of all existing pages/sections.
- CRUD for: text content blocks, projects, stack definitions, blog posts (§9).
- Admin login/logout, session guard on `/admin/*`.
- Inline WYSIWYG-style editing on the live page (not a separate form dashboard).
- Image upload for project photos.
- Seed script that imports all current static content into SQLite.

### Out of scope
- Any visual/design change, new sections, A/B testing, analytics, i18n, multi-user roles,
  comments, search, RSS, dark-mode toggle, deployment pipeline.

---

## 3. Data Model (Prisma)

datasource db { provider = "sqlite"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model Admin {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

// Every editable string on the site, keyed by a stable slug.
model ContentBlock {
  id        Int      @id @default(autoincrement())
  key       String   @unique   // e.g. "hero.title", "about.p2", "footer.tagline"
  value     String             // plain text, may contain newlines
  label     String             // human name shown in edit tooltip
  updatedAt DateTime @updatedAt
}

model Stack {
  id       Int      @id @default(autoincrement())
  name     String   @unique   // "JavaScript"
  svgPath  String             // file path or data URI, e.g. /stacks/javascript.svg
  order    Int      @default(0)
  projects Project[]
}

model Project {
  id          Int      @id @default(autoincrement())
  title       String
  photoUrl    String?
  description String?
  link        String?
  repoUrl     String?
  order       Int      @default(0)
  published   Boolean  @default(true)
  stacks      Stack[]        // via ProjectStack join model
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProjectStack {
  projectId Int
  stackId   Int
  order     Int @default(0)
  @@id([projectId, stackId])
}

**Hard constraint:** max 5 stacks per project. Enforce in the API handler *and* in the UI
(see §6.3). Return `400 VALIDATION` beyond 5.

---

## 4. Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Server (public) | The portfolio, byte-for-byte current design |
| `/blog`, `/blog/[slug]` | Server (public) | Blog (§9) |
| `/login` | Server + form | Admin login |
| `/admin` | Redirect | -> `/admin/projects` |
| `/admin/edit/[page]` | Client-hydrated | The live site wrapped in edit mode (§5) |
| `/admin/projects` | Client | Project grid + add tile (§6) |
| `/admin/stacks` | Client | Stack init pane (§7) |
| `/api/auth/login`, `/api/auth/logout` | POST | Session |
| `/api/blocks/[key]` | PATCH | Update one text block |
| `/api/projects`, `/api/projects/[id]` | POST/PATCH/DELETE | Project CRUD |
| `/api/stacks`, `/api/stacks/[id]` | POST/PATCH/DELETE | Stack CRUD |
| `/api/upload` | POST | Multipart image -> `/public/uploads` |

All mutating `/api/*` routes must call `requireSession()` and return `401` when absent.
CSRF: SameSite=Strict cookies + Origin check.

---

## 5. The Editor — Core Concept

The admin editor is **not** a dashboard. It is the real page with an `EditModeProvider`
client boundary.

### 5.1 Mechanics
- `/admin/edit/[page]` renders the exact same section components as the public route,
  passing `editable={true}`.
- Public route renders the same components with `editable={false}`. One source of truth
  for markup.
- When `editable`: each text node is wrapped in `<EditableText blockKey="hero.title">`.
- Click → becomes `contentEditable`/textarea in place, same computed font/size/color as
  display state.
- Blur or `Cmd/Ctrl+Enter` → optimistic `PATCH /api/blocks/[key]`, then revert to display
  element.
- `Esc` → abort, restore original value.
- While editing: outline `2px dashed` using the existing border color token. No other
  styling change.
- Hover (editable only): subtle `outline: 1px dashed rgba(...)` so the admin knows what's
  clickable. This hover ring must **never** render on the public site.

### 5.2 Rules
- Never alter the DOM structure of the display state. The editable wrapper must render its
  child unchanged when not focused (no extra divs inside flex/grid parents where they'd
  break layout — use `display: contents` or spread props onto the tag itself).
- Long-text blocks (multi-paragraph) switch to a textarea overlay sized to the element box.
- Save failures: toast, keep edits, allow retry.
- Unsaved-changes guard on navigation.

---

## 6. Projects Section & Add Tile

### 6.1 Shared parent container
The grid/flex container that parents the existing project cards is a single component,
`ProjectBoard`, used in both modes. It maps over projects and, **only in edit mode**,
appends one trailing tile of the same type as the existing card wrappers — but empty.

> Implementation note: the add tile must be a sibling produced by the same map/render path
> so it inherits identical grid sizing, gaps, and responsive breakpoints. Do not hardcode
> a second layout.

### 6.2 The add control
Inside the empty add tile: a **medium-sized dashed circle containing a plus sign**,
centered.
- Dashed border, transparent fill, plus glyph centered (SVG or `+`).
- Diameter reads as "mid-sized" relative to the card — roughly 40–48% of the card's inner
  width, clamped (e.g. `clamp(64px, 30%, 96px)`). Match the site's existing stroke widths
  and colors; do not invent new ones.
- Hover: slight opacity/scale using existing easing tokens.
- Click → opens the add-project panel anchored to the tile (§6.3).

### 6.3 Add project panel — three slots
Rendered as placeholders that mirror how the static card displays each field:

1. **Add photo** — dropzone/click-to-upload. Preview appears at the exact dimensions the
   static card uses for its image. Accepts `image/*`, ≤ 5 MB, goes through `/api/upload`.
2. **Add title** — inline text input styled like the card's title element.
3. **Add stack** — chips row. Empty state shows "Add stack". Selecting opens the stack
   picker (§7.2). Max 5; the 6th selection is blocked with an inline hint "Max 5 stacks".

Save → `POST /api/projects` with `{title, photoUrl, stackIds[]}`, optimistic insert into
the board, tile resets to the empty add state. Validation errors surface inline under the
failing slot.

### 6.4 Editing an existing project
Same affordances in place: click the photo to replace it, click the title to retype, click
a stack chip to remove, click "+" on the card to add another stack. Reorder via drag within
the existing grid (optional; keep simple if it risks layout changes). Delete behind a
confirm dialog.

---

## 7. Stacks — Text ↔ Icon Mapping & Init Pane

This is the subtle part. Get it right.

### 7.1 Two representations of one entity
A `Stack` has `name` and `svgPath`.
- **Public site:** always renders the SVG icon, at the same size/placement as the static
  site.
- **Editor, while choosing:** renders **text labels** ("JavaScript", "TypeScript", …).
- **On commit:** the chosen text resolves to its icon and renders as the icon immediately.

So: in the picker the admin sees readable names; the moment a name is selected, the chip in
the project becomes the icon. The mapping lives in one place — `Stack.name → Stack.svgPath`
— resolved by a single `StackChip` component. No duplicated lookup logic.

Example: clicking "JavaScript" in the picker commits and renders the JS SVG at exactly the
size the static site uses.

### 7.2 Stack picker popover
Triggered by "Add stack". Lists all initialized stacks as **text items**. Selected ones show
a check. Search/filter input at top. Enforces the 5 cap.

### 7.3 Initialize Stacks pane — `/admin/stacks`
Purpose: the admin defines the catalog once, so the picker stays a short list of known
technologies.

Pane contains:
- **List of existing stacks**: each row shows the rendered icon preview + editable name +
  "Replace icon" upload + delete (blocked with a message if referenced by any project).
- **"New stack" row**: name input + icon upload (or pick from bundled defaults in
  `/public/stacks/*.svg`) + save.
- **Icon guidance:** uploads normalized to the same square viewBox/size the static site
  expects, so icons never resize the layout. Store as optimized SVG or PNG at fixed
  dimensions.

**Acceptance:** adding "Svelte" here makes "Svelte" appear as text in the picker and as the
Svelte icon on the site after selection — with zero code changes.

---

## 8. Auth

- `POST /api/auth/login` → verify bcrypt hash, set `HttpOnly; Secure; SameSite=Strict`
  signed session cookie.
- `requireSession()` helper used by every mutating API and every `/admin/*` page (middleware
  + server-side check; do not rely on client routing alone).
- Logout button visible only in edit mode, positioned so it does not shift layout (fixed
  overlay).
- Seed admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars; refuse to boot in production if
  unset.
- Rate-limit login attempts (simple in-memory counter is fine).

---

## 9. Blog — "Go to Blog" Button

There is a "Go to blog" CTA on the site. Behavior:
- Detect which suite/framework the blog currently runs on in the static project (check for
  an existing blog directory, subdomain reference, external URL, Jekyll/Hugo/Astro output,
  etc.). Report the finding in your summary before wiring anything.
- If a blog exists: the button links to it exactly as it does today, preserving href and
  target behavior. Its posts become manageable via a minimal `Post` model (`slug`, `title`,
  `body`, `publishedAt`, `published`) **only if** the blog is self-hosted in this repo.
- If the blog is external: leave the link untouched, out of scope for CRUD.
- If no blog exists: flag it and ask. Do not invent a blog engine.

Do not migrate blog content or restyle blog pages without confirmation.

---

## 10. Definition of Done

- [ ] `npm run dev`, `npm run build`, `npm run start` all succeed clean — no TS errors, no Prisma warnings.
- [ ] Side-by-side visual diff vs. static site at 375/768/1440px: no differences beyond hydration attributes.
- [ ] All existing animations (AOS), charts (Chart.js), and the EmailJS contact form behave identically.
- [ ] Every text string on the site is editable inline and persists across reloads.
- [ ] Can create, edit, reorder, and delete projects; each enforces the 5-stack cap.
- [ ] Add tile is a true sibling of project cards (same grid cell, same responsive behavior).
- [ ] Stack init pane: add/rename/replace-icon/delete works; picker shows text, site shows icons.
- [ ] Unauthenticated requests to `/admin/*` and mutating APIs return 401/redirect.
- [ ] Seed script reproduces 100% of current static content in SQLite.
- [ ] "Go to blog" button behavior confirmed and reported (§9).
- [ ] README updated: setup, env vars, seed, admin credentials, deploy notes.

---

## 11. Guardrails for Codex

1. Do not rename, restructure, or "clean up" existing class names or section markup.
2. Do not add a component library, icon library, or animation library.
3. Do not change fonts, colors, spacing scale, breakpoints, or shadow/radius tokens.
4. Do not introduce rich-text/markdown editors for site copy.
5. Ask before: touching blog internals, changing the contact-form provider, altering SEO
   metadata, or adding any new page.
6. Commit in reviewable slices: (a) port, (b) schema+seed, (c) auth, (d) inline text edit,
   (e) project CRUD + add tile, (f) stack pane, (g) polish/QA.