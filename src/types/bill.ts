import { Timestamps } from "@/utils/timestamps";

export interface Bill extends Timestamps {
    id: string;
    name: string;
    /** Typical / last-known amount. Actual leftover uses the payment ledger. */
    amount: number;
    dueDay: number;
    isPaid: boolean;
    category?: string;
    isRecurring: boolean;
    /** Water, electricity, etc. — enter the real amount when marking paid. */
    amountVaries?: boolean;
}
