# Cosmic Playground — Data Viewer Spec v0.1

**Status:** Draft (Codex-ready)

**Owner:** Anna

**Date:** 2026-01-29

**Repo:** `cosmic-playground`

**Related specs:**

* `docs/specs/cosmic-playground-site-spec.md`
* `docs/specs/cosmic-playground-roadmap.md`

---

## 0) One-liner

Build a **Cosmic Playground Data Viewer**: a standards-driven, education-first web app for **finding objects (by name/coords), visualizing sky context, querying a small curated set of catalogs, viewing cutouts and FITS, and running guided “tours”/activities**—with strong pedagogy and exportable results.

This viewer is **separate from the interactive physics demos** and is explicitly **not required for v1**. Demos ship first.

---

## 1) Scope and priorities

### 1.1 Primary goal

Make a tool that can do most of the *teaching work* during data-focused lessons:

* Students **observe** (sky + catalogs + images)
* Students **measure** (simple computations, region measurements)
* Students **infer** (what does this imply?)
* The system scaffolds them using **Predict → Play → Explain** steps.

### 1.2 v0.1 (this spec) — Minimum lovable Data Viewer

**Must have**

1. **Object search + resolution** (name → coordinates; coords → name)
2. **Object summary** (ID, type, basic properties, cross-IDs)
3. **Sky context view** (fast background imagery + overlays)
4. **Catalog queries** (a curated set; show table + simple plots)
5. **FITS/image viewing** (JS9 integration is allowed)
6. **Guided activities (“Tours”)** that can run inside the viewer
7. **Export results** (clipboard-ready artifact) with **required credits**

**Nice-to-have**

* cross-match (CDS XMatch)
* SIA image discovery
* an “ADQL sandbox” (advanced mode)

### 1.3 Non-goals (v0.1)

* Not a full research environment.
* Not “every catalog on Earth.” Prefer curated, stable teaching datasets.
* No accounts/auth.
* No heavy backend required (optional lightweight proxy is permitted if CORS/rate-limits force it).

---

## 2) User stories (pedagogical)

### 2.1 Student

* I can type **M42** or **Sirius** and get a correct sky position.
* I can see the object on the sky in context and **switch surveys**.
* I can query a **small set of catalogs** (Gaia, 2MASS, etc.) in a cone around the target.
* I can view an image/cutout, adjust contrast, and make a basic measurement.
* I can follow a guided activity that tells me what to do and asks me to explain what I saw.
* I can export a results block for my homework/lab report.

### 2.2 Instructor (future-you)

* I can author activities/tours as plain text files in the repo.
* I can keep activities stable by pinning to curated datasets or cached snapshots.
* I can reuse the same activity across ASTR101 and ASTR201 by switching “difficulty lenses.”

---

## 3) Information architecture and routing

### 3.1 Where it lives

Add a new app:

* `apps/viewer` — Vite-built viewer app

Deployed under the museum site:

* `/viewer/` — viewer home
* `/viewer/object/<slug-or-encoded-query>/` — deep link to a resolved object
* `/viewer/tour/<slug>/` — open viewer and load a tour

### 3.2 Navigation philosophy

The museum stays the “front door.” The viewer is a “wing.”

* Exhibit pages can optionally include a “Explore in Data Viewer” button.
* Tours can be linked from playlists.

---

## 4) Architecture (high level)

### 4.1 Frontend

* Vite app in `apps/viewer`
* TypeScript preferred
* Framework optional (vanilla/Preact/React/Svelte) — choose one and standardize

### 4.2 Integration with Astro

* Viewer builds to `apps/viewer/dist/`
* A script copies the built viewer into `apps/site/public/viewer/`
* Astro routes to a simple wrapper page that links to `/viewer/` (or uses direct static hosting under `/viewer/`)

### 4.3 Shared packages

* `packages/theme` — museum + instrument theme tokens
* `packages/ui` — panels, tabs, tables, callouts
* `packages/runtime` — tour engine + export results + (optional) telemetry hooks
* `packages/physics` — coordinate helpers, units, small math utilities

---

## 5) Data sources and service adapters

