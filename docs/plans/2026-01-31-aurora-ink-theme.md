# Aurora Ink Theme Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the blue-heavy "cosmic cliché" theme with a modern "Aurora Ink" aesthetic—warm ink blacks, teal + pink neon accents, violet tertiary, plus a clean light mode ("Paper") for instructor-facing pages.

**Architecture:** Two-theme system (`aurora-ink` dark default, `paper` light). Tokens centralized in `tokens.css` with theme variants via `[data-theme]` selectors. Layer files (museum/instrument) remain separate but inherit from theme tokens. TS constants updated for parity.

**Tech Stack:** Pure CSS custom properties, `color-mix()` for derived colors, `data-theme` attribute switching, Astro layout integration.

---

## Files Overview

| File | Action |
|------|--------|
| `packages/theme/styles/tokens.css` | Major rewrite (new color system) |
| `packages/theme/styles/layer-museum.css` | Update gradient hues |
| `packages/theme/styles/layer-instrument.css` | Update glow alphas + callout colors |
| `packages/theme/styles/layer-paper.css` | **Create** (light theme layer) |
| `packages/theme/styles/components/button.css` | Add pink accent variant |
| `packages/theme/src/vars.ts` | Expand constants |
| `packages/theme/src/layer.ts` | Add `paper` theme support |
| `apps/site/src/styles/global.css` | Import paper layer, update button |
| `apps/site/src/layouts/Layout.astro` | Add theme toggle support |
| `docs/specs/cosmic-playground-theme-spec.md` | Update spec |

---

## Task 1: Update Core Token System

**Files:**
- Modify: `packages/theme/styles/tokens.css`

**Step 1: Replace neutrals with warm ink blacks**

Change lines 4-8 from:

```css
/* ---------- Neutrals ---------- */
--cp-bg0: #070a12; /* page background */
--cp-bg1: #0b1020; /* cards/panels */
--cp-bg2: #0f1a33; /* elevated */
--cp-border: rgba(255, 255, 255, 0.1);
```

To:

```css
/* ---------- Neutrals (warm ink, not blue) ---------- */
--cp-bg0: #0a0a0c;    /* page background - neutral ink */
--cp-bg1: #101014;    /* cards/panels - charcoal */
--cp-bg2: #18181c;    /* elevated - warm charcoal */
--cp-bg3: #1f1f24;    /* highest elevation */
--cp-border: rgba(255, 255, 255, 0.10);
--cp-border-subtle: rgba(255, 255, 255, 0.06);
```

**Step 2: Replace text colors with neutral whites**

Change lines 10-12 from:

```css
--cp-text: #eaf2ff;
--cp-muted: #b7c4da;
--cp-faint: #7d8ba6;
```

To:

```css
/* ---------- Text (neutral, not blue-tinted) ---------- */
--cp-text: #e8e8ec;      /* primary - neutral white */
--cp-text2: #c9c9d0;     /* secondary */
--cp-muted: #9a9aa6;     /* tertiary */
--cp-faint: #6a6a78;     /* quaternary */
```

**Step 3: Replace accent system**

Change lines 14-18 from:

```css
/* ---------- Accents (cosmic, controlled) ---------- */
--cp-accent: #2dd4bf; /* aurora teal (primary) */
--cp-accent2: #a78bfa; /* nebula violet (secondary) */
--cp-accent3: #60a5fa; /* ion blue (links) */
--cp-accent4: #ec4899; /* nebula magenta (sparingly) */
```

To:

```css
/* ---------- Accents (aurora ink: teal + pink + violet) ---------- */
--cp-accent: #2dd4bf;       /* teal - primary interactive */
--cp-accent-hover: #5eead4;
--cp-pink: #ff2d95;         /* pink - special emphasis, goals */
--cp-pink-hover: #ff5cad;
--cp-violet: #a78bfa;       /* violet - tertiary, categories */
--cp-violet-hover: #c4b5fd;

/* Legacy aliases (for gradual migration) */
--cp-accent2: var(--cp-violet);
--cp-accent3: var(--cp-accent);  /* links now use teal */
--cp-accent4: var(--cp-pink);
```

**Step 4: Update glow tokens**

Change lines 25-29 from:

