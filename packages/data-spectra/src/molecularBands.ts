export type MolecularBand = {
  id: string;
  label: string;
  molecule: string;
  bandType: string;
  centerWavelengthCm: number;
};

export const molecularBandsMeta = {
  id: "molecularBands",
  title: "Teaching IR molecular band centers",
  version: 1,
  unitsPolicy: "units-in-field-names",
  fields: [
    { name: "id", type: "string", unit: "unitless" },
    { name: "label", type: "string", unit: "unitless" },
    { name: "molecule", type: "string", unit: "unitless" },
    { name: "bandType", type: "string", unit: "unitless" },
    { name: "centerWavelengthCm", type: "number", unit: "cm" }
  ],
  provenance: {
    kind: "project-authored",
    notes: "Band centers are representative anchors for teaching; shapes/details are intentionally not line-by-line spectroscopy."
  },
  license: "UNSPECIFIED"
} as const;

export const molecularBands: MolecularBand[] = [
  {
    id: "CH4_3p3um",
    label: "CH4 ~3.3 um band",
    molecule: "CH4",
    bandType: "rovibrational",
    centerWavelengthCm: 3.3e-4
  },
  {
    id: "CO2_4p3um",
    label: "CO2 ~4.3 um band",
    molecule: "CO2",
    bandType: "rovibrational",
    centerWavelengthCm: 4.3e-4
  },
  {
    id: "CO_4p67um",
    label: "CO ~4.67 um band",
    molecule: "CO",
    bandType: "rovibrational",
    centerWavelengthCm: 4.67e-4
  },
  {
    id: "H2O_6p3um",
    label: "H2O ~6.3 um band",
    molecule: "H2O",
    bandType: "rovibrational",
    centerWavelengthCm: 6.3e-4
  },
  {
    id: "CO2_15um",
    label: "CO2 ~15 um band",
    molecule: "CO2",
    bandType: "rovibrational",
    centerWavelengthCm: 1.5e-3
  }
];
