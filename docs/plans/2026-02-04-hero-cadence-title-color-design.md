# Hero Physics Line + Cadence Items + Title Color (Design)

## Goals
- Restore the physics tagline: “Play with the universe. Learn the physics.” in the Explore hero.
- Make Predict / Play / Explain **itemized and more pronounced** (brand + Explore onboarding).
- Color **key titles** (hero H1 + card titles + section headings) using tokens, without overwhelming body text.

## Non‑Goals
- No new color literals in `apps/site` or `apps/demos`.
- No paper‑theme changes beyond neutral token mapping.
- No layout overhaul; only targeted markup + token changes.

## Approach
**1) Hero physics line**
- Add a dedicated line under the Explore H1 using a new class (e.g., `.explore-hero__tagline`).
- Style as strong secondary headline (size + weight), tinted with title tokens.
- Keep the existing lede as the softer supporting line.

**2) Itemized cadence**
- Header: replace the single subtitle line with a compact list of three items (`Predict`, `Play`, `Explain`) styled as subtle pills.
- Explore onboarding: replace the single cadence line with the same three items, larger and more spacious.
- Ensure semantic list markup (`<ul><li>…`) and readable in screen readers.

**3) Title colors**
- Add `--cp-title` and `--cp-title-strong` tokens in `packages/theme/styles/tokens.css`, derived from existing accent + text tokens.
- Apply title colors to headings (H1/H2/H3/H4) globally for dark theme.
- Keep paper theme unchanged by setting `--cp-title*` to `--cp-text` in `layer-paper.css`.
- Ensure demo card titles explicitly use `--cp-title` and gain a subtle hover shift to `--cp-title-strong`.

## Accessibility + UX Notes
- Cadence list is text‑based (not color‑only).
- Focus rings unchanged; link shading intact.
- Hero line remains readable with a clear hierarchy (H1 → tagline → lede).

## Acceptance Criteria
- Explore hero shows “Play with the universe. Learn the physics.”
- Header and Explore onboarding show **itemized** Predict/Play/Explain.
- Card titles and section headings are visibly tinted (not plain white) in dark mode.
- Paper theme remains visually unchanged.
