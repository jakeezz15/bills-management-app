import { Timestamps } from "@/utils/timestamps";

/** A dated contribution toward a savings goal. */
export interface SavingsContribution extends Timestamps {
    id: string;
    savingsId: string;
    amount: number;
    /** ISO `YYYY-MM-DD`. */
    date: string;
    /**
     * Money pot this contribution came from.
     * Missing on older records → treated as Cash on load.
     */
    accountId?: string;
}
