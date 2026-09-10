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

/** Prefer the stack. If this screen is the root (notification tap), land on `fallback`. */
export function goBackOrReplace(fallback: Href) {
    if (router.canGoBack()) {
        router.back();
        return;
    }
    router.replace(fallback);
}
