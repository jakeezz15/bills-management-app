import { Timestamps } from "@/utils/timestamps";

export type PayCadence = "once" | "weekly" | "biweekly" | "monthly";

export interface Income extends Timestamps {
    id: string;
    date: string;
    gross: number;
    net: number;
    source: string;
    /** How often this paycheck repeats. Missing means a one-off. */
    payCadence?: PayCadence;
}
