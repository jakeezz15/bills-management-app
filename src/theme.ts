import { TextStyle, ViewStyle } from "react-native";

/**
 * On Hand visual language — 8px grid, hairline lists, no heavy shadows.
 * Screens should read from here instead of hard-coding hex values.
 */
export const theme = {
    color: {
        canvas: "#F1F5F9",
        surface: "#FFFFFF",
        sunken: "#F8FAFC",
        surfaceMuted: "#F8FAFC",
        hero: "#0F172A",
        raised: "#1E293B",
        ink: "#0F172A",
        muted: "#64748B",
        soft: "#94A3B8",
        faint: "#CBD5E1",
        inverse: "#FFFFFF",
        border: "#E2E8F0",
        borderStrong: "#CBD5E1",
        track: "#E2E8F0",
        heroTrack: "#1E293B",
        onHero: "#FFFFFF",
        onHeroMuted: "#94A3B8",
        onHeroCaption: "#CBD5E1",
        primary: "#2563EB",
        primaryOn: "#FFFFFF",
        accent: "#2563EB",
        accentSoft: "#EFF6FF",
        accentText: "#1D4ED8",
        success: "#059669",
        successText: "#047857",
        successSoft: "#ECFDF5",
        successBright: "#059669",
        danger: "#DC2626",
        dangerSoft: "#FEF2F2",
        warning: "#B45309",
        warningBright: "#D97706",
        warningSoft: "#FFFBEB",
        info: "#1D4ED8",
        infoSoft: "#EFF6FF",
        statusPaid: "#059669",
        statusOverdue: "#DC2626",
        statusDueSoon: "#D97706",
        statusUpcoming: "#2563EB",
        statusDefault: "#94A3B8",
        overlay: "rgba(15, 23, 42, 0.55)",
        segmentTrack: "#E8EEF5",
    },
    font: {
        kicker: 12,
        caption: 12,
        body: 14,
        title: 16,
        page: 20,
        value: 20,
        section: 24,
        display: 32,
        hero: 40,
        weight: {
            regular: "500" as const,
            semibold: "600" as const,
            bold: "700" as const,
        },
    },
    space: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        screenX: 16,
        screenTop: 48,
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 16,
        pill: 999,
    },
    size: {
        tap: 44,
        fab: 56,
        strip: 4,
        heroAdd: 36,
        bar: 8,
    },
} as const;

export type StatusTone =
    | "paid"
    | "overdue"
    | "due-soon"
    | "upcoming"
    | "default";

export const statusStrip: Record<StatusTone, string> = {
    paid: theme.color.statusPaid,
    overdue: theme.color.statusOverdue,
    "due-soon": theme.color.statusDueSoon,
    upcoming: theme.color.statusUpcoming,
    default: theme.color.statusDefault,
};

export const statusChip: Record<
    StatusTone,
    { bg: string; fg: string; label: string }
> = {
    paid: {
        bg: theme.color.successSoft,
        fg: theme.color.successText,
        label: "Paid",
    },
    overdue: {
        bg: theme.color.dangerSoft,
        fg: theme.color.danger,
        label: "Overdue",
    },
    "due-soon": {
        bg: theme.color.warningSoft,
        fg: theme.color.warning,
        label: "Due soon",
    },
    upcoming: {
        bg: theme.color.infoSoft,
        fg: theme.color.info,
        label: "Upcoming",
    },
    default: {
        bg: theme.color.sunken,
        fg: theme.color.muted,
        label: "",
    },
};

export const type = {
    pageTitle: {
        color: theme.color.ink,
        fontSize: theme.font.display,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.4,
    } satisfies TextStyle,
    subtitle: {
        color: theme.color.muted,
        fontSize: theme.font.body,
        lineHeight: 20,
        marginTop: 4,
    } satisfies TextStyle,
    kicker: {
        color: theme.color.onHeroMuted,
        fontSize: theme.font.kicker,
        fontWeight: theme.font.weight.semibold,
        letterSpacing: 0.2,
    } satisfies TextStyle,
    sectionLabel: {
        color: theme.color.muted,
        fontSize: theme.font.kicker,
        fontWeight: theme.font.weight.semibold,
        letterSpacing: 0.4,
        textTransform: "uppercase",
    } satisfies TextStyle,
    cardTitle: {
        color: theme.color.ink,
        fontSize: theme.font.title,
        fontWeight: theme.font.weight.semibold,
    } satisfies TextStyle,
    cardSubtitle: {
        color: theme.color.muted,
        fontSize: theme.font.kicker,
        lineHeight: 16,
    } satisfies TextStyle,
    button: {
        color: theme.color.primaryOn,
        fontSize: theme.font.title,
        fontWeight: theme.font.weight.semibold,
    } satisfies TextStyle,
    ghostButton: {
        color: theme.color.ink,
        fontSize: theme.font.title,
        fontWeight: theme.font.weight.semibold,
    } satisfies TextStyle,
};

/** Spec: no heavy shadows — grouped lists use hairline dividers instead. */
export const shadows = {
    card: {
        shadowOpacity: 0,
        elevation: 0,
    } satisfies ViewStyle,
};
