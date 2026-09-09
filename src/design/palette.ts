/**
 * Raw colour ramps. Nothing outside `src/design/tokens.ts` may import this —
 * screens and components consume semantic roles instead, so a hue can change
 * in one place without a find-and-replace across the app.
 */
export const palette = {
    slate: {
        50: "#F8FAFC",
        100: "#F1F5F9",
        200: "#E2E8F0",
        300: "#CBD5E1",
        400: "#94A3B8",
        500: "#64748B",
        600: "#475569",
        700: "#334155",
        800: "#1E293B",
        900: "#0F172A",
    },
    blue: {
        50: "#EFF6FF",
        100: "#DBEAFE",
        200: "#BFDBFE",
        500: "#3B82F6",
        600: "#2563EB",
        700: "#1D4ED8",
    },
    emerald: {
        50: "#ECFDF5",
        100: "#D1FAE5",
        400: "#34D399",
        600: "#059669",
        700: "#047857",
    },
    amber: {
        50: "#FFFBEB",
        100: "#FEF3C7",
        600: "#D97706",
        700: "#B45309",
    },
    red: {
        50: "#FEF2F2",
        100: "#FEE2E2",
        600: "#DC2626",
        700: "#B91C1C",
    },
    violet: { 600: "#7C3AED" },
    pink: { 600: "#DB2777" },
    cyan: { 600: "#0891B2" },
    orange: { 600: "#EA580C" },
    white: "#FFFFFF",
    black: "#000000",
} as const;
