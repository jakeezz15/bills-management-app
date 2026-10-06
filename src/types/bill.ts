import { Timestamps } from "@/utils/timestamps";

export interface Bill extends Timestamps {
    id: string;
    name: string;
    /** Recurring / set amount. Actual leftover uses the payment ledger. */
    amount: number;
    dueDay: number;
    /**
     * When this bill becomes active (`YYYY-MM-DD`). Optional — omitted on
     * older records means already active. Hidden from Due now / reminders
     * before this day.
     */
    startDate?: string;
    isPaid: boolean;
    category?: string;
    isRecurring: boolean;
    /** Water, electricity, etc. — enter the real amount when marking paid. */
    amountVaries?: boolean;
    /**
     * Schedule a due-day reminder for this bill. Missing on old records
     * means on (`remind !== false`).
     */
    remind?: boolean;
}
