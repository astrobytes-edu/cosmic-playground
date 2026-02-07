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

function resolveCss(varName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
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
 *   - Count proportional to density (log-mapped 5 to 80 particles)
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

  start(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = setupCanvas(canvas);
    if (!this.ctx) return;
    const rect = canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.rebuild();
    this.tick();
  }

  updateParams(params: Record<string, number>): void {
    const prevLogRho = this.logRho;
    const prevLogT = this.logT;
    this.logRho = params["logRho"] ?? this.logRho;
    this.logT = params["logT"] ?? this.logT;
    if (this.logRho !== prevLogRho) this.rebuild();
    else if (this.logT !== prevLogT) this.rescale();
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.canvas = null;
    this.ctx = null;
  }

  private rebuild(): void {
    const count = Math.round(mapRange(this.logRho, -10, 10, 5, 80));
    const speed = mapRange(this.logT, 3, 9, 0.5, 4);
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
    const speed = mapRange(this.logT, 3, 9, 0.5, 4);
    for (const p of this.particles) {
      const cur = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (cur > 0) {
        const s = speed / cur;
        p.vx *= s;
        p.vy *= s;
      }
    }
  }

  private tick = (): void => {
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

    // Wall flashes (amber pulse = momentum transfer)
    const amber = "#fbbf24";
    for (const f of this.wallFlashes) {
      const a = Math.round((f.timer / 4) * 128);
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

    this.rafId = requestAnimationFrame(this.tick);
  };
}

/* ================================================================
 * Radiation Pressure Animation
 *
 * Photons bouncing in a box.
 *   - All at same speed (c — speed of light)
 *   - Count ~ T^4 (Stefan-Boltzmann, mapped 3 to 100)
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

  start(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = setupCanvas(canvas);
    if (!this.ctx) return;
    const rect = canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.rebuild();
    this.tick();
  }

  updateParams(params: Record<string, number>): void {
    const prev = this.logT;
    this.logT = params["logT"] ?? this.logT;
    if (this.logT !== prev) this.rebuild();
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
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
    const count = Math.round(mapRange(this.logT, 3, 9, 3, 100));
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

  private tick = (): void => {
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

      // Glow halo
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 3, 0, 2 * Math.PI);
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

  start(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = setupCanvas(canvas);
    if (!this.ctx) return;
    const rect = canvas.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.tick();
  }

  updateParams(params: Record<string, number>): void {
    this.logRho = params["logRho"] ?? this.logRho;
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    this.canvas = null;
    this.ctx = null;
  }

  private tick = (): void => {
    const ctx = this.ctx;
    if (!ctx) return;
    const { w, h, maxLevels } = this;

    ctx.fillStyle = resolveCss("--cp-bg0") || "#0e1117";
    ctx.fillRect(0, 0, w, h);

    const filled = Math.round(mapRange(this.logRho, -4, 10, 2, maxLevels));
    const spacing = (h - 40) / maxLevels;
    const levelW = w * 0.55;
    const xStart = (w - levelW) / 2;
    const violet = "#a78bfa";
    const grid = "rgba(255,255,255,0.15)";
    const eR = 4;

    for (let i = 0; i < maxLevels; i++) {
      const y = h - 20 - i * spacing;
      const on = i < filled;

      // Level line
      ctx.strokeStyle = on ? violet : grid;
      ctx.lineWidth = on ? 1.5 : 0.5;
      ctx.beginPath();
      ctx.moveTo(xStart, y);
      ctx.lineTo(xStart + levelW, y);
      ctx.stroke();

      if (on) {
        // Glow halo behind electrons
        ctx.beginPath();
        ctx.arc(xStart + levelW * 0.35, y - eR - 2, eR * 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = violet + "33";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(xStart + levelW * 0.65, y - eR - 2, eR * 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = violet + "33";
        ctx.fill();
        // Spin-up electron
        ctx.beginPath();
        ctx.arc(xStart + levelW * 0.35, y - eR - 2, eR, 0, 2 * Math.PI);
        ctx.fillStyle = violet;
        ctx.fill();
        // Spin-down electron
        ctx.beginPath();
        ctx.arc(xStart + levelW * 0.65, y - eR - 2, eR, 0, 2 * Math.PI);
        ctx.fillStyle = violet + "aa";
        ctx.fill();
        // Arrows (white on violet circles)
        ctx.fillStyle = "#fff";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\u2191", xStart + levelW * 0.35, y - eR - 2);
        ctx.fillText("\u2193", xStart + levelW * 0.65, y - eR - 2);
      }
    }

    // Pressure arrow
    if (filled > 3) {
      const ax = w - 28;
      const aTop = h - 20 - (filled - 1) * spacing;
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

    this.rafId = requestAnimationFrame(this.tick);
  };
}
