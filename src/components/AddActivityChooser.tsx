import { useTheme } from "@/app/contexts/ThemeContext";
import { elevation, text, theme } from "@/design";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type AddActivityChooserProps = {
    visible: boolean;
    onClose: () => void;
    onPickIncome: () => void;
    onPickSpending: () => void;
};

/** Pick paycheck vs everyday spending before opening the matching form. */
export function AddActivityChooser({
    visible,
    onClose,
    onPickIncome,
    onPickSpending,
}: AddActivityChooserProps) {
    const { theme: accentTheme } = useTheme();
    const styles = useMemo(() => createStyles(accentTheme), [accentTheme]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            {/* View overlay — Pressable-as-button nesting is invalid on web. */}
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss"
                />
                <View style={styles.card} accessibilityViewIsModal>
                    <Text style={styles.kicker}>Add</Text>
                    <Text style={styles.title}>What are you logging?</Text>

                    <Pressable
                        onPress={() => {
                            onClose();
                            onPickIncome();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Add paycheck"
                        style={({ pressed }) => [
                            styles.row,
                            pressed && styles.rowPressed,
                        ]}
                    >
                        <View
                            style={[
                                styles.iconWrap,
                                {
                                    backgroundColor:
                                        accentTheme.intent.positive.bg,
                                },
                            ]}
                        >
                            <Ionicons
                                name="cash-outline"
                                size={22}
                                color={accentTheme.intent.positive.fg}
                            />
                        </View>
                        <View style={styles.copy}>
                            <Text style={styles.rowTitle}>Paycheck</Text>
                            <Text style={styles.rowMeta}>
                                Income that hits your leftover
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={theme.text.tertiary}
                        />
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            onClose();
                            onPickSpending();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Add spending"
                        style={({ pressed }) => [
                            styles.row,
                            styles.rowLast,
                            pressed && styles.rowPressed,
                        ]}
                    >
                        <View
                            style={[
                                styles.iconWrap,
                                {
                                    backgroundColor: accentTheme.intent.info.bg,
                                },
                            ]}
                        >
                            <Ionicons
                                name="bag-handle-outline"
                                size={22}
                                color={accentTheme.text.accent}
                            />
                        </View>
                        <View style={styles.copy}>
                            <Text style={styles.rowTitle}>Spending</Text>
                            <Text style={styles.rowMeta}>
                                Everyday purchases
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={theme.text.tertiary}
                        />
                    </Pressable>

                    <Pressable
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel"
                        style={({ pressed }) => [
                            styles.cancel,
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <Text style={styles.cancelLabel}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

function createStyles(accentTheme: {
    overlay: string;
    bg: { surface: string };
    radius: { lg: number; pill: number };
    border: { subtle: string };
}) {
    return StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: accentTheme.overlay,
            padding: theme.space.md,
        },
        card: {
            backgroundColor: accentTheme.bg.surface,
            borderRadius: accentTheme.radius.lg,
            padding: theme.space.md,
            ...elevation.dialog,
        },
        kicker: {
            ...text.kicker,
            color: theme.text.secondary,
            marginBottom: theme.space.xs,
        },
        title: {
            ...text.pageTitle,
            marginBottom: theme.space.md,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: theme.space.sm,
            minHeight: theme.size.tap,
            paddingVertical: theme.space.sm,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: accentTheme.border.subtle,
        },
        rowLast: {
            borderBottomWidth: 0,
        },
        rowPressed: {
            opacity: 0.85,
        },
        iconWrap: {
            width: theme.size.control,
            height: theme.size.control,
            borderRadius: accentTheme.radius.pill,
            alignItems: "center",
            justifyContent: "center",
        },
        copy: {
            flex: 1,
            gap: 2,
        },
        rowTitle: {
            ...text.itemTitle,
        },
        rowMeta: {
            ...text.caption,
        },
        cancel: {
            marginTop: theme.space.sm,
            minHeight: theme.size.tap,
            alignItems: "center",
            justifyContent: "center",
        },
        cancelLabel: {
            color: theme.text.secondary,
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
        },
    });
}
