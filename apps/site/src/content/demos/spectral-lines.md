---
title: "Spectral Lines & the Bohr Atom"
status: draft
content_verified: true
levels: [Both]
topics: [LightSpectra]
time_minutes: 12
has_math_mode: false
tags: ["spectral lines", "Bohr atom", "emission", "absorption", "hydrogen", "energy levels"]
readiness: candidate
readinessReason: "SoTA UX/pedagogy uplift is complete (playbar transport, deeper challenge deck, tooltip affordances, misconception framing, expanded station snapshots) and regression gates are passing; launch-ready promotion now depends on classroom + screen-reader validation logs."
parityAuditPath: "docs/audits/migrations/spectral-lines-parity.md"
lastVerifiedAt: "2026-02-24"
learning_goals:
  - "Explain why atoms emit and absorb light only at specific wavelengths using the Bohr model."
  - "Connect energy-level transitions to the Rydberg formula and predict transition wavelengths."
  - "Distinguish Lyman, Balmer, and Paschen series and identify which fall in visible, UV, and IR bands."
  - "Recognize that each element has a unique spectral fingerprint and explain why."
misconceptions:
  - "Electrons orbit like planets — the Bohr model gives correct energies but not correct spatial pictures."
  - "Emission and absorption lines are unrelated — they occur at the same wavelengths."
  - "All hydrogen lines are visible — only the Balmer series falls primarily in visible light."
predict_prompt: "If an electron drops from n = 3 to n = 2 in hydrogen, will the photon be in the UV, visible, or infrared?"
play_steps:
  - "Set upper level to n = 3 and lower to n = 2 (H-alpha). Note the wavelength and color."
  - "Switch to Inverse mode, enter 656 nm, and solve for the transition; verify it infers Balmer n=3->2."
  - "Increase the upper level: watch the lines converge toward the series limit."
  - "Use the Hydrogen-tab Series Limit Microscope and move n_upper toward infinity to see line pile-up near the Balmer limit."
  - "Switch to Absorption mode: the same wavelengths now appear as dark dips."
  - "Change the series filter to Lyman — these are UV, invisible to our eyes."
  - "Switch to the Elements tab and enable H Balmer comparison to contrast fingerprints against sodium or iron."
  - "Use Mystery Spectrum in the Elements tab, commit to one evidence pattern, then check your answer."
  - "Use the Hydrogen-tab temperature panel to test why Balmer lines peak in A-type stars."
explain_prompt: "Use the Bohr energy formula and the Rydberg equation to explain the pattern of spectral lines and why each element has a unique fingerprint."
model_notes:
  - "Hydrogen energy levels computed from the Bohr formula: $E_n = -13.6\\ \\text{eV} / n^2$ (exact for hydrogen)."
  - "For hydrogen, Bohr energies match the exact Schrödinger eigenvalues for the pure $1/r$ Coulomb potential; circular orbits are not physically exact."
  - "Hydrogen tab is model-computed; Elements tab is empirical catalog data (NIST teaching subset), so Bohr ladder semantics apply only to hydrogen."
  - "Bound-state energies are negative because the reference is a free electron-proton pair at infinite separation: $E=0$."
  - "The limit $n=\\infty$ is the ionization limit (electron no longer bound), so $E_{\\infty}=0$."
  - "As $n_{\\text{upper}}$ increases, level spacing shrinks and lines converge toward each series limit."
  - "Emission and absorption use the same $\\Delta E$ values and therefore the same wavelengths."
  - "Wavelengths are vacuum wavelengths via $\\lambda = hc / \\Delta E$ with $hc = 1239.8\\ \\text{eV·nm}$."
  - "Multi-element line data from the NIST Atomic Spectra Database (strongest lines only)."
  - "Mystery mode requires a reflection commitment ('what pattern convinced you?') before reveal to train inference habits."
  - "Temperature readouts use qualitative proxy populations normalized over n=1,2,3 and a Balmer-strength proxy (Boltzmann excitation times neutral-hydrogen proxy), not full radiative transfer."
  - "Bohr atom radii in the visualization use a compressed display scale (labeled 'not to scale')."
  - "Line widths in the spectrum strip are for display only (fixed width, not physical broadening)."
demo_path: "/play/spectral-lines/"
station_path: "/stations/spectral-lines/"
instructor_path: "/instructor/spectral-lines/"
last_updated: "2026-02-24"
---

Explore how atoms produce light at specific wavelengths, then invert the problem: observed wavelength to inferred transition. The instrument links Bohr structure, series scaling, and stellar-spectrum inference in one loop.
