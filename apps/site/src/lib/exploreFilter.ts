/**
 * Explore filtering, evaluated in the browser.
 *
 * The site builds with `output: "static"`, so `Astro.url.searchParams` in a page's
 * frontmatter is read once at BUILD time, when every parameter is empty. The Explore
 * page did exactly that for all eight of its filter axes, which meant the whole
 * apparatus was inert in production: submitting the filter form navigated to
 * `/explore/?topic=Orbits`, the server returned the one prerendered `explore/index.html`,
 * and the reader saw the unfiltered catalogue with the select snapped back to "All".
 *
 * These functions are pure so the same rules drive the DOM script and can be asserted
 * directly. `now` is a parameter rather than a `new Date()` call for the same reason it
 * has to be evaluated client-side at all: "recently updated" is relative to when someone
 * LOOKS at the page, not to when the site was built.
 */

export const FILTER_KEYS = ["q", "topic", "level", "time", "status", "math", "quick", "sort"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type Filters = Record<FilterKey, string>;

/** Axes that narrow the catalogue. `sort` reorders it and is deliberately not here. */
export const NARROWING_KEYS = ["q", "topic", "level", "time", "status", "math", "quick"] as const;
export type NarrowingKey = (typeof NARROWING_KEYS)[number];

export type TimeBucket = "lt10" | "10to20" | "gt20";

/*
 * Two chips, not five. The three that went were measured against the 19-demo catalogue on
 * 2026-09-09 and could not earn their place:
 *
 *   labs    matched 19 of 19 -- every demo ships a Station-mode lab, so it narrowed nothing
 *   lt10    identical to the Time budget select's "<=10 min", to the demo
 *   noMath  identical to Math required = No, and 18 of 19 either way
 *
 * A control that cannot change the result is worse than absent: it invites a click, does
 * nothing, and teaches the reader that the filters are decorative. The two survivors do
 * something the selects cannot -- `astr101` is the one-click answer to the question most
 * readers of this site arrive with, and `updated` is the only axis over `last_updated`.
 */
export const QUICK_FILTER_KEYS = ["astr101", "updated"] as const;
export type QuickFilterKey = (typeof QUICK_FILTER_KEYS)[number];

export function isQuickFilterKey(value: string): value is QuickFilterKey {
  return (QUICK_FILTER_KEYS as readonly string[]).includes(value);
}

export interface DemoFacets {
  slug: string;
  topics: string[];
  levels: string[];
  timeMinutes: number;
  status: string;
  hasMath: boolean;
  /** ISO date, as authored in the demo's frontmatter. */
  updated: string;
  /** Title + tags + learning goals, pre-lowercased. */
  search: string;
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  topic: "",
  level: "",
  time: "",
  status: "",
  math: "",
  quick: "",
  sort: "recommended"
};

export function timeBucket(minutes: number): TimeBucket {
  if (minutes <= 10) return "lt10";
  if (minutes <= 20) return "10to20";
  return "gt20";
}

/**
 * A demo tagged `Both` is suitable for either course, so it must match a request for
 * either one. The select used to compare the raw tag, so choosing "ASTR101" matched only
 * the single demo literally tagged ASTR101 and hid the 16 tagged Both -- while the
 * "ASTR 101" quick chip beside it used the union and returned 17. Two controls, one
 * meaning, answers differing by 16 demos.
 */
export function matchesLevel(levels: readonly string[], level: string): boolean {
  if (!level) return true;
  return levels.includes(level) || levels.includes("Both");
}

export function isRecent(isoDate: string, now: Date, windowDays = 30): boolean {
  const updatedAt = Date.parse(isoDate);
  if (Number.isNaN(updatedAt)) return false;
  return now.getTime() - updatedAt <= windowDays * 24 * 60 * 60 * 1000;
}

export function matchesQuick(demo: DemoFacets, quick: string, now: Date): boolean {
  if (quick === "astr101") return matchesLevel(demo.levels, "ASTR101");
  if (quick === "updated") return isRecent(demo.updated, now);
  return true;
}

/** One axis in isolation. Faceting needs to ask about a single axis, so this is the unit. */
export function matchesAxis(demo: DemoFacets, key: NarrowingKey, value: string, now: Date): boolean {
  if (!value) return true;
  switch (key) {
    case "q":
      return demo.search.includes(value.toLowerCase().trim());
    case "topic":
      return demo.topics.includes(value);
    case "level":
      return matchesLevel(demo.levels, value);
    case "time":
      return timeBucket(demo.timeMinutes) === value;
    case "status":
      return demo.status === value;
    case "math":
      return demo.hasMath === (value === "yes");
    case "quick":
      return matchesQuick(demo, value, now);
  }
}

export function matches(demo: DemoFacets, filters: Filters, now: Date): boolean {
  return NARROWING_KEYS.every((key) => matchesAxis(demo, key, filters[key], now));
}

export function hasNarrowingFilter(filters: Filters): boolean {
  return NARROWING_KEYS.some((key) => filters[key] !== "");
}

/**
 * How many demos an option would yield if you picked it, with every OTHER axis left as
 * it is. Showing these in the control is what stops a filter from quietly lying: the
 * catalogue currently has zero demos over 20 minutes, so "20+ min" can only ever produce
 * an empty state, and a count of 0 says so before the reader spends a click finding out.
 */
export function facetCount(
  demos: readonly DemoFacets[],
  filters: Filters,
  key: NarrowingKey,
  value: string,
  now: Date
): number {
  const others = NARROWING_KEYS.filter((k) => k !== key);
  return demos.filter(
    (demo) =>
      matchesAxis(demo, key, value, now) &&
      others.every((k) => matchesAxis(demo, k, filters[k], now))
  ).length;
}

export function readFilters(search: string): Filters {
  const params = new URLSearchParams(search);
  const read = (key: FilterKey) => params.get(key)?.trim() ?? "";
  return {
    q: read("q"),
    topic: read("topic"),
    level: read("level"),
    time: read("time"),
    status: read("status"),
    math: read("math"),
    /*
     * A `?quick=labs` bookmark from before the trim would otherwise render a chip with no
     * matching control, no label and no effect. Unknown values are dropped on read.
     */
    quick: isQuickFilterKey(read("quick")) ? read("quick") : "",
    sort: read("sort") || "recommended"
  };
}

/** Only non-default values reach the URL, so a shared link carries no noise. */
export function toSearchParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (!value) continue;
    if (key === "sort" && value === "recommended") continue;
    params.set(key, value);
  }
  return params;
}

const STATUS_RANK: Record<string, number> = { stable: 0, beta: 1, draft: 2 };
const LEVEL_RANK: Record<string, number> = { ASTR101: 0, Both: 1, ASTR201: 2 };

export function levelRank(levels: readonly string[]): number {
  if (levels.length === 0) return 99;
  return Math.min(...levels.map((level) => LEVEL_RANK[level] ?? 99));
}

export function compareDemos(a: DemoFacets, b: DemoFacets, sort: string): number {
  if (sort === "duration") return a.timeMinutes - b.timeMinutes || a.slug.localeCompare(b.slug);
  if (sort === "level") return levelRank(a.levels) - levelRank(b.levels) || a.slug.localeCompare(b.slug);
  if (sort === "updated") return Date.parse(b.updated) - Date.parse(a.updated) || a.slug.localeCompare(b.slug);
  return (
    (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99) ||
    Date.parse(b.updated) - Date.parse(a.updated) ||
    a.slug.localeCompare(b.slug)
  );
}
