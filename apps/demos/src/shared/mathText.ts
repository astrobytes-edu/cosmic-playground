import { renderInlineKatex } from "@cosmic/runtime";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeDelimitedMath(source: string): {
  latex: string;
  displayMode: boolean;
} {
  if (source.startsWith("$$") && source.endsWith("$$")) {
    return {
      latex: source.slice(2, -2),
      displayMode: true
    };
  }

  if (source.startsWith("$") && source.endsWith("$")) {
    return {
      latex: source.slice(1, -1),
      displayMode: false
    };
  }

  return {
    latex: source,
    displayMode: false
  };
}

function renderDelimitedMath(source: string): string {
  const { latex } = normalizeDelimitedMath(source);
  return renderInlineKatex(latex);
}

const INLINE_MATH_RE = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;

export function renderMathText(source: string): string {
  if (!source) return "";

  let html = "";
  let lastIndex = 0;

  for (const match of source.matchAll(INLINE_MATH_RE)) {
    const token = match[0];
    const index = match.index ?? 0;
    html += escapeHtml(source.slice(lastIndex, index));
    html += renderDelimitedMath(token);
    lastIndex = index + token.length;
  }

  html += escapeHtml(source.slice(lastIndex));
  return html;
}

const renderedSource = new WeakMap<object, string>();

/**
 * Typeset `source` into `el`, skipping KaTeX when the source has not changed since the last
 * call. Readouts are refreshed from render(), which several demos run every animation frame,
 * and the string is usually identical frame to frame. The element must be owned by this
 * helper: anything else that writes its content leaves the cache stale.
 */
export function setMathText(el: Pick<Element, "innerHTML">, source: string): void {
  if (renderedSource.get(el) === source) return;
  el.innerHTML = renderMathText(source);
  renderedSource.set(el, source);
}
