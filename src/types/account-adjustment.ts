import { Timestamps } from "@/utils/timestamps";

/**
 * Auditable balance change for a pot (opening balance or “set to match wallet”).
 * `delta` is added to the derived balance (can be negative).
 */
export interface AccountAdjustment extends Timestamps {
    id: string;
    accountId: string;
    date: string; // YYYY-MM-DD
    delta: number;
    note?: string;
}
