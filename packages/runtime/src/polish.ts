type Root = Document | Element;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function prefersReducedMotion(): boolean {
  if (!isBrowser()) return true;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function resolveDemoRoot(root: Root): Element | null {
  if (root instanceof Document) return root.getElementById("cp-demo");
  if (root instanceof Element) return root.querySelector("#cp-demo") ?? root;
  return null;
}

export function initRangeProgress(root: Root = document): void {
  if (!isBrowser()) return;
  const demoRoot = resolveDemoRoot(root);
  if (!demoRoot) return;

  const sliders = Array.from(
    demoRoot.querySelectorAll<HTMLInputElement>('input[type="range"]')
  );

  for (const slider of sliders) {
    if (slider.dataset.cpRangeInit === "true") continue;
    slider.dataset.cpRangeInit = "true";

    const update = () => {
      const min = Number(slider.min || "0");
      const max = Number(slider.max || "100");
      const value = Number(slider.value);
      if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return;

      const pct = ((value - min) / (max - min)) * 100;
      slider.style.setProperty("--cp-range-progress", `${clamp(pct, 0, 100)}%`);
    };

    update();
    slider.addEventListener("input", update, { passive: true });
    slider.addEventListener("change", update, { passive: true });
  }
}

export function initSliderTooltips(root: Root = document): void {
  if (!isBrowser()) return;
  if (prefersReducedMotion()) return;

  const demoRoot = resolveDemoRoot(root);
  if (!demoRoot) return;

  const sliders = Array.from(
    demoRoot.querySelectorAll<HTMLInputElement>('input[type="range"][data-tooltip-source]')
  );

  for (const slider of sliders) {
    if (slider.dataset.cpTooltipInit === "true") continue;
    slider.dataset.cpTooltipInit = "true";

    const sourceSelector = slider.dataset.tooltipSource;
    if (!sourceSelector) continue;

    const sourceEl = demoRoot.querySelector<HTMLElement>(sourceSelector) ?? document.querySelector<HTMLElement>(sourceSelector);
    if (!sourceEl) continue;

    const container = slider.parentElement;
    if (!container) continue;
    const containerStyle = window.getComputedStyle(container);
    if (containerStyle.position === "static") {
      container.style.position = "relative";
    }

    const tooltip = document.createElement("div");
    tooltip.className = "cp-range-tooltip";
    tooltip.setAttribute("aria-hidden", "true");
    tooltip.style.cssText = `
      position: absolute;
      left: 0;
      top: -34px;
      transform: translateX(-50%);
      padding: 0.2rem 0.45rem;
      border-radius: 10px;
      background: color-mix(in srgb, var(--cp-bg2) 82%, transparent);
      border: 1px solid var(--cp-border);
      color: var(--cp-text);
      font-size: 0.85rem;
      font-family: var(--cp-font-mono);
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 120ms var(--cp-ease-out);
      z-index: var(--cp-z-tooltip, 400);
    `;
    container.appendChild(tooltip);

    const format = () => {
      const text = sourceEl.textContent?.trim();
      return text && text.length > 0 ? text : slider.value;
    };

    const position = () => {
      const rect = slider.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const min = Number(slider.min || "0");
      const max = Number(slider.max || "100");
      const value = Number(slider.value);
      if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return;

      const pct = clamp((value - min) / (max - min), 0, 1);
      const thumbSize = 20;
      const left = pct * (rect.width - thumbSize) + thumbSize / 2;
      const leftInContainer = rect.left - containerRect.left + left;

      tooltip.style.left = `${leftInContainer}px`;
      tooltip.textContent = format();
    };

    const show = () => {
      position();
      tooltip.style.opacity = "1";
    };

    const hide = () => {
      tooltip.style.opacity = "0";
    };

    slider.addEventListener("input", position, { passive: true });
    slider.addEventListener("pointerdown", show);
    slider.addEventListener("focus", show);
    slider.addEventListener("pointerup", hide);
    slider.addEventListener("pointercancel", hide);
    slider.addEventListener("blur", hide);

    window.addEventListener("resize", position, { passive: true });
  }
}

function ensureRippleStyles(): void {
  if (!isBrowser()) return;
  if (document.getElementById("cp-runtime-ripple-styles")) return;

  const style = document.createElement("style");
  style.id = "cp-runtime-ripple-styles";
  style.textContent = `
@keyframes cp-ripple {
  to {
    transform: scale(20);
    opacity: 0;
  }
}
  `.trim();
  document.head.appendChild(style);
}

export function initRipples(root: Root = document): void {
  if (!isBrowser()) return;
  if (prefersReducedMotion()) return;

  const demoRoot = resolveDemoRoot(root);
  if (!demoRoot) return;

  ensureRippleStyles();

  const candidates = Array.from(
    demoRoot.querySelectorAll<HTMLElement>(
      'button, a.cp-button, button.cp-button, .cp-accordion > summary'
    )
  );

  for (const el of candidates) {
    if (el.dataset.cpRippleInit === "true") continue;
    el.dataset.cpRippleInit = "true";

    if (el.dataset.ripple === "off") continue;
    if ((el as HTMLButtonElement).disabled) continue;
    if (el.getAttribute("aria-disabled") === "true") continue;

    const computed = window.getComputedStyle(el);
    if (computed.position === "static") {
      el.style.position = "relative";
    }
    el.style.overflow = "hidden";

    el.addEventListener("click", (event) => {
      const rect = el.getBoundingClientRect();
      const mouse = event as MouseEvent;
      const clientX = mouse.clientX || rect.left + rect.width / 2;
      const clientY = mouse.clientY || rect.top + rect.height / 2;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const ripple = document.createElement("span");
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 10px;
        height: 10px;
        margin-left: -5px;
        margin-top: -5px;
        border-radius: 9999px;
        background: color-mix(in srgb, var(--cp-accent) 30%, transparent);
        transform: scale(0);
        animation: cp-ripple 420ms var(--cp-ease-out);
        pointer-events: none;
      `;

      el.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 450);
    });
  }
}

export function initDemoPolish(root: Root = document): void {
  initRangeProgress(root);
  initSliderTooltips(root);
  initRipples(root);
}
