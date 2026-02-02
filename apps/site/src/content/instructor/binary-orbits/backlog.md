---
title: "Binary Orbits — Future Enhancements (Backlog)"
bundle: "binary-orbits"
section: "backlog"
demo_slug: "binary-orbits"
last_updated: "2026-01-30"
has_math: true
---
> **Navigation**
> - Instructor hub: [/demos/_instructor/](../../instructor/)
> - Back to this demo guide: [Guide](#index)
> - Student demo: [/play/binary-orbits/](../../play/binary-orbits/)
> - This demo: [Model](#model) · [Activities](#activities) · [Assessment](#assessment) · [Backlog](#backlog)

> **How to use this backlog**
> This is a planning guide. Prefer changes that increase correctness and reduce cognitive friction before adding new features.

## Completed Items

| Priority | Impact | Effort | Category | Notes | Code entrypoint |
|---|---|---|---|---|---|
| P0 | High | Medium | Physics | **DONE (2026-01-28):** Extract physics model to shared, testable module with UMD pattern. | `demos/_assets/binary-orbits-model.js` + `tests/binary-orbits-physics.test.js` |
| P0 | High | Low | Physics | **DONE (2026-01-28):** Document invariants in model file header. | `demos/_assets/binary-orbits-model.js` |
| P0 | High | Low | Bug | **DONE (2026-01-28):** Fix missing model script tag in index.html. | `demos/binary-orbits/index.html` |
| P1 | High | Medium | Docs | **DONE (2026-01-28):** Expand README with pedagogical notes and future features. | `demos/binary-orbits/README.md` |
| P1 | High | High | Docs | **DONE (2026-01-28):** Create instructor resources (index, model, activities, assessment, backlog). | `demos/_instructor/binary-orbits/` |
| P1 | Medium | Low | UX | **DONE (2026-01-28):** Add preset for **51 Pegasi b** + barycenter distance readout with inside/outside star indicator. | `demos/binary-orbits/` |

## Active Backlog

| Priority | Impact | Effort | Category | Notes | Code entrypoint |
|---|---|---|---|---|---|
| P1 | High | Medium | Physics | Add **Doppler RV curve** overlay showing radial velocity vs time for each body. Critical for exoplanet detection pedagogy. | `demos/binary-orbits/binary-orbits.js` |
| P1 | High | Medium | Physics | Add **light curve** overlay for edge-on systems (transit/eclipse dips). | `demos/binary-orbits/binary-orbits.js` |
| P2 | Medium | Medium | Physics | Add **3D inclination** control to show projection effects (why RV gives minimum mass). | `demos/binary-orbits/binary-orbits.js` |
| P2 | Medium | Medium | Pedagogy | Add **prediction checkpoint** mode with guided questions before revealing answers. | `demos/binary-orbits/binary-orbits.js` |
| P2 | Low | Low | Accessibility | Add on-screen **keyboard shortcuts** help panel. | `demos/binary-orbits/index.html` |
| P2 | Low | Medium | Physics | Add **tidal distortion** visualization for close binaries (Roche geometry). | `demos/binary-orbits/binary-orbits.js` |
| P3 | Low | Medium | Physics | Add **mass transfer** animation for semi-detached binaries. | `demos/binary-orbits/binary-orbits.js` |
| P3 | Low | Medium | Physics | Add **GR precession** for close, eccentric orbits (post-Newtonian correction). | `demos/_assets/binary-orbits-model.js` |

## Priority Definitions

- **P0:** Correctness or critical functionality (must fix before use)
- **P1:** High-impact pedagogy or usability (should add soon)
- **P2:** Nice-to-have enhancements (add when time permits)
- **P3:** Future extensions (research-level or specialized topics)

## Feature Notes

### Doppler RV Curve (P1)

The radial velocity curve is the primary observable for spectroscopic binaries and exoplanet detection. Implementation notes:

- Plot $v_r = v \sin i \cos(\theta + \omega)$ where $i$ is inclination and $\omega$ is argument of perihelion
- For edge-on systems ($i = 90^\\circ$), this simplifies to $v_r = v \\cos\\theta$
- Show both curves (for binaries) or just the star curve (for exoplanets)
- Sync with orbital animation so students see the connection

### Light Curve (P1)

For edge-on systems, show brightness dips during transits/eclipses. Implementation notes:

- Primary eclipse: smaller body in front of larger (deeper dip if smaller body is hotter)
- Secondary eclipse: larger body in front of smaller
- For star+planet: transit of planet causes small dip; secondary eclipse (planet behind star) may be undetectable
- Requires inclination control (or assume edge-on)

### 3D Inclination (P2)

Critical for understanding why RV gives minimum mass ($M \sin i$). Implementation notes:

- Add inclination slider ($0^\\circ$ = face-on, $90^\\circ$ = edge-on)
- Show that face-on systems have no RV signal
- Explain that we measure $v \sin i$, hence $M_p \sin i$
