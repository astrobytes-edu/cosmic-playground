/**
 * One navigation vocabulary, defined once.
 *
 * The header nav, the footer nav and the mobile nav were three hand-written lists with
 * three different link sets: the footer carried Station cards and Glossary that the header
 * did not, and nothing tied either to the routes that actually exist. A link added to one
 * list silently did not appear in the others, which is how `/instructor/` and `/welcome/`
 * ended up reachable from no nav at all.
 *
 * `href` is base-path-relative (no leading slash): pass it through `withBase` from
 * ./base at the point of use.
 */

export interface NavLink {
  /** Base-relative, with a trailing slash, e.g. `"explore/"`. */
  href: string;
  label: string;
}

/** The header and mobile nav. Kept to five: these are the whole-site entry points. */
export const PRIMARY_NAV: readonly NavLink[] = [
  { href: "explore/", label: "Explore" },
  { href: "topics/", label: "Topics" },
  { href: "playlists/", label: "Playlists" },
  { href: "for-instructors/", label: "For Instructors" },
  { href: "about/", label: "About" }
];

/**
 * The footer, which may be longer than the header: it is where the secondary indexes
 * (station cards, instructor notes, glossary) are reachable from every page.
 */
export const FOOTER_NAV: readonly NavLink[] = [
  { href: "explore/", label: "Explore" },
  { href: "topics/", label: "Topics" },
  { href: "playlists/", label: "Playlists" },
  { href: "stations/", label: "Station cards" },
  { href: "instructor/", label: "Instructor notes" },
  { href: "glossary/", label: "Glossary" },
  { href: "for-instructors/", label: "For instructors" },
  { href: "about/", label: "About" }
];
