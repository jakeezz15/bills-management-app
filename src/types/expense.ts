import { Timestamps } from "@/utils/timestamps";

export interface Expense extends Timestamps {
    id: string;
    name: string;
    amount: number;
    date: string; // ISO YYYY-MM-DD — when the money was spent
    category?: string;
    /**
     * Money pot this spend came from.
     * Missing on older records → treated as Cash on load.
     */
    accountId?: string;
}
