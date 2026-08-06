## Hugo Juskowiak — Portfolio

A portfolio built as a **technical drawing set**: ten numbered sheets, engineering-drawing
vocabulary, bilingual FR/EN, statically rendered. There is no CMS and no server data — every
string and every record is checked into the repository.

- Live: <https://www.hugojuskowiak.com/>
- Dev: `http://localhost:3000`

### Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Animation | [Motion](https://motion.dev) (`motion`, the package formerly published as `framer-motion`) |
| Scroll | [Lenis](https://lenis.darkroom.engineering/) |
| Styling | Hand-written CSS (`app/planche.css`) + Tailwind CSS v4 as a base layer only |
| Analytics | `@vercel/analytics` |
| Hosting | Vercel |

**What this project does *not* use**, despite what a Next.js scaffold usually implies: no
shadcn/ui, no Radix, no icon library (arrows are text — `→`, `←`; symbols are inline SVG), no
UI kit of any sort. The visual system is written by hand in `app/planche.css`, which is where
every design token lives (`.proto-root`). `app/globals.css` declares Tailwind and nothing else —
no palette, no radius, no font. That is deliberate: a component that is not restyled to the
system must render *wrong*, not render blue.

Real-time 3D is also absent by choice. The rotating car is a 120-image WebP sequence rendered
offline by `tools/voiture/`; `components/proto/voiture.tsx` documents why a sequence beats a
WebGL canvas on this frame budget.

### Getting started

```bash
npm install

npm run dev            # http://localhost:3000

npm run build          # production build (runs tsc)
npm start
```

### Project structure

```
app/
  layout.tsx           fonts, metadata, .proto-root (holds the design tokens)
  page.tsx             the ten sheets, in order
  work/[slug]/         one detail sheet per project or course (9 static paths)
  planche.css          THE visual system — tokens, layout, states, a11y
  globals.css          Tailwind import only
components/proto/      one file per sheet + the data
  dict.ts              every visible label, FR and EN
  projets.ts           project records (U-0n)
  parcours.ts          employers and studies records (F-0n)
  schema.tsx           anchor-based SVG primitives (diagrams are declared, not drawn)
  world.tsx            the fixed 3D-looking backdrop (CSS transforms, not WebGL)
  voiture.tsx          the scroll-driven car sequence
lib/utils.ts           cn() — for imported components only
public/voiture/        the 120 rendered frames
tools/chrome.mjs       finds and drives Chrome over CDP — no npm dependency
tools/voiture/         the offline render pipeline (Three.js in a headless Chrome)
tools/banc/frame.mjs   frame-budget bench: `node tools/banc/frame.mjs <url> <label> --tete`
```

### Conventions

These are enforced by review, not by a linter — they are the reason the document reads the way
it does.

- **No visible string inside a component.** Labels go in `dict.ts`, records in `projets.ts` /
  `parcours.ts`, always FR **and** EN.
- **No invented facts.** `projets.ts` puts it plainly: a data sheet that invents its dimensions
  is no longer a data sheet.
- **One accent colour.** The system is mono-accent (one red, in two states with disjoint
  substrates). Contrast ratios are computed, not eyeballed. Do not add a hue.
- **`prefers-reduced-motion: reduce` cuts every animation** — including the JS ones, which CSS
  cannot reach; see the note in `planche.css` under `ACCESSIBILITÉ`.
- **Frame budget: 8.3 ms** (120 Hz). Anything added is measured against it, with
  `node tools/banc/frame.mjs <url> <label> --tete`. `--tete` is not optional:
  headless Chrome composites in software and cannot answer a 120 Hz question.
- Code comments are in French and say *why*, not *what*.

### Contact

- Email: <mailto:hugo.jskpro@outlook.fr>
- GitHub: <https://github.com/Zokuzo>
- LinkedIn: <https://www.linkedin.com/in/hugo-juskowiak/>
