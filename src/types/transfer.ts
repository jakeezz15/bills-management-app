import { Timestamps } from "@/utils/timestamps";

/** Move money between pots without changing total leftover. */
export interface Transfer extends Timestamps {
    id: string;
    date: string; // YYYY-MM-DD
    amount: number;
    fromAccountId: string;
    toAccountId: string;
    note?: string;
}
