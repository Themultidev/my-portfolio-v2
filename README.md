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
npm run start
```

The parity check compares the rendered React sections to the captured static
source for structure, class strings, attributes, and text. It also verifies
the original global CSS is unchanged. Comments and indentation-only text are
ignored, inline style serialization is normalized, React image preloads are
ignored, and the original empty `minlength` is treated as absent. Browser
screenshots at the three required widths remain a separate acceptance check.

## Migration status

The public portfolio is ported. The overview route and browser visual checks
are the next slice. Database-backed content, authentication, and the inline
editor are planned in subsequent commits. Blog work awaits clarification.

The original HTML components and Vite tools are retained as a reference until
visual parity is verified. React components under `src/components/portfolio`
are the active Next.js implementation. `npm run port:html` regenerates them
from the original HTML and **overwrites edits**; it is a migration tool only.

Next.js uses the existing global CSS with Tailwind v4 via PostCSS. Linting runs
ESLint directly; it is separate from the production build.
