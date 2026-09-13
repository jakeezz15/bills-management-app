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
     * Punchy categorical series for charts / statement bars.
     * Pattern: accent first, then alternate warm↔cool so neighbors pop.
     * Keep ≤8; end on a deep slate for quiet leftovers.
     */
    chart: readonly string[];
};

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
        chart: [
            palette.blue[600],
            palette.amber[500],
            palette.emerald[500],
            palette.rose[600],
            palette.cyan[500],
            palette.orange[500],
            palette.violet[500],
            palette.slate[600],
        ],
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
        chart: [
            palette.emerald[600],
            palette.amber[500],
            palette.teal[500],
            palette.orange[500],
            palette.cyan[400],
            palette.rose[600],
            palette.lime[500],
            palette.slate[600],
        ],
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
        chart: [
            palette.amber[600],
            palette.blue[600],
            palette.orange[500],
            palette.violet[600],
            palette.gold[500],
            palette.rose[600],
            palette.teal[600],
            palette.slate[600],
        ],
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
        chart: [
            palette.violet[600],
            palette.amber[500],
            palette.fuchsia[500],
            palette.cyan[500],
            palette.rose[500],
            palette.green[500],
            palette.indigo[500],
            palette.slate[600],
        ],
    },
] as const;

export function isAccentId(value: string): value is AccentId {
    return (ACCENT_IDS as readonly string[]).includes(value);
}

export function getAccentPreset(id: AccentId): AccentPreset {
    const found = ACCENT_PRESETS.find((preset) => preset.id === id);
    return found ?? ACCENT_PRESETS[0];
}
