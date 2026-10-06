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
     * Accent for letter avatar. Low-risk branding — no company logos.
     * Values come from ACCOUNT_COLORS in @/design.
     */
    color: string;
    /** Prefer this Online account for income / bills defaults. */
    isPrimary?: boolean;
    /** Hidden from pickers; history kept. */
    archived?: boolean;
}
