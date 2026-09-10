import { Timestamps } from "@/utils/timestamps";

export interface Debt extends Timestamps {
    id: string;
    name: string;
    balance: number;
    dueDay: number;
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
    /**
     * Schedule a due-day reminder for this debt. Missing on old records
     * means on (`remind !== false`).
     */
    remind?: boolean;

    /** @deprecated Prefer DebtPayment rows. Kept for old backups / migration. */
    isPaid?: boolean;
    /** @deprecated Prefer DebtPayment rows. */
    totalPaid?: number;
    /** @deprecated Prefer DebtPayment rows. */
    lastPaymentDate?: string;
}
