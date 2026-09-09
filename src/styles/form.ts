import { text, theme } from "@/design";
import { StyleSheet } from "react-native";

/**
 * Field primitives shared by every form. Dialog chrome (overlay, header,
 * footer) lives with `FormDialog`, since nothing else renders it.
 */
export const form = StyleSheet.create({
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
        minHeight: theme.size.control,
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
    chipText: {
        color: theme.text.secondary,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.regular,
    },
    chipTextSelected: {
        color: theme.text.accent,
        fontWeight: theme.fontWeight.semibold,
    },

    /** Inline "record a payment" block inside a form. */
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

/** Shared control colours that RN takes as props rather than styles. */
export const formColors = {
    placeholder: theme.text.tertiary,
    switchTrackOff: theme.border.base,
    switchTrackOn: theme.intent.info.solid,
    switchThumb: theme.bg.surface,
};
