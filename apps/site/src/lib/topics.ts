/**
 * Single source of truth for the topic taxonomy.
 *
 * Before this module the eight topic keys, their labels, their descriptions and their
 * suggested reading order were duplicated across `explore/index.astro`,
 * `topics/index.astro`, `topics/[slug].astro` and `TopicStrip.astro`. The copies had
 * already drifted: `TopicStrip` shipped six of the eight topics, and the suggested
 * sequences omitted every demo added after they were written.
 *
 * `TopicKey` is derived from `TOPIC_ORDER`, so adding a topic to the content schema
 * without adding it here is a type error rather than a silently missing page.
 */

/** Canonical display order: roughly the order an intro course meets these ideas. */
export const TOPIC_ORDER = [
  "EarthSky",
  "Orbits",
  "LightSpectra",
  "Telescopes",
  "DataInference",
  "Stars",
  "Galaxies",
  "Cosmology"
] as const;

export type TopicKey = (typeof TOPIC_ORDER)[number];

export function isTopicKey(value: string): value is TopicKey {
  return (TOPIC_ORDER as readonly string[]).includes(value);
}

export const TOPIC_LABEL: Record<TopicKey, string> = {
  EarthSky: "Earth & Sky",
  Orbits: "Orbits",
  LightSpectra: "Light & Spectra",
  Telescopes: "Telescopes",
  DataInference: "Data & Inference",
  Stars: "Stars",
  Galaxies: "Galaxies",
  Cosmology: "Cosmology"
};

/** One line. Used on cards and in listings where space is tight. */
export const TOPIC_SUMMARY: Record<TopicKey, string> = {
  EarthSky: "Moon phases, seasons, and the view from Earth.",
  Orbits: "Kepler’s laws, retrograde motion, and gravitational dynamics.",
  LightSpectra: "Blackbody radiation, the electromagnetic spectrum, and spectral analysis.",
  Telescopes: "Resolution, diffraction, and optical design.",
  DataInference: "Statistics, measurement, and scientific reasoning.",
  Stars: "Stellar structure, evolution, and the physics of stellar interiors.",
  Galaxies: "Galaxy types, rotation, and large-scale structure.",
  Cosmology: "Expansion, dark energy, and the cosmic microwave background."
};

/** A paragraph. Used in the topic page hero, where there is room to frame the subject. */
export const TOPIC_DESCRIPTION: Record<TopicKey, string> = {
  EarthSky:
    "Moon phases, seasons, eclipses, and the geometry of what we see from Earth. These demos build intuition for how angles, distances, and illumination combine to produce the sky we observe.",
  Orbits:
    "Kepler’s laws, retrograde motion, binary systems, and gravitational dynamics. Interactive simulations that reveal how orbits shape planetary motion and timing.",
  LightSpectra:
    "Blackbody radiation, the electromagnetic spectrum, and spectral analysis. Explore how temperature, wavelength, and energy are connected through the physics of light.",
  Telescopes:
    "Resolution, diffraction, and what limits how much detail a telescope can see. Understand the relationship between aperture, wavelength, and angular resolution.",
  DataInference:
    "Statistical reasoning, measurement uncertainty, and the connection between data and physical models. Learn how astronomers extract meaning from observations.",
  Stars:
    "Stellar structure, equations of state, and the internal physics that determine how stars work. Explore the relationship between temperature, pressure, and density inside stars.",
  Galaxies:
    "Galaxy morphology, rotation curves, and large-scale structure. Investigate how galaxies are organized and what their dynamics reveal about dark matter.",
  Cosmology:
    "The expanding universe, dark energy, and the cosmic microwave background. Explore the observations and models that describe the universe on the largest scales."
};

/**
 * Suggested teaching order within a topic, by demo slug.
 *
 * Each list is a concept build, not a difficulty ramp. Slugs that do not resolve to a
 * published demo are dropped by the consumer, so an entry here for a demo that is
 * unlisted or not yet written is harmless.
 */
export const TOPIC_SEQUENCE: Record<TopicKey, readonly string[]> = {
  // Illumination geometry first, then angular measure, which is what makes the
  // eclipse coincidence (Sun and Moon subtend nearly the same angle) land.
  EarthSky: [
    "moon-phases",
    "seasons",
    "angular-size",
    "eclipse-geometry",
    "planetary-conjunctions",
    "retrograde-motion"
  ],
  // The laws, then why they hold, then two consequences of relative motion.
  Orbits: [
    "keplers-laws",
    "conservation-laws",
    "planetary-conjunctions",
    "retrograde-motion",
    "binary-orbits"
  ],
  // The ruler, the continuum, the lines, then what motion does to the lines.
  LightSpectra: ["em-spectrum", "blackbody-radiation", "spectral-lines", "doppler-shift"],
  Telescopes: ["telescope-resolution"],
  // The distance ladder's first rung, then a second observable, then an inference
  // that needs both and lands on something you cannot see.
  DataInference: ["parallax-distance", "doppler-shift", "cluster-census", "galaxy-rotation"],
  // What holds a star up, what that looks like from outside, then the microphysics.
  Stars: ["hydrostatic-equilibrium-explorer", "stars-zams-hr", "cluster-census", "eos-lab"],
  Galaxies: ["galaxy-rotation"],
  Cosmology: ["galaxy-rotation"]
};

/** Path to a topic page, relative to the site root (no base path applied). */
export function topicPath(topic: TopicKey): string {
  return `topics/${topic.toLowerCase()}/`;
}

/** Path to the explore view pre-filtered to one topic. */
export function topicFilterPath(topic: TopicKey): string {
  return `explore/?topic=${topic}`;
}