```css
/* ---------- Glows (low alpha = not loud) ---------- */
--cp-glow-accent: rgba(45, 212, 191, 0.22);
--cp-glow-violet: rgba(167, 139, 250, 0.18);
--cp-glow-blue: rgba(96, 165, 250, 0.2);
--cp-glow-magenta: rgba(236, 72, 153, 0.16);
```

To:

```css
/* ---------- Glows (aurora palette, not blue-heavy) ---------- */
--cp-glow-teal: rgba(45, 212, 191, 0.18);
--cp-glow-pink: rgba(255, 45, 149, 0.12);
--cp-glow-violet: rgba(167, 139, 250, 0.14);

/* Legacy aliases */
--cp-glow-accent: var(--cp-glow-teal);
--cp-glow-blue: var(--cp-glow-violet);  /* map old blue → violet */
--cp-glow-magenta: var(--cp-glow-pink);
```

**Step 5: Add selection + focus tokens**

Add after the focus section (around line 32):

```css
/* ---------- Selection & Focus ---------- */
--cp-selection-bg: rgba(255, 45, 149, 0.28);
--cp-focus: rgba(45, 212, 191, 0.70);
--cp-focus-ring: 2px solid var(--cp-focus);
```

**Step 6: Update link colors and add selection**

Change lines 116-128 from:

```css
a {
  color: var(--cp-accent3);
  text-decoration: none;
  transition: color var(--cp-transition-fast) var(--cp-ease-out);
}

a:hover {
  color: color-mix(in srgb, var(--cp-accent3) 80%, white);
}

a:active {
  color: var(--cp-accent3);
}
```

To:

```css
a {
  color: var(--cp-accent);
  text-decoration: none;
  text-decoration-color: rgba(45, 212, 191, 0.35);
  text-underline-offset: 0.18em;
  transition: color var(--cp-transition-fast) var(--cp-ease-out);
}

a:hover {
  color: var(--cp-accent-hover);
  text-decoration-color: rgba(94, 234, 212, 0.55);
}

a:active {
  color: var(--cp-accent);
}

::selection {
  background: var(--cp-selection-bg);
  color: var(--cp-text);
}
```

**Step 7: Run build to verify no syntax errors**

```bash
corepack pnpm build
```

Expected: Build succeeds.

**Step 8: Commit**

```bash
git add packages/theme/styles/tokens.css
git commit -m "$(cat <<'EOF'
feat(theme): replace blue palette with Aurora Ink tokens

- Warm ink blacks (#0a0a0c) instead of blue-blacks
- Neutral text (#e8e8ec) instead of blue-tinted
- Teal primary + pink accent + violet tertiary
- Add selection/focus tokens
- Legacy aliases for gradual migration

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Update Museum Layer Gradients

**Files:**
- Modify: `packages/theme/styles/layer-museum.css`

**Step 1: Replace blue-heavy gradients with aurora palette**

Change lines 2-18 from:

```css
.cp-layer-museum {
  background: radial-gradient(
      900px circle at 18% 12%,
      var(--cp-glow-blue),
      transparent 58%
    ),
    radial-gradient(
      900px circle at 82% 18%,
      var(--cp-glow-violet),
      transparent 62%
    ),
    radial-gradient(
      900px circle at 50% 95%,
      var(--cp-glow-accent),
      transparent 62%
    ),
    var(--cp-bg0);
}
```

To:

```css
.cp-layer-museum {
  background:
    radial-gradient(
      900px circle at 15% 10%,
      var(--cp-glow-violet),
      transparent 55%
    ),
    radial-gradient(
      900px circle at 85% 18%,
      var(--cp-glow-pink),
      transparent 50%
    ),
    radial-gradient(
      1100px circle at 50% 100%,
      var(--cp-glow-teal),
      transparent 55%
    ),
    var(--cp-bg0);
}
```

**Step 2: Update card hover glow**

Change lines 32-36 from:

```css
.cp-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--cp-card-glow), var(--cp-shadow-2);
  border-color: color-mix(in srgb, var(--cp-border) 65%, var(--cp-accent3));
}
```

To:

```css
.cp-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(45, 212, 191, 0.12), var(--cp-shadow-2);
  border-color: color-mix(in srgb, var(--cp-border) 50%, var(--cp-accent));
}
```

**Step 3: Commit**

```bash
git add packages/theme/styles/layer-museum.css
git commit -m "$(cat <<'EOF'
feat(theme): aurora gradient for museum layer

