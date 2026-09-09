import { palette } from "./palette";

/**
 * Semantic design tokens. Components ask for a *role* ("surface", "danger
 * text") rather than a hue, which is what makes a theme swap possible.
 *
 * Colours are grouped per scheme so a dark palette can be added later without
 * touching call sites; `theme` currently resolves to the light scheme.
 */

type ColorScheme = typeof light;

const light = {
    bg: {
        /** App background behind all content. */
        canvas: palette.slate[100],
        /** Cards, rows, grouped lists. */
        surface: palette.white,
        /** Recessed areas: inputs, completed rows, segment tracks. */
        sunken: palette.slate[50],
        /** Dark band: hero, mastheads, dialog headers. */
        inverse: palette.slate[900],
        /** Raised element sitting on `bg.inverse`. */
        inverseRaised: palette.slate[800],
    },
    text: {
        primary: palette.slate[900],
        secondary: palette.slate[500],
        tertiary: palette.slate[400],
        disabled: palette.slate[300],
        /** On `bg.inverse`. */
        inverse: palette.white,
        inverseSecondary: palette.slate[300],
        inverseTertiary: palette.slate[400],
        /** Links and quiet accent labels. */
        accent: palette.blue[700],
    },
    border: {
        /** Hairlines between rows in the same group. */
        subtle: palette.slate[200],
        /** Card and input outlines. */
        base: palette.slate[300],
        focus: palette.blue[600],
        inverse: palette.slate[800],
    },
    /** Status meaning. `fg` is text/icon, `bg` is the soft fill behind it. */
    intent: {
        positive: {
            fg: palette.emerald[700],
            bg: palette.emerald[50],
            solid: palette.emerald[600],
            bright: palette.emerald[400],
            strong: palette.emerald[100],
        },
        negative: {
            fg: palette.red[600],
            bg: palette.red[50],
            solid: palette.red[600],
        },
        caution: {
            fg: palette.amber[700],
            bg: palette.amber[50],
            solid: palette.amber[600],
        },
        info: {
            fg: palette.blue[700],
            bg: palette.blue[50],
            solid: palette.blue[600],
        },
    },
    /** Interactive surfaces. One accent owns every primary action. */
    action: {
        primary: { bg: palette.blue[600], fg: palette.white },
        secondary: { bg: palette.slate[100], fg: palette.slate[900] },
        danger: { bg: palette.red[600], fg: palette.white },
        disabled: { bg: palette.slate[200], fg: palette.slate[400] },
        /** Control fill on a dark band. */
        onInverse: { bg: "rgba(255, 255, 255, 0.12)", fg: palette.white },
    },
    /** Neutral progress/meter track. */
    track: {
        base: palette.slate[200],
        inverse: palette.slate[800],
    },
    overlay: "rgba(15, 23, 42, 0.55)",
    /** Categorical series for charts and ledger accents. */
    chart: [
        palette.blue[600],
        palette.emerald[600],
        palette.amber[600],
        palette.violet[600],
        palette.pink[600],
        palette.cyan[600],
        palette.orange[600],
        palette.slate[500],
    ],
} as const;

export const schemes: { light: ColorScheme } = { light };

/** 8px spacing scale. `xs` is only for icon-to-label and badge padding. */
const space = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    screenX: 16,
    screenTop: 48,
} as const;

const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
} as const;

/** Seven steps. Anything outside this belongs in the scale, not the component. */
const fontSize = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    display: 32,
    hero: 40,
} as const;

const lineHeight = {
    xs: 16,
    sm: 20,
    md: 20,
    lg: 24,
    xl: 28,
    display: 36,
    hero: 44,
} as const;

const fontWeight = {
    regular: "500",
    semibold: "600",
    bold: "700",
} as const;

const size = {
    /** Minimum accessible touch target. */
    tap: 44,
    control: 32,
    fab: 56,
    bar: 8,
    /** Caps line length on tablets and web. */
    readable: 720,
} as const;

export const theme = {
    ...light,
    space,
    radius,
    fontSize,
    lineHeight,
    fontWeight,
    size,
} as const;

export type Theme = typeof theme;
