# Cosmic Playground

Public, static, fast “interactive museum” for astronomy demos: a searchable library, exhibit pages (predict→play→explain), curated playlists, printable station cards, and optional instructor notes.

## Repo layout

- `apps/site` — Astro museum site
- `apps/demos` — Vite multi-page demos (one `index.html` per slug)
- `packages/*` — shared runtime/UI/theme/physics (initial placeholders)
- `scripts/` — build + validation scripts

## Local development

Prereqs: Node.js + Corepack (Corepack ships with modern Node).

- Install: `corepack pnpm install`
- Dev (museum pages): `corepack pnpm dev`
- Full build (demos → copy → site): `corepack pnpm build`

Note: the demo iframe on exhibit pages expects built artifacts under `apps/site/public/play/<slug>/`. Running `corepack pnpm build` populates these.

## Demo pipeline

- Source demos live in `apps/demos/src/demos/<slug>/`.
- Build output is `apps/demos/dist/<slug>/...`.
- `scripts/build.mjs` copies these into `apps/site/public/play/<slug>/...`.
- `scripts/validate-play-dirs.mjs` fails the build if any demo in the content collection is missing a corresponding `/play/<slug>/index.html`.

## GitHub Pages deployment

Workflow: `.github/workflows/deploy.yml`

Astro GitHub Pages settings:
- The museum site is configured as a **project site** with `base: "/cosmic-playground/"` in `apps/site/astro.config.mjs`.
- Local dev will serve the site under the same base path: open `http://localhost:4321/cosmic-playground/`.
