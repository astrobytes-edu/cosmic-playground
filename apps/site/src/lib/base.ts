/**
 * One base-path helper, defined once.
 *
 * GitHub Pages serves this site under a repository sub-path, so every internal href and
 * asset URL has to be prefixed with `import.meta.env.BASE_URL`. That four-line prefixing
 * rule had been retyped as a local `const withBase` in eleven pages plus the layout, and
 * called through `normalizeBasePathPath` in three more -- fourteen copies of one rule, so
 * a change to it (a trailing-slash case, an anchor, a query string) could only ever be
 * applied partially. The pure two-argument form stays exported because it is the testable
 * one; `withBase` is the form pages actually want.
 */

export function normalizeBasePathPath(path: string, base: string): string {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

/** `withBase("explore/")` -> the deployed base path plus `explore/`. Use this in pages. */
export function withBase(path: string): string {
  return normalizeBasePathPath(path, import.meta.env.BASE_URL);
}
