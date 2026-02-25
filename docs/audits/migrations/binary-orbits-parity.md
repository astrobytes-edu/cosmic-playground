# binary-orbits Migration Parity Audit

Last updated: 2026-02-25

## 1) Behavior parity
- Preserved core circular two-body behavior (shared period, barycenter geometry, speed partition).
- Expanded model outputs to include momentum and RV observables:
  - $M_1v_1$, $M_2v_2$
  - $\omega = 2\pi/P$
  - $K_1$, $K_2$ with inclination projection.

## 2) Visual/interaction parity
- Original orbit-stage visualization retained and upgraded.
- Added RV view panel (toggle between orbit and RV plots).
- Added Energy view panel and stage toggle, including decomposition bars for $K_1$, $K_2$, $K$, $|U|$, and marker for $E$.
- Added quick-snap mass presets (equal, planet limit, $M_2=0.5M_1$).
- Added prediction checkpoint gate on mass-ratio changes (readouts freeze until reveal).
- Added persistent prediction-outcome readout outside the hidden gate panel.
- Added RV inversion challenge workflow (measure amplitudes on RV canvas, infer $q$, reveal and compare).

## 3) Export parity
- Existing export fields retained and extended.
- New exported readouts: inclination, angular frequency, momentum pair and mismatch, RV amplitudes.
- Hardening delta: export and station snapshot now respect prediction-lock state and use revealed values while pending.
- Pass 3 delta: export payload now includes energy readouts and RV challenge state/summary.

## 4) Pedagogical parity
- "What to notice" reframed from descriptive to causality-first dynamics.
- Added invariant discrimination workflow (must-hold statements plus distractors).
- Added direct observables bridge to spectroscopic binaries via RV amplitudes.
- Added measure → infer → compare loop for mass-ratio inference from observables.
- Added explicit energy-scaling cue bridge ($E \propto -1/a$ and, with fixed $M_1$, $|E| \propto M_2$).

## 5) Accessibility and performance hardening
- Added keyboard-complete radiogroup navigation for Orbit/RV view (`Arrow`, `Home`, `End`).
- Extended keyboard-complete radiogroup navigation to Orbit/RV/Energy.
- Added reduced-motion CSS overrides to remove entry animations for motion-sensitive users.
- RV plotting now avoids unnecessary hidden-view redraws and reuses cached sampled curves.
- Energy rendering now draws only when Energy view is active and reuses cached breakdown payloads.

## 6) Intentional deltas
- Expanded mass-ratio lower bound from 0.1 to 0.01 to support planet-limit reasoning.
- Added observer inclination as a first-class control.
- Added derived-equation panel for $\omega^2 = G(M_1+M_2)/a^3$ and $P^2 = a^3/(M_1+M_2)$.

## 7) Promotion recommendation
- Current recommendation: stay **experimental** until full app/site gates pass with this upgrade (`build`, `site e2e`), and manual pedagogy QA confirms prediction-gate pacing in class use.
