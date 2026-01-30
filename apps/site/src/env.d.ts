/// <reference path="../.astro/types.d.ts" />

declare module "katex/contrib/auto-render" {
  const renderMathInElement: (
    element: Element,
    options?: Record<string, unknown>
  ) => void;
  export default renderMathInElement;
}
