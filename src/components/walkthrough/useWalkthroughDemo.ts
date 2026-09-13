import { useWalkthroughOptional } from "./WalkthroughContext";
import type { WalkthroughStepId } from "./steps";

/** True while the tour is on one of the listed steps. */
export function useWalkthroughStep(
    ...ids: WalkthroughStepId[]
): boolean {
    const walkthrough = useWalkthroughOptional();
    if (walkthrough?.phase !== "running" || !walkthrough.activeId) {
        return false;
    }
    return ids.includes(walkthrough.activeId);
}

/** Tour is running on any Activity list step (show sample income/spend). */
export function useWalkthroughActivityDemo(): boolean {
    return useWalkthroughStep(
        "activity-income",
        "activity-spending",
        "activity-add"
    );
}

/** Tour is running on a Plans list step. */
export function useWalkthroughPlansDemo(
    section: "bills" | "savings" | "debts"
): boolean {
    const map = {
        bills: "plans-bills",
        savings: "plans-savings",
        debts: "plans-debts",
    } as const;
    return useWalkthroughStep(map[section]);
}
