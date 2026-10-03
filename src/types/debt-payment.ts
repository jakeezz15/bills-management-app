import { Timestamps } from "@/utils/timestamps";

/** One installment payment toward a debt. */
export interface DebtPayment extends Timestamps {
    id: string;
    debtId: string;
    amount: number;
    /** ISO `YYYY-MM-DD` when the payment was recorded. */
    date: string;
    /**
     * True when this month’s installment was intentionally skipped.
     * Amount is 0; does not reduce remaining balance.
     */
    skipped?: boolean;
    /**
     * Money pot this payment came from.
     * Missing on older records → treated as Cash on load.
     */
    accountId?: string;
}
