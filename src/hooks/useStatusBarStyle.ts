import { useFocusEffect } from "expo-router";
import { StatusBar, type StatusBarStyle } from "expo-status-bar";
import { useCallback } from "react";

/**
 * Lets the focused screen own the status bar.
 *
 * Rendering a `<StatusBar>` per screen does not work under tabs: every visited
 * screen stays mounted, and expo-status-bar merges mounted components in mount
 * order, so whichever tab was opened last keeps control instead of the one on
 * screen. Setting the style on focus puts the visible screen in charge.
 *
 * Pass `null` for a screen that is embedded inside another — the host owns the
 * bar, and two writers racing on focus would be a coin toss.
 */
export function useStatusBarStyle(style: StatusBarStyle | null) {
    useFocusEffect(
        useCallback(() => {
            if (style) {
                StatusBar.setStyle(style, true);
            }
        }, [style])
    );
}
