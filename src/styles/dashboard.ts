import { text, theme } from "@/design";
import { StyleSheet } from "react-native";

export const dashboard = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: theme.bg.canvas,
    },
    list: {
        flex: 1,
    },
    listContent: {
        flexGrow: 1,
        width: "100%",
        maxWidth: theme.size.readable,
        alignSelf: "center",
        paddingHorizontal: theme.space.screenX,
        paddingTop: theme.space.md,
        // Clears the floating add button and the tab bar.
        paddingBottom: theme.space.xxl * 2,
    },
    standaloneHeader: {
        marginBottom: theme.space.md,
    },

    // Dark hero band. Bleeds past the list padding to the screen edges.
    hero: {
        backgroundColor: theme.bg.inverse,
        marginHorizontal: -theme.space.screenX,
        marginTop: -theme.space.md,
        marginBottom: theme.space.lg,
        overflow: "hidden",
    },
    heroWithStatus: {
        flexDirection: "row",
        alignItems: "stretch",
    },
    heroAccent: {
        width: 4,
    },
    heroMain: {
        flex: 1,
        minWidth: 0,
    },
    heroNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.space.sm,
        minHeight: theme.size.tap,
    },
    heroNavSide: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: theme.size.tap,
        paddingHorizontal: theme.space.sm,
        gap: theme.space.xs,
    },
    heroNavLabel: {
        color: theme.text.inverse,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.sm,
        fontWeight: theme.fontWeight.semibold,
    },
    heroDisplay: {
        overflow: "hidden",
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.md,
    },
    heroTitle: {
        ...text.dialogTitle,
        marginBottom: theme.space.sm,
    },
    heroEyebrow: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: theme.space.md,
    },
    heroKicker: {
        ...text.kicker,
        flex: 1,
    },
    heroPct: {
        color: theme.text.inverse,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: 0.4,
        fontVariant: ["tabular-nums"],
    },
    heroValue: {
        ...text.hero,
        marginTop: theme.space.sm,
    },
    heroCaption: {
        color: theme.text.inverseSecondary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        marginTop: theme.space.sm,
    },
    heroTide: {
        height: theme.size.bar,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.track.inverse,
        overflow: "hidden",
        marginTop: theme.space.md,
    },
    heroTools: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: theme.size.tap,
        paddingRight: theme.space.sm,
        backgroundColor: theme.bg.inverseRaised,
    },
    heroToolsMain: {
        flex: 1,
        minWidth: 0,
    },
    heroToolsAdd: {
        width: theme.size.control,
        height: theme.size.control,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.action.onInverse.bg,
    },
    heroDockText: {
        color: theme.text.inverseTertiary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        paddingHorizontal: theme.space.sm,
        paddingVertical: theme.space.sm,
    },

    // Condensed hero pinned to the top once the full one scrolls away.
    heroCompactSticky: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingHorizontal: theme.space.screenX,
        paddingVertical: theme.space.sm,
        backgroundColor: theme.bg.inverse,
    },
    heroCompact: {},
    heroCompactTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.space.sm,
    },
    heroCompactKicker: text.kicker,
    heroCompactValue: {
        color: theme.text.inverse,
        fontSize: theme.fontSize.lg,
        lineHeight: theme.lineHeight.lg,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: -0.3,
        fontVariant: ["tabular-nums"],
        marginTop: theme.space.xs,
    },
    heroCompactAdd: {
        width: theme.size.control,
        height: theme.size.control,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.bg.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    heroCompactPaceText: {
        color: theme.text.inverseTertiary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        marginTop: theme.space.sm,
    },

    // Period stepper: two 44px chevrons flanking a centred label.
    periodRow: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: theme.size.tap,
    },
    periodChevron: {
        width: theme.size.tap,
        height: theme.size.tap,
        alignItems: "center",
        justifyContent: "center",
    },
    periodLabelHit: {
        flex: 1,
        minHeight: theme.size.tap,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.space.xs,
        gap: 2,
    },
    periodLabel: {
        color: theme.text.inverseSecondary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.semibold,
        textAlign: "center",
        includeFontPadding: false,
        textAlignVertical: "center",
    },
    periodToday: {
        color: theme.text.inverseTertiary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.semibold,
        textAlign: "center",
        includeFontPadding: false,
    },

    sectionLabel: {
        ...text.sectionLabel,
        marginTop: theme.space.xs,
        marginBottom: theme.space.sm,
    },

    card: {
        backgroundColor: theme.bg.surface,
        borderRadius: theme.radius.md,
        padding: theme.space.md,
        marginBottom: theme.space.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border.subtle,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: theme.space.md,
    },
    cardTitle: text.itemTitle,
    cardSubtitle: {
        ...text.caption,
        marginTop: theme.space.xs,
    },
    cardRight: {
        ...text.money,
        fontSize: theme.fontSize.lg,
        lineHeight: theme.lineHeight.lg,
    },
    cardMeta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: theme.space.md,
        gap: theme.space.sm,
    },
    cardAmounts: {
        ...text.money,
        flex: 1,
    },
    cardAmountsMuted: {
        color: theme.text.tertiary,
        fontWeight: theme.fontWeight.regular,
    },

    barTrack: {
        height: theme.size.bar,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.track.base,
        overflow: "hidden",
    },
    barFill: {
        height: theme.size.bar,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.action.primary.bg,
    },
    barFillDone: {
        backgroundColor: theme.intent.positive.solid,
    },

    chip: {
        backgroundColor: theme.intent.info.bg,
        paddingHorizontal: theme.space.sm,
        borderRadius: theme.radius.sm,
        minHeight: theme.size.tap,
        justifyContent: "center",
    },
    chipText: {
        color: theme.text.accent,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.bold,
    },

    emptyCard: {
        alignSelf: "stretch",
        backgroundColor: theme.bg.surface,
        borderRadius: theme.radius.md,
        padding: theme.space.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border.subtle,
        alignItems: "stretch",
    },
    emptyTitle: {
        ...text.itemTitle,
        textAlign: "center",
    },
    emptyText: {
        ...text.bodyMuted,
        marginTop: theme.space.sm,
        marginBottom: theme.space.md,
        textAlign: "center",
    },
    emptyButton: {
        alignSelf: "stretch",
        backgroundColor: theme.action.primary.bg,
        minHeight: theme.size.tap,
        borderRadius: theme.radius.sm,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.sm,
        overflow: "visible",
    },
    emptyButtonText: {
        ...text.button,
        width: "100%",
        textAlign: "center",
    },

    // paddingTop comes from useScreenTopPadding at the call site.
    tabHeader: {
        paddingHorizontal: theme.space.screenX,
        paddingBottom: theme.space.sm,
        backgroundColor: theme.bg.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border.subtle,
    },
});
