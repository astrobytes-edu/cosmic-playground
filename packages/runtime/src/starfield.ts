/**
 * Starfield — animated canvas background for Cosmic Playground demos.
 *
 * Creates a deep-space atmosphere with realistic star distribution,
 * Milky Way band, nebula color patches, and occasional shooting stars.
 * Designed to be "felt, not noticed" — elegant and never competing
 * with demo content.
 *
 * Architecture: Two-layer compositing
 *   Offscreen canvas (rendered once): Milky Way, nebulae, static stars, spikes
 *   Visible canvas (per-frame): static layer blit + twinkling stars + shooting star
 *
 * Usage:
 *   const cleanup = initStarfield({ canvas: myCanvas });
 *   // Later, when done:
 *   cleanup();
 */

export interface StarfieldConfig {
  /** The canvas element to draw on. */
  canvas: HTMLCanvasElement;
  /** Total number of stars. Default: 500 */
  starCount?: number;
  /** Amplitude of opacity oscillation. Default: 0.3 */
  twinkleAmount?: number;
  /** Show Milky Way gradient band. Default: true */
  milkyWay?: boolean;
  /** Angle of Milky Way band in degrees. Default: -20 */
  milkyWayAngle?: number;
  /** Show nebula color patches. Default: true */
  nebulae?: boolean;
  /** Show shooting stars. Default: true */
  shootingStars?: boolean;
  /** Min/max interval between shooting stars in ms. Default: [15000, 30000] */
  shootingStarInterval?: [number, number];
}

/* ── Star data types ─────────────────────────────────────────────── */

interface Star {
  x: number;
  y: number;
  /** Visual radius in logical pixels */
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  /** Magnitude class index (0 = brightest) */
  magClass: number;
  /** Whether this star twinkles (mag 0-3 only) */
  twinkles: boolean;
}

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  /** Remaining life in seconds */
  life: number;
  /** Total life in seconds */
  totalLife: number;
}

/* ── Constants ───────────────────────────────────────────────────── */

/**
 * Realistic stellar colors by spectral type.
 * O/B → blue-white, A → white, F → warm white, G → yellow,
 * K → orange, M → warm red-orange.
 */
const STAR_COLORS = [
  "#aabfff", // O/B blue-white
  "#cad8ff", // A blue-white
  "#ffffff", // A/F white
  "#fff4e8", // F/G warm white
  "#ffd2a1", // K orange
  "#ffcc6f", // K/M warm amber
];

/**
 * Power-law magnitude classes. For every bright star, there are
 * roughly 3-4x more stars one magnitude fainter — matching real
 * night-sky star counts.
 *
 * Classes 0-3 twinkle (animated layer), classes 4-5 are static.
 */
const MAG_CLASSES = [
  { fraction: 0.01,  minSize: 2.0, maxSize: 3.0, baseOpacity: 0.90, speedBase: 0.025 }, // brilliant
  { fraction: 0.03,  minSize: 1.4, maxSize: 2.0, baseOpacity: 0.80, speedBase: 0.020 }, // bright
  { fraction: 0.08,  minSize: 0.9, maxSize: 1.4, baseOpacity: 0.65, speedBase: 0.018 }, // medium
  { fraction: 0.28,  minSize: 0.5, maxSize: 0.9, baseOpacity: 0.45, speedBase: 0.015 }, // faint
  { fraction: 0.40,  minSize: 0.3, maxSize: 0.6, baseOpacity: 0.25, speedBase: 0     }, // dim (static)
  { fraction: 0.20,  minSize: 0.2, maxSize: 0.3, baseOpacity: 0.15, speedBase: 0     }, // threshold (static)
];

/** Magnitude classes that twinkle (rendered per-frame) */
const TWINKLE_THRESHOLD = 4; // classes 0..3 twinkle

/** Nebula patch definitions (viewport-relative positions) */
const NEBULA_PATCHES = [
  { xFrac: 0.20, yFrac: 0.35, rFrac: 0.18, color: [220, 120, 130] }, // salmon-pink (H-alpha)
  { xFrac: 0.75, yFrac: 0.25, rFrac: 0.15, color: [140, 160, 200] }, // blue-grey (reflection)
  { xFrac: 0.55, yFrac: 0.70, rFrac: 0.14, color: [200, 180, 120] }, // warm gold (dust)
];

