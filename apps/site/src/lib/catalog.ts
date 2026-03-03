import type { CollectionEntry } from "astro:content";

export type DemoEntry = CollectionEntry<"demos">;
export type PlaylistEntry = CollectionEntry<"playlists">;

export function normalizeBasePathPath(path: string, base: string): string {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

export function demoKeyIdea(entry: DemoEntry): string {
  // TODO(content): populate `short_key_idea` in demo frontmatter for richer card summaries.
  return entry.data.short_key_idea ?? entry.data.learning_goals[0] ?? "\u2014";
}

export type DemoTimeBucket = "lt10" | "10to20" | "gt20";

export function demoTimeBucket(minutes: number): DemoTimeBucket {
  if (minutes <= 10) return "lt10";
  if (minutes <= 20) return "10to20";
  return "gt20";
}

export function parseIsoDate(isoDate: string): number {
  const t = Date.parse(isoDate);
  return Number.isNaN(t) ? 0 : t;
}

export function isRecentlyUpdated(
  isoDate: string,
  now: Date = new Date(),
  windowDays = 30
): boolean {
  const updatedAt = parseIsoDate(isoDate);
  if (!updatedAt) return false;
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  return now.getTime() - updatedAt <= windowMs;
}

const levelRank: Record<string, number> = {
  ASTR101: 0,
  Both: 1,
  ASTR201: 2
};

export function demoLevelRank(levels: readonly string[]): number {
  if (levels.length === 0) return 99;
  return Math.min(...levels.map((level) => levelRank[level] ?? 99));
}

export function hasAstr101Level(levels: readonly string[]): boolean {
  return levels.includes("ASTR101") || levels.includes("Both");
}

export function hasStationPath(entry: DemoEntry): boolean {
  return entry.data.station_path.trim().length > 0;
}

export function hasNoMathMode(entry: DemoEntry): boolean {
  return entry.data.has_math_mode === false;
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
