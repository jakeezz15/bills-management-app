import { Timestamps } from "@/utils/timestamps";

/** Built-in Cash pot — never archived or deleted. */
export const CASH_ACCOUNT_ID = "cash";

/** First Online pot created for every install. */
export const DEFAULT_ONLINE_ACCOUNT_ID = "online-default";

export type AccountKind = "cash" | "online";

/**
 * A money pot. Cash is singular; Online can have many named accounts
 * (BDO, GCash, …) — labels only, no bank login.
 */
export interface CashAccount extends Timestamps {
    id: string;
    kind: AccountKind;
    name: string;
    /**
     * Accent for letter avatar (hex). Low-risk branding — no company logos.
     */
    color: string;
    /** Prefer this Online account for income / bills defaults. */
    isPrimary?: boolean;
    /** Hidden from pickers; history kept. */
    archived?: boolean;
}

export const ACCOUNT_COLORS = [
    "#64748b", // slate — Cash default
    "#2563eb", // blue — default Online
    "#059669", // emerald
    "#d97706", // amber
    "#db2777", // pink
    "#7c3aed", // violet
    "#0891b2", // cyan
    "#ea580c", // orange
] as const;
