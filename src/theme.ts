import { TextStyle, ViewStyle } from "react-native";

/**
 * App-wide visual language. Screens and StyleSheets should read from here
 * instead of hard-coding hex values — the React Native equivalent of global CSS.
 */
export const theme = {
    color: {
        canvas: "#F1F5F9",
        surface: "#FFFFFF",
        surfaceMuted: "#F8FAFC",
        ink: "#0F172A",
        muted: "#64748B",
        soft: "#94A3B8",
        faint: "#CBD5E1",
        border: "#E2E8F0",
        track: "#E2E8F0",
        hero: "#0F172A",
        heroTrack: "#1E293B",
        onHero: "#FFFFFF",
        onHeroMuted: "#94A3B8",
        onHeroCaption: "#CBD5E1",
        primary: "#0F172A",
        primaryOn: "#FFFFFF",
        accent: "#2563EB",
        accentSoft: "#EFF6FF",
        accentText: "#1D4ED8",
        success: "#059669",
        successBright: "#34D399",
        successText: "#15803D",
        danger: "#DC2626",
        dangerSoft: "#FEF2F2",
        warning: "#B45309",
        overlay: "rgba(15, 23, 42, 0.55)",
        segmentTrack: "#E8EEF5",
    },
    font: {
        kicker: 12,
        caption: 13,
        body: 14,
        title: 17,
        page: 20,
        value: 20,
        hero: 34,
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
        xl: 20,
        xxl: 24,
        screenX: 16,
        screenTop: 48,
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 18,
        xl: 20,
        pill: 999,
    },
    size: {
        tap: 44,
        heroAdd: 36,
        bar: 8,
    },
} as const;

export const type = {
    pageTitle: {
        color: theme.color.ink,
        fontSize: theme.font.page,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.2,
    } satisfies TextStyle,
    subtitle: {
        color: theme.color.muted,
        fontSize: theme.font.caption,
        lineHeight: 18,
        marginTop: 3,
    } satisfies TextStyle,
    kicker: {
        color: theme.color.onHeroMuted,
        fontSize: theme.font.kicker,
        fontWeight: theme.font.weight.semibold,
        letterSpacing: 0.4,
        textTransform: "uppercase",
    } satisfies TextStyle,
    sectionLabel: {
        color: theme.color.muted,
        fontSize: theme.font.kicker,
        fontWeight: theme.font.weight.bold,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    } satisfies TextStyle,
    cardTitle: {
        color: theme.color.ink,
        fontSize: theme.font.title,
        fontWeight: theme.font.weight.bold,
    } satisfies TextStyle,
    cardSubtitle: {
        color: theme.color.muted,
        fontSize: theme.font.kicker,
        lineHeight: 16,
    } satisfies TextStyle,
    button: {
        color: theme.color.primaryOn,
        fontSize: 15,
        fontWeight: theme.font.weight.bold,
    } satisfies TextStyle,
    ghostButton: {
        color: theme.color.ink,
        fontSize: 16,
        fontWeight: theme.font.weight.semibold,
    } satisfies TextStyle,
};

export const shadows = {
    card: {
        shadowColor: theme.color.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    } satisfies ViewStyle,
};
