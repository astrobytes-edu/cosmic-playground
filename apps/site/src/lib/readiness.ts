/**
 * One readiness vocabulary, defined once.
 *
 * Demo frontmatter carries THREE overlapping claims about the same thing: `status`
 * (stable/beta/draft), `readiness` (stub/experimental/candidate/launch-ready) and
 * `content_verified`. Across the 19 listed demos on 2026-09-09 only four combinations
 * occurred, and 14 of them read "draft" and "experimental" and "verified: true" at the
 * same time. Cards and exhibit pages showed two of the three, so a reader met two hedges
 * on a demo whose own frontmatter said its content had been checked -- and the two badges
 * together carried barely more information than either alone.
 *
 * `readiness` is the one kept on the page: it has four levels rather than three, it splits
 * the catalogue better (15 experimental / 4 candidate, against status's 18 draft / 1 beta),
 * and its vocabulary says what a reader actually wants to know -- can I put this in front
 * of a class. `status` stays in the schema and still drives nothing visible.
 *
 * The badge is deliberately ABSENT at launch-ready. A finished exhibit should look
 * finished; a badge on every card is wallpaper, and wallpaper is not a warning.
 */

export type Readiness = "stub" | "experimental" | "candidate" | "launch-ready";

export type TagPillTone =
  | "default"
  | "teal"
  | "violet"
  | "blue"
  | "magenta"
  | "status-draft"
  | "status-beta";

export interface ReadinessBadge {
  label: string;
  tone: TagPillTone;
  /** What the level means, for the badge's accessible name. */
  ariaLabel: string;
}

const BADGES: Record<Exclude<Readiness, "launch-ready">, ReadinessBadge> = {
  stub: {
    label: "stub",
    tone: "status-draft",
    ariaLabel: "Readiness: stub -- placeholder, not ready to assign"
  },
  experimental: {
    label: "experimental",
    tone: "status-draft",
    ariaLabel: "Readiness: experimental -- usable, still being revised"
  },
  candidate: {
    label: "near-ready",
    tone: "status-beta",
    ariaLabel: "Readiness: candidate -- ready to assign, pending final review"
  }
};

/** The badge to render, or null when the exhibit is finished and needs no caveat. */
export function readinessBadge(readiness: Readiness): ReadinessBadge | null {
  return readiness === "launch-ready" ? null : BADGES[readiness];
}

/** Most-ready first. Drives Explore's "Recommended" order and the readiness filter. */
export const READINESS_ORDER: readonly Readiness[] = [
  "launch-ready",
  "candidate",
  "experimental",
  "stub"
];

export function readinessRank(readiness: string): number {
  const index = READINESS_ORDER.indexOf(readiness as Readiness);
  return index === -1 ? READINESS_ORDER.length : index;
}