- Violet upper-left, pink upper-right, teal bottom
- Removes blue-heavy atmospheric wash

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Update Instrument Layer

**Files:**
- Modify: `packages/theme/styles/layer-instrument.css`

**Step 1: Update reduced glow values**

Change lines 6-12 from:

```css
.cp-layer-instrument {
  --cp-glow-accent: rgba(45, 212, 191, 0.1);
  --cp-glow-violet: rgba(167, 139, 250, 0.08);
  --cp-glow-blue: rgba(96, 165, 250, 0.08);
  --cp-glow-magenta: rgba(236, 72, 153, 0.06);
}
```

To:

```css
.cp-layer-instrument {
  --cp-glow-teal: rgba(45, 212, 191, 0.08);
  --cp-glow-pink: rgba(255, 45, 149, 0.05);
  --cp-glow-violet: rgba(167, 139, 250, 0.06);

  /* Legacy */
  --cp-glow-accent: var(--cp-glow-teal);
  --cp-glow-blue: var(--cp-glow-violet);
  --cp-glow-magenta: var(--cp-glow-pink);
}
```

**Step 2: Update callout colors**

Change lines 33-48 from:

```css
.cp-callout {
  border-left: 3px solid var(--cp-accent3);
  background: rgba(96, 165, 250, 0.08);
  padding: var(--cp-space-3) var(--cp-space-4);
  border-radius: var(--cp-r-2);
}

.cp-callout[data-kind="model"] {
  border-left-color: var(--cp-accent2);
  background: rgba(167, 139, 250, 0.08);
}

.cp-callout[data-kind="misconception"] {
  border-left-color: var(--cp-accent4);
  background: rgba(236, 72, 153, 0.08);
}
```

To:

```css
.cp-callout {
  border-left: 3px solid var(--cp-accent);
  background: rgba(45, 212, 191, 0.08);
  padding: var(--cp-space-3) var(--cp-space-4);
  border-radius: var(--cp-r-2);
}

.cp-callout[data-kind="model"] {
  border-left-color: var(--cp-violet);
  background: rgba(167, 139, 250, 0.08);
}

.cp-callout[data-kind="misconception"] {
  border-left-color: var(--cp-pink);
  background: rgba(255, 45, 149, 0.08);
}
```

**Step 3: Commit**

```bash
git add packages/theme/styles/layer-instrument.css
git commit -m "$(cat <<'EOF'
feat(theme): aurora palette for instrument layer callouts

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create Light Theme Layer (Paper)

**Files:**
- Create: `packages/theme/styles/layer-paper.css`

**Step 1: Write the light theme layer**

Create the file with this content:

```css
/* Light theme for instructor-facing pages */
/* Apply via <html data-theme="paper"> or <body class="cp-layer-paper"> */

.cp-layer-paper,
[data-theme="paper"] {
  color-scheme: light;

  /* ---------- Neutrals (paper) ---------- */
  --cp-bg0: #fafaff;
  --cp-bg1: #ffffff;
  --cp-bg2: #f2f4ff;
  --cp-bg3: #e8ebf5;
  --cp-border: rgba(17, 20, 37, 0.12);
  --cp-border-subtle: rgba(17, 20, 37, 0.08);

  /* ---------- Text ---------- */
  --cp-text: #111425;
  --cp-text2: #2d3348;
  --cp-muted: #4b556b;
  --cp-faint: #7d8599;

  /* ---------- Accents (adjusted for light bg) ---------- */
  --cp-accent: #0d9488;       /* darker teal for contrast */
  --cp-accent-hover: #14b8a6;
  --cp-pink: #db2777;         /* darker pink for contrast */
  --cp-pink-hover: #ec4899;
  --cp-violet: #7c3aed;       /* darker violet */
  --cp-violet-hover: #8b5cf6;

  /* Legacy aliases */
  --cp-accent2: var(--cp-violet);
  --cp-accent3: var(--cp-accent);
  --cp-accent4: var(--cp-pink);

  /* ---------- Glows (subtle on light) ---------- */
  --cp-glow-teal: rgba(13, 148, 136, 0.08);
  --cp-glow-pink: rgba(219, 39, 119, 0.06);
  --cp-glow-violet: rgba(124, 58, 237, 0.08);
  --cp-glow-accent: var(--cp-glow-teal);
  --cp-glow-blue: var(--cp-glow-violet);
  --cp-glow-magenta: var(--cp-glow-pink);

  /* ---------- Selection & Focus ---------- */
  --cp-selection-bg: rgba(124, 58, 237, 0.20);
  --cp-focus: rgba(13, 148, 136, 0.50);

  /* ---------- Status (adjusted for light) ---------- */
  --cp-success: #059669;
  --cp-warning: #d97706;
  --cp-danger: #dc2626;

  /* ---------- Shadows (light mode) ---------- */
  --cp-shadow-1: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05);
  --cp-shadow-2: 0 2px 6px rgba(0, 0, 0, 0.10), 0 8px 24px rgba(0, 0, 0, 0.08);
  --cp-card-glow: 0 4px 16px rgba(13, 148, 136, 0.08);
}