### 5.1 Design principle: “Small set, standards-first”

Build a small number of robust adapters that can talk to multiple services:

* Name resolution
* Object database
* Catalog query
* Image/cutout retrieval
* FITS viewer

Prefer standards (TAP/ADQL, Cone Search, SIA, HiPS) when possible.

### 5.2 Required adapters (v0.1)

#### A) Name Resolver (Sesame)

**Purpose:** Convert object names → coordinates + alternative IDs.

* Input: `name: string`
* Output: `{ raDeg, decDeg, canonicalName?, ids?, resolverUsed? }`

Implementation:

* Use Sesame HTTP GET.
* Parse XML output.
* Cache results.

#### B) Object Summary (SIMBAD)

**Purpose:** Retrieve object facts and cross-identifications.

* Input: `{ raDeg, decDeg }` or `{ objectName }`
* Output: `ObjectSummary` model

Implementation options:

* Preferred: TAP/ADQL query (robust, structured)
* Alternate: SIMBAD Script output / VOTable (also structured)
* Avoid parsing HTML.

Add rate limiting and caching.

#### C) Sky Background (HiPS2FITS cutouts)

**Purpose:** Render a sky image for the current center/FOV without building a full sky atlas.

* Input: `{ hipsSurveyId, raDeg, decDeg, fovDeg, widthPx, heightPx, projection, format }`
* Output: image URL (jpg/png) OR FITS cutout

Strategy:

* For sky pane, use **jpg/png** cutouts.
* For analysis pane, request **FITS** cutouts and open them in JS9.

Hard constraints:

* Enforce service limitations (pixel count budget).

#### D) Catalog Query (TAP: VizieR ADQL)

**Purpose:** Query a curated set of catalogs in a cone around the target.

* Input: `{ catalogId, raDeg, decDeg, radiusArcmin, columns?, limit? }`
* Output: rows + metadata

Strategy:

* Use TAP/ADQL.
* Include “safe templates” for students (no raw SQL injection free-for-all by default).

#### E) FITS / Image Viewer (JS9)

**Purpose:** Provide professional-grade, browser-based FITS viewing and simple measurements.

* Load FITS produced by HiPS2FITS or SIA cutouts.
* Enable contrast/stretch controls, regions, basic stats.

Integration:

* Embed JS9 in a dedicated panel.
* Provide a minimal “bridge API” so tours can trigger:

  * load file
  * set stretch
  * create region
  * read region stats (if available)

### 5.3 Optional adapters (post v0.1)

#### F) Simple Image Access (SIA)

* Discover archival images/cutouts for a coordinate region.
* Use when you want “real observation products,” not just survey cutouts.

#### G) CDS XMatch

* Cross-match student-provided lists with a curated catalog.
* Useful for “researcher mode” and data-wrangling labs.

---

## 6) Curated content model (the teaching layer)

### 6.1 Philosophy

The viewer should not dump infinite data on students.

Instead:

* Provide curated **Target Packs**
* Provide curated **Catalog Packs**
* Provide authored **Tours/Activities**

### 6.2 Content Collections (repo-driven)

Add in `apps/site/src/content/` (or a shared `content/` folder consumed by both apps):

* `viewer-targets/` — curated objects
* `viewer-catalogs/` — curated catalogs and query templates
* `viewer-surveys/` — curated HiPS survey IDs
* `viewer-tours/` — guided tours / activities
* `viewer-datasets/` — optional cached snapshots

### 6.3 Target schema (example)

Fields:

* `slug`, `title`
* `aliases[]`
* `raDeg`, `decDeg` (optional; can be resolved via Sesame)
* `defaultFovDeg`, `defaultRadiusArcmin`
* `recommendedSurveys[]` (HiPS IDs)
* `recommendedCatalogs[]`
* `learningTags[]` (dust, star-formation, distance-ladder, etc.)
* `whyThisMatters` (short)
* `commonMisconceptions[]`

### 6.4 Catalog schema (example)

Fields:

