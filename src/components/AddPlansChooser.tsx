import { useTheme } from "@/app/contexts/ThemeContext";
import { elevation, text, theme } from "@/design";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type AddPlansChooserProps = {
    visible: boolean;
    onClose: () => void;
    onPickBill: () => void;
    onPickSavings: () => void;
    onPickDebt: () => void;
};

/** Pick bill, savings goal, or debt before opening that catalog’s form. */
export function AddPlansChooser({
    visible,
    onClose,
    onPickBill,
    onPickSavings,
    onPickDebt,
}: AddPlansChooserProps) {
    const { theme: accentTheme } = useTheme();
    const styles = useMemo(() => createStyles(accentTheme), [accentTheme]);

    const rows = [
        {
            key: "bill",
            title: "Bill",
            meta: "Rent, utilities, subscriptions",
            icon: "receipt-outline" as const,
            onPress: onPickBill,
            label: "Add bill",
            bg: accentTheme.intent.info.bg,
            fg: accentTheme.text.accent,
        },
        {
            key: "savings",
            title: "Savings goal",
            meta: "Emergency fund, trip, or target",
            icon: "flag-outline" as const,
            onPress: onPickSavings,
            label: "Add savings goal",
            bg: accentTheme.intent.positive.bg,
            fg: accentTheme.intent.positive.fg,
        },
        {
            key: "debt",
            title: "Debt",
            meta: "Loan or installment balance",
            icon: "card-outline" as const,
            onPress: onPickDebt,
            label: "Add debt",
            bg: accentTheme.intent.caution.bg,
            fg: accentTheme.intent.caution.fg,
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss"
                />
                <View style={styles.card} accessibilityViewIsModal>
                    <Text style={styles.kicker}>Add</Text>
                    <Text style={styles.title}>What are you planning?</Text>

                    {rows.map((row, index) => (
                        <Pressable
                            key={row.key}
                            onPress={() => {
                                onClose();
                                row.onPress();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={row.label}
                            style={({ pressed }) => [
                                styles.row,
                                index === rows.length - 1 && styles.rowLast,
                                pressed && styles.rowPressed,
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconWrap,
                                    { backgroundColor: row.bg },
                                ]}
                            >
                                <Ionicons
                                    name={row.icon}
                                    size={22}
                                    color={row.fg}
                                />
                            </View>
                            <View style={styles.copy}>
                                <Text style={styles.rowTitle}>{row.title}</Text>
                                <Text style={styles.rowMeta}>{row.meta}</Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={18}
                                color={theme.text.tertiary}
                            />
                        </Pressable>
                    ))}

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
