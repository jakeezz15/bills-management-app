import { Timestamps } from "@/utils/timestamps";

export interface Income extends Timestamps {
    id: string;
    date: string;
    gross: number;
    net: number;
    source: string;
}
