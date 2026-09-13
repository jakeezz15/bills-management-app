import { AppButton } from "@/components/AppButton";
import { useTheme } from "@/app/contexts/ThemeContext";
import { text } from "@/design";
import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    FadeInDown,
    ReduceMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWalkthrough } from "./WalkthroughContext";

/**
 * First-run prompt: start the spotlight tour or skip.
 */
export function WalkthroughOffer() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { phase, start, declineOffer } = useWalkthrough();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                overlay: {
                    flex: 1,
                    justifyContent: "flex-end",
                    backgroundColor: theme.overlay,
                    paddingHorizontal: theme.space.screenX,
                },
                card: {
                    backgroundColor: theme.bg.surface,
                    borderRadius: theme.radius.lg,
                    padding: theme.space.lg,
                    gap: theme.space.md,
                    marginBottom: Math.max(insets.bottom, theme.space.lg),
                },
                kicker: text.sectionLabel,
                title: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.xl,
                    lineHeight: theme.lineHeight.xl,
                    fontWeight: theme.fontWeight.bold,
                    letterSpacing: -0.4,
                },
                body: {
                    ...text.body,
                    color: theme.text.secondary,
                },
                actions: {
                    gap: theme.space.sm,
                },
                skip: {
                    alignSelf: "center",
                    paddingVertical: theme.space.sm,
                },
                skipText: {
                    color: theme.text.tertiary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                },
            }),
        [theme, insets.bottom]
    );

    if (phase !== "offer") {
        return null;
    }

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={declineOffer}
        >
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={declineOffer}
                    accessibilityRole="button"
                    accessibilityLabel="Skip walkthrough"
                />
                <Animated.View
                    entering={FadeInDown.duration(380).reduceMotion(
                        ReduceMotion.System
                    )}
                    style={styles.card}
                >
                    <Text style={styles.kicker}>Quick start</Text>
                    <Text style={styles.title} accessibilityRole="header">
                        Want a quick walkthrough?
                    </Text>
                    <Text style={styles.body}>
                        We’ll highlight the vital spots — leftover, logging
                        money, plans, and settings. You can skip anytime.
                    </Text>
                    <View style={styles.actions}>
                        <AppButton label="Yes, show me" onPress={start} />
                        <Pressable
                            onPress={declineOffer}
                            accessibilityRole="button"
                            accessibilityLabel="Skip walkthrough"
                            style={styles.skip}
                        >
                            <Text style={styles.skipText}>Skip for now</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}
