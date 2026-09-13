import { useTheme } from "@/app/contexts/ThemeContext";
import { text, theme as defaultTheme, type Theme } from "@/design";
import { useMemo } from "react";
import { StyleSheet } from "react-native";

/**
 * Field primitives shared by every form. Dialog chrome lives with FormDialog.
 * Prefer `useFormStyles()` / `useFormColors()` so accent roles update live.
 */
export function createFormStyles(theme: Theme) {
    return StyleSheet.create({
        field: {
            marginBottom: theme.space.md,
        },
        label: {
            ...text.label,
            marginBottom: theme.space.sm,
        },
        input: {
            backgroundColor: theme.bg.sunken,
            borderWidth: 1,
            borderColor: theme.border.subtle,
            borderRadius: theme.radius.sm,
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            minHeight: theme.size.tap,
            fontSize: theme.fontSize.md,
            color: theme.text.primary,
        },
        inputFocused: {
            borderColor: theme.border.focus,
            backgroundColor: theme.bg.surface,
        },
        inputError: {
            borderColor: theme.intent.negative.fg,
            backgroundColor: theme.intent.negative.bg,
        },
        error: {
            color: theme.intent.negative.fg,
            fontSize: theme.fontSize.xs,
            lineHeight: theme.lineHeight.xs,
            marginTop: theme.space.sm,
        },
        helper: {
            ...text.caption,
            marginTop: theme.space.sm,
        },

        amountWrap: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.bg.sunken,
            borderWidth: 1,
            borderColor: theme.border.subtle,
            borderRadius: theme.radius.sm,
            paddingHorizontal: theme.space.md,
        },
        amountPrefix: {
            color: theme.text.tertiary,
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.semibold,
            marginRight: theme.space.sm,
        },
        amountInput: {
            flex: 1,
            fontSize: theme.fontSize.xl,
            fontWeight: theme.fontWeight.bold,
            color: theme.text.primary,
            paddingVertical: theme.space.sm,
            minHeight: theme.size.tap,
        },

        switchRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: theme.bg.sunken,
            borderRadius: theme.radius.sm,
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            marginBottom: theme.space.sm,
            minHeight: theme.size.tap,
        },
        switchCopy: {
            flex: 1,
            marginRight: theme.space.md,
        },
        switchTitle: {
            color: theme.text.primary,
            fontSize: theme.fontSize.sm,
            lineHeight: theme.lineHeight.sm,
            fontWeight: theme.fontWeight.semibold,
        },
        switchCaption: {
            ...text.caption,
            marginTop: theme.space.xs,
        },

        chipRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: theme.space.sm,
        },
        chip: {
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            minHeight: theme.size.tap,
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.border.subtle,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.bg.surface,
        },
        chipSelected: {
            borderColor: theme.border.focus,
            backgroundColor: theme.intent.info.bg,
        },
        chipPressed: {
            opacity: 0.7,
        },
        chipText: {
            color: theme.text.secondary,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.regular,
        },
        chipTextSelected: {
            color: theme.text.accent,
            fontWeight: theme.fontWeight.semibold,
        },

        actionCard: {
            backgroundColor: theme.intent.positive.bg,
            borderRadius: theme.radius.sm,
            padding: theme.space.md,
            marginTop: theme.space.lg,
        },
        actionCardLead: {
            marginTop: 0,
            marginBottom: theme.space.md,
        },
        actionCardTitle: {
            color: theme.intent.positive.fg,
            fontSize: theme.fontSize.md,
            lineHeight: theme.lineHeight.md,
            fontWeight: theme.fontWeight.semibold,
        },
        actionCardCaption: {
            color: theme.intent.positive.fg,
            fontSize: theme.fontSize.xs,
            lineHeight: theme.lineHeight.xs,
            marginTop: theme.space.xs,
            marginBottom: theme.space.md,
        },
        actionCardButton: {
            backgroundColor: theme.intent.positive.fg,
            borderRadius: theme.radius.sm,
            minHeight: theme.size.tap,
            alignItems: "center",
            justifyContent: "center",
        },
        actionCardButtonMuted: {
            backgroundColor: theme.text.secondary,
        },
        actionCardButtonSpacer: {
            marginBottom: theme.space.sm,
        },

        banner: {
            backgroundColor: theme.intent.positive.bg,
            borderRadius: theme.radius.sm,
            padding: theme.space.md,
            marginBottom: theme.space.md,
        },
        bannerText: {
            color: theme.intent.positive.fg,
            fontSize: theme.fontSize.sm,
            lineHeight: theme.lineHeight.sm,
            fontWeight: theme.fontWeight.semibold,
            textAlign: "center",
        },
    });
}

export function createFormColors(theme: Theme) {
    return {
        placeholder: theme.text.tertiary,
        switchTrackOff: theme.border.base,
        switchTrackOn: theme.intent.info.solid,
        switchThumb: theme.bg.surface,
    };
}

export const form = createFormStyles(defaultTheme);
export const formColors = createFormColors(defaultTheme);

export function useFormStyles() {
    const { theme } = useTheme();
    return useMemo(() => createFormStyles(theme), [theme]);
}

export function useFormColors() {
    const { theme } = useTheme();
    return useMemo(() => createFormColors(theme), [theme]);
}
