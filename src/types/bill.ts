import { Timestamps } from "@/utils/timestamps";

export interface Bill extends Timestamps {
    id: string;
    name: string;
    amount: number;
    dueDay: number;
    isPaid: boolean;
    category?: string;
    isRecurring: boolean;
}