.cp-layer-paper,
[data-theme="paper"] body,
[data-theme="paper"] {
  background: var(--cp-bg0);
  color: var(--cp-text);
}

/* No cosmic gradients in paper mode - clean and professional */
.cp-layer-paper.cp-layer-museum {
  background: var(--cp-bg0);
}

/* Callouts with light backgrounds */
.cp-layer-paper .cp-callout,
[data-theme="paper"] .cp-callout {
  background: rgba(13, 148, 136, 0.06);
}

.cp-layer-paper .cp-callout[data-kind="model"],
[data-theme="paper"] .cp-callout[data-kind="model"] {
  background: rgba(124, 58, 237, 0.06);
}

.cp-layer-paper .cp-callout[data-kind="misconception"],
[data-theme="paper"] .cp-callout[data-kind="misconception"] {
  background: rgba(219, 39, 119, 0.06);
}

/* Cards in light mode */
.cp-layer-paper .cp-card,
[data-theme="paper"] .cp-card {
  background: var(--cp-bg1);
}

/* Print-friendly by default */
@media print {
  .cp-layer-paper,
  [data-theme="paper"] {
    --cp-bg0: #fff;
    --cp-bg1: #fff;
    --cp-text: #000;
    --cp-muted: #333;
  }
}
```

**Step 2: Commit**

```bash
git add packages/theme/styles/layer-paper.css
git commit -m "$(cat <<'EOF'
feat(theme): add light 'paper' theme for instructor pages

- Clean, readable light mode
- Adjusted accent colors for light backgrounds
- Print-friendly defaults

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Update Button Component

**Files:**
- Modify: `packages/theme/styles/components/button.css`

**Step 1: Add pink accent variant for special CTAs**

Add after line 62 (after the disabled styles, before the media query):

```css
.cp-button--accent {
  background: rgba(255, 45, 149, 0.14);
  border-color: rgba(255, 45, 149, 0.45);
  color: var(--cp-text);
}

.cp-button--accent:hover {
  background: rgba(255, 45, 149, 0.22);
  border-color: rgba(255, 45, 149, 0.60);
}
```

**Step 2: Commit**

```bash
git add packages/theme/styles/components/button.css
git commit -m "$(cat <<'EOF'
feat(theme): add pink accent button variant

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Update TypeScript Constants

**Files:**
- Modify: `packages/theme/src/vars.ts`

**Step 1: Expand CSS_VARS constant**

Replace entire file:

```typescript
export const CSS_VARS = {
  // Backgrounds
  bg0: "--cp-bg0",
  bg1: "--cp-bg1",
  bg2: "--cp-bg2",
  bg3: "--cp-bg3",

  // Text
  text: "--cp-text",
  text2: "--cp-text2",
  muted: "--cp-muted",
  faint: "--cp-faint",

  // Borders
  border: "--cp-border",
  borderSubtle: "--cp-border-subtle",

  // Accents
  accent: "--cp-accent",
  accentHover: "--cp-accent-hover",
  pink: "--cp-pink",
  pinkHover: "--cp-pink-hover",
  violet: "--cp-violet",
  violetHover: "--cp-violet-hover",

  // Legacy aliases
  accent2: "--cp-accent2",
  accent3: "--cp-accent3",
  accent4: "--cp-accent4",

  // Glows
  glowTeal: "--cp-glow-teal",
  glowPink: "--cp-glow-pink",
  glowViolet: "--cp-glow-violet",

  // Focus
  focus: "--cp-focus",
  selectionBg: "--cp-selection-bg",
} as const;

