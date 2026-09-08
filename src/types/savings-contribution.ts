import { Timestamps } from "@/utils/timestamps";

/** A dated contribution toward a savings goal. */
export interface SavingsContribution extends Timestamps {
    id: string;
    savingsId: string;
    amount: number;
    /** ISO `YYYY-MM-DD`. */
    date: string;
}
