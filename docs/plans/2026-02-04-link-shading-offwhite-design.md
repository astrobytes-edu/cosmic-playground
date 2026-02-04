# Link Shading + Off‑White Text (Design)

## Goals
- Reduce harsh contrast in dark mode by softening global text to an off‑white.
- Make links feel alive via subtle chroma shifts (shade transitions on hover/active).
- Add a small, emphasized header motto under “Cosmic Playground”: “Predict → Play → Explain.”
- Keep paper theme unchanged for now.

## Non‑Goals
- No new color literals in `apps/site` or `apps/demos`.
- No layout rework; only small header markup additions and token changes.
- No changes to paper theme colors or typography.

## Approach
**1) Token‑level text tuning (dark theme only)**
- Adjust `--cp-text`, `--cp-text2`, `--cp-muted`, `--cp-faint` in `packages/theme/styles/tokens.css` to mix slightly less white into `--cp-bg0`.
- This preserves “white” while reducing glare and keeping hierarchy intact.

**2) Global link shading via tokens**
- Introduce link tokens in `tokens.css`:
  - `--cp-link`, `--cp-link-hover`, `--cp-link-active`
- Define these via `color-mix()` using existing accents + text tokens (no new hex literals).
- Update the global `a` rules to use these tokens so *all links* (nav/footer/body) follow the same chroma‑shift behavior.
- In `layer-paper.css`, set `--cp-link*` to match existing paper behavior (keep paper as‑is).

**3) Header motto**
- Update `Layout.astro` header brand to include a subtitle line.
- Style the subtitle as small + emphasized (weight + tracking), colored with link token for subtle chroma.

## Accessibility + UX Notes
- Off‑white reduces glare while maintaining contrast in dark mode.
- Link chroma is not the only cue: underline color remains, focus rings unchanged.
- The motto is static text (no JS), preserving museum‑page performance.

## Acceptance Criteria
- Dark mode body text is off‑white (not pure white).
- Link hover/active states visibly shift shade using tokens.
- Header shows “Predict → Play → Explain” under the brand name.
- Paper theme appearance remains unchanged.
