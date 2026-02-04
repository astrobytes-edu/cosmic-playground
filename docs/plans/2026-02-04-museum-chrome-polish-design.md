# Museum Chrome Polish + Attribution (Design)

## Goals
- Add a subtle, permanent attribution line that makes authorship clear without dominating the page.
- Provide a single, easy contact path (mailto) that stays visible but quiet.
- Refine museum chrome (header + footer) so it feels deliberate, calm, and coherent with the muted dark theme.
- Preserve base‑path safety and zero‑JS museum pages.

## Non‑Goals
- No new navigation items, layout reflow, or hero changes.
- No new color literals in `apps/site`; only existing tokens.
- No light‑mode redesign (changes must remain neutral and safe in paper theme).

## Proposed Structure
**Footer**
- Add a new meta row above the existing note:
  - Left: “Developed and designed by Anna Rosen.”
  - Right: “Contact” mailto link (`alrosen@sdsu.edu`)
- Keep the existing “interactive museum” note as the secondary line.
- Use a flex row that wraps gracefully on small screens.

**Header**
- Make navigation feel less “accent‑heavy” by default:
  - Nav links use `--cp-text2` (muted) at rest.
  - Active page uses `--cp-accent` (existing pattern).
  - Hover shifts toward `--cp-text` (not full accent).

## Visual Intent
The footer should read like a quiet museum placard: clear authorship and a small invitation to contact, not a promotional banner. The header should feel calm and editorial — navigation is present, but the content is the exhibit.

## Accessibility + Semantics
- Use semantic HTML: paragraph + link (no icon-only controls).
- Keep focus-visible rings intact via existing tokenized outline.
- Mailto link stays discoverable through keyboard navigation.

## Acceptance Criteria
- Footer shows “Developed and designed by Anna Rosen.” on all pages.
- Footer includes a working contact link (`mailto:alrosen@sdsu.edu`).
- No new hardcoded colors in `apps/site` CSS.
- No root‑absolute URLs added (base‑path safe).
