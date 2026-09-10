import { theme } from "@/design";
import { BillDueStatus } from "@/utils/filters";

export type PlanStatusTone = BillDueStatus | "default";

export function planStatusAccent(tone: PlanStatusTone): string {
    if (tone === "paid") {
        return theme.intent.positive.solid;
    }
    if (tone === "overdue") {
        return theme.intent.negative.solid;
    }
    if (tone === "due-soon") {
        return theme.intent.caution.solid;
    }
    if (tone === "upcoming") {
        return theme.intent.info.solid;
    }
    return theme.border.base;
}

/** Meta text on a light row. */
export function planStatusFg(tone: PlanStatusTone): string {
    if (tone === "paid") {
        return theme.intent.positive.fg;
    }
    if (tone === "overdue") {
        return theme.intent.negative.fg;
    }
    if (tone === "due-soon") {
        return theme.intent.caution.fg;
    }
    if (tone === "upcoming") {
        return theme.intent.info.fg;
    }
    return theme.text.secondary;
}

/** Caption on the dark hero — solid, not fg, so it stays readable. */
export function planStatusOnInverse(tone: PlanStatusTone): string {
    if (tone === "default") {
        return theme.text.inverseSecondary;
    }
    return planStatusAccent(tone);
}
