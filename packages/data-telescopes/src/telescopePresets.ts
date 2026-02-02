export type TelescopePreset = {
  id: string;
  name: string;
  apertureM: number;
  /**
   * Whether "apertureM" is a physical diameter or an effective interferometer baseline.
   * Used for teaching: resolution depends on the effective aperture/baseline.
   */
  apertureKind: "diameter" | "baseline";
  platform: "ground" | "space" | "network";
  type: string;
  location: string;
  notes: string;
  /**
   * Default wavelength in cm for this instrument (teaching choice).
   * For radio/mm, this is important; for optical telescopes, visible is typical.
   */
  defaultWavelengthCm: number;
};

export const telescopePresetsMeta = {
  id: "telescopePresets",
  title: "Telescope and interferometer presets",
  version: 1,
  unitsPolicy: "units-in-field-names",
  fields: [
    { name: "id", type: "string", unit: "unitless" },
    { name: "name", type: "string", unit: "unitless" },
    { name: "apertureM", type: "number", unit: "m" },
    { name: "apertureKind", type: "string", unit: "unitless" },
    { name: "platform", type: "string", unit: "unitless" },
    { name: "type", type: "string", unit: "unitless" },
    { name: "location", type: "string", unit: "unitless" },
    { name: "notes", type: "string", unit: "unitless" },
    { name: "defaultWavelengthCm", type: "number", unit: "cm" }
  ],
  provenance: {
    kind: "project-authored",
    notes: "Values curated for ASTR 101 teaching examples; apertures are representative. Some entries represent interferometer baselines as an effective aperture."
  },
  license: "UNSPECIFIED"
} as const;

const VISIBLE_DEFAULT_CM = 5.5e-5;
const RADIO_21CM_DEFAULT_CM = 21;
const MM_1P3_DEFAULT_CM = 0.13;

export const telescopePresets: TelescopePreset[] = [
  { id: "eye", name: "Human eye", apertureM: 0.007, apertureKind: "diameter", platform: "ground", type: "optical", location: "Ground", notes: "Pupil diameter in dark conditions", defaultWavelengthCm: VISIBLE_DEFAULT_CM },
  { id: "binoculars", name: "Binoculars (50 mm)", apertureM: 0.05, apertureKind: "diameter", platform: "ground", type: "optical", location: "Ground", notes: "Handheld optics", defaultWavelengthCm: VISIBLE_DEFAULT_CM },
  { id: "amateur-200mm", name: "Amateur telescope (200 mm)", apertureM: 0.2, apertureKind: "diameter", platform: "ground", type: "optical", location: "Ground", notes: "Popular Dobsonian size", defaultWavelengthCm: VISIBLE_DEFAULT_CM },

  { id: "hubble", name: "Hubble Space Telescope (2.4 m)", apertureM: 2.4, apertureKind: "diameter", platform: "space", type: "optical", location: "Space", notes: "No atmospheric seeing", defaultWavelengthCm: VISIBLE_DEFAULT_CM },
  { id: "jwst", name: "JWST (6.5 m)", apertureM: 6.5, apertureKind: "diameter", platform: "space", type: "infrared", location: "Space", notes: "Optimized for infrared", defaultWavelengthCm: 2.2e-4 },
  { id: "keck", name: "Keck (10 m)", apertureM: 10, apertureKind: "diameter", platform: "ground", type: "optical", location: "Mauna Kea (ground)", notes: "Adaptive optics capable", defaultWavelengthCm: 2.2e-4 },
  { id: "tmt", name: "TMT (30 m)", apertureM: 30, apertureKind: "diameter", platform: "ground", type: "optical", location: "Ground (planned)", notes: "Extremely large telescope class", defaultWavelengthCm: 2.2e-4 },
  { id: "elt", name: "ELT (39 m)", apertureM: 39, apertureKind: "diameter", platform: "ground", type: "optical", location: "Cerro Armazones (ground)", notes: "Extremely large telescope class", defaultWavelengthCm: 2.2e-4 },

  { id: "gbt", name: "Green Bank Telescope (100 m)", apertureM: 100, apertureKind: "diameter", platform: "ground", type: "radio", location: "West Virginia (ground)", notes: "Largest fully steerable dish", defaultWavelengthCm: RADIO_21CM_DEFAULT_CM },
  { id: "arecibo", name: "Arecibo (305 m)", apertureM: 305, apertureKind: "diameter", platform: "ground", type: "radio", location: "Puerto Rico (historic)", notes: "Collapsed 2020 (reference)", defaultWavelengthCm: RADIO_21CM_DEFAULT_CM },
  { id: "vla", name: "VLA (36 km baseline)", apertureM: 36_000, apertureKind: "baseline", platform: "ground", type: "radio-interferometer", location: "New Mexico (ground)", notes: "Interferometer baseline as effective aperture", defaultWavelengthCm: RADIO_21CM_DEFAULT_CM },
  { id: "eht", name: "EHT (Earth diameter)", apertureM: 10_000_000, apertureKind: "baseline", platform: "network", type: "mm-interferometer", location: "VLBI network", notes: "Earth-sized baseline for mm VLBI", defaultWavelengthCm: MM_1P3_DEFAULT_CM }
];

