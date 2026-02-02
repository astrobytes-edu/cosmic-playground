export type AtomicLine = {
  id: string;
  label: string;
  species: string;
  lineName: string;
  wavelengthCm: number;
  medium: "air" | "vacuum";
  relativeStrengthUnitless: number;
};

export const atomicLinesMeta = {
  id: "atomicLines",
  title: "Teaching atomic lines (visible)",
  version: 1,
  unitsPolicy: "units-in-field-names",
  fields: [
    { name: "id", type: "string", unit: "unitless" },
    { name: "label", type: "string", unit: "unitless" },
    { name: "species", type: "string", unit: "unitless" },
    { name: "lineName", type: "string", unit: "unitless" },
    { name: "wavelengthCm", type: "number", unit: "cm" },
    { name: "medium", type: "string", unit: "unitless" },
    { name: "relativeStrengthUnitless", type: "number", unit: "unitless" }
  ],
  provenance: {
    kind: "project-authored",
    notes: "Values curated for ASTR 101 teaching; wavelengths are representative air wavelengths anchored to NIST strong line tables."
  },
  license: "UNSPECIFIED"
} as const;

// Teaching-oriented subset: common visible-range lines used for pattern matching.
export const atomicLines: AtomicLine[] = [
  {
    id: "H_I_Hd",
    label: "Hydrogen H-delta (Balmer)",
    species: "H I",
    lineName: "H-delta",
    wavelengthCm: 4.10174e-5,
    medium: "air",
    relativeStrengthUnitless: 0.4
  },
  {
    id: "H_I_Hg",
    label: "Hydrogen H-gamma (Balmer)",
    species: "H I",
    lineName: "H-gamma",
    wavelengthCm: 4.340462e-5,
    medium: "air",
    relativeStrengthUnitless: 0.5
  },
  {
    id: "H_I_Hb",
    label: "Hydrogen H-beta (Balmer)",
    species: "H I",
    lineName: "H-beta",
    wavelengthCm: 4.86128e-5,
    medium: "air",
    relativeStrengthUnitless: 0.8
  },
  {
    id: "H_I_Ha",
    label: "Hydrogen H-alpha (Balmer)",
    species: "H I",
    lineName: "H-alpha",
    wavelengthCm: 6.56281e-5,
    medium: "air",
    relativeStrengthUnitless: 1.0
  },
  {
    id: "Na_I_D2",
    label: "Sodium D2",
    species: "Na I",
    lineName: "D2",
    wavelengthCm: 5.88995e-5,
    medium: "air",
    relativeStrengthUnitless: 1.0
  },
  {
    id: "Na_I_D1",
    label: "Sodium D1",
    species: "Na I",
    lineName: "D1",
    wavelengthCm: 5.895924e-5,
    medium: "air",
    relativeStrengthUnitless: 0.9
  },
  {
    id: "Ca_II_K",
    label: "Calcium II K",
    species: "Ca II",
    lineName: "K",
    wavelengthCm: 3.9336614e-5,
    medium: "air",
    relativeStrengthUnitless: 1.0
  },
  {
    id: "Ca_II_H",
    label: "Calcium II H",
    species: "Ca II",
    lineName: "H",
    wavelengthCm: 3.9684673e-5,
    medium: "air",
    relativeStrengthUnitless: 0.9
  }
];
