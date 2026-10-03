import { palette } from "./palette";

/**
 * Accent presets for Settings → Appearance.
 * Full “look” presets later can wrap buildTheme with a lookId; accents stay here.
 */

export const DEFAULT_ACCENT_ID = "blue" as const;

export const ACCENT_IDS = ["blue", "emerald", "amber", "violet"] as const;

export type AccentId = (typeof ACCENT_IDS)[number];

export type AccentRamp = {
    50: string;
    600: string;
    700: string;
};

export type AccentPreset = {
    id: AccentId;
    label: string;
    /** Swatch shown in Settings. */
    swatch: string;
    ramp: AccentRamp;
    /**
     * Categorical series for spend-by-category (and similar) only — not P&L.
     * Avoids green/red/rose so slices are not read as income or expense.
     */
    chart: readonly string[];
};

/** Hues safe for multi-series charts (no profit/loss green or red). */
const CATEGORICAL_POOL: readonly string[] = [
    palette.blue[600],
    palette.violet[600],
    palette.amber[500],
    palette.cyan[500],
    palette.orange[500],
    palette.teal[600],
    palette.indigo[500],
    palette.gold[500],
    palette.fuchsia[500],
];

function buildCategoricalChart(
    accentId: AccentId,
    swatch: string
): readonly string[] {
    /** Emerald accent keeps green primary UI but must not tint category series like income. */
    const lead = accentId === "emerald" ? palette.blue[600] : swatch;
    const rest = CATEGORICAL_POOL.filter((color) => color !== lead).slice(0, 7);
    return [lead, ...rest, palette.slate[600]];
}

export const ACCENT_PRESETS: readonly AccentPreset[] = [
    {
        id: "blue",
        label: "Blue",
        swatch: palette.blue[600],
        ramp: {
            50: palette.blue[50],
            600: palette.blue[600],
            700: palette.blue[700],
        },
        chart: buildCategoricalChart("blue", palette.blue[600]),
    },
    {
        id: "emerald",
        label: "Emerald",
        swatch: palette.emerald[600],
        ramp: {
            50: palette.emerald[50],
            600: palette.emerald[600],
            700: palette.emerald[700],
        },
        chart: buildCategoricalChart("emerald", palette.emerald[600]),
    },
    {
        id: "amber",
        label: "Amber",
        swatch: palette.amber[600],
        ramp: {
            50: palette.amber[50],
            600: palette.amber[600],
            700: palette.amber[700],
        },
        chart: buildCategoricalChart("amber", palette.amber[600]),
    },
    {
        id: "violet",
        label: "Violet",
        swatch: palette.violet[600],
        ramp: {
            50: palette.violet[50],
            600: palette.violet[600],
            700: palette.violet[700],
        },
        chart: buildCategoricalChart("violet", palette.violet[600]),
    },
] as const;

export function isAccentId(value: string): value is AccentId {
    return (ACCENT_IDS as readonly string[]).includes(value);
}

export function getAccentPreset(id: AccentId): AccentPreset {
    const found = ACCENT_PRESETS.find((preset) => preset.id === id);
    return found ?? ACCENT_PRESETS[0];
}
