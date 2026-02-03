export type DemoGlyphName =
  | "orbit"
  | "sightline"
  | "angle"
  | "horizon"
  | "wave"
  | "axes"
  | "scale"
  | "motion"
  | "sparkles"
  | "featured"
  | "instructor"
  | "notes"
  | "lab";

const keyword = (slug: string, title: string) => `${slug} ${title}`.toLowerCase();

export function pickDemoGlyph(
  topics: string[],
  slug: string,
  title: string
): DemoGlyphName {
  const key = keyword(slug, title);

  if (key.includes("retrograde")) return "motion";
  if (key.includes("binary")) return "orbit";
  if (key.includes("kepler")) return "orbit";
  if (key.includes("angular")) return "angle";
  if (key.includes("eclipse")) return "angle";
  if (key.includes("parallax")) return "sightline";
  if (key.includes("telescope")) return "sightline";
  if (key.includes("spectrum") || key.includes("radiation")) return "wave";

  if (topics.includes("LightSpectra")) return "wave";
  if (topics.includes("Telescopes")) return "sightline";
  if (topics.includes("DataInference")) return "axes";
  if (topics.includes("Orbits")) return "orbit";
  if (topics.includes("EarthSky")) return "horizon";
  if (topics.includes("Stars")) return "scale";
  if (topics.includes("Galaxies")) return "scale";
  if (topics.includes("Cosmology")) return "scale";

  return "sparkles";
}
