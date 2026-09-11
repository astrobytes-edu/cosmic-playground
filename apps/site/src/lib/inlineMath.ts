import katex from "katex";

/**
 * Render `$...$` spans in a plain content string, at build time.
 *
 * Demo frontmatter is authored with TeX in it, and outside the demos nothing rendered it:
 * the exhibit page prints `predict_prompt` straight into a `<p>`, so binary-orbits has
 * been showing a literal "When $M_2/M_1$ decreases..." on a public page. Measured
 * 2026-09-10, 2 of the 19 listed demos carry math in that field; `learning_goals` carries
 * none, which is why the card's key-idea line needs no help.
 *
 * Server-side rather than client-side because the site's rule is static and fast -- the
 * KaTeX stylesheet and fonts are already copied in by `copy-katex-assets.mjs`, so the
 * markup this produces is styled with no script at all.
 *
 * The escaping matters: everything OUTSIDE the delimiters is content, and goes through
 * `escapeHtml` before being concatenated with KaTeX's own (already safe) output.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderInlineMath(text: string): string {
  if (!text.includes("$")) return escapeHtml(text);

  // Split on `$...$`, keeping the delimited pieces. Non-greedy so adjacent spans do not
  // swallow the text between them; a lone unmatched `$` falls through as literal text.
  const parts = text.split(/(\$[^$]+\$)/g);
  return parts
    .map((part) => {
      if (part.length > 2 && part.startsWith("$") && part.endsWith("$")) {
        try {
          return katex.renderToString(part.slice(1, -1), {
            throwOnError: false,
            displayMode: false,
            output: "html"
          });
        } catch {
          // A malformed expression should degrade to its source, never break the page.
          return escapeHtml(part);
        }
      }
      return escapeHtml(part);
    })
    .join("");
}

/** True when the string carries any TeX, for callers that want to skip the work. */
export function hasInlineMath(text: string): boolean {
  return /\$[^$]+\$/.test(text);
}
