export type CosmicLayer = "museum" | "instrument";

export function setCosmicLayer(el: HTMLElement, layer: CosmicLayer) {
  el.dataset.cpLayer = layer;
  el.classList.toggle("cp-layer-museum", layer === "museum");
  el.classList.toggle("cp-layer-instrument", layer === "instrument");
}

export function getCosmicLayer(el: HTMLElement): CosmicLayer {
  return el.dataset.cpLayer === "instrument" ? "instrument" : "museum";
}

