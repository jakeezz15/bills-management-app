import { useTheme } from "@/app/contexts/ThemeContext";
import { text, theme as defaultTheme, type Theme } from "@/design";
import { useMemo } from "react";
import { StyleSheet } from "react-native";

export function createButtonStyle(theme: Theme) {
    return StyleSheet.create({
        normalButton: {
            alignItems: "center",
            justifyContent: "center",
            minHeight: theme.size.tap,
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            backgroundColor: theme.action.primary.bg,
            borderRadius: theme.radius.sm,
        },
        ghostButton: {
            alignItems: "center",
            justifyContent: "center",
            minHeight: theme.size.tap,
            paddingHorizontal: theme.space.md,
            backgroundColor: theme.action.secondary.bg,
            borderRadius: theme.radius.sm,
        },
        disabledButton: {
            backgroundColor: theme.action.disabled.bg,
        },
        buttonPressed: {
            opacity: 0.9,
            transform: [{ scale: 0.98 }],
        },
        buttonText: text.button,
        ghostButtonText: {
            color: theme.action.secondary.fg,
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
        },
        disabledButtonText: {
            color: theme.action.disabled.fg,
        },
        dangerText: {
            color: theme.intent.negative.fg,
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.bold,
            textAlign: "center",
        },
    });
}

/** Default blue — prefer `useButtonStyle()` for live accent. */
export const buttonStyle = createButtonStyle(defaultTheme);

export function useButtonStyle() {
    const { theme } = useTheme();
    return useMemo(() => createButtonStyle(theme), [theme]);
}
