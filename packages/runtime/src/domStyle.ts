export function injectStyleOnce(args: { id: string; cssText: string }): void {
  if (typeof document === "undefined") return;

  const existing = document.getElementById(args.id);
  if (existing) return;

  const styleEl = document.createElement("style");
  styleEl.id = args.id;
  styleEl.textContent = args.cssText;
  document.head.appendChild(styleEl);
}

