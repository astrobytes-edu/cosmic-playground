/// <reference path="./katex.d.ts" />

import katex from "katex";
import renderMathInElement from "katex/contrib/auto-render";
export {
  EPS,
  clamp,
  findRootBisection,
  findRootNewton,
  integrateSimpson,
  integrateSimpsonSamples,
  integrateTrapz,
  interp1,
  logspace,
  linspace
} from "@cosmic/math";

const DEFAULT_IGNORED_TAGS = [
  "script",
  "noscript",
  "style",
  "textarea",
  "pre",
  "code"
] as const;

export function renderMath(root: Element): void {
  if (typeof window === "undefined") return;
  renderMathInElement(root, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false }
    ],
    ignoredTags: [...DEFAULT_IGNORED_TAGS],
    throwOnError: false,
    katex
  });
}

export function initMath(root: Document | Element = document): void {
  if (typeof window === "undefined") return;
  const el = root instanceof Document ? root.body : root;
  if (!el) return;
  renderMath(el);
}
