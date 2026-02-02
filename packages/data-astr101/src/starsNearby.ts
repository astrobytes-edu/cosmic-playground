export type NearbyStar = {
  /** Display name for UI (human-friendly). */
  name: string;
  /**
   * Annual parallax in milliarcseconds (mas).
   * Definition is the standard astronomical one: d(pc) = 1 / p(arcsec).
   */
  parallaxMas: number;
};

export const nearbyStarsMeta = {
  id: "nearbyStars",
  title: "Nearby stars (parallax)",
  version: 1,
  unitsPolicy: "units-in-field-names",
  fields: [
    { name: "name", type: "string", unit: "unitless" },
    { name: "parallaxMas", type: "number", unit: "mas" }
  ],
  provenance: {
    kind: "project-authored",
    notes: "Approximate values curated for teaching examples; not a single upstream catalog."
  },
  license: "UNSPECIFIED"
} as const;

// Values are representative (order-of-magnitude correct) and intentionally limited in size
// so the demo bundles quickly. These can be swapped with a larger vetted list later.
export const nearbyStars: NearbyStar[] = [
  { name: "Proxima Centauri", parallaxMas: 768.5 },
  { name: "Alpha Centauri A/B (system)", parallaxMas: 747.0 },
  { name: "Barnard’s Star", parallaxMas: 548.3 },
  { name: "Wolf 359", parallaxMas: 419.1 },
  { name: "Sirius", parallaxMas: 379.2 },
  { name: "Luyten 726-8 (UV Ceti)", parallaxMas: 373.7 },
  { name: "Ross 154", parallaxMas: 336.9 },
  { name: "Epsilon Eridani", parallaxMas: 310.7 },
  { name: "Procyon", parallaxMas: 284.6 },
  { name: "Vega", parallaxMas: 130.2 }
];
