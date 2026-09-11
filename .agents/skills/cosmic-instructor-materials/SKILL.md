---
name: cosmic-instructor-materials
description: Use when writing or editing Cosmic Playground instructor bundles (apps/site/src/content/instructor/<slug>/) or station cards (apps/site/src/content/stations/<slug>.md) — they must follow the content schema, print cleanly on paper, carry units, and link back to the demo without breaking the base path.
---

# Cosmic instructor materials

Read `.agents/references/invariants.md` first. Instructor and station pages are used in class, often on
paper: they must be scannable, printable and mechanically usable.

## Schema (from `apps/site/src/content/config.ts`)

- Station card: `stations/<slug>.md`; frontmatter `title`, `demo_slug`, `last_updated` (optional `has_math`).
- Instructor bundle: `instructor/<slug>/<section>.md`; `section` is one of
  `index | activities | assessment | model | backlog`; frontmatter `title`, `bundle`, `section`,
  `last_updated` (optional `demo_slug`, `has_math`). Do not invent section names.
- A demo with no bundle shows an explicit "Instructor notes not written yet" scaffold notice
  (`apps/site/src/pages/instructor/[slug].astro`). Never paste placeholder or backlog text as content.

## Shapes to copy

- **Instructor `index.md`:** navigation; why this demo exists (one paragraph); 3-5 learning goals;
  10-15 minute live-teach script (numbered); 1-3 misconceptions with the counter sentence; what to notice
  (readouts with units); links to the other sections.
- **`activities.md`:** timed blocks, each Prompt -> Student action -> Expected observation -> Instructor move.
- **Station card (one page):** Name/Section/Date lines; one-sentence goal; a blockquote with setup
  defaults, 3-6 steps and answer blanks; a parameter table whose headers carry units; Claim + Evidence box
  (cite at least one readout and one sanity check); word bank + 2-4 sanity checks.
- Every station card and instructor index links to its demo with a relative link (`../../play/<slug>/`),
  and the station card prints that address so it is typeable from paper. (Station cards linking nowhere
  was audit finding U10.)

## Rules

- Every numeric instruction has units. `D` = diameter, `d` = distance.
- Math follows the invariants: KaTeX, display math fenced in Markdown, no Unicode symbols. Fill-in blanks
  go outside the math (`$\sigma_p =$ ____`), or Markdown will read the underscores as emphasis.
- Claims about pedagogy or cited research are scholarly claims under Anna's name: verify the source and
  get her approval before publishing wording.
- No `@media print` or `<style>` in content; fix genuinely global print issues in
  `packages/theme/styles/print.css`.

## Red flags — stop

- Pasting an external doc without reshaping it to the templates.
- An instructor file with an unrecognised section name.
- Numbers without units; `D`/`d` used for anything else.
- A citation you have not checked against the paper itself (search-engine summaries have been wrong).

## Verify

`corepack pnpm build`; then the museum math and reflow specs via
`CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e` (see `cosmic-verification`).
