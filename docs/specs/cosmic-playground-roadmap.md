# Cosmic Playground Ecosystem Roadmap and Product Spec v1.0

This roadmap assumes you’re already executing **Site Spec v0.1** (Astro “museum” + Vite demo apps + shared packages) and expands Cosmic Playground into a **full learning ecosystem**: exhibits, labs, tours, real data, media, and an authoring platform.

---

## 1) Vision

**Cosmic Playground is an interactive museum + lab manual for astronomy.**
Not “a list of demos,” but a place where learners:

* **Predict → Play → Explain** (guided inquiry)
* learn from **model honesty** (what’s simplified and why)
* practice **inference** (what can we deduce from observations/data?)
* build transferable skills (units, scaling, uncertainty, visualization)

---

## 2) Product pillars

### Pillar A — The Museum

**Curated learning experiences**, not just widgets.

* **Explore**: searchable/filterable catalog of demos
* **Exhibits**: pedagogical wrapper pages (story + goals + misconceptions + prompts)
* **Playlists**: sequences for ASTR101/ASTR201 units
* **Tours**: step-by-step guided experiences (later milestone)

### Pillar B — The Lab

Make demos **assignable** and **gradeable**.

* **Station Cards**: print-first activity sheets
* **Export Results**: clipboard-ready parameter/readout blocks for writeups
* **Assessment prompts**: concept checks + short rubrics aligned to the exhibit

### Pillar C — The Studio (Instructor + Authoring)

A platform you can extend fast without UI drift.

* **Instructor Notes**: activity ideas, facilitation tips, assessment items, common pitfalls
* **Authoring Kit**: scaffolding + shared runtime + quality gates so every new demo matches the house style

### Pillar D — The Observatory (Real data + Media)

Add “reality” without bloating complexity.

* **Data Playground**: tiny curated datasets + “fit/interpret” tasks
* **Media Gallery**: beautiful images/videos with correct credits/licensing metadata
* **Space Facts**: curated “micro-exhibits” that link into real concepts (not trivia spam)

### Pillar E — The Spacewalk (3D Wing)

Selective 3D where it *actually teaches something better than 2D*.

* solar system geometry and scale
* orbital inclination / nodes / eclipses in 3D
* coordinate systems, sky motion, parallax intuition
* telescope field-of-view + resolution in a 3D scene (careful: easy to overdo)

---

## 3) IA and sections (what the site *is*)

### Public museum (v1)

* `/explore/` — library + filters
* `/exhibits/<slug>/` — pedagogy wrapper + launch + embed
* `/play/<slug>/` — the demo app
* `/playlists/<slug>/` — guided sequences
* `/stations/<slug>/` — printable lab sheets
* `/instructor/<slug>/` — public instructor notes (not in main nav; optional `noindex`)

### New “beyond demos” wings (v1.5–v2)

* `/data/` — Data Playground hub (datasets + mini-labs)
* `/media/` — Media gallery hub (images/videos)
* `/facts/` — Space facts hub (short, sourced, concept-linked)
* `/3d/` — 3D wing hub (explicit performance warnings + device support notes)

---

## 4) Roadmap (phased)

### Phase 0 — Foundation (must be true before anything scales)

**Exit criteria**

* Monorepo + packages exist (theme/runtime/ui/physics)
* Content collections are typed and validated
* `/explore` + `/exhibits/[slug]` + `/stations/[slug]` ship
* Build pipeline produces `/play/<slug>/` artifacts reliably

---

### v1 — Public Beta: “Museum + Assignable Labs + Platform seed”

**Goal:** The site is already useful for ASTR101/201 *and* you can build more demos quickly.

#### v1 Deliverables

1. **Core museum**

* Explore page with filters + good card UX
* Exhibit pages with the full pedagogy structure
* Playlist pages that feel like mini-units (overview + steps + links)

2. **Assignable lab layer**

* Station cards with print CSS
* Demo “Copy Results” export format standardized

3. **Pilot demo refactor (the keystone)**

* 1 demo fully migrated to the new runtime + instrument shell
* Sets the gold standard for UI/UX + accessibility + export behavior

4. **Authoring Kit v0.1 (YES, in v1)**

* A generator/scaffold that creates:

  * a new demo folder with the instrument layout
  * wiring for modes + export + model note
  * correct imports for theme/runtime/ui/physics
* A couple quality gates (build-time warnings/errors):

  * no model note → fail
  * no exportResults → fail
  * missing metadata entry → fail

**Why Authoring Kit belongs in v1:**
Once the pilot demo locks the “instrument standard,” you want the kit immediately so every subsequent refactor doesn’t reinvent UI patterns. Otherwise your demo fleet will diverge and you’ll pay interest forever.

#### v1 Acceptance criteria

* 1 refactored demo is “exemplar quality”
* 3–5 additional demos can be **imported** (even temporarily) and exposed via exhibits
* Every demo listed in metadata has a working `/play/<slug>/`
* Station cards print cleanly
* Explore → Exhibit → Play flow is smooth on mobile

---

### v1.1 — “Factory mode”: migrate fast, keep quality

**Goal:** turn the kit into a production line.

* Harden Authoring Kit (templates + docs + lint rules)
* Refactor 5–10 demos to the new runtime
* Add “common UI patterns” library (presets, units toggle, reset, tooltips)
* Add Playwright smoke tests: `/play/<slug>/` loads, no console errors

Exit criteria: adding a new demo feels like adding a new Markdown page, not a new project.

---

### v1.5 — Guided Tours + Better assessment + Media + Early 3D experiment

