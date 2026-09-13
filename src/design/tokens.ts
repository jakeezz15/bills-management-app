import {
    DEFAULT_ACCENT_ID,
    getAccentPreset,
    type AccentId,
} from "./accents";
import { palette } from "./palette";

/**
 * Semantic design tokens. Components ask for a *role* ("surface", "danger
 * text") rather than a hue, which is what makes a theme swap possible.
 *
 * Build themes with `buildTheme(accentId)`. Neutrals (slate canvas/surface)
 * can stay on the static default export longer; **accent-facing color roles**
 * (`action.primary`, `text.accent`, `border.focus`, `intent.info`, chart[0])
 * should go through `useTheme()` / style factories so Settings can change them
 * live. Full look presets later = extend `buildTheme` (lookId + accentId).
 */

const space = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    screenX: 16,
} as const;

const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
} as const;

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
    tap: 44,
    control: 32,
    fab: 56,
    bar: 8,
    readable: 720,
} as const;

export function buildTheme(accentId: AccentId = DEFAULT_ACCENT_ID) {
    const { ramp, chart } = getAccentPreset(accentId);

    return {
        accentId,
        bg: {
            canvas: palette.slate[100],
            surface: palette.white,
            sunken: palette.slate[50],
            inverse: palette.slate[900],
            inverseRaised: palette.slate[800],
        },
        text: {
            primary: palette.slate[900],
            secondary: palette.slate[500],
            tertiary: palette.slate[400],
            disabled: palette.slate[300],
            inverse: palette.white,
            inverseSecondary: palette.slate[300],
            inverseTertiary: palette.slate[400],
            accent: ramp[700],
        },
        border: {
            subtle: palette.slate[200],
            base: palette.slate[300],
            focus: ramp[600],
            inverse: palette.slate[800],
        },
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
                fg: ramp[700],
                bg: ramp[50],
                solid: ramp[600],
            },
        },
        action: {
            primary: { bg: ramp[600], fg: palette.white },
            secondary: { bg: palette.slate[100], fg: palette.slate[900] },
            danger: { bg: palette.red[600], fg: palette.white },
            disabled: { bg: palette.slate[200], fg: palette.slate[400] },
            onInverse: { bg: "rgba(255, 255, 255, 0.12)", fg: palette.white },
        },
        track: {
            base: palette.slate[200],
            inverse: palette.slate[800],
        },
        overlay: "rgba(15, 23, 42, 0.55)",
        chart: [...chart],
        /** Third-party marks (Welcome Google button). */
        brand: {
            google: palette.google.red,
        },
        space,
        radius,
        fontSize,
        lineHeight,
        fontWeight,
        size,
    } as const;
}

export type Theme = ReturnType<typeof buildTheme>;

/** Default blue theme — safe for static imports that only need neutrals. */
export const theme = buildTheme(DEFAULT_ACCENT_ID);

export const schemes = {
    light: theme,
} as const;

export { DEFAULT_ACCENT_ID };
export type { AccentId };
