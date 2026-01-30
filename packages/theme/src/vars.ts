export const CSS_VARS = {
  bg0: "--cp-bg0",
  bg1: "--cp-bg1",
  text: "--cp-text",
  accent: "--cp-accent",
  accent2: "--cp-accent2",
  accent3: "--cp-accent3",
  accent4: "--cp-accent4"
} as const;

export type CssVarKey = keyof typeof CSS_VARS;

