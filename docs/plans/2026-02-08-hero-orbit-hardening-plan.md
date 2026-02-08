# Hero Orbit Hardening — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a live binary-orbit micro-demo to the hero RHS, restructure the hero as a two-column grid, and reduce hero height.

**Architecture:** New `HeroOrbit.astro` component with inline `<script>` renders a Canvas 2D binary orbit loop. Reuses pure functions from `apps/demos/src/demos/binary-orbits/logic.ts` (copied, not imported — demos are a separate Vite build). Physics period calculation from `@cosmic/physics`.

**Tech Stack:** Astro, Canvas 2D, `@cosmic/physics`, CSS Grid.

---

### Task 1: Add @cosmic/physics dependency to site

**Files:**
- Modify: `apps/site/package.json`

**Step 1: Add the workspace dependency**

Add `"@cosmic/physics": "workspace:*"` to the `dependencies` object in `apps/site/package.json`, after the `@cosmic/runtime` line:

```json
"dependencies": {
  "@cosmic/physics": "workspace:*",
  "@cosmic/runtime": "workspace:*",
```

**Step 2: Install**

Run: `corepack pnpm install`
Expected: lockfile updates, no errors.

**Step 3: Verify build**

Run: `corepack pnpm build 2>&1 | tail -5`
Expected: "Complete!" with no errors.

**Step 4: Commit**

```bash
git add apps/site/package.json pnpm-lock.yaml
git commit -m "chore(site): add @cosmic/physics workspace dependency"
```

---

### Task 2: Reduce hero min-height token

**Files:**
- Modify: `packages/theme/styles/tokens.css:248` (change `50vh` to `40vh`)

**Step 1: Edit the token**

In `packages/theme/styles/tokens.css`, change:
```css
--cp-hero-min-height: 50vh;
```
to:
```css
--cp-hero-min-height: 40vh;
```

**Step 2: Run theme tests**

Run: `corepack pnpm -C packages/theme test -- --run 2>&1 | tail -5`
Expected: 116 passed. The test at line 272 checks `toContain("--cp-hero-min-height")` — the token still exists, so it passes.

**Step 3: Commit**

```bash
git add packages/theme/styles/tokens.css
git commit -m "feat(theme): reduce hero min-height from 50vh to 40vh"
```

---

### Task 3: Create HeroOrbit.astro component

**Files:**
- Create: `apps/site/src/components/HeroOrbit.astro`

**Step 1: Write the component**

Create `apps/site/src/components/HeroOrbit.astro` with this structure:

