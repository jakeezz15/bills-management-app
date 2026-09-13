/**
 * Raw colour ramps. Nothing outside `src/design/` may import this —
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
        500: "#10B981",
        600: "#059669",
        700: "#047857",
    },
    amber: {
        50: "#FFFBEB",
        100: "#FEF3C7",
        500: "#F59E0B",
        600: "#D97706",
        700: "#B45309",
    },
    red: {
        50: "#FEF2F2",
        100: "#FEE2E2",
        600: "#DC2626",
        700: "#B91C1C",
    },
    violet: {
        50: "#F5F3FF",
        500: "#A855F7",
        600: "#7C3AED",
        700: "#6D28D9",
        800: "#5B21B6",
    },
    pink: { 500: "#EC4899", 600: "#DB2777" },
    cyan: { 400: "#22D3EE", 500: "#06B6D4", 600: "#0891B2" },
    orange: { 500: "#F97316", 600: "#EA580C" },
    teal: { 500: "#14B8A6", 600: "#0D9488" },
    lime: { 500: "#84CC16", 600: "#65A30D" },
    gold: { 500: "#EAB308", 600: "#CA8A04" },
    fuchsia: { 500: "#D946EF" },
    indigo: { 500: "#6366F1", 600: "#4F46E5" },
    rose: { 500: "#F43F5E", 600: "#E11D48" },
    green: { 500: "#22C55E" },
    /** Google brand mark on Welcome (logo only). */
    google: { red: "#EA4335" },
    white: "#FFFFFF",
    black: "#000000",
} as const;
