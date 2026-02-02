export type EmSpectrumTelescope = {
  name: string;
  band: string;
  wavelengthMinCm: number;
  wavelengthMaxCm: number;
  location: string;
  science: string;
};

export const emSpectrumTelescopesMeta = {
  id: "emSpectrumTelescopes",
  title: "Example observatories by wavelength band",
  version: 1,
  unitsPolicy: "units-in-field-names",
  fields: [
    { name: "name", type: "string", unit: "unitless" },
    { name: "band", type: "string", unit: "unitless" },
    { name: "wavelengthMinCm", type: "number", unit: "cm" },
    { name: "wavelengthMaxCm", type: "number", unit: "cm" },
    { name: "location", type: "string", unit: "unitless" },
    { name: "science", type: "string", unit: "unitless" }
  ],
  provenance: {
    kind: "project-authored",
    notes: "Ranges and descriptions are approximate and teaching-oriented, based on commonly cited instrument coverage."
  },
  license: "UNSPECIFIED"
} as const;

// Wavelength ranges are approximate and for teaching use.
export const emSpectrumTelescopes: EmSpectrumTelescope[] = [
  {
    name: "Fermi",
    band: "Gamma-ray",
    wavelengthMinCm: 1e-14,
    wavelengthMaxCm: 1e-10,
    location: "Space (LEO)",
    science: "Gamma-ray bursts, pulsars, active galactic nuclei"
  },
  {
    name: "VERITAS",
    band: "Gamma-ray",
    wavelengthMinCm: 1e-15,
    wavelengthMaxCm: 1e-12,
    location: "Arizona, USA (ground)",
    science: "Very high energy gamma rays from blazars, supernova remnants"
  },
  {
    name: "Chandra",
    band: "X-ray",
    wavelengthMinCm: 1e-9,
    wavelengthMaxCm: 1e-6,
    location: "Space (HEO)",
    science: "Black holes, neutron stars, supernova remnants, galaxy clusters"
  },
  {
    name: "XMM-Newton",
    band: "X-ray",
    wavelengthMinCm: 6e-9,
    wavelengthMaxCm: 1.2e-6,
    location: "Space (HEO)",
    science: "X-ray spectroscopy of hot gas in clusters, stellar coronae"
  },
  {
    name: "GALEX",
    band: "Ultraviolet",
    wavelengthMinCm: 1.35e-5,
    wavelengthMaxCm: 2.8e-5,
    location: "Space (archived)",
    science: "Star formation history, UV bright stars, hot white dwarfs"
  },
  {
    name: "Hubble",
    band: "UV/Optical/Near-IR",
    wavelengthMinCm: 1.15e-5,
    wavelengthMaxCm: 2.5e-4,
    location: "Space (LEO)",
    science: "Imaging and spectroscopy from UV to near-IR"
  },
  {
    name: "Keck",
    band: "Optical/Near-IR",
    wavelengthMinCm: 3e-5,
    wavelengthMaxCm: 5e-4,
    location: "Mauna Kea, Hawaii (ground)",
    science: "Exoplanets, galaxy spectroscopy, adaptive optics imaging"
  },
  {
    name: "VLT",
    band: "Optical/Near-IR",
    wavelengthMinCm: 3e-5,
    wavelengthMaxCm: 2.5e-3,
    location: "Paranal, Chile (ground)",
    science: "Optical and infrared spectroscopy and imaging"
  },
  {
    name: "JWST",
    band: "Near/Mid-IR",
    wavelengthMinCm: 6e-5,
    wavelengthMaxCm: 2.8e-3,
    location: "Space (L2)",
    science: "First galaxies, exoplanet atmospheres, star formation in dust"
  },
  {
    name: "Spitzer",
    band: "Infrared",
    wavelengthMinCm: 3.6e-4,
    wavelengthMaxCm: 1.6e-2,
    location: "Space (archived)",
    science: "Infrared galaxies, brown dwarfs, protoplanetary disks"
  },
  {
    name: "Herschel",
    band: "Far-IR/Sub-mm",
    wavelengthMinCm: 5.5e-3,
    wavelengthMaxCm: 6.72e-2,
    location: "Space (archived)",
    science: "Cold dust in star-forming regions, debris disks, distant galaxies"
  },
  {
    name: "ALMA",
    band: "Millimeter/Sub-mm",
    wavelengthMinCm: 3.2e-2,
    wavelengthMaxCm: 3.6e0,
    location: "Atacama, Chile (ground)",
    science: "Protoplanetary disks, molecular gas, high-redshift galaxies"
  },
  {
    name: "VLA",
    band: "Radio",
    wavelengthMinCm: 7e-1,
    wavelengthMaxCm: 4e2,
    location: "New Mexico, USA (ground)",
    science: "Jets, synchrotron emission, neutral hydrogen (21 cm)"
  },
  {
    name: "FAST",
    band: "Radio",
    wavelengthMinCm: 2.1e1,
    wavelengthMaxCm: 4.3e2,
    location: "Guizhou, China (ground)",
    science: "Pulsars, fast radio bursts, neutral hydrogen mapping"
  }
];
