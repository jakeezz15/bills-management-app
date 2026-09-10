import { dashboard } from "@/styles/dashboard";
import { theme } from "@/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type DashboardEmptyProps = {
    title: string;
    text: string;
    actionLabel: string;
    onAction: () => void;
};

export function DashboardEmpty({
    title,
    text,
    actionLabel,
    onAction,
}: DashboardEmptyProps) {
    return (
        <View style={dashboard.emptyCard}>
            <Text style={dashboard.emptyTitle}>{title}</Text>
            <Text style={dashboard.emptyText}>{text}</Text>
            <Pressable
                onPress={onAction}
                style={({ pressed }) => [
                    dashboard.emptyButton,
                    pressed && { opacity: 0.9 },
                ]}
            >
                <Text style={dashboard.emptyButtonText}>{actionLabel}</Text>
            </Pressable>
        </View>
    );
}

type FirstRunEmptyProps = {
    onAddPaycheck: () => void;
};

/** Full-screen first-run Home — centered copy + solid primary CTA. */
export function FirstRunEmpty({ onAddPaycheck }: FirstRunEmptyProps) {
    return (
        <View style={styles.screen}>
            <View style={styles.block}>
                <Text style={styles.title}>
                    What’s left after money in and out?
                </Text>
                <Text style={styles.body}>
                    On-device leftover tracker. No account and no bank sync.
                    Leftover only subtracts money you log — unpaid bills stay
                    on Plans until you mark them paid.
                </Text>
                <Pressable
                    onPress={onAddPaycheck}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.cta,
                        pressed && { opacity: 0.92 },
                    ]}
                >
                    <Text style={styles.ctaLabel}>Add first paycheck</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: theme.color.canvas,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    block: {
        width: "100%",
        maxWidth: 340,
        alignItems: "center",
    },
    title: {
        color: theme.color.ink,
        fontSize: theme.font.section,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.3,
        textAlign: "center",
        lineHeight: 30,
    },
    body: {
        color: theme.color.muted,
        fontSize: theme.font.body,
        lineHeight: 20,
        textAlign: "center",
        marginTop: theme.space.lg,
        marginBottom: theme.space.xl,
    },
    cta: {
        alignSelf: "stretch",
        minHeight: theme.size.tap,
        backgroundColor: theme.color.primary,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.space.lg,
    },
    ctaLabel: {
        color: theme.color.inverse,
        fontSize: theme.font.title,
        fontWeight: theme.font.weight.semibold,
    },
});
