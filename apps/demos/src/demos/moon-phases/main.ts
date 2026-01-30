const angleInputEl = document.querySelector<HTMLInputElement>("#angle");
const angleValueEl = document.querySelector<HTMLSpanElement>("#angleValue");
const illumValueEl = document.querySelector<HTMLSpanElement>("#illumValue");
const canvasEl = document.querySelector<HTMLCanvasElement>("#moonCanvas");

if (!angleInputEl || !angleValueEl || !illumValueEl || !canvasEl) {
  throw new Error("Missing required DOM elements for moon-phases demo.");
}

const ctxEl = canvasEl.getContext("2d");
if (!ctxEl) {
  throw new Error("Canvas 2D context unavailable.");
}

const angleInput = angleInputEl;
const angleValue = angleValueEl;
const illumValue = illumValueEl;
const canvas = canvasEl;
const ctx = ctxEl;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Illuminated fraction of a sphere as seen from Earth, approximated by:
// f = (1 + cos(phaseAngle)) / 2 where phaseAngle is in radians.
function illuminatedFraction(phaseAngleDeg: number) {
  const radians = (phaseAngleDeg * Math.PI) / 180;
  return (1 + Math.cos(radians)) / 2;
}

function drawMoon(phaseAngleDeg: number) {
  const w = canvas.width;
  const h = canvas.height;
  const r = Math.min(w, h) * 0.34;
  const cx = w / 2;
  const cy = h / 2;

  const frac = illuminatedFraction(phaseAngleDeg);
  const terminatorX = (1 - 2 * frac) * r;

  ctx.clearRect(0, 0, w, h);

  // Soft background glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6);
  glow.addColorStop(0, "rgba(138,162,255,0.18)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Moon disk base (dark)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#0b0f1f";
  ctx.fill();

  // Lit portion: draw as intersection of two circles to hint at a terminator.
  // This is a visualization aid, not a full 3D ray-trace.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.beginPath();
  ctx.arc(cx + terminatorX, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#f1f3ff";
  ctx.fill();

  ctx.restore();

  // Rim
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.20)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function render() {
  const angleDeg = clamp(Number(angleInput.value), 0, 360);
  const frac = illuminatedFraction(angleDeg);

  angleValue.textContent = String(Math.round(angleDeg));
  illumValue.textContent = String(Math.round(frac * 100));

  drawMoon(angleDeg);
}

angleInput.addEventListener("input", render);
render();
