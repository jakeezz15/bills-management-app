import { Timestamps } from "@/utils/timestamps";

export interface Debt extends Timestamps {
    id: string;
    name: string;
    balance: number;
    dueDay: number;
    /** True when the latest installment payment has been recorded this cycle. */
    isPaid: boolean;
    /** Cumulative amount paid toward this debt (drives Home leftover). */
    totalPaid: number;
    /** ISO date of the most recent installment payment. */
    lastPaymentDate?: string;
    /**
     * When this installment plan begins (YYYY-MM-DD).
     * Hidden when viewing dates before this.
     */
    startDate: string;
    /**
     * ISO date the balance hit $0. Kept in storage for history.
     * Hidden from the list after this day; still visible when viewing as-of
     * this day or earlier.
     */
    paidOffDate?: string;
    remarks?: string;
    minimumPayment: number;
    type: string;
}
