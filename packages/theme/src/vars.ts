export const CSS_VARS = {
  // Backgrounds
  bg0: "--cp-bg0",
  bg1: "--cp-bg1",
  bg2: "--cp-bg2",
  bg3: "--cp-bg3",

  // Text
  text: "--cp-text",
  text2: "--cp-text2",
  muted: "--cp-muted",
  faint: "--cp-faint",

  // Borders
  border: "--cp-border",
  borderSubtle: "--cp-border-subtle",

  // Accents
  accent: "--cp-accent",
  accentHover: "--cp-accent-hover",
  pink: "--cp-pink",
  pinkHover: "--cp-pink-hover",
  violet: "--cp-violet",
  violetHover: "--cp-violet-hover",

  // Legacy aliases
  accent2: "--cp-accent2",
  accent3: "--cp-accent3",
  accent4: "--cp-accent4",

  // Glows
  glowTeal: "--cp-glow-teal",
  glowPink: "--cp-glow-pink",
  glowViolet: "--cp-glow-violet",

  // Focus
  focus: "--cp-focus",
  selectionBg: "--cp-selection-bg",
} as const;

export type CssVarKey = keyof typeof CSS_VARS;
