/** Maps topic enum keys to their CSS custom property names. */
export const TOPIC_CSS_VAR: Record<string, string> = {
  EarthSky: "--cp-topic-earthsky",
  Orbits: "--cp-topic-orbits",
  LightSpectra: "--cp-topic-lightspectra",
  Telescopes: "--cp-topic-telescopes",
  DataInference: "--cp-topic-datainference",
  Stars: "--cp-topic-stars",
  Galaxies: "--cp-topic-galaxies",
  Cosmology: "--cp-topic-cosmology",
};

/** Returns the CSS var() reference for a topic's color. Falls back to accent. */
export function topicColor(topic: string): string {
  const v = TOPIC_CSS_VAR[topic];
  return v ? `var(${v})` : "var(--cp-accent)";
}

/** Returns the primary topic from an array of topics. */
export function primaryTopic(topics: string[]): string {
  return topics[0] ?? "Orbits";
}
