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
</INSTRUCTIONS>

