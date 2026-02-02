export type EmSpectrumObject = {
  name: string;
  bands: string[];
  why: string;
  telescopeExamples: string;
};

export const emSpectrumObjectsMeta = {
  id: "emSpectrumObjects",
  title: "Example objects across the EM spectrum",
  version: 1,
  unitsPolicy: "units-in-field-names",
  fields: [
    { name: "name", type: "string", unit: "unitless" },
    { name: "bands", type: "string[]", unit: "unitless" },
    { name: "why", type: "string", unit: "unitless" },
    { name: "telescopeExamples", type: "string", unit: "unitless" }
  ],
  provenance: {
    kind: "project-authored",
    notes: "Descriptions are qualitative and designed for introductory discussion; not an exhaustive catalog."
  },
  license: "UNSPECIFIED"
} as const;

export const emSpectrumObjects: EmSpectrumObject[] = [
  {
    name: "O/B stars",
    bands: ["Ultraviolet", "Visible"],
    why: "Hot surfaces (10,000-50,000 K) emit strongly at short wavelengths and ionize surrounding gas.",
    telescopeExamples: "Hubble (UV), GALEX (UV), ground optical"
  },
  {
    name: "Sun (G star)",
    bands: ["Visible", "Ultraviolet", "X-ray"],
    why: "At 5778 K the Sun peaks in visible light; its million-K corona emits X-rays.",
    telescopeExamples: "Ground optical, solar space missions (UV/X-ray)"
  },
  {
    name: "Red dwarfs (M stars)",
    bands: ["Infrared", "Visible"],
    why: "Cool surfaces (2500-3900 K) emit mostly in red and infrared.",
    telescopeExamples: "JWST (IR), ground IR"
  },
  {
    name: "Brown dwarfs",
    bands: ["Infrared"],
    why: "Too cool for sustained hydrogen fusion; emit primarily in infrared.",
    telescopeExamples: "JWST (IR), Spitzer (IR), WISE (IR)"
  },
  {
    name: "White dwarfs",
    bands: ["Ultraviolet", "Visible"],
    why: "Hot exposed stellar cores emit strongly at shorter wavelengths.",
    telescopeExamples: "Hubble (UV), GALEX (UV)"
  },
  {
    name: "Neutron stars / pulsars",
    bands: ["X-ray", "Gamma-ray", "Radio"],
    why: "Extreme temperatures and magnetic fields produce high-energy emission; pulsars are strong radio sources.",
    telescopeExamples: "Chandra (X-ray), Fermi (gamma), radio arrays"
  },
  {
    name: "Accreting black holes",
    bands: ["X-ray", "Radio", "Gamma-ray"],
    why: "Accretion disks can reach millions of K (X-rays); jets emit radio and sometimes gamma rays.",
    telescopeExamples: "Chandra (X-ray), radio arrays, Fermi (gamma)"
  },
  {
    name: "Dust clouds",
    bands: ["Infrared", "Sub-mm"],
    why: "Cold dust absorbs visible light and re-emits in the infrared; IR can also see through dust better than visible.",
    telescopeExamples: "JWST (IR), Herschel (far-IR), ALMA (sub-mm)"
  },
  {
    name: "Emission nebulae",
    bands: ["Visible", "Infrared", "Radio"],
    why: "Ionized gas emits bright optical lines; dust and warm regions glow in infrared; molecules emit in radio/sub-mm lines.",
    telescopeExamples: "Hubble (visible), JWST (IR), ALMA/VLA (radio)"
  },
  {
    name: "Spiral galaxies",
    bands: ["Visible", "Ultraviolet", "Infrared", "Radio"],
    why: "Young stars emit UV, older stars emit visible/near-IR; dust re-emits in IR; gas can be traced in radio.",
    telescopeExamples: "Hubble/JWST, GALEX, ALMA/VLA"
  },
  {
    name: "Quasars / AGN",
    bands: ["All"],
    why: "Accreting supermassive black holes can emit across the spectrum; different components dominate in different bands.",
    telescopeExamples: "Many observatories depending on wavelength"
  },
  {
    name: "Cosmic microwave background (CMB)",
    bands: ["Microwave"],
    why: "Relic radiation cooled by expansion; today peaks in microwave wavelengths.",
    telescopeExamples: "Planck, WMAP, ground CMB experiments"
  }
];
