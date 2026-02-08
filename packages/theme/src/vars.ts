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

  // Celestial glows (30-50% opacity)
  glowSun: "--cp-glow-sun",
  glowMoon: "--cp-glow-moon",
  glowPlanet: "--cp-glow-planet",
  glowStar: "--cp-glow-star",
  glowAccentTeal: "--cp-glow-accent-teal",
  glowAccentRose: "--cp-glow-accent-rose",
  glowAccentViolet: "--cp-glow-accent-violet",

  // Celestial object palette
  celestialSun: "--cp-celestial-sun",
  celestialSunCore: "--cp-celestial-sun-core",
  celestialSunCorona: "--cp-celestial-sun-corona",
  celestialMoon: "--cp-celestial-moon",
  celestialMoonDark: "--cp-celestial-moon-dark",
  celestialEarth: "--cp-celestial-earth",
  celestialMars: "--cp-celestial-mars",
  celestialJupiter: "--cp-celestial-jupiter",
  celestialVenus: "--cp-celestial-venus",
  celestialSaturn: "--cp-celestial-saturn",
  celestialStar: "--cp-celestial-star",
  celestialOrbit: "--cp-celestial-orbit",

  // Instrument accents
  accentAmber: "--cp-accent-amber",
  accentGreen: "--cp-accent-green",
  accentIce: "--cp-accent-ice",
  accentRose: "--cp-accent-rose",

  // Readout typography
  readoutLabelColor: "--cp-readout-label-color",
  readoutValueColor: "--cp-readout-value-color",
  readoutValueFont: "--cp-readout-value-font",
  readoutUnitColor: "--cp-readout-unit-color",

  // Display font
  fontDisplay: "--cp-font-display",

  // Museum atmosphere
  museumNebulaOpacity: "--cp-museum-nebula-opacity",
  museumStarOpacity: "--cp-museum-star-opacity",

  // PPE phase colors
  phasePredict: "--cp-phase-predict",
  phasePlay: "--cp-phase-play",
  phaseExplain: "--cp-phase-explain",

  // Hero
  heroMinHeight: "--cp-hero-min-height",
} as const;

export type CssVarKey = keyof typeof CSS_VARS;

export const Z_INDEX = {
  dropdown: "var(--cp-z-dropdown)",
  sticky: "var(--cp-z-sticky)",
  modal: "var(--cp-z-modal)",
  tooltip: "var(--cp-z-tooltip)",
} as const;

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
} as const;

export const CHART_COLORS = {
  1: "var(--cp-chart-1)",
  2: "var(--cp-chart-2)",
  3: "var(--cp-chart-3)",
  4: "var(--cp-chart-4)",
  5: "var(--cp-chart-5)",
} as const;

export const MOTION = {
  fast: "var(--cp-transition-fast)",
  normal: "var(--cp-transition-normal)",
  slow: "var(--cp-transition-slow)",
  enter: "var(--cp-duration-enter)",
  exit: "var(--cp-duration-exit)",
  easeOut: "var(--cp-ease-out)",
  easeInOut: "var(--cp-ease-in-out)",
  easeSpring: "var(--cp-ease-spring)",
  stagger: "var(--cp-stagger)",
} as const;
