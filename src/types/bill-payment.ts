import { Timestamps } from "@/utils/timestamps";

/** One recorded payment for a recurring bill (typically one per month). */
export interface BillPayment extends Timestamps {
    id: string;
    billId: string;
    amount: number;
    /** ISO `YYYY-MM-DD` — usually the day it was marked paid. */
    date: string;
    /**
     * True when this month was intentionally skipped (e.g. no allowance).
     * Amount is 0; leftover and due lists treat the month as settled.
     */
    skipped?: boolean;
}
