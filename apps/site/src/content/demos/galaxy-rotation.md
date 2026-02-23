---
title: "Galaxy Rotation Curves"
status: draft
content_verified: true
levels: [Both]
topics: [Galaxies, Cosmology, DataInference]
time_minutes: 16
has_math_mode: false
tags: ["rotation curves", "dark matter", "MOND", "NFW halo", "galaxy dynamics", "21-cm"]
readiness: candidate
readinessReason: "Physics + demo + content + targeted contract tests are implemented; launch-ready still requires classroom and screen-reader validation artifacts."
parityAuditPath: "docs/audits/migrations/galaxy-rotation-parity.md"
lastVerifiedAt: "2026-02-23"
learning_goals:
  - "Interpret galaxy rotation curves as velocity-versus-radius observables inferred from Doppler measurements."
  - "Compare visible-matter-only Keplerian predictions to flat observed curves and infer missing mass."
  - "Relate bulge, disk, and halo component models to total curve shape and enclosed-mass growth."
  - "Use baryon fraction and dark-to-visible ratio readouts to reason about mass budgets at large radius."
misconceptions:
  - "Galaxies should behave like the solar system, so outer stars must always slow as $R^{-1/2}$."
  - "A face-on schematic means real observations are made face-on too."
  - "A good MOND fit to galaxy curves means dark matter is ruled out at all scales."
predict_prompt: "If a galaxy had only visible bulge+disk mass, what should happen to orbital speed from $30$ to $50\\,{\\rm kpc}$, and what would that imply for $M(<R)$?"
play_steps:
  - "Start with `No dark matter` and trace the outer slope from $30$ to $50\\,{\\rm kpc}$."
  - "Switch to `Milky Way-like` and compare $V_{\\rm total}$ with $V_{\\rm Kep}$ at the same radii."
  - "Increase halo mass and watch the outer curve flatten while $M_{\\rm dark}/M_{\\rm vis}$ rises."
  - "Toggle to mass mode and identify where $M_{\\rm dark}$ exceeds $M_{\\rm vis}$."
  - "Turn on MOND and compare it to the dark-halo model at galaxy scales."
  - "Use the normalized inset to contrast solar-system Keplerian behavior with galaxy behavior."
  - "Run one mystery challenge round, then copy challenge evidence for debrief."
explain_prompt: "At $R=30\\,{\\rm kpc}$, why can two models produce similar speeds while implying different physical interpretations, and what additional scale-dependent evidence breaks the tie?"
model_notes:
  - "Mass model uses a Hernquist bulge, exact exponential disk rotation (modified Bessel $I_n$/$K_n$ terms), and NFW halo."
  - "Velocities add in quadrature: $V_{\\rm total}^2=V_{\\rm bulge}^2+V_{\\rm disk}^2+V_{\\rm halo}^2$."
  - "NFW derived quantities ($R_{\\rm vir}$, $c$) use internal cosmology defaults ($H_0=67.4\\,{\\rm km\\,s^{-1}\\,Mpc^{-1}}$, $\\Omega_m=0.315$)."
  - "MOND is shown as an optional comparison curve via full interpolation, not as a full parameter-fitting workflow."
  - "The galaxy panel is a face-on schematic; published curves are inclination-corrected intrinsic $V(R)$."
  - "Readout $\\Delta\\lambda_{21}$ uses $\\Delta\\lambda_{21}=\\lambda_0 V/c$ with $\\lambda_0=21.106\\,{\\rm cm}$."
demo_path: "/play/galaxy-rotation/"
station_path: "/stations/galaxy-rotation/"
instructor_path: "/instructor/galaxy-rotation/"
last_updated: "2026-02-23"
---

Explore why spiral-galaxy rotation curves stay nearly flat at large radius and what that implies about dark matter across scales.
