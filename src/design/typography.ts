import type { TextStyle } from "react-native";
import { theme } from "./tokens";

/**
 * Named text roles. Components pick a role instead of assembling
 * size + weight + colour by hand, which is how the type scale stays at
 * seven steps.
 */
export const text = {
    /** Masthead figure on the dark band. */
    hero: {
        color: theme.text.inverse,
        fontSize: theme.fontSize.hero,
        lineHeight: theme.lineHeight.hero,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: -1,
        fontVariant: ["tabular-nums"],
    },
    /** Large figure inside a card or compact hero. */
    display: {
        color: theme.text.primary,
        fontSize: theme.fontSize.display,
        lineHeight: theme.lineHeight.display,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: -0.6,
        fontVariant: ["tabular-nums"],
    },
    pageTitle: {
        color: theme.text.primary,
        fontSize: theme.fontSize.lg,
        lineHeight: theme.lineHeight.lg,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: -0.2,
    },
    dialogTitle: {
        color: theme.text.inverse,
        fontSize: theme.fontSize.xl,
        lineHeight: theme.lineHeight.xl,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: -0.3,
    },
    /** Row and card headings. */
    itemTitle: {
        color: theme.text.primary,
        fontSize: theme.fontSize.md,
        lineHeight: theme.lineHeight.md,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: -0.2,
    },
    body: {
        color: theme.text.primary,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.sm,
        fontWeight: theme.fontWeight.regular,
    },
    bodyMuted: {
        color: theme.text.secondary,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.sm,
        fontWeight: theme.fontWeight.regular,
    },
    caption: {
        color: theme.text.secondary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.regular,
    },
    /** Uppercase group heading above a list. */
    sectionLabel: {
        color: theme.text.secondary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    /** Uppercase label on a dark band. */
    kicker: {
        color: theme.text.inverseTertiary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.semibold,
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    /** Field label above an input. */
    label: {
        color: theme.text.secondary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.semibold,
    },
    /** Any currency figure. Tabular so columns line up. */
    money: {
        color: theme.text.primary,
        fontSize: theme.fontSize.md,
        lineHeight: theme.lineHeight.md,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: -0.2,
        fontVariant: ["tabular-nums"],
    },
    button: {
        color: theme.action.primary.fg,
        fontSize: theme.fontSize.md,
        lineHeight: theme.lineHeight.md,
        fontWeight: theme.fontWeight.bold,
    },
} satisfies Record<string, TextStyle>;

/**
 * Elevation. Flat by default — depth is reserved for things that genuinely
 * float above the page.
 */
export const elevation = {
    floating: {
        shadowColor: theme.text.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 8,
    },
    dialog: {
        shadowColor: theme.text.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.24,
        shadowRadius: 24,
        elevation: 16,
    },
} as const;