/* ── Utility ─────────────────────────────────────────────────────── */

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/* ── Star generation ─────────────────────────────────────────────── */

function generateStars(count: number, width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let mc = 0; mc < MAG_CLASSES.length; mc++) {
    const cls = MAG_CLASSES[mc];
    const n = Math.round(count * cls.fraction);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: rand(cls.minSize, cls.maxSize),
        baseOpacity: cls.baseOpacity + rand(-0.08, 0.08),
        twinkleSpeed: cls.speedBase * rand(0.6, 1.4),
        twinklePhase: Math.random() * Math.PI * 2,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        magClass: mc,
        twinkles: mc < TWINKLE_THRESHOLD,
      });
    }
  }
  return stars;
}

/* ── Sprite pre-rendering ────────────────────────────────────────── */

/**
 * Pre-render a star + glow halo to a tiny offscreen canvas.
 * Returns a map from mag class index to the sprite canvas.
 * Stars with size > 1.0 get a glow halo baked in.
 */
function createStarSprites(dpr: number): Map<number, HTMLCanvasElement> {
  const sprites = new Map<number, HTMLCanvasElement>();

  for (let mc = 0; mc < MAG_CLASSES.length; mc++) {
    const cls = MAG_CLASSES[mc];
    // Use the midpoint size for the sprite
    const size = (cls.minSize + cls.maxSize) / 2;
    const glowRadius = size > 1.0 ? size * 3 : size;
    const dim = Math.ceil(glowRadius * 2 * dpr) + 4; // padding

    const c = document.createElement("canvas");
    c.width = dim;
    c.height = dim;
    const ctx = c.getContext("2d");
    if (!ctx) continue;

    const cx = dim / 2;
    const cy = dim / 2;

    // Glow halo for larger stars
    if (size > 1.0) {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius * dpr);
      grad.addColorStop(0, "rgba(255,255,255,0.6)");
      grad.addColorStop(0.4, "rgba(255,255,255,0.15)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dim, dim);
    }

    // Crisp core
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, size * dpr, 0, Math.PI * 2);
    ctx.fill();

    sprites.set(mc, c);
  }

  return sprites;
}

/* ── Static layer rendering ──────────────────────────────────────── */

function renderMilkyWay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  angleDeg: number,
): void {
  const angle = (angleDeg * Math.PI) / 180;
  const diag = Math.sqrt(w * w + h * h);
  const bandWidth = h * 0.35;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);

  // The band runs along the rotated x-axis
  const grad = ctx.createLinearGradient(0, -bandWidth, 0, bandWidth);
  grad.addColorStop(0, "rgba(210,200,180,0)");
  grad.addColorStop(0.3, "rgba(210,200,180,0.04)");
  grad.addColorStop(0.5, "rgba(210,200,180,0.07)");
  grad.addColorStop(0.7, "rgba(210,200,180,0.04)");
  grad.addColorStop(1, "rgba(210,200,180,0)");

  ctx.fillStyle = grad;
  ctx.fillRect(-diag, -bandWidth, diag * 2, bandWidth * 2);
  ctx.restore();
}

function renderNebulae(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  for (const patch of NEBULA_PATCHES) {
    const cx = patch.xFrac * w;
    const cy = patch.yFrac * h;
    const r = patch.rFrac * Math.min(w, h);
    const [red, green, blue] = patch.color;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `rgba(${red},${green},${blue},0.045)`);
    grad.addColorStop(0.5, `rgba(${red},${green},${blue},0.02)`);
    grad.addColorStop(1, `rgba(${red},${green},${blue},0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderDiffractionSpikes(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
): void {
  // Only the brightest class (mag 0) gets spikes
  const bright = stars.filter((s) => s.magClass === 0);
  const spikeAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];

  for (const star of bright) {
    const len = star.size * 4 + 4; // 8-12px range
    for (const angle of spikeAngles) {
      const ex = star.x + Math.cos(angle) * len;
      const ey = star.y + Math.sin(angle) * len;

      const grad = ctx.createLinearGradient(star.x, star.y, ex, ey);
      grad.addColorStop(0, `rgba(255,255,255,${star.baseOpacity * 0.5})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }
}

function renderStaticStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  sprites: Map<number, HTMLCanvasElement>,
  dpr: number,
): void {
  const staticStars = stars.filter((s) => !s.twinkles);
  for (const star of staticStars) {
    const sprite = sprites.get(star.magClass);
    if (!sprite) {
      // Fallback: draw a simple circle
      ctx.globalAlpha = Math.max(0, Math.min(1, star.baseOpacity));
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.globalAlpha = Math.max(0, Math.min(1, star.baseOpacity));
    const sw = sprite.width / dpr;
    const sh = sprite.height / dpr;
    ctx.drawImage(sprite, star.x - sw / 2, star.y - sh / 2, sw, sh);
  }
  ctx.globalAlpha = 1;
}

/**
 * Build the static offscreen layer: Milky Way, nebulae, static stars, spikes.
 * This is rendered once at init and on resize.
 */
function buildStaticLayer(
  staticCanvas: HTMLCanvasElement,
  w: number,
  h: number,
  dpr: number,
  stars: Star[],
  sprites: Map<number, HTMLCanvasElement>,
  config: { milkyWay: boolean; milkyWayAngle: number; nebulae: boolean },
): void {
  staticCanvas.width = Math.round(w * dpr);
  staticCanvas.height = Math.round(h * dpr);
  const ctx = staticCanvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // Layer 1: Milky Way band
  if (config.milkyWay) {
    renderMilkyWay(ctx, w, h, config.milkyWayAngle);
  }

  // Layer 2: Nebula patches
  if (config.nebulae) {
    renderNebulae(ctx, w, h);
  }

  // Layer 3: Static stars (mag 4-5)
  renderStaticStars(ctx, stars, sprites, dpr);

  // Layer 4: Diffraction spikes on brightest stars
  renderDiffractionSpikes(ctx, stars);
}

/* ── Shooting star ───────────────────────────────────────────────── */

function spawnShootingStar(w: number, h: number): ShootingStar {
  // Start from a random edge, biased toward top and sides
  const edge = Math.random();
  let x: number, y: number;
  if (edge < 0.4) {
    // top edge
    x = Math.random() * w;
    y = 0;
  } else if (edge < 0.7) {
    // left edge
    x = 0;
    y = Math.random() * h * 0.6;
  } else {
    // right edge
    x = w;
    y = Math.random() * h * 0.6;
  }

  // Direction: generally downward and inward
  const targetX = w * rand(0.2, 0.8);
  const targetY = h * rand(0.3, 0.8);
  const dx = targetX - x;
  const dy = targetY - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const speed = rand(600, 1000); // pixels per second

  return {
    x,
    y,
    dx: (dx / dist) * speed,
    dy: (dy / dist) * speed,
    life: rand(0.3, 0.5),
    totalLife: 0, // set after creation
  };
}

function renderShootingStar(
  ctx: CanvasRenderingContext2D,
  ss: ShootingStar,
  dt: number,
): void {
  const progress = 1 - ss.life / ss.totalLife;
  const headAlpha = Math.max(0, 1 - progress * 1.5);
  const tailLen = 40 + progress * 30;

  // Direction unit vector
  const speed = Math.sqrt(ss.dx * ss.dx + ss.dy * ss.dy);
  const ux = ss.dx / speed;
  const uy = ss.dy / speed;

  // Tail endpoint
  const tx = ss.x - ux * tailLen;
  const ty = ss.y - uy * tailLen;

  // Warm-yellow tail gradient
  const grad = ctx.createLinearGradient(ss.x, ss.y, tx, ty);
  grad.addColorStop(0, `rgba(255,255,255,${headAlpha})`);
  grad.addColorStop(0.3, `rgba(255,240,200,${headAlpha * 0.6})`);
  grad.addColorStop(1, "rgba(255,220,150,0)");

  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ss.x, ss.y);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  // Bright head dot
  ctx.globalAlpha = headAlpha;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ss.x, ss.y, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/* ── Main initialization ─────────────────────────────────────────── */

/**
 * Initialize an animated starfield on the given canvas.
 *
 * @returns A cleanup function that stops the animation and removes listeners.
 */
export function initStarfield(config: StarfieldConfig): () => void {
  const {
    canvas,
    starCount = 500,
    twinkleAmount = 0.3,
    milkyWay = true,
    milkyWayAngle = -20,
    nebulae = true,
    shootingStars: enableShootingStars = true,
    shootingStarInterval = [15000, 30000] as [number, number],
  } = config;

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let logicalWidth = 0;
  let logicalHeight = 0;
  let dpr = 1;
  let stars: Star[] = [];
  let twinklingStars: Star[] = [];
  let sprites: Map<number, HTMLCanvasElement> = new Map();
  let animationId = 0;
  let running = false;

  // Static offscreen layer
  const staticCanvas = document.createElement("canvas");

  // Shooting star state
  let shootingStar: ShootingStar | null = null;
  let shootingStarTimer = 0;
  let lastTimestamp = 0;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function scheduleShootingStar(): void {
    if (!enableShootingStars || prefersReducedMotion) return;
    const [minMs, maxMs] = shootingStarInterval;
    shootingStarTimer = rand(minMs, maxMs) / 1000; // convert to seconds
  }

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;

    logicalWidth = rect.width;
    logicalHeight = rect.height;

    canvas.width = Math.round(logicalWidth * dpr);
    canvas.height = Math.round(logicalHeight * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Regenerate stars and sprites
    stars = generateStars(starCount, logicalWidth, logicalHeight);
    twinklingStars = stars.filter((s) => s.twinkles);
    sprites = createStarSprites(dpr);

    // Build static offscreen layer
    buildStaticLayer(staticCanvas, logicalWidth, logicalHeight, dpr, stars, sprites, {
      milkyWay,
      milkyWayAngle,
      nebulae,
    });

    // Reset shooting star on resize
    shootingStar = null;
    scheduleShootingStar();

    // If static mode, draw once after resize
    if (!running) {
      renderFrame(0, 0);
    }
  }

  function renderFrame(timeSec: number, dt: number): void {
    ctx!.clearRect(0, 0, logicalWidth, logicalHeight);

    // Blit static layer (Milky Way, nebulae, static stars, spikes)
    ctx!.drawImage(staticCanvas, 0, 0, logicalWidth, logicalHeight);

    // Twinkling stars (mag 0-3) with multi-harmonic oscillation
    for (const star of twinklingStars) {
      const s = star.twinkleSpeed;
      const p = star.twinklePhase;
      // Golden ratio frequency prevents visible periodicity
      const twinkle =
        0.6 * Math.sin(timeSec * s + p) +
        0.4 * Math.sin(timeSec * s * 1.618 + p * 0.7);
      const opacity = star.baseOpacity + twinkle * twinkleAmount;

      const sprite = sprites.get(star.magClass);
      if (sprite) {
        ctx!.globalAlpha = Math.max(0, Math.min(1, opacity));
        const sw = sprite.width / dpr;
        const sh = sprite.height / dpr;
        ctx!.drawImage(sprite, star.x - sw / 2, star.y - sh / 2, sw, sh);
      } else {
        ctx!.globalAlpha = Math.max(0, Math.min(1, opacity));
        ctx!.fillStyle = star.color;
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
    ctx!.globalAlpha = 1;

    // Shooting star
    if (shootingStar) {
      renderShootingStar(ctx!, shootingStar, dt);
      shootingStar.x += shootingStar.dx * dt;
      shootingStar.y += shootingStar.dy * dt;
      shootingStar.life -= dt;
      if (shootingStar.life <= 0) {
        shootingStar = null;
        scheduleShootingStar();
      }
    } else if (!prefersReducedMotion && enableShootingStars) {
      shootingStarTimer -= dt;
      if (shootingStarTimer <= 0) {
        shootingStar = spawnShootingStar(logicalWidth, logicalHeight);
        shootingStar.totalLife = shootingStar.life;
      }
    }
  }

  function animate(timestamp: number): void {
    const timeSec = timestamp / 1000;
    const dt = lastTimestamp > 0 ? (timestamp - lastTimestamp) / 1000 : 0;
    lastTimestamp = timestamp;

    renderFrame(timeSec, Math.min(dt, 0.1)); // cap dt to avoid jumps

    if (running) {
      animationId = requestAnimationFrame(animate);
    }
  }

  function start(): void {
    if (running) return;
    running = true;
    lastTimestamp = 0;
    animationId = requestAnimationFrame(animate);
  }

  function stop(): void {
    running = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = 0;
    }
  }

  // Initialize
  resize();

  if (prefersReducedMotion) {
    // Draw a single static frame — all visual elements, no animation
    renderFrame(0, 0);
  } else {
    start();
  }

  // Listen for resize
  const handleResize = (): void => resize();
  window.addEventListener("resize", handleResize);

  // Return cleanup function
  return () => {
    stop();
    window.removeEventListener("resize", handleResize);
  };
}