export type CssVarKey = keyof typeof CSS_VARS;
```

**Step 2: Commit**

```bash
git add packages/theme/src/vars.ts
git commit -m "$(cat <<'EOF'
feat(theme): expand CSS_VARS with new token names

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update Layer TypeScript

**Files:**
- Modify: `packages/theme/src/layer.ts`

**Step 1: Add paper theme support**

Replace entire file:

```typescript
export type CosmicLayer = "museum" | "instrument" | "paper";

export function setCosmicLayer(el: HTMLElement, layer: CosmicLayer) {
  el.dataset.cpLayer = layer;
  el.classList.remove("cp-layer-museum", "cp-layer-instrument", "cp-layer-paper");
  el.classList.add(`cp-layer-${layer}`);

  // Also set data-theme for CSS variable cascading
  if (layer === "paper") {
    el.dataset.theme = "paper";
  } else {
    delete el.dataset.theme;
  }
}

export function getCosmicLayer(el: HTMLElement): CosmicLayer {
  const layer = el.dataset.cpLayer;
  if (layer === "instrument") return "instrument";
  if (layer === "paper") return "paper";
  return "museum";
}

export function setTheme(theme: "aurora-ink" | "paper") {
  if (theme === "paper") {
    document.documentElement.dataset.theme = "paper";
  } else {
    delete document.documentElement.dataset.theme;
  }
}
```

**Step 2: Commit**

```bash
git add packages/theme/src/layer.ts
git commit -m "$(cat <<'EOF'
feat(theme): add paper layer + theme toggle support

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Update Site Global Styles

**Files:**
- Modify: `apps/site/src/styles/global.css`

**Step 1: Import paper layer**

Add after line 3 (`@import "@cosmic/theme/styles/print.css";`):

```css
@import "@cosmic/theme/styles/layer-paper.css";
```

**Step 2: Update .button to use teal instead of blue**

Change lines 120-134 from:

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--cp-accent3) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--cp-accent3) 44%, transparent);
  text-decoration: none;
  font-weight: 600;
}

.button:hover {
  background: color-mix(in srgb, var(--cp-accent3) 30%, transparent);
}
```

To:

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(45, 212, 191, 0.14);
  border: 1px solid rgba(45, 212, 191, 0.35);
  text-decoration: none;
  font-weight: 600;
}

.button:hover {
  background: rgba(45, 212, 191, 0.22);
  border-color: rgba(45, 212, 191, 0.50);
}
```

**Step 3: Commit**

```bash
git add apps/site/src/styles/global.css
git commit -m "$(cat <<'EOF'
feat(site): import paper layer, update button to teal

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Add Theme Toggle to Layout

**Files:**
- Modify: `apps/site/src/layouts/Layout.astro`

**Step 1: Add theme detection logic**

Add after line 23 (after the `isActive` function):

```astro
const themeParam = Astro.url.searchParams.get("theme");
const isLightTheme = themeParam === "paper" || Astro.url.pathname.includes("/instructor/");
```

**Step 2: Update html tag to include data-theme**

Change line 27 from:

```astro
<html lang="en">
```

To:

```astro
<html lang="en" data-theme={isLightTheme ? "paper" : undefined}>
```

**Step 3: Update body class**

Change line 33 from:

```astro
<body class="cp-layer-museum">
```

To:

```astro
<body class={isLightTheme ? "cp-layer-paper" : "cp-layer-museum"}>
```

**Step 4: Commit**

