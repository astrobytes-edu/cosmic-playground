<INSTRUCTIONS>
## Cosmic Playground (monorepo) agent notes

### Superpowers system

<EXTREMELY_IMPORTANT>
You have superpowers. Superpowers teach you new skills and capabilities.

Before starting work, run:
`~/.codex/superpowers/.codex/superpowers-codex bootstrap`

When a relevant skill exists for the task, you must load it via:
`~/.codex/superpowers/.codex/superpowers-codex use-skill <skill-name>`
</EXTREMELY_IMPORTANT>

### Repo goals
- Treat `docs/specs/cosmic-playground-site-spec.md` as the contract.
- Prefer static + fast pages; minimal client JS on museum pages.
- Use `pnpm` workspace.
- Demos build into `apps/demos/dist/<slug>/` and are copied to `apps/site/public/play/<slug>/`.
- GitHub Pages deploy targets the Astro build output from `apps/site/`.

### Conventions
- Use `import.meta.env.BASE_URL` for internal site links/asset URLs (GitHub Pages base path support).
- Instructor pages are public; optionally `noindex` and omitted from primary nav.

### Verification / base path
- Primary gates:
  - `corepack pnpm build`
  - `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e` (or leave `CP_BASE_PATH` unset)
- If Playwright is failing due to base paths, check `CP_BASE_PATH` first; an empty/incorrect value can cause `/explore/` and `/play/<slug>/` routes to 404 in e2e.

### Demo pipeline (important)
- Source: `apps/demos/src/demos/<slug>/` (Vite + TS)
- Build output: `apps/demos/dist/<slug>/`
- Site-served copies: `apps/site/public/play/<slug>/` (copied during `corepack pnpm build`)

### Units policy (important)
- Keep units explicit and consistent across UI labels, exported results, and docs.
- Do **not** introduce `G=1` or “natural units” language. When orbital mechanics units matter pedagogically, prefer AU / yr / M☉ with `G = 4π² AU³/(yr²·M☉)`.
</INSTRUCTIONS>
