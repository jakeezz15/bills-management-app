import { palette } from "./palette";

/**
 * Accent swatches for money-pot letter avatars.
 * Lives in the design layer so raw ramps stay private to palette.ts.
 */
export const ACCOUNT_COLORS = [
    palette.slate[500], // Cash default
    palette.blue[600], // default Online
    palette.emerald[600],
    palette.amber[600],
    palette.pink[600],
    palette.violet[600],
    palette.cyan[600],
    palette.orange[600],
] as const;
