import { Timestamps } from "@/utils/timestamps";

/** One recorded payment for a recurring bill (typically one per month). */
export interface BillPayment extends Timestamps {
    id: string;
    billId: string;
    amount: number;
    /** ISO `YYYY-MM-DD` — usually the day it was marked paid. */
    date: string;
}
