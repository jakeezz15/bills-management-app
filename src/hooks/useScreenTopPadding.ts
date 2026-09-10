import { theme } from "@/design";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Top padding for screen chrome that sits under the status bar.
 *
 * Replaces a fixed 48pt guess, which overlapped the Dynamic Island on current
 * iPhones (top inset ~59) and wasted space on older ones (~20). The inset is
 * measured, so only the gap below it is a design choice.
 */
export function useScreenTopPadding(gap: number = theme.space.md): number {
    const insets = useSafeAreaInsets();
    return insets.top + gap;
}
