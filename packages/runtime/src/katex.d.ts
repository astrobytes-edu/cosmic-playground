declare module "katex" {
  const katex: unknown;
  export default katex;
}

declare module "katex/contrib/auto-render" {
  type Delimiter = { left: string; right: string; display: boolean };
  type RenderMathInElementOptions = {
    delimiters?: Delimiter[];
    ignoredTags?: string[];
    throwOnError?: boolean;
    katex?: unknown;
  };

  const renderMathInElement: (root: Element, options?: RenderMathInElementOptions) => void;
  export default renderMathInElement;
}
