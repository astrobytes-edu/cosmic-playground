import type { CollectionEntry } from "astro:content";

export type DemoEntry = CollectionEntry<"demos">;
export type PlaylistEntry = CollectionEntry<"playlists">;

/*
 * Six helpers were removed from here on 2026-09-09: demoTimeBucket, isRecentlyUpdated,
 * demoLevelRank, hasAstr101Level, hasStationPath and hasNoMathMode. They existed only to
 * serve Explore's build-time filter chain, which could never run (the page is prerendered,
 * so its `Astro.url.searchParams` reads were always empty). Filtering moved to
 * `exploreFilter.ts`, which owns the same vocabulary and evaluates it in the browser --
 * and got the ASTR101/Both union right where the page's inline comparison had not. Two
 * copies of filter semantics, one of them unreachable, is how the two drifted apart in the
 * first place, so the unreachable one is gone rather than kept "in case".
 */

/**
 * Demos that belong in catalogue listings.
 *
 * Every listing surface (home, explore, topics, stations, instructor) must go through
 * this rather than using `getCollection("demos")` directly, so that unlisting a demo is
 * one frontmatter edit instead of fifteen. Detail routes deliberately do NOT filter:
 * an unlisted demo keeps its exhibit, station and play pages so shared links survive.
 */
export function listedDemos(demos: readonly DemoEntry[]): DemoEntry[] {
  return demos.filter((entry) => !entry.data.unlisted);
}

/** How many of `demos` ship each mode, from the frontmatter `modes` list that the build checks against the demo source. */
export function demoModeCounts(demos: readonly DemoEntry[]) {
  const withMode = (mode: DemoEntry["data"]["modes"][number]) =>
    demos.filter((entry) => entry.data.modes.includes(mode)).length;
  return {
    total: demos.length,
    station: withMode("station"),
    challenge: withMode("challenge"),
    exporting: withMode("export")
  };
}

export function demoKeyIdea(entry: DemoEntry): string {
  // TODO(content): populate `short_key_idea` in demo frontmatter for richer card summaries.
  return entry.data.short_key_idea ?? entry.data.learning_goals[0] ?? "\u2014";
}

export function parseIsoDate(isoDate: string): number {
  const t = Date.parse(isoDate);
  return Number.isNaN(t) ? 0 : t;
}

export function playlistMembershipMap(
  playlists: readonly PlaylistEntry[]
): Map<string, number> {
  const memberships = new Map<string, number>();
  for (const playlist of playlists) {
    for (const item of playlist.data.demos) {
      memberships.set(item.slug, (memberships.get(item.slug) ?? 0) + 1);
    }
  }
  return memberships;
}

/**
 * The one-line card description, taken from the exhibit body's first prose line.
 *
 * Two identical copies of this lived in explore/index.astro and topics/[slug].astro, and
 * both sliced the line at exactly 140 characters with no regard for where that landed.
 * Demo bodies are authored with inline TeX, so the cut fell inside a `$...$` span and the
 * card printed raw LaTeX at a reader: the conservation-laws card ended "...then press
 * Escape ($\sqrt{2" and eclipse-geometry ended "$|\be". Cutting on a word boundary and
 * then dropping any span left unbalanced by the cut makes the result always renderable,
 * and `renderInlineMath` in DemoCard typesets what survives.
 */
export function excerptFromBody(body: string, limit = 140): string {
  const firstLine = body
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith("---"));
  if (!firstLine) return "\u2014";

  const line = firstLine.replace(/^#+\s*/, "");
  if (line.length <= limit) return line;

  // Back the cut off to the last word boundary rather than mid-word.
  const cut = line.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  let text = lastSpace > limit * 0.5 ? cut.slice(0, lastSpace) : cut;

  // An odd number of `$` means the cut fell inside a math span: drop the opener too.
  const dollars = (text.match(/\$/g) ?? []).length;
  if (dollars % 2 === 1) {
    text = text.slice(0, text.lastIndexOf("$"));
  }

  return `${text.replace(/[\s,;:.\u2014-]+$/, "")}\u2026`;
}
