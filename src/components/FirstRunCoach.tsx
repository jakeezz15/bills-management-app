import { AppButton } from "@/components/AppButton";
import { text, theme } from "@/design";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FirstRunCoachProps = {
    visible: boolean;
    onDismiss: () => void;
};

/**
 * One-time Home coach: leftover only counts logged cash. Dismiss to mark
 * first-run complete (the old flag was a silent no-op).
 */
export function FirstRunCoach({ visible, onDismiss }: FirstRunCoachProps) {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onDismiss}
        >
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onDismiss}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss"
                />
                <View
                    style={[
                        styles.card,
                        {
                            marginBottom: Math.max(
                                insets.bottom,
                                theme.space.lg
                            ),
                        },
                    ]}
                >
                    <Text style={styles.kicker}>Quick tip</Text>
                    <Text style={styles.title} accessibilityRole="header">
                        How leftover works
                    </Text>
                    <Text style={styles.body}>
                        Leftover is a running balance from money you’ve actually
                        logged — income in, then spending, bill payments, debt
                        payments, and savings contributions.
                    </Text>
                    <Text style={styles.body}>
                        Unpaid bills and planned monthly savings stay on Plans
                        so you still see what’s due. They don’t reduce leftover
                        until you log them.
                    </Text>
                    <AppButton label="Got it" onPress={onDismiss} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
});
