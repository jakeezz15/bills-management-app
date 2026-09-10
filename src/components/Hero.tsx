import { theme, type } from "@/theme";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type HeroProps = {
    kicker: string;
    value: string;
    caption?: string;
    /** 0–100. Blue fill on raised track. Omit to hide the bar. */
    percent?: number;
    /** Extra bottom padding so a snapshot card can overlap the hero. */
    overlap?: boolean;
    leading?: ReactNode;
    children?: ReactNode;
};

/**
 * Full-bleed dark hero. Use on Home, Activity, and plan detail screens.
 * Guidance: kicker 12/600, value 40/700 white, caption secondary-on-hero.
 */
export function Hero({
    kicker,
    value,
    caption,
    percent,
    overlap = false,
    leading,
    children,
}: HeroProps) {
    const width = Math.max(0, Math.min(100, percent ?? 0));

    return (
        <View style={[styles.hero, overlap && styles.heroOverlap]}>
            {leading}
            <Text style={styles.kicker}>{kicker}</Text>
            <Text style={styles.value}>{value}</Text>
            {caption ? <Text style={styles.caption}>{caption}</Text> : null}

            {percent !== undefined ? (
                <View style={styles.track}>
                    <View style={[styles.fill, { width: `${width}%` }]} />
                </View>
            ) : null}

            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    hero: {
        backgroundColor: theme.color.hero,
        paddingHorizontal: theme.space.lg,
        paddingTop: theme.space.screenTop,
        paddingBottom: theme.space.xl,
    },
    heroOverlap: {
        paddingBottom: 56,
    },
    kicker: {
        ...type.kicker,
        marginBottom: theme.space.sm,
    },
    value: {
        color: theme.color.inverse,
        fontSize: theme.font.hero,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.8,
        lineHeight: 44,
    },
    caption: {
        color: theme.color.onHeroCaption,
        fontSize: theme.font.body,
        marginTop: theme.space.sm,
    },
    track: {
        height: theme.size.bar,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.color.raised,
        marginTop: theme.space.lg,
        overflow: "hidden",
    },
    fill: {
        height: theme.size.bar,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.color.primary,
    },
});
