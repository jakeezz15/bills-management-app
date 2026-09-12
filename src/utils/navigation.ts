import { Href, router } from "expo-router";

/** Expo Router params can be a string or a one-item array. */
export function paramId(
    value: string | string[] | undefined
): string | undefined {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}

/** True for `1` / `true` style query flags from deep links. */
export function paramFlag(
    value: string | string[] | undefined
): boolean {
    const raw = paramId(value);
    return raw === "1" || raw === "true";
}

/**
 * Set when leaving a reminder deep-link detail so Home can open Due now
 * without relying on query params (which can remount and drop modal state).
 */
let openDuesOnNextHomeFocus = false;

export function markOpenDuesOnHome() {
    openDuesOnNextHomeFocus = true;
}

/** Returns true once, then clears. Call from Home’s focus effect. */
export function takeOpenDuesOnHome(): boolean {
    if (!openDuesOnNextHomeFocus) {
        return false;
    }
    openDuesOnNextHomeFocus = false;
    return true;
}

/**
 * Prefer the stack. If this screen is the root (notification tap), land on
 * `fallback`. Reminder deep links always return Home + dues modal instead.
 */
export function goBackOrReplace(
    fallback: Href,
    options?: { fromReminder?: boolean }
) {
    if (options?.fromReminder) {
        markOpenDuesOnHome();
        // Explicit Home tab — not whatever tab was last selected.
        router.replace("/(tabs)/" as Href);
        return;
    }
    if (router.canGoBack()) {
        router.back();
        return;
    }
    router.replace(fallback);
}

/**
 * Open a bill/debt from a notification: reset to Home first so Back never
 * returns to whatever screen was open when the app was backgrounded, then
 * push the plan with `fromReminder=1`.
 */
export function openPlanFromReminder(type: "bill" | "debt", id: string) {
    const detail =
        type === "debt"
            ? (`/debt/${id}?fromReminder=1` as Href)
            : (`/bill/${id}?fromReminder=1` as Href);

    // Only dismiss when a stack exists — bare Home triggers POP_TO_TOP noise.
    if (typeof router.canDismiss === "function" && router.canDismiss()) {
        router.dismissAll();
    }

    router.replace("/(tabs)/" as Href);
    queueMicrotask(() => {
        router.push(detail);
    });
}
