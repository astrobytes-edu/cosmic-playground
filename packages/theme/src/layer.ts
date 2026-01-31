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
