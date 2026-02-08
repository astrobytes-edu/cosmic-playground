export interface GlossaryEntry {
  term: string;
  definition: string;
  demos: string[];
}

export const glossary: GlossaryEntry[] = [
  {
    term: "Angular size",
    definition:
      "The apparent size of an object as seen from a given viewpoint, measured as an angle. Two objects of different physical size can subtend the same angular size if they are at different distances.",
    demos: ["angular-size", "eclipse-geometry"],
  },
  {
    term: "Aphelion",
    definition:
      "The point in an orbit farthest from the central body (the Sun for planets in the solar system).",
    demos: ["keplers-laws"],
  },
  {
    term: "Blackbody radiation",
    definition:
      "Electromagnetic radiation emitted by an idealized object that absorbs all incident radiation. Its spectrum depends only on temperature and peaks at a wavelength given by Wien\u2019s law.",
    demos: ["blackbody-radiation", "eos-lab"],
  },
  {
    term: "Conjunction",
    definition:
      "A configuration where two celestial bodies have the same ecliptic longitude as seen from Earth. Superior conjunction places the body behind the Sun; inferior conjunction places it between Earth and the Sun.",
    demos: ["planetary-conjunctions"],
  },
  {
    term: "Eccentricity",
    definition:
      "A measure of how much an orbit deviates from a perfect circle. A circle has eccentricity 0; a parabolic escape orbit has eccentricity 1.",
    demos: ["keplers-laws", "binary-orbits"],
  },
  {
    term: "Ecliptic",
    definition:
      "The plane of Earth\u2019s orbit around the Sun, and by extension the apparent path of the Sun on the sky over a year.",
    demos: ["eclipse-geometry", "seasons"],
  },
  {
    term: "Equation of state",
    definition:
      "A relationship among thermodynamic variables (pressure, density, temperature) that describes the material properties of a gas or plasma. Stellar interiors require combining ideal gas, radiation, and degeneracy pressure contributions.",
    demos: ["eos-lab"],
  },
  {
    term: "Kepler\u2019s laws",
    definition:
      "Three laws describing planetary motion: (1) orbits are ellipses with the Sun at one focus, (2) a line from planet to Sun sweeps equal areas in equal times, (3) the square of the orbital period is proportional to the cube of the semi-major axis.",
    demos: ["keplers-laws", "binary-orbits", "planetary-conjunctions"],
  },
  {
    term: "Lunar phase",
    definition:
      "The shape of the illuminated portion of the Moon as seen from Earth, determined by the Moon-Earth-Sun geometry. Phases cycle from new to full and back over about 29.5 days.",
    demos: ["moon-phases"],
  },
  {
    term: "Obliquity",
    definition:
      "The angle between a planet\u2019s rotational axis and the perpendicular to its orbital plane. Earth\u2019s obliquity (~23.4\u00B0) causes the seasons.",
    demos: ["seasons"],
  },
  {
    term: "Parallax",
    definition:
      "The apparent shift in position of an object when viewed from two different vantage points. Stellar parallax uses Earth\u2019s orbital diameter as a baseline to measure distances to nearby stars.",
    demos: ["parallax-distance"],
  },
  {
    term: "Perihelion",
    definition:
      "The point in an orbit closest to the central body (the Sun for planets in the solar system).",
    demos: ["keplers-laws"],
  },
  {
    term: "Rayleigh criterion",
    definition:
      "The angular resolution limit of a circular aperture, approximately 1.22 times the wavelength divided by the aperture diameter. Two point sources closer than this angle cannot be distinguished.",
    demos: ["telescope-resolution"],
  },
  {
    term: "Retrograde motion",
    definition:
      "The apparent backward (westward) drift of a planet against the background stars, caused by the relative orbital motion of Earth and the planet.",
    demos: ["retrograde-motion"],
  },
  {
    term: "Semi-major axis",
    definition:
      "Half the longest diameter of an ellipse. For an orbit, it determines the size of the orbit and (via Kepler\u2019s third law) the orbital period.",
    demos: ["keplers-laws", "binary-orbits"],
  },
  {
    term: "Synodic period",
    definition:
      "The time between successive identical configurations (e.g., conjunctions) of two orbiting bodies as seen from a reference body. It depends on both orbital periods.",
    demos: ["planetary-conjunctions", "retrograde-motion"],
  },
  {
    term: "Wien\u2019s displacement law",
    definition:
      "The peak wavelength of a blackbody spectrum is inversely proportional to the temperature: \u03BB_max = b / T, where b \u2248 2.898 \u00D7 10\u207B\u00B3 m\u00B7K.",
    demos: ["blackbody-radiation"],
  },
  {
    term: "Wavelength",
    definition:
      "The spatial period of a wave, the distance between successive crests. For electromagnetic radiation, wavelength determines the type of light (radio, infrared, visible, ultraviolet, X-ray, gamma ray).",
    demos: ["em-spectrum", "blackbody-radiation", "telescope-resolution"],
  },
];
