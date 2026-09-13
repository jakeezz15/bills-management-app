import { WelcomeVaultArt } from "@/components/WelcomeVaultArt";
import { useSyncProgress } from "@/components/SyncProgressOverlay";
import { text, theme } from "@/design";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { signInWithGoogle, messageForSignInError } from "@/services/auth";
import { markChosenGuest } from "@/services/auth-preference";
import { runEnsureCloudLinked } from "@/utils/sync-ui";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    ReduceMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BENEFITS: {
    label: string;
    icon: "phone-portrait-outline" | "cloud-outline" | "shield-checkmark-outline";
    color: string;
    tint: string;
}[] = [
    {
        label: "On device",
        icon: "phone-portrait-outline",
        color: theme.chart[0],
        tint: "rgba(37, 99, 235, 0.14)",
    },
    {
        label: "Optional sync",
        icon: "cloud-outline",
        color: theme.chart[1],
        tint: "rgba(5, 150, 105, 0.14)",
    },
    {
        label: "Your vault",
        icon: "shield-checkmark-outline",
        color: theme.chart[2],
        tint: "rgba(217, 119, 6, 0.14)",
    },
];

/**
 * Soft entry: colorful immersive hero + light bottom sheet CTAs
 * (common fintech welcome layout).
 */
export default function WelcomeScreen() {
    useStatusBarStyle("light");
    const insets = useSafeAreaInsets();
    const [busy, setBusy] = useState(false);
    const { showSyncProgress, hideSyncProgress } = useSyncProgress();

    const goHome = () => {
        router.replace("/(tabs)");
    };

    const handleGoogle = async () => {
        try {
            setBusy(true);
            await signInWithGoogle();
            goHome();
            setTimeout(() => {
                void runEnsureCloudLinked({
                    showSyncProgress,
                    hideSyncProgress,
                });
            }, 400);
        } catch (error) {
            const message = messageForSignInError(error);
            if (message) {
                Alert.alert("Sign-in failed", message);
            }
        } finally {
            setBusy(false);
        }
    };

    const handleGuest = async () => {
        try {
            setBusy(true);
            await markChosenGuest();
            goHome();
        } catch {
            Alert.alert(
                "Could not continue",
                "Something went wrong. Please try again."
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={styles.screen}>
            <View
                style={[
                    styles.hero,
                    { paddingTop: insets.top + theme.space.lg },
                ]}
            >
                <View style={styles.blobEmerald} />
                <View style={styles.blobBlue} />
                <View style={styles.blobAmber} />
                <WelcomeVaultArt />

                <Animated.View
                    entering={FadeInDown.duration(420)
                        .delay(60)
                        .reduceMotion(ReduceMotion.System)}
                    style={styles.heroCopy}
                >
                    <Text style={styles.brand}>On Hand</Text>
                    <Text style={styles.headline}>Your money vault</Text>
                    <Text style={styles.support}>
                        See what’s left after bills and debts — keep it on this
                        phone, or sync with Google when you’re ready.
                    </Text>
                </Animated.View>

                <Animated.View
                    entering={FadeInDown.duration(400)
                        .delay(120)
                        .reduceMotion(ReduceMotion.System)}
                    style={styles.benefits}
                >
                    {BENEFITS.map((item) => (
                        <View
                            key={item.label}
                            style={[
                                styles.benefitChip,
                                { backgroundColor: item.tint },
                            ]}
                        >
                            <Ionicons
                                name={item.icon}
                                size={14}
                                color={item.color}
                            />
                            <Text style={[styles.benefitLabel, { color: item.color }]}>
                                {item.label}
                            </Text>
                        </View>
                    ))}
                </Animated.View>
            </View>

            <Animated.View
                entering={FadeInUp.duration(420)
                    .delay(140)
                    .reduceMotion(ReduceMotion.System)}
                style={[
                    styles.sheet,
                    { paddingBottom: insets.bottom + theme.space.lg },
                ]}
            >
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Get started</Text>
                <Text style={styles.sheetSubtitle}>
                    Sign in to unlock cloud sync, or continue as a guest.
                </Text>

                <Pressable
                    disabled={busy}
                    onPress={() => {
                        void handleGoogle();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in with Google"
                    style={({ pressed }) => [
                        styles.googleButton,
                        (pressed || busy) && styles.googlePressed,
                        busy && styles.googleDisabled,
                    ]}
                >
                    <View style={styles.googleIconWrap}>
                        <Ionicons name="logo-google" size={18} color="#EA4335" />
                    </View>
                    <Text style={styles.googleLabel}>Sign in with Google</Text>
                </Pressable>

                <Pressable
                    disabled={busy}
                    onPress={() => {
                        void handleGuest();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Continue as guest"
                    style={({ pressed }) => [
                        styles.guestButton,
                        pressed && styles.guestPressed,
                        busy && styles.guestDisabled,
                    ]}
                >
                    <Text style={styles.guestLabel}>Continue as guest</Text>
                </Pressable>

                <Text style={styles.finePrint}>
                    Guest stays local. You can sign in anytime in Settings.
                </Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: theme.bg.inverse,
    },
    hero: {
        flex: 1,
        paddingHorizontal: theme.space.screenX,
        justifyContent: "center",
        gap: theme.space.md,
        overflow: "visible",
    },
    blobEmerald: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: 110,
        top: -40,
        left: -60,
        backgroundColor: "rgba(52, 211, 153, 0.22)",
    },
    blobBlue: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 90,
        top: 80,
        right: -70,
        backgroundColor: "rgba(59, 130, 246, 0.24)",
    },
    blobAmber: {
        position: "absolute",
        width: 140,
        height: 140,
        borderRadius: 70,
        bottom: 40,
        left: 40,
        backgroundColor: "rgba(245, 158, 11, 0.18)",
    },
    heroCopy: {
        gap: theme.space.sm,
        maxWidth: theme.size.readable,
        width: "100%",
        alignSelf: "center",
    },
    brand: {
        ...text.caption,
        color: theme.intent.positive.bright,
        textTransform: "uppercase",
        letterSpacing: 1.4,
        fontWeight: theme.fontWeight.semibold,
    },
    headline: {
        ...text.display,
        color: theme.text.inverse,
        letterSpacing: -0.8,
    },
    support: {
        ...text.body,
        color: theme.text.inverseSecondary,
    },
    benefits: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.space.sm,
        maxWidth: theme.size.readable,
        width: "100%",
        alignSelf: "center",
    },
    benefitChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.space.xs,
        paddingHorizontal: theme.space.sm,
        paddingVertical: theme.space.xs + 2,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
    },
    benefitLabel: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.semibold,
    },
    sheet: {
        backgroundColor: theme.bg.surface,
        borderTopLeftRadius: theme.radius.lg,
        borderTopRightRadius: theme.radius.lg,
        paddingHorizontal: theme.space.screenX,
        paddingTop: theme.space.md,
        gap: theme.space.sm,
        maxWidth: theme.size.readable,
        width: "100%",
        alignSelf: "center",
    },
    sheetHandle: {
        alignSelf: "center",
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.border.subtle,
        marginBottom: theme.space.xs,
    },
    sheetTitle: {
        ...text.pageTitle,
        color: theme.text.primary,
    },
    sheetSubtitle: {
        ...text.body,
        color: theme.text.secondary,
        marginBottom: theme.space.xs,
    },
    googleButton: {
        minHeight: theme.size.tap,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.bg.inverse,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.space.sm,
        paddingHorizontal: theme.space.md,
    },
    googleIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.bg.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    googlePressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    googleDisabled: {
        opacity: 0.55,
    },
    googleLabel: {
        ...text.button,
        color: theme.text.inverse,
    },
    guestButton: {
        minHeight: theme.size.tap,
        borderRadius: theme.radius.sm,
        borderWidth: 1.5,
        borderColor: theme.border.base,
        backgroundColor: theme.bg.sunken,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.space.md,
    },
    guestPressed: {
        opacity: 0.85,
    },
    guestDisabled: {
        opacity: 0.55,
    },
    guestLabel: {
        color: theme.text.primary,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
    },
    finePrint: {
        ...text.caption,
        color: theme.text.tertiary,
        textAlign: "center",
        marginTop: theme.space.xs,
    },
});