* `catalogId` (service-specific)
* `displayName`
* `service` (TAP endpoint)
* `defaultColumns[]`
* `coneQueryTemplate` (ADQL with placeholders)
* `rowLimitDefaults` (e.g., 1000)
* `pedagogyNotes` (what this catalog teaches)

### 6.5 Survey schema (example)

Fields:

* `hipsId` (string)
* `displayName`
* `band` (optical/IR/UV/X-ray)
* `defaultStretch` (min_cut/max_cut/stretch)
* `pedagogyNotes` (what you learn from this band)

### 6.6 Tour schema (the core)

Tours are how “Cosmic Playground teaches for you.”

Fields:

* `slug`, `title`
* `audience` (ASTR101 / ASTR201 / Both)
* `estimatedMinutes`
* `targets[]` (slugs)
* `prereqs[]`
* `steps[]` (DSL defined below)
* `assessment` (optional)

---

## 7) Tour / Activity engine (DSL)

### 7.1 Design goals

* Author tours in Markdown/YAML.
* Tours can control the viewer (set target, set survey, run query) and prompt students.
* Tours can optionally **check** whether students performed an action.

### 7.2 Step types

Each step is one of:

1. `narrate`

* Show text + optional image.

2. `predict`

* Ask a prediction question. Store response locally.

3. `setTarget`

* Resolve and center on a target.

4. `setSurvey`

* Select a HiPS survey and render background.

5. `setFov`

* Set FoV/radius.

6. `runCatalogQuery`

* Execute a catalog query template.

7. `inspectTable`

* Prompt students to find a pattern (e.g., “sort by parallax”).

8. `plot`

* Generate a simple plot (color–magnitude diagram, histogram, scatter).

9. `measure`

* Measurement prompt (e.g., angular separation, region stats in JS9).

10. `explain`

* Ask students to write an explanation.

11. `checkpoint`

* Optional: verify state (survey selected, query ran, plot created).

### 7.3 DSL example

```yaml
steps:
  - type: narrate
    title: "Welcome"
    body: "Today you’ll discover how dust changes what we see."

  - type: setTarget
    target: "orion-nebula"

  - type: predict
    prompt: "In infrared surveys, do you expect to see *more* or *less* structure inside the nebula than in optical? Why?"

  - type: setSurvey
    hipsId: "CDS/P/DSS2/color"

  - type: setSurvey
    hipsId: "CDS/P/2MASS/color"

  - type: runCatalogQuery
    catalogId: "gaia-dr3"
    radiusArcmin: 10

  - type: plot
    kind: "cmd"
    x: "bp_rp"
    y: "phot_g_mean_mag"
    yInvert: true

  - type: explain
    prompt: "Explain how your observations support or contradict your prediction."
```

---

## 8) Viewer UX: panels and affordances

### 8.1 Layout

Use the “instrument” layout philosophy:

* **Left:** controls and tour stepper
* **Center:** sky view and/or JS9 view (tabbed)
* **Right:** object summary + readouts + table/plot tabs
* **Bottom drawer:** credits + export + model notes

### 8.2 Global controls

* Search box (name/coords)
* Survey picker (banded, curated)
* Radius/FoV control
* Catalog picker (curated)
* “Run query” button
* “Export results” button
* “Start tour” button

### 8.3 Sky view

* Background image from HiPS2FITS (jpg/png)
* Overlay layers:

  * target marker
  * coordinate grid (optional)
  * catalog points (scatter overlay)
* Pan/zoom behavior:

  * On drag: show low-res or cached frame
  * On release: request new cutout

### 8.4 Table view

* Column selection (predefined + advanced)
* Sorting/filtering
* Quick stats (min/max/median)
* Export as CSV

### 8.5 Plot view

Minimum plot types:

* scatter
* histogram
* CMD preset (color vs magnitude)

Keep plotting library lightweight and consistent.

### 8.6 FITS view (JS9)

* Load FITS cutouts
* Stretch presets
* Regions + basic stats
* Optional catalog overlay

---

## 9) Export and “grading ergonomics”

### 9.1 Export format (clipboard)

All exports must be human-readable and include credits.

