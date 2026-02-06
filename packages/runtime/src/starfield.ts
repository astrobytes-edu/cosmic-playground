/**
 * Starfield — animated canvas background for Cosmic Playground demos.
 *
 * Creates a subtle field of twinkling stars that sits behind translucent
 * demo panels, establishing the "cosmic" atmosphere.
 *
 * Usage:
 *   const cleanup = initStarfield({ canvas: myCanvas });
 *   // Later, when done:
 *   cleanup();
 */

export interface StarfieldConfig {
  /** The canvas element to draw on. */
  canvas: HTMLCanvasElement;
  /** Number of stars to generate. Default: 200 */
  starCount?: number;
  /** Amplitude of opacity oscillation. Default: 0.3 */
  twinkleAmount?: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

/** Star colors: white, warm (Betelgeuse), cool (Rigel), off-white */
const STAR_COLORS = ["#ffffff", "#ffe4c4", "#cae1ff", "#fff5ee"];

/**
 * Three depth layers create a parallax-like sense of depth.
 * Far stars are small/dim, near stars are large/bright.
 */
const LAYERS = [
  { fraction: 0.55, minSize: 0.3, maxSize: 0.8, baseOpacity: 0.3, speedBase: 0.01 },
  { fraction: 0.30, minSize: 0.5, maxSize: 1.2, baseOpacity: 0.5, speedBase: 0.02 },
  { fraction: 0.15, minSize: 1.0, maxSize: 2.5, baseOpacity: 0.7, speedBase: 0.03 },
];

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateStars(count: number, width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (const layer of LAYERS) {
    const layerCount = Math.round(count * layer.fraction);
    for (let i = 0; i < layerCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: rand(layer.minSize, layer.maxSize),
        baseOpacity: layer.baseOpacity + rand(-0.1, 0.1),
        twinkleSpeed: layer.speedBase * rand(0.5, 1.5),
        twinklePhase: Math.random() * Math.PI * 2,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
    }
  }
  return stars;
}

function drawStar(ctx: CanvasRenderingContext2D, star: Star, opacity: number): void {
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.fillStyle = star.color;

  // Large stars get a soft glow halo
  if (star.size > 1.0) {
    const gradient = ctx.createRadialGradient(
      star.x, star.y, 0,
      star.x, star.y, star.size * 3,
    );
    gradient.addColorStop(0, star.color);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
    ctx.fill();
    // Draw the crisp core on top
    ctx.fillStyle = star.color;
  }

  ctx.beginPath();
  ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Initialize an animated starfield on the given canvas.
 *
 * @returns A cleanup function that stops the animation and removes listeners.
 */
export function initStarfield(config: StarfieldConfig): () => void {
  const { canvas, starCount = 200, twinkleAmount = 0.3 } = config;

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let logicalWidth = 0;
  let logicalHeight = 0;
  let stars: Star[] = [];
  let animationId = 0;
  let running = false;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    logicalWidth = rect.width;
    logicalHeight = rect.height;

    canvas.width = Math.round(logicalWidth * dpr);
    canvas.height = Math.round(logicalHeight * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars = generateStars(starCount, logicalWidth, logicalHeight);

    // If static mode, draw once after resize
    if (!running) {
      renderFrame(0);
    }
  }

  function renderFrame(timeSec: number): void {
    ctx!.clearRect(0, 0, logicalWidth, logicalHeight);

    for (const star of stars) {
      const twinkle = Math.sin(timeSec * star.twinkleSpeed + star.twinklePhase);
      const opacity = star.baseOpacity + twinkle * twinkleAmount;
      drawStar(ctx!, star, opacity);
    }
  }

  function animate(timestamp: number): void {
    renderFrame(timestamp / 1000);
    if (running) {
      animationId = requestAnimationFrame(animate);
    }
  }

  function start(): void {
    if (running) return;
    running = true;
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
    // Draw a single static frame — no animation loop
    renderFrame(0);
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
