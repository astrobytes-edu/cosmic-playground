/**
 * mechanismViz.ts — Particle animations for EOS deep-dive panels.
 *
 * Three Canvas 2D animations illustrating the physical mechanism behind
 * each pressure channel: gas (particle collisions), radiation (photon flux),
 * and degeneracy (Pauli exclusion level filling).
 */

/* ---------- Shared interface ---------- */

export interface MechanismAnimation {
  start(canvas: HTMLCanvasElement): void;
  updateParams(params: Record<string, number>): void;
  stop(): void;
}

/* ---------- Motion preference ---------- */

const reducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Helpers ---------- */

function mapRange(
  val: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = Math.max(0, Math.min(1, (val - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}

/** Cache of resolved CSS custom property values (resolved once, reused). */
const cssCache = new Map<string, string>();

function resolveCss(varName: string): string {
  let cached = cssCache.get(varName);
  if (cached !== undefined) return cached;
  cached = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  cssCache.set(varName, cached);
  return cached;
}

function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio ?? 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
};

/* ================================================================
 * Gas Pressure Animation
 *
 * Particles bouncing in a box.
 *   - Count proportional to density (log-mapped 10 to 150 particles)
 *   - Speed proportional to sqrt(T) (thermal speed)
 *   - Wall flash on collision = momentum transfer = pressure
 * ================================================================ */

type WallFlash = { side: "top" | "bottom" | "left" | "right"; timer: number };

export class GasPressureAnimation implements MechanismAnimation {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private rafId = 0;
  private particles: Particle[] = [];
  private wallFlashes: WallFlash[] = [];
  private logRho = 2;
  private logT = 7;
  private w = 0;
  private h = 0;
  private resizeObserver: ResizeObserver | null = null;

  start(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = setupCanvas(canvas);
    if (!this.ctx) return;
    const rect = canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.rebuild();
    this.drawFrame();
    if (!reducedMotion.matches) this.tick();
    this.resizeObserver = new ResizeObserver(() => {
      this.ctx = setupCanvas(canvas);
      const r = canvas.getBoundingClientRect();
      this.w = r.width;
      this.h = r.height;
      for (const p of this.particles) {
        p.x = Math.min(p.x, this.w - p.radius);
        p.y = Math.min(p.y, this.h - p.radius);
      }
      if (reducedMotion.matches) this.drawFrame();
    });
    this.resizeObserver.observe(canvas);
  }

  updateParams(params: Record<string, number>): void {
    const prevLogRho = this.logRho;
    const prevLogT = this.logT;
    this.logRho = params["logRho"] ?? this.logRho;
    this.logT = params["logT"] ?? this.logT;
    if (this.logRho !== prevLogRho) this.rebuild();
    else if (this.logT !== prevLogT) this.rescale();
    if (reducedMotion.matches) this.drawFrame();
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.canvas = null;
    this.ctx = null;
  }

  private rebuild(): void {
    const count = Math.round(mapRange(this.logRho, -10, 10, 10, 150));
    // Physical sqrt(T) scaling — thermal speed ~ sqrt(kT/m)
    const T = Math.pow(10, this.logT);
    const Tref = 1e6;
    const speed = Math.max(0.2, Math.min(7, 0.5 + 4.5 * Math.sqrt(Math.min(T, 1e9) / Tref)));
    const color = "#34d399";
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 2 * Math.PI;
      this.particles.push({
        x: 4 + Math.random() * (this.w - 8),
        y: 4 + Math.random() * (this.h - 8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 2.5,
      });
    }
  }

  private rescale(): void {
    // Physical sqrt(T) scaling — matches rebuild()
    const T = Math.pow(10, this.logT);
    const Tref = 1e6;
    const speed = Math.max(0.2, Math.min(7, 0.5 + 4.5 * Math.sqrt(Math.min(T, 1e9) / Tref)));
    for (const p of this.particles) {
      const cur = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (cur > 0) {
        const s = speed / cur;
        p.vx *= s;
        p.vy *= s;
      }
    }
  }

  private drawFrame = (): void => {
    const ctx = this.ctx;
    if (!ctx) return;
    const { w, h } = this;

    ctx.fillStyle = resolveCss("--cp-bg0") || "#0e1117";
    ctx.fillRect(0, 0, w, h);

    // Expire wall flashes
    this.wallFlashes = this.wallFlashes.filter((f) => f.timer > 0);
    for (const f of this.wallFlashes) f.timer -= 1;

    // Step particles
    const r = 2.5;
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x <= r) {
        p.x = r;
        p.vx = Math.abs(p.vx);
        this.wallFlashes.push({ side: "left", timer: 4 });
      }
      if (p.x >= w - r) {
        p.x = w - r;
        p.vx = -Math.abs(p.vx);
        this.wallFlashes.push({ side: "right", timer: 4 });
      }
      if (p.y <= r) {
        p.y = r;
        p.vy = Math.abs(p.vy);
        this.wallFlashes.push({ side: "top", timer: 4 });
      }
      if (p.y >= h - r) {
        p.y = h - r;
        p.vy = -Math.abs(p.vy);
        this.wallFlashes.push({ side: "bottom", timer: 4 });
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    // Wall flashes (amber pulse = momentum transfer, intensity scales with speed)
    const amber = "#fbbf24";
    const avgSpeed = this.particles.length > 0
      ? this.particles.reduce((s, p) => s + Math.sqrt(p.vx * p.vx + p.vy * p.vy), 0) / this.particles.length
      : 1;
    const baseAlpha = Math.min(200, 80 + avgSpeed * 25);
    for (const f of this.wallFlashes) {
      const a = Math.round((f.timer / 4) * baseAlpha);
      const hex = a.toString(16).padStart(2, "0");
      ctx.fillStyle = amber + hex;
      switch (f.side) {
        case "top":    ctx.fillRect(0, 0, w, 3); break;
        case "bottom": ctx.fillRect(0, h - 3, w, 3); break;
        case "left":   ctx.fillRect(0, 0, 3, h); break;
        case "right":  ctx.fillRect(w - 3, 0, 3, h); break;
      }
    }

    // Border
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  };

  private tick = (): void => {
    this.drawFrame();
    this.rafId = requestAnimationFrame(this.tick);
  };
}

/* ================================================================
 * Radiation Pressure Animation
 *
 * Photons bouncing in a box.
 *   - All at same speed (c — speed of light)
 *   - Count increases with T (photon number density ~ T^3, mapped 3 to 150)
 *   - Color from Wien's law (red to white to blue)
 *   - No density dependence — that's the key insight
 * ================================================================ */

export class RadiationPressureAnimation implements MechanismAnimation {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private rafId = 0;
  private particles: Particle[] = [];
  private logT = 7;
  private w = 0;
  private h = 0;
  private resizeObserver: ResizeObserver | null = null;

  start(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = setupCanvas(canvas);
    if (!this.ctx) return;
    const rect = canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.rebuild();
    this.drawFrame();
    if (!reducedMotion.matches) this.tick();
    this.resizeObserver = new ResizeObserver(() => {
      this.ctx = setupCanvas(canvas);
      const r = canvas.getBoundingClientRect();
      this.w = r.width;
      this.h = r.height;
      for (const p of this.particles) {
        p.x = Math.min(p.x, this.w - p.radius);
        p.y = Math.min(p.y, this.h - p.radius);
      }
      if (reducedMotion.matches) this.drawFrame();
    });
    this.resizeObserver.observe(canvas);
  }

  updateParams(params: Record<string, number>): void {
    const prev = this.logT;
    this.logT = params["logT"] ?? this.logT;
    if (this.logT !== prev) this.rebuild();
    if (reducedMotion.matches) this.drawFrame();
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.canvas = null;
    this.ctx = null;
  }

  private wienColor(): string {
    const T = Math.pow(10, this.logT);
    if (T < 3000)   return "#ff4444";
    if (T < 6000)   return "#ffaa44";
    if (T < 10000)  return "#ffeecc";
    if (T < 30000)  return "#ffffff";
    if (T < 100000) return "#aaddff";
    return "#6688ff";
  }

  private rebuild(): void {
    const count = Math.round(mapRange(this.logT, 3, 9, 3, 150));
    const speed = 3; // All photons at same speed (c)
    const color = this.wienColor();
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 2 * Math.PI;
      this.particles.push({
        x: 4 + Math.random() * (this.w - 8),
        y: 4 + Math.random() * (this.h - 8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 1.8,
      });
    }
  }

  private drawFrame = (): void => {
    const ctx = this.ctx;
    if (!ctx) return;
    const { w, h } = this;

    ctx.fillStyle = resolveCss("--cp-bg0") || "#0e1117";
    ctx.fillRect(0, 0, w, h);

    const r = 1.8;
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x <= r) { p.x = r; p.vx = Math.abs(p.vx); }
      if (p.x >= w - r) { p.x = w - r; p.vx = -Math.abs(p.vx); }
      if (p.y <= r) { p.y = r; p.vy = Math.abs(p.vy); }
      if (p.y >= h - r) { p.y = h - r; p.vy = -Math.abs(p.vy); }

      // Glow halo — radius grows with temperature
      const haloR = r * (2 + mapRange(this.logT, 3, 9, 0, 3));
      ctx.beginPath();
      ctx.arc(p.x, p.y, haloR, 0, 2 * Math.PI);
      ctx.fillStyle = p.color + "22";
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  };

  private tick = (): void => {
    this.drawFrame();
    this.rafId = requestAnimationFrame(this.tick);
  };
}

/* ================================================================
 * Degeneracy Pressure Animation
 *
 * Energy level stacking diagram.
 *   - Horizontal lines = energy levels
 *   - Fermion dots fill from bottom up (Pauli exclusion)
 *   - At low rho: sparse filling, gaps visible
 *   - At high rho: packed solid, overflow to high-energy states
 *   - Pressure arrow shows upward force from packed states
 * ================================================================ */

export class DegeneracyPressureAnimation implements MechanismAnimation {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private rafId = 0;
  private logRho = 4;
  private w = 0;
  private h = 0;
  private readonly maxLevels = 16;
  private resizeObserver: ResizeObserver | null = null;

  start(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = setupCanvas(canvas);
    if (!this.ctx) return;
    const rect = canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.drawFrame();
    if (!reducedMotion.matches) this.tick();
    this.resizeObserver = new ResizeObserver(() => {
      this.ctx = setupCanvas(canvas);
      const r = canvas.getBoundingClientRect();
      this.w = r.width;
      this.h = r.height;
      if (reducedMotion.matches) this.drawFrame();
    });
    this.resizeObserver.observe(canvas);
  }

  updateParams(params: Record<string, number>): void {
    this.logRho = params["logRho"] ?? this.logRho;
    if (reducedMotion.matches) this.drawFrame();
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.canvas = null;
    this.ctx = null;
  }

  private drawFrame = (): void => {
    const ctx = this.ctx;
    if (!ctx) return;
    const { w, h, maxLevels } = this;

    ctx.fillStyle = resolveCss("--cp-bg0") || "#0e1117";
    ctx.fillRect(0, 0, w, h);

    const filled = Math.round(mapRange(this.logRho, -4, 10, 2, maxLevels));
    // Non-uniform spacing — levels closer together at top (3D fermion DOS: g(E) ~ sqrt(E))
    const weights: number[] = [];
    for (let i = 0; i < maxLevels; i++) weights.push(1.4 - 0.4 * (i / maxLevels));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const baseSpacing = (h - 40) / totalWeight;

    const levelW = w * 0.55;
    const xStart = (w - levelW) / 2;
    const violetBright = "#c4b5fd"; // brighter violet for spin-up
    const violetDim = "#7c3aed";   // dimmer violet for spin-down
    const violet = "#a78bfa";
    const grid = "rgba(255,255,255,0.15)";
    const eR = 4;

    // Precompute cumulative y positions
    const levelY: number[] = [];
    let cumY = h - 20;
    for (let i = 0; i < maxLevels; i++) {
      levelY.push(cumY);
      cumY -= weights[i] * baseSpacing;
    }

    let fermiY = 0;
    for (let i = 0; i < maxLevels; i++) {
      const y = levelY[i];
      const on = i < filled;

      // Vibration for top 3 filled levels (Fermi surface excitation)
      const vibration = (on && i >= filled - 3)
        ? Math.sin(Date.now() / 150 + i * 2) * 1.2
        : 0;

      // Level line
      ctx.strokeStyle = on ? violet : grid;
      ctx.lineWidth = on ? 1.5 : 0.5;
      ctx.beginPath();
      ctx.moveTo(xStart, y);
      ctx.lineTo(xStart + levelW, y);
      ctx.stroke();

      if (on) {
        fermiY = y;
        const xUp = xStart + levelW * 0.35 + vibration;
        const xDown = xStart + levelW * 0.65 + vibration;
        const yE = y - eR - 2;

        // Glow halo behind electrons
        ctx.beginPath();
        ctx.arc(xUp, yE, eR * 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = violetBright + "33";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(xDown, yE, eR * 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = violetDim + "33";
        ctx.fill();

        // Spin-up electron (brighter)
        ctx.beginPath();
        ctx.arc(xUp, yE, eR, 0, 2 * Math.PI);
        ctx.fillStyle = violetBright;
        ctx.fill();

        // Spin-down electron (dimmer)
        ctx.beginPath();
        ctx.arc(xDown, yE, eR, 0, 2 * Math.PI);
        ctx.fillStyle = violetDim;
        ctx.fill();

        // Arrows (white on violet circles) — larger font for visibility
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\u2191", xUp, yE);
        ctx.fillText("\u2193", xDown, yE);
      }
    }

    // Fermi energy line (dashed amber)
    if (filled > 0) {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xStart - 8, fermiY);
      ctx.lineTo(xStart + levelW + 8, fermiY);
      ctx.stroke();
      ctx.setLineDash([]);
      // Label
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "left";
      ctx.fillText("E_F", xStart + levelW + 12, fermiY + 3);
    }

    // Pressure arrow
    if (filled > 3) {
      const ax = w - 28;
      const aTop = levelY[filled - 1];
      const aBot = h - 20;

      ctx.strokeStyle = violet;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax, aBot);
      ctx.lineTo(ax, aTop);
      ctx.stroke();

      ctx.fillStyle = violet;
      ctx.beginPath();
      ctx.moveTo(ax, aTop - 4);
      ctx.lineTo(ax - 5, aTop + 4);
      ctx.lineTo(ax + 5, aTop + 4);
      ctx.closePath();
      ctx.fill();

      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("P_deg", ax, aBot + 14);
    }

    // Y-axis label
    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "10px monospace";
    ctx.fillStyle = "#aaa";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Energy", 0, 0);
    ctx.restore();

    // Border
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  };

  private tick = (): void => {
    this.drawFrame();
    this.rafId = requestAnimationFrame(this.tick);
  };
}
