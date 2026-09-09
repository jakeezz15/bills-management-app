import { Timestamps } from "@/utils/timestamps";

export interface SavingsGoal extends Timestamps {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    /** ISO `YYYY-MM-DD` — when this goal started (pace / history). */
    startDate: string;
    /** Planned monthly put-aside — ETA only; does not auto-deduct leftover. */
    monthlyContribution?: number;
}
