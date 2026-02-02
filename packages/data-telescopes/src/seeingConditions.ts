export type SeeingCondition = {
  id: string;
  label: string;
  seeingArcsec: number;
  notes: string;
};

export const seeingConditionsMeta = {
  id: "seeingConditions",
  title: "Atmospheric seeing presets",
  version: 1,
  unitsPolicy: "units-in-field-names",
  fields: [
    { name: "id", type: "string", unit: "unitless" },
    { name: "label", type: "string", unit: "unitless" },
    { name: "seeingArcsec", type: "number", unit: "arcsec" },
    { name: "notes", type: "string", unit: "unitless" }
  ],
  provenance: {
    kind: "project-authored",
    notes: "Typical seeing ranges used for classroom discussion; not a site-specific distribution."
  },
  license: "UNSPECIFIED"
} as const;

export const seeingConditions: SeeingCondition[] = [
  { id: "excellent", label: "Excellent", seeingArcsec: 0.5, notes: "Best high-altitude sites" },
  { id: "good", label: "Good", seeingArcsec: 0.8, notes: "Typical good night" },
  { id: "average", label: "Average", seeingArcsec: 1.0, notes: "Typical conditions" },
  { id: "fair", label: "Fair", seeingArcsec: 1.5, notes: "Blurrier nights" },
  { id: "poor", label: "Poor", seeingArcsec: 3.0, notes: "Poor conditions" }
];

