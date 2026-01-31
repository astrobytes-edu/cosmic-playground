# Demo Shell Layout Overhaul (2-Column + Below-Stage Panels) Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Make the visualization the hero by switching the shared demo shell from a 3-column layout to a 2-column layout with readouts and secondary panels below the stage, applied globally to all demos (breaking change).

**Architecture:** Update the shared CSS layout contract in `packages/theme/styles/demo-shell.css`, add a shared no-JS accordion panel pattern (native `<details>`), then migrate each demo’s `index.html` (move “What to notice” and “Model notes” into panels) and remove per-demo visualization width caps that shrink the stage.

**Tech Stack:** HTML + CSS (theme package), Vite demos (TypeScript). No new dependencies.

---

## Task 1: Update shared `demo-shell.css` to a 2-column layout

**Files:**
- Modify: `packages/theme/styles/demo-shell.css`
- Docs check: `docs/specs/cosmic-playground-theme-spec.md`

**Step 1: Update grid layout (breaking change)**

Replace the 3-column grid with a 2-column grid and explicit areas:

```css
.cp-demo {
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  grid-template-areas:
    "controls stage"
    "controls readouts"
    "controls drawer";
  gap: var(--cp-space-4);
  padding: var(--cp-space-4);
  min-height: 100svh;
  align-items: start;
}

.cp-demo__controls { grid-area: controls; }
.cp-demo__stage { grid-area: stage; min-width: 0; }
.cp-demo__readouts { grid-area: readouts; min-width: 0; }
.cp-demo__drawer { grid-area: drawer; min-width: 0; }
```

Add “stage is big” sizing defaults (avoid postage-stamp stage):

```css
.cp-demo__stage {
  min-height: clamp(420px, 70svh, 820px);
}
```

Add a mobile stack that puts the stage first:

```css
@media (max-width: 980px) {
  .cp-demo {
    grid-template-columns: 1fr;
    grid-template-areas:
      "stage"
      "readouts"
      "controls"
      "drawer";
  }
}
```

**Step 2: Keep controls usable (sticky + scroll)**

Use sticky controls on desktop with scrollable body:

```css
.cp-demo__controls {
  position: sticky;
  top: var(--cp-space-4);
  align-self: start;
  max-height: calc(100svh - (2 * var(--cp-space-4)));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cp-demo__controls .cp-panel-body {
  overflow: auto;
}

@media (max-width: 980px) {
  .cp-demo__controls {
    position: static;
    max-height: none;
  }
}
```

**Step 3: Readouts should lay out as a compact strip**

```css
.cp-demo__readouts .cp-panel-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--cp-space-3);
}
```

**Step 4: Responsive sanity check**

Manually verify in browser:
- Wide desktop: stage is the dominant element.
- Narrow/mobile: stage first, then readouts, then controls.

---

## Task 2: Add shared “Panels” accordion styles (no JS)

**Files:**
- Modify: `packages/theme/styles/demo-shell.css`

**Step 1: Add shared panel container + accordion styles**

Use a `.cp-panels` container inside `.cp-demo__drawer`, and style `details/summary` accordions.

Example CSS:

```css
.cp-panels {
  display: grid;
  gap: var(--cp-space-3);
}

.cp-accordion {
  background: var(--cp-bg1);
  border: 1px solid var(--cp-border);
  border-radius: var(--cp-r-3);
  box-shadow: var(--cp-shadow-1);
  overflow: hidden;
}

.cp-accordion > summary {
  cursor: pointer;
  padding: var(--cp-space-3) var(--cp-space-4);
  list-style: none;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--cp-space-3);
}

.cp-accordion > summary::-webkit-details-marker { display: none; }

.cp-accordion__meta {
  color: var(--cp-muted);
  font-size: 0.9rem;
}

.cp-accordion__body {
  padding: var(--cp-space-3) var(--cp-space-4) var(--cp-space-4);
  border-top: 1px solid var(--cp-border);
}
```

**Step 2: Make drawer act like a container (not a “big panel”)**

Optionally strip the old `.cp-drawer` visuals so the accordion panels provide the surfaces.

---

## Task 3: Migrate each demo `index.html` to use below-stage panels