```
Cosmic Playground — Data Viewer Results
Tour: <tour title or N/A>
Target: <name> (RA, Dec)
Timestamp: <ISO>

Surveys:
- <hips survey id>

Catalog queries:
- <catalog> radius=<...> rows=<...>

Key observations:
- ...

Measurements:
- ...

Claim:
<one sentence>

Evidence:
- ...

Credits:
- SIMBAD database (CDS)
- HiPS2FITS service (CDS)
- JS9 (MIT)
```

### 9.2 Station cards and assignments

Tours should generate a printable “station card” summary:

* steps
* blanks
* parameter table
* claim/evidence box

---

## 10) Rate limiting, caching, and stability

### 10.1 Rate limiting

* Implement client-side throttles per service.
* Batch queries when possible.

### 10.2 Caching strategy

* In-memory cache for recent responses
* localStorage cache for:

  * resolved targets
  * recent query results (small)
  * tour progress

### 10.3 “Curated snapshots” (optional but recommended)

Because upstream databases can evolve:

* Allow tours to reference **cached datasets** stored in repo (`viewer-datasets/`).
* Provide a script to refresh snapshots periodically.

---

## 11) Credits, licensing, and attribution (must be explicit)

### 11.1 UI requirements

Every viewer session must have a visible **Credits** panel that lists:

* services used
* required acknowledgments

### 11.2 Embed credits into exports

Export blocks must include credits.

---

## 12) Testing and QA

### 12.1 Unit tests

* Adapters parse responses correctly (Sesame XML, VOTable, JSON where applicable)
* Query template substitution is safe

### 12.2 Integration tests

* Mock network responses for deterministic tests
* “Golden” snapshots for parsing

### 12.3 E2E tests (Playwright)

* resolve object
* render sky image
* run one catalog query
* generate one plot
* export results

---

## 13) Implementation milestones (Codex plan)

### Milestone A — Scaffolding

* Create `apps/viewer` Vite app
* Add copy step into `apps/site/public/viewer/`
* Add basic routing/deep links

### Milestone B — Minimum viewer

* Sesame name resolution
* SIMBAD summary (one robust method)
* HiPS2FITS sky background (jpg)
* One catalog query via TAPVizieR
* Table display

### Milestone C — Pedagogy engine

* Tour DSL parsing
* Stepper UI
* Ability to set target/survey/run query
* Export results

### Milestone D — JS9 integration

* Load FITS cutout from HiPS2FITS
* Basic stretch controls
* Regions + stats

### Milestone E — Authoring workflow

* Add templates for targets/catalogs/surveys/tours
* Add validation scripts (missing IDs, missing endpoints)

---

## 14) Appendix: Reference endpoints and standards (for implementers)

> Put URLs in code blocks to avoid accidental markdown-link rewriting.

```text
Sesame name resolver (CDS):
- https://cds.unistra.fr/cgi-bin/nph-sesame

SIMBAD (CDS):
- Basic query UI: https://simbad.u-strasbg.fr/simbad/
- URL query docs: https://simbad.u-strasbg.fr/Pages/guide/sim-url.htx
- Script execution: https://simbad.u-strasbg.fr/simbad/sim-fscript

TAP/ADQL standards:
- TAP (IVOA): https://www.ivoa.net/documents/TAP/
- ADQL (IVOA): https://www.ivoa.net/documents/ADQL/

VizieR TAP/ADQL:
- TAP endpoint: http://tapvizier.u-strasbg.fr/TAPVizieR/tap/

HiPS / HiPS2FITS:
- HiPS standard: https://www.ivoa.net/documents/HiPS/
- HiPS2FITS docs + API params: https://alasky.cds.unistra.fr/hips-image-services/hips2fits

SIA (optional):
- SIA 2.0: https://www.ivoa.net/documents/SIA/

Cone Search (optional):
- Cone Search: https://www.ivoa.net/documents/latest/ConeSearch.html

CDS XMatch (optional):
- Docs: https://cdsxmatch.u-strasbg.fr/xmatch/doc/

JS9:
- Docs + downloads: https://js9.si.edu/
- GitHub: https://github.com/ericmandel/js9
```