**Goal:** make it feel like an actual museum experience.

1. **Tours (guided mode)**

* “stepper” overlays on exhibits/demos
* prompts that highlight UI regions and ask for a specific observation
* optional “checkpoints” (student self-check)

2. **Assessment toolkit**

* per exhibit: 3 concept checks + 1 short explanation prompt + rubric stub

3. **Media Gallery v0**

* curated sets (e.g., “JWST Infrared,” “Hubble Visible,” “Solar System Missions”)
* each item has required credit line + source metadata (see policies below)

4. **3D Wing v0 (one demo only)**

* pick one concept where 3D is unequivocally better (e.g., nodes/inclination/eclipses)
* strict performance budgets and a “2D fallback” plan

---

### v2 — Data Playground + 3D Wing + Community contributions

**Goal:** Cosmic Playground becomes a complete learning environment.

1. **Data Playground**

* tiny curated datasets (CSV/JSON) + “plot, fit, interpret uncertainty” mini-labs
* “Real Data Mode” versions of a few demos (noise, measurement limits, inference)

2. **3D Wing v1**

* 3–5 3D experiences total, each with:

  * explicit learning goal
  * clear camera controls
  * accessible fallback narrative

3. **Community layer (GitHub-native)**

* “contribute a playlist / activity wrapper” via PR templates
* curated gallery of instructor activities

---

## 5) Media and “Random Space Facts” (how to do this *without becoming fluff*)

### Media Gallery: make it a **Visual Index** that supports learning

* every media item must include:

  * **credit line**
  * **source**
  * **license/usage policy tag**
  * 1–2 sentences: “what am I looking at?” + “why it matters”
* link media items to exhibits (e.g., dust reddening → JWST vs Hubble comparison)

**Policy reality you should encode into the gallery tooling**

* NASA media is **generally usable for educational/informational purposes**, but you must respect cases where third-party rights are indicated. ([NASA][1])
* ESA media is copyrighted and requires **proper credit and adherence to terms**; some ESA properties explicitly require the credit line shown with each asset. ([European Space Agency][2])

### “Random Space Facts”: make them **micro-exhibits**, not trivia

* facts must be:

  * **sourced**
  * **concept-linked** (each fact points to at least one exhibit/playlist)
  * framed as: *claim → why you should care → how we know*
* consider two modes:

  * **Daily fact** on the home page
  * **Facts gallery** filtered by topic (but still structured)

---

## 6) 3D demos: yes, but with guardrails

3D is powerful when it helps learners build spatial intuition—NASA’s Eyes apps are a great precedent for browser-based 3D exploration of missions/objects/data. ([NASA Science][3])
WorldWide Telescope also treats “guided experiences” (tours) and layered 3D/imagery as core, which maps well to your future “Tours” concept. ([WorldWide Telescope][4])

**Guardrails**

* start with *one* 3D demo (v1.5) and make it excellent
* always include:

  * “reset camera”
  * “show axes / reference plane”
  * a 2D companion view or a guided tour mode
* don’t let 3D become “spinny toy mode”

---

## 7) Authoring Kit in v1 (explicit decision)

**Yes**—make **Authoring Kit v0.1** part of v1, immediately after the pilot demo sets the standard.

**Definition of “v0.1 kit” (minimum)**

* scaffold a new demo with:

  * instrument shell layout
  * model note block
  * export results plumbing
  * theme tokens wired
  * metadata stub created in content collections
* a “demo QA checklist” printed on first run (or in README)

This is the hinge that turns Cosmic Playground from “a project” into “a platform.”

---

## 8) Precedents you’re explicitly building toward (for alignment, not imitation)

* **NAAP** style: background + simulator(s) + student guide; supports pre/post testing and faculty guidance docs. ([Astro UNL][5])
* **PhET** style: teaching resources + activities database + community sharing; strong emphasis on how to *use* sims, not just host them. ([PhET][6])
* **WWT** style: “tours” as scripted, multimedia guided experiences. ([WorldWide Telescope][4])
* **NASA Eyes** style: browser-based 3D visualization for exploration of real mission/object data. ([NASA Science][3])

---

### Next practical move (so Codex can build toward this)

* Keep your existing **v0.1 site spec** as the engineering contract.
* Add this doc as **`docs/specs/cosmic-playground-ecosystem-roadmap-v1.0.md`**.
* Tell Codex: “Implement v1 (Public Beta) scope first; everything else is gated behind the Authoring Kit + the pilot demo quality bar.”

If you want, I can collapse this into a tighter “MVP checklist” version for Codex’s first PR, while keeping this roadmap as the north star.

[1]: https://www.nasa.gov/nasa-brand-center/images-and-media/?utm_source=chatgpt.com "Guidelines for using NASA Images and Media ..."
[2]: https://www.esa.int/ESA_Multimedia/Terms_and_conditions_of_use_of_images_and_videos_available_on_the_esa_website?utm_source=chatgpt.com "ESA - Terms and conditions of use of images and videos ..."
[3]: https://science.nasa.gov/eyes/?utm_source=chatgpt.com "NASA's Eyes - NASA Science"
[4]: https://docs.worldwidetelescope.org/tour-authoring-guide/1/?utm_source=chatgpt.com "WWT Tour Authoring Guide"
[5]: https://astro.unl.edu/naap/?utm_source=chatgpt.com "NAAP Astronomy Labs"
[6]: https://phet.colorado.edu/en/teaching-resources?utm_source=chatgpt.com "Teaching Resources"