**Files (modify):**
- `apps/demos/src/demos/angular-size/index.html`
- `apps/demos/src/demos/binary-orbits/index.html`
- `apps/demos/src/demos/eclipse-geometry/index.html`
- `apps/demos/src/demos/seasons/index.html`
- `apps/demos/src/demos/moon-phases/index.html`
- `apps/demos/src/demos/blackbody-radiation/index.html`
- `apps/demos/src/demos/conservation-laws/index.html`
- `apps/demos/src/demos/em-spectrum/index.html`
- `apps/demos/src/demos/keplers-laws/index.html`
- `apps/demos/src/demos/parallax-distance/index.html`
- `apps/demos/src/demos/telescope-resolution/index.html`

**Step 1: Move “What to notice” out of the readouts panel**

Remove the `.cp-notice` / “What to notice” block from `.cp-demo__readouts`.

**Step 2: Convert drawer into “Panels”**

Inside `.cp-demo__drawer`, replace the old “Model notes” content with:

```html
<section class="cp-demo__drawer cp-drawer" aria-label="Panels">
  <div class="cp-panels">
    <details class="cp-accordion" open>
      <summary>
        <span>What to notice</span>
        <span class="cp-accordion__meta">2 bullets</span>
      </summary>
      <div class="cp-accordion__body">
        <!-- existing bullets go here unchanged -->
      </div>
    </details>

    <details class="cp-accordion">
      <summary>
        <span>Model notes</span>
        <span class="cp-accordion__meta">assumptions</span>
      </summary>
      <div class="cp-accordion__body">
        <!-- existing model notes go here unchanged -->
      </div>
    </details>
  </div>
</section>
```

For stub demos, keep the existing model notes text (but inside the accordion body).

**Step 3: Keep readouts panel only for readouts**

The `.cp-demo__readouts` panel should contain only the numeric readouts (and optionally a 1-line muted hint).

---

## Task 4: Remove per-demo visualization width caps that shrink the stage

**Files (modify):**
- `apps/demos/src/demos/angular-size/style.css`
- `apps/demos/src/demos/eclipse-geometry/style.css`
- `apps/demos/src/demos/seasons/style.css`

**Step 1: Replace `width: min(..., 100%)` with `width: 100%`**

Example:

```css
.stage__svg {
  width: 100%;
  max-width: none;
  height: auto;
}
```

---

## Task 5: Make canvas demos scale to the larger stage (responsive + DPR-safe)

**Files (modify):**
- `apps/demos/src/demos/binary-orbits/main.ts`
- `apps/demos/src/demos/binary-orbits/style.css`
- `apps/demos/src/demos/moon-phases/main.ts`
- `apps/demos/src/demos/moon-phases/style.css`
- `apps/demos/src/demos/moon-phases/index.html`

**Step 1: CSS — make canvas follow its container**

```css
canvas {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  display: block;
}
```

**Step 2: TS — resize canvas to CSS pixels with devicePixelRatio**

Add a helper:

```ts
function resizeCanvasToCssPixels(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const nextWidth = Math.max(1, Math.round(rect.width * dpr));
  const nextHeight = Math.max(1, Math.round(rect.height * dpr));

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: rect.width, height: rect.height };
}
```

Call it before each draw and then draw using the returned CSS-pixel `width/height`.

**Step 3: Moon phases cleanup (optional, for consistency)**

Switch `apps/demos/src/demos/moon-phases/style.css` to import `../../shared/stub-demo.css` and update `index.html` to use `cp-action`, `cp-status`, `cp-readout`, `cp-notice` like other demos.

---

## Task 6: Update theme spec to match the new shell behavior

**Files:**
- Modify: `docs/specs/cosmic-playground-theme-spec.md`

**Step 1: Update the “demo shell layout contract” description**

Keep the same required regions, but document that:
- Desktop is a 2-column layout (controls left; stage column right with readouts + panels below).
- Under 980px, the stage stacks first.

---

## Task 7: Verification

**Step 1: Build**

Run: `corepack pnpm build`

Expected: build succeeds; demos copy into `apps/site/public/play/<slug>/`.

**Step 2: Typecheck**

Run: `corepack pnpm -r typecheck`

Expected: all workspaces typecheck successfully.

