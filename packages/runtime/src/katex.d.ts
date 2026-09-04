// KaTeX ships its own declarations for the main entry point (`katex/types/katex.d.ts`),
// so we must NOT declare `module "katex"` here — an ambient declaration shadows the real
// types and degrades the default export to `unknown`.
//
// Only the `contrib/auto-render` subpath is untyped upstream, so that is all we declare.

declare module "katex/contrib/auto-render" {
  import type { KatexOptions } from "katex";

  type Delimiter = { left: string; right: string; display: boolean };

  type RenderMathInElementOptions = KatexOptions & {
    delimiters?: Delimiter[];
    ignoredTags?: string[];
    ignoredClasses?: string[];
    errorCallback?: (message: string, error: unknown) => void;
    katex?: typeof import("katex").default;
  };

  const renderMathInElement: (root: Element, options?: RenderMathInElementOptions) => void;
  export default renderMathInElement;
}
