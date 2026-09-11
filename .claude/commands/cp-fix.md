---
description: Fix one audit finding test-first, with evidence
argument-hint: "<finding ID or short description>"
---

Fix the finding `$ARGUMENTS`.

1. Locate it in `STATUS.md` ("Remaining demo fixes") or the audit, and confirm it against the current code
   before changing anything.
2. Load the skill that owns it (`cosmic-physics`, `cosmic-ui`, `cosmic-a11y`, `cosmic-demo-contracts`,
   `cosmic-site-content` or `cosmic-instructor-materials`) plus `cosmic-verification`.
3. Write a test that fails on the current code on its assertions; make the smallest fix; show it passing.
4. For angles, geometry or physical quantities, get an independent `physics-reviewer` pass.
5. Run the relevant gates, commit on a branch with the measured evidence, and update `STATUS.md`.
