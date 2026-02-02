export type WavelengthBand = {
  id: string;
  shortLabel: string;
  name: string;
  wavelengthCm: number;
  notes: string;
};

export const wavelengthBandsMeta = {
  id: "wavelengthBands",
  title: "Wavelength band presets",
  version: 1,
  unitsPolicy: "units-in-field-names",
  fields: [
    { name: "id", type: "string", unit: "unitless" },
    { name: "shortLabel", type: "string", unit: "unitless" },
    { name: "name", type: "string", unit: "unitless" },
    { name: "wavelengthCm", type: "number", unit: "cm" },
    { name: "notes", type: "string", unit: "unitless" }
  ],
  provenance: {
    kind: "project-authored",
    notes: "Preset values mirror legacy ASTR 101 demo defaults; wavelengths are representative anchors for band-scale reasoning."
  },
  license: "UNSPECIFIED"
} as const;

export const wavelengthBands: WavelengthBand[] = [
  {
    id: "uv",
    shortLabel: "UV",
    name: "Ultraviolet",
    wavelengthCm: 3e-5,
    notes: "Mostly blocked by atmosphere; space-based UV astronomy."
  },
  {
    id: "visible",
    shortLabel: "Visible",
    name: "Visible light",
    wavelengthCm: 5.5e-5,
    notes: "Human-visible wavelengths."
  },
  {
    id: "near-ir",
    shortLabel: "Near-IR",
    name: "Near-infrared",
    wavelengthCm: 2.2e-4,
    notes: "Penetrates dust; common for adaptive optics."
  },
  {
    id: "mid-ir",
    shortLabel: "Mid-IR",
    name: "Mid-infrared",
    wavelengthCm: 1e-3,
    notes: "Thermal emission; space telescopes often dominate."
  },
  {
    id: "radio-21cm",
    shortLabel: "21 cm",
    name: "Radio (21 cm)",
    wavelengthCm: 21,
    notes: "Hydrogen 21-cm hyperfine line (radio astronomy)."
  },
  {
    id: "mm-1p3",
    shortLabel: "1.3 mm",
    name: "Millimeter (1.3 mm)",
    wavelengthCm: 0.13,
    notes: "EHT observing wavelength (mm VLBI)."
  }
];

