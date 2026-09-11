---
name: cosmic-adversarial-review
description: Use when asked to review, audit or red-team a Cosmic Playground demo, page, pull request or claim of readiness — tries to falsify every claim the work makes (readouts, drawings, labels, docs, tests) by independent recomputation, rendered measurement and control sweeps, and reports only what was verified.
---

# Cosmic adversarial review

The job is to find what is wrong, not to confirm what is right. Every claim is false until a test that
could have proved it false did not. Read `.agents/references/invariants.md` first. Read-only unless the
user asks for fixes.

## 1. Inventory the claims

For the scope (a demo, a page, a diff), list what it asserts, explicitly or implicitly:
readout values and units · what the drawing shows (direction, size, position, scale) · labels, captions
and legends · what each control does · presets and their names · exhibit, station and instructor text ·
citations · test names and what they claim to cover · docs and prior reviews · readiness fields.

## 2. Design the cheapest falsifying test for each

| Claim type | Test |
|---|---|
| A number | Recompute independently (by hand or a separate script from first principles, not the demo's model); compare at the default state and one non-default state. |
| A drawing | Measure the SVG attributes or element geometry at two or more states; derive direction and magnitude; compare with the sky. |
| A control works | Sweep: fingerprint readouts, SVG attributes and canvas `toDataURL()` before and after actuating each control; classify live / dead / echo-only (changes only its own label). Tabs, accordions and popovers produce false positives — re-verify each hit. |
| A preset | Read back exact state; check it survives slider rounding; check the name matches the physics. |
| Layout / reflow | Screenshots at 1440x900, 1280x720, 390x844, 320x640; real sideways-scroll test at 320px; readouts on screen. |
| Accessibility | Keyboard-only pass, arrow keys on sliders, `#status` text after a change, contrast on the actual ground. |
| A test covers X | Read its assertions; check the selector exists; check it fails when X is broken. |
| A citation | Find the paper itself; confirm the claim, venue, year and numbers. Summaries have been wrong. |
| Consistency | Compare the same quantity across demos (orbit direction, star colour, number formatting). |

## 3. Run them, and hold yourself to the same standard

- Mark a finding **verified** only if you ran the test in this session; otherwise **lead** (unverified).
- Quote file:line and the measured numbers. Show derivations for physics.
- Check your own method: a zsh glob that matches nothing aborts the whole command, a subagent can
  misread a PDF, a probe on a stale page measures the wrong state. Retract false findings explicitly.
- Never accept `docs/reviews/*.md`, commit messages, test names or a previous audit as evidence.

## 4. Report

Order by harm to a student, not by effort:

- **Critical** — wrong science or a blocked task in the default state, or a WCAG A failure on a primary control.
- **High** — wrong science after one interaction; a dead primary control; a misleading label or citation.
- **Medium** — inconsistency, weak test coverage that hides a real risk, secondary accessibility gaps.
- **Low** — hygiene.

Each finding: ID (P for physics, B for delivery/content, U for UI/accessibility, H for hardening),
severity, one-sentence claim, evidence (measurements, file:line), why it matters to a learner, the smallest
fix, and verified/lead. Close with what you did not check and what is genuinely strong.

Use the `adversarial-reviewer` role for an independent pass; one reviewer at a time.
