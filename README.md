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

## Migration status

The public portfolio and `/overview.html` are ported, with separate layouts
preserving each page's original body styles and metadata. Database-backed
content, authentication, and the inline editor are planned in subsequent
commits. Blog work awaits clarification.

The original HTML components and Vite tools are retained as a reference until
the migration comparisons are needed. React components under
`src/components/portfolio` and `src/components/overview` are the active Next.js
implementation. `npm run port:html` regenerates them
from the original HTML and **overwrites edits**; it is a migration tool only.

Next.js uses the existing global CSS with Tailwind v4 via PostCSS. Linting runs
ESLint directly; it is separate from the production build.
