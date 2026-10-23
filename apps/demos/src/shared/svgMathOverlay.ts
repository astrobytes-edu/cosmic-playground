import { setMathText } from "./mathText";

/**
 * KaTeX labels for an SVG diagram.
 *
 * SVG <text> cannot host KaTeX, so a math label (the photon's gamma, the ionization
 * limit's infinity, an apparent-longitude lambda) is an HTML element in a layer stacked
 * over the SVG and pinned to a point in the SVG's user space through getScreenCTM()
 * (Anna, 2026-10-23: typeset symbols over words or ASCII). getScreenCTM() includes the
 * viewBox scale and any preserveAspectRatio letterboxing, so a label lands where the
 * <text> it replaces would have.
 *
 * The layer is aria-hidden: the labels belong to the drawing, whose accessible name is
 * on the SVG.
 */
export interface SvgMathLabel {
  /** Stable identity: a label redrawn under the same key keeps its element. */
  key: string;
  /** Delimited TeX, e.g. "$\\gamma$". */
  tex: string;
  /** SVG user-space point the label's anchor edge is centred on vertically. */
  x: number;
  y: number;
  anchor?: "start" | "middle" | "end";
  /** Fixed on-screen size. */
  fontPx?: number;
  /** Size in SVG user units, scaled with the drawing like the <text> it replaces. */
  fontUnits?: number;
  color?: string;
  opacity?: number;
  glow?: boolean;
}

export interface SvgMathOverlay {
  readonly layer: HTMLElement;
  /** Replace the drawn labels. Cheap per frame: unchanged TeX is not re-typeset. */
  set(labels: readonly SvgMathLabel[]): void;
  /** Re-pin the current labels after the SVG moved or resized. */
  reposition(): void;
}

const ANCHOR_SHIFT = { start: "0%", middle: "-50%", end: "-100%" } as const;
const POSITIONED = new Set(["relative", "absolute", "fixed", "sticky"]);

export function createSvgMathOverlay(svg: SVGSVGElement): SvgMathOverlay {
  const host = svg.parentElement;
  if (!host) throw new Error("createSvgMathOverlay: the SVG needs a parent to host its label layer");
  if (!POSITIONED.has(getComputedStyle(host).position)) host.style.position = "relative";

  const layer = document.createElement("div");
  layer.className = "cp-svg-math";
  layer.setAttribute("aria-hidden", "true");
  svg.after(layer);

  const nodes = new Map<string, HTMLElement>();
  let current: readonly SvgMathLabel[] = [];

  function reposition(): void {
    const ctm = svg.getScreenCTM();
    const scale = ctm ? Math.hypot(ctm.a, ctm.b) : 0;
    // A panel in a hidden tab has no layout, so there is nothing to pin to. Visibility,
    // not display, so the layer keeps a box to measure once the panel is shown.
    if (!ctm || scale === 0) {
      layer.style.visibility = "hidden";
      return;
    }
    layer.style.visibility = "";
    const origin = layer.getBoundingClientRect();
    for (const label of current) {
      const el = nodes.get(label.key);
      if (!el) continue;
      el.style.left = `${ctm.a * label.x + ctm.c * label.y + ctm.e - origin.left}px`;
      el.style.top = `${ctm.b * label.x + ctm.d * label.y + ctm.f - origin.top}px`;
      el.style.fontSize = `${label.fontPx ?? (label.fontUnits ?? 0) * scale}px`;
    }
  }

  function set(labels: readonly SvgMathLabel[]): void {
    const keep = new Set(labels.map((label) => label.key));
    for (const [key, el] of nodes) {
      if (keep.has(key)) continue;
      el.remove();
      nodes.delete(key);
    }
    for (const label of labels) {
      let el = nodes.get(label.key);
      if (!el) {
        el = document.createElement("span");
        el.className = "cp-svg-math__label";
        el.dataset.svgMath = label.key;
        layer.append(el);
        nodes.set(label.key, el);
      }
      setMathText(el, label.tex);
      el.style.transform = `translate(${ANCHOR_SHIFT[label.anchor ?? "middle"]}, -50%)`;
      el.style.color = label.color ?? "";
      el.style.opacity = label.opacity === undefined ? "" : String(label.opacity);
      el.classList.toggle("cp-svg-math__label--glow", label.glow === true);
    }
    current = labels;
    reposition();
  }

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => reposition());
    observer.observe(svg);
    observer.observe(host);
  }

  return { layer, set, reposition };
}
