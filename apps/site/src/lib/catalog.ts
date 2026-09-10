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

export function normalizeBasePathPath(path: string, base: string): string {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

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