```astro
---
/**
 * Silent binary-orbit micro-demo for the home hero.
 * Two stars orbit a shared barycenter on a <canvas>.
 * No controls, no annotations — just physics in motion.
 * Respects prefers-reduced-motion with a static snapshot.
 */
---

<canvas class="hero-orbit" aria-hidden="true"></canvas>

<style>
  .hero-orbit {
    width: 100%;
    height: 100%;
    min-height: 200px;
    display: block;
  }
</style>

<script>
  import { TwoBodyAnalytic } from "@cosmic/physics";

  // --- Inlined pure functions from binary-orbits/logic.ts ---
  // (We inline instead of importing because demos are a separate Vite build.)

  function clamp(v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v));
  }

  function bodyRadius(mass: number, base: number): number {
    if (mass <= 0 || base <= 0) return 0;
    return base * (1 + 0.25 * Math.log10(mass + 1));
  }

  interface BinaryModel {
    m1: number; m2: number; total: number;
    r1: number; r2: number;
    omegaRadPerYr: number;
  }

  function computeModel(massRatio: number, sepAu: number): BinaryModel {
    const m1 = 1;
    const m2 = clamp(massRatio, 0.2, 5);
    const total = m1 + m2;
    const sep = clamp(sepAu, 1, 8);
    const periodYr = TwoBodyAnalytic.orbitalPeriodYrFromAuSolar({
      aAu: sep, massSolar: total
    });
    const omega = periodYr > 0 ? (2 * Math.PI) / periodYr : 0;
    return {
      m1, m2, total,
      r1: sep * (m2 / total),
      r2: sep * (m1 / total),
      omegaRadPerYr: omega,
    };
  }

  // --- Canvas rendering ---

  const canvas = document.querySelector<HTMLCanvasElement>(".hero-orbit");
  if (!canvas) throw new Error("HeroOrbit: canvas not found");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("HeroOrbit: 2d context unavailable");

  const model = computeModel(0.4, 3);
  const YEARS_PER_SEC = 0.06;
  const TRAIL_LENGTH = 90; // number of trail dots

  // Resolve CSS token colors once
  const style = getComputedStyle(document.documentElement);
  function cssVar(name: string) {
    return style.getPropertyValue(name).trim() || "#888";
  }
  const COLOR_PRIMARY = cssVar("--cp-celestial-sun");
  const COLOR_SECONDARY = cssVar("--cp-accent");
  const COLOR_MUTED = cssVar("--cp-muted");
  const COLOR_GLOW = cssVar("--cp-glow-blue");

  // Trail buffers: ring buffers of {x, y}
  const trail1: { x: number; y: number }[] = [];
  const trail2: { x: number; y: number }[] = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: rect.width, h: rect.height };
  }

  function draw(phaseRad: number) {
    const { w, h } = resize();
    const cx = w / 2;
    const cy = h / 2;
    ctx!.clearRect(0, 0, w, h);

    // Soft background glow
    const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.5);
    glow.addColorStop(0, COLOR_GLOW);
    glow.addColorStop(1, "transparent");
    ctx!.fillStyle = glow;
    ctx!.fillRect(0, 0, w, h);

    // Scale orbits to fit canvas
    const maxR = Math.max(model.r1, model.r2);
    const ppu = maxR > 0 ? (Math.min(w, h) * 0.36) / maxR : 1;
    const r1px = model.r1 * ppu;
    const r2px = model.r2 * ppu;

    // Body positions
    const cos = Math.cos(phaseRad);
    const sin = Math.sin(phaseRad);
    const x1 = cx - r1px * cos;
    const y1 = cy - r1px * sin;
    const x2 = cx + r2px * cos;
    const y2 = cy + r2px * sin;

    // Update trail buffers
    trail1.push({ x: x1, y: y1 });
    trail2.push({ x: x2, y: y2 });
    if (trail1.length > TRAIL_LENGTH) trail1.shift();
    if (trail2.length > TRAIL_LENGTH) trail2.shift();

    // Draw trails
    function drawTrail(trail: { x: number; y: number }[], color: string) {
      for (let i = 0; i < trail.length; i++) {
        const alpha = (i / trail.length) * 0.6;
        ctx!.fillStyle = color.startsWith("#")
          ? color + Math.round(alpha * 255).toString(16).padStart(2, "0")
          : color.replace(/[\d.]+\)$/, `${alpha})`);
        ctx!.beginPath();
        ctx!.arc(trail[i].x, trail[i].y, 1.5, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
    drawTrail(trail1, COLOR_PRIMARY);
    drawTrail(trail2, COLOR_SECONDARY);

    // Barycenter cross
    ctx!.strokeStyle = COLOR_MUTED;
    ctx!.globalAlpha = 0.3;
    ctx!.lineWidth = 1;
    ctx!.beginPath();
    ctx!.moveTo(cx - 4, cy); ctx!.lineTo(cx + 4, cy);
    ctx!.moveTo(cx, cy - 4); ctx!.lineTo(cx, cy + 4);
    ctx!.stroke();
    ctx!.globalAlpha = 1;

    // Bodies with glow
    const base = Math.min(w, h) * 0.02;

    function drawBody(x: number, y: number, mass: number, color: string) {
      const r = bodyRadius(mass, base);
      // Glow
      const g = ctx!.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, color);
      g.addColorStop(1, "transparent");
      ctx!.fillStyle = g;
      ctx!.beginPath();
      ctx!.arc(x, y, r * 3, 0, Math.PI * 2);
      ctx!.fill();
      // Solid body
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();
    }
    drawBody(x1, y1, model.m1, COLOR_PRIMARY);
    drawBody(x2, y2, model.m2, COLOR_SECONDARY);
  }

  // Animation loop
  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    // Pre-fill trail for static snapshot
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const phase = (i / TRAIL_LENGTH) * Math.PI * 1.5; // 270 deg of trail
      draw(phase);
    }
  } else {
    let lastTime = performance.now();
    let phaseRad = 0;
    function step(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      phaseRad += model.omegaRadPerYr * YEARS_PER_SEC * dt;
      draw(phaseRad);
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
</script>
```

Key decisions documented in the code:
- **Inlined binary logic** instead of importing from `apps/demos/src/demos/binary-orbits/logic.ts`. The demos workspace is a separate Vite build; cross-importing would create a build dependency we don't want. The inlined functions total ~30 lines.
- **Mass ratio 0.4, separation 3 AU**: produces a visually asymmetric orbit (smaller star orbits wider) at a comfortable pace.
- **Trail alpha**: linear ramp from 0 to 0.6, creating a comet-like fade.
- **Glow**: radial gradient at 3x body radius, same pattern as the full demo.
- **Color via CSS custom properties**: resolved once at init via `getComputedStyle`.

