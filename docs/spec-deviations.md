# Spec Deviations

## GitHub Pages deploy action

The spec requested “the official Astro GitHub Pages action”. For v0.1, the workflow uses GitHub’s official Pages actions (`actions/upload-pages-artifact` + `actions/deploy-pages`) and runs the monorepo build at the workspace root.

Rationale: the monorepo build must run `scripts/build.mjs` (build demos → copy into `apps/site/public/play/` → build Astro). Using a single root build step is simpler and more reliable for a pnpm workspace than delegating build/install steps to a per-app action.

## Demo `slug` field in content frontmatter

The spec listed `slug: string` as a required frontmatter field for the `demos` collection. Astro Content Collections reserve `slug` for their own generated slug and disallow it in the schema.

In v0.1:
- Demo slugs are derived from filenames in `apps/site/src/content/demos/<slug>.md`.
- Code uses `entry.slug` (Astro-generated) as the canonical slug.