```bash
git add apps/site/src/layouts/Layout.astro
git commit -m "$(cat <<'EOF'
feat(site): auto-detect paper theme for instructor pages

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Update Theme Spec

**Files:**
- Modify: `docs/specs/cosmic-playground-theme-spec.md`

**Step 1: Update spec header and goals**

Change lines 1-24 to reflect Aurora Ink and add Paper theme. Update to version 0.2.

Key updates:
- Rename "Two-layer theme" to "Three-layer theme" (museum, instrument, paper)
- Document Aurora Ink palette philosophy
- Add section on Paper theme usage

**Step 2: Update section 2.1 Canonical files**

Add `layer-paper.css` to the list.

**Step 3: Update section 2.2 token list**

Replace the accent list with:

```markdown
- `--cp-accent`, `--cp-accent-hover` (teal - primary)
- `--cp-pink`, `--cp-pink-hover` (pink - special emphasis)
- `--cp-violet`, `--cp-violet-hover` (violet - tertiary)
- Legacy: `--cp-accent2`, `--cp-accent3`, `--cp-accent4` (aliases)
```

**Step 4: Add new section 3.3 Paper layer**

```markdown
### 3.3 Paper layer (instructor-facing)

Intent:
- clean, readable light mode
- print-friendly by default
- professional appearance for handouts

Mechanics:
- Set `<html data-theme="paper">` or `<body class="cp-layer-paper">`
- Auto-applied to `/instructor/*` pages
- Manual via `?theme=paper` query param
```

**Step 5: Update section 5 Accent usage**

Document the new teal/pink/violet system:

```markdown
## 5. Accent usage (Aurora Ink palette)

The Aurora Ink palette uses three accent colors for **small, meaningful emphasis**:

| Color | Token | Use for |
|-------|-------|---------|
| Teal | `--cp-accent` | Primary interactive (links, buttons, focus rings) |
| Pink | `--cp-pink` | Special emphasis (goals, challenges, alerts) |
| Violet | `--cp-violet` | Tertiary (categories, model callouts, tags) |

Avoid:
- large pink/teal backgrounds
- accent body text
- low-contrast text on tinted backgrounds
```

**Step 6: Commit**

```bash
git add docs/specs/cosmic-playground-theme-spec.md
git commit -m "$(cat <<'EOF'
docs(theme): update spec for Aurora Ink + paper theme (v0.2)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Visual Verification

**Step 1: Build the project**

```bash
corepack pnpm build
```

Expected: Build succeeds with no errors.

**Step 2: Run the site locally**

```bash
corepack pnpm -C apps/site dev
```

**Step 3: Check museum pages (dark theme)**

Open `http://localhost:4321/` in browser:
- [ ] Background shows violet (top-left), pink (top-right), teal (bottom) gradients
- [ ] Cards have teal hover glow
- [ ] Links are teal (`#2dd4bf`), not blue
- [ ] Selection highlight is pink

**Step 4: Check instrument pages (demos)**

Open any demo (e.g., `http://localhost:4321/play/angular-size/`):
- [ ] Calmer, no blue atmospheric wash
- [ ] Callouts use correct accent colors

**Step 5: Check instructor pages (paper theme)**

Open `http://localhost:4321/instructor/angular-size/`:
- [ ] Light background (`#fafaff`)
- [ ] Dark text (`#111425`)
- [ ] No cosmic gradients

**Step 6: Check print preview**

Open any instructor page, press Cmd+P (or Ctrl+P):
- [ ] Clean black-on-white output
- [ ] Navigation hidden

**Step 7: Run E2E tests**

```bash
CP_BASE_PATH=/cosmic-playground/ corepack pnpm -C apps/site test:e2e
```

Expected: All tests pass.

---

## Verification Checklist

- [ ] No hardcoded `#070a12`, `#0b1020`, `#0f1a33` (old blue-blacks) remaining
- [ ] No hardcoded `#60a5fa` (old ion blue) remaining
- [ ] All demos still render correctly
- [ ] Focus rings visible and accessible (teal)
- [ ] Paper theme readable in print preview
- [ ] Card hovers use teal glow, not blue
- [ ] Links are teal, not ion blue
- [ ] Selection highlight is pink
- [ ] E2E tests pass
- [ ] TypeScript types compile

---

## Rollback Plan

If issues arise:

```bash
git revert HEAD~N  # where N = number of theme commits
```

Or cherry-pick individual reverts for specific files.