**Step 2: Verify build**

Run: `corepack pnpm build 2>&1 | tail -5`
Expected: "Complete!" — Astro bundles the inline script.

**Step 3: Commit**

```bash
git add apps/site/src/components/HeroOrbit.astro
git commit -m "feat(site): add HeroOrbit binary-orbit micro-demo for homepage hero"
```

---

### Task 4: Restructure hero as two-column grid

**Files:**
- Modify: `apps/site/src/pages/index.astro`

**Step 1: Add import**

At the top of the frontmatter, add:
```ts
import HeroOrbit from "../components/HeroOrbit.astro";
```

**Step 2: Update hero HTML**

Replace the hero section:
```astro
<section class="obs-hero cp-hero" aria-label="Welcome">
  <NebularHero />
  <div class="obs-hero__content">
    <h1 class="obs-hero__title">Cosmic Playground</h1>
    <p class="obs-hero__tagline">Play with the universe. Learn the physics.</p>
    <div class="obs-hero__actions">
      <a class="cp-button cp-button--primary" href={`${base}explore/`}>
        Explore demos
      </a>
      <a class="cp-button cp-button--ghost" href={`${base}playlists/`}>
        Browse playlists
      </a>
    </div>
  </div>
</section>
```

with:
```astro
<section class="obs-hero cp-hero" aria-label="Welcome">
  <NebularHero />
  <div class="obs-hero__grid">
    <div class="obs-hero__content">
      <h1 class="obs-hero__title">Cosmic Playground</h1>
      <p class="obs-hero__tagline">Play with the universe. Learn the physics.</p>
      <div class="obs-hero__actions">
        <a class="cp-button cp-button--primary" href={`${base}explore/`}>
          Explore demos
        </a>
        <a class="cp-button cp-button--ghost" href={`${base}playlists/`}>
          Browse playlists
        </a>
      </div>
    </div>
    <div class="obs-hero__orbit">
      <HeroOrbit />
    </div>
  </div>
</section>
```

**Step 3: Update hero CSS**

Replace the `.obs-hero__content` rule and add the grid container. The key changes:

```css
.obs-hero__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: var(--cp-space-5);
  width: 100%;
}

.obs-hero__content {
  display: grid;
  gap: var(--cp-space-3);
  max-width: 36rem;
}

.obs-hero__orbit {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}

@media (max-width: 767px) {
  .obs-hero__grid {
    grid-template-columns: 1fr;
  }
  .obs-hero__orbit {
    min-height: 200px;
  }
}
```

Remove the `position: relative; z-index: 1;` from `.obs-hero__content` (it moves to `.obs-hero__grid`).

**Step 4: Verify build**

Run: `corepack pnpm build 2>&1 | tail -5`
Expected: "Complete!"

**Step 5: Commit**

```bash
git add apps/site/src/pages/index.astro
git commit -m "feat(site): restructure hero as two-column grid with orbit canvas"
```

---

### Task 5: E2E smoke test + visual QA

**Files:**
- None created — just run verification.

**Step 1: Run full E2E suite**

Run: `CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e 2>&1 | tail -15`
Expected: 604+ passed, 38 skipped, no new failures.

**Step 2: Run theme tests**

Run: `corepack pnpm -C packages/theme test -- --run 2>&1 | tail -5`
Expected: 116 passed.

**Step 3: Run demo unit tests**

Run: `corepack pnpm -C apps/demos test -- --run 2>&1 | tail -5`
Expected: 1287 passed.

**Step 4: Visual QA (manual)**

Start the dev server: `corepack pnpm -C apps/site dev`

Check on desktop (>= 768px):
- [ ] Hero shows two-column: text left, orbit canvas right
- [ ] Two stars orbit at different radii, fading trails visible
- [ ] Nebula glow still visible behind orbit
- [ ] Starfield canvas behind everything
- [ ] "Start here" demos visible within ~1 scroll
- [ ] No layout shift or jank

Check on mobile (< 768px, use devtools):
- [ ] Hero stacks: text above, orbit below
- [ ] Orbit canvas ~200px tall, still animating
- [ ] No horizontal overflow

Check reduced-motion:
- [ ] In devtools, emulate `prefers-reduced-motion: reduce`
- [ ] Orbit shows static snapshot, no animation

**Step 5: Commit any fixes if needed**

If visual QA reveals issues, fix and commit with descriptive messages.
