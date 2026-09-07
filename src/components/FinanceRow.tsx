import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type FinanceRowProps = {
    label: string;
    amount: number;
    subtitle?: string;
    isPaid?: boolean;
    dueTone?: "overdue" | "due-soon" | "default";
    onPress?: () => void;
    onTogglePaid?: () => void;
};

export function FinanceRow({
    label,
    amount,
    subtitle,
    isPaid,
    dueTone = "default",
    onPress,
    onTogglePaid,
}: FinanceRowProps) {
    const subtitleColor =
        dueTone === "overdue"
            ? "#DC2626"
            : dueTone === "due-soon"
                ? "#B45309"
                : "#64748B";

    return (
        <View style={[styles.row, isPaid && styles.rowPaid]}>
            {onTogglePaid ? (
                <Pressable
                    onPress={onTogglePaid}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                        isPaid ? "Mark as unpaid" : "Mark as paid"
                    }
                    style={styles.paidToggle}
                >
                    <Ionicons
                        name={isPaid ? "checkmark-circle" : "ellipse-outline"}
                        size={26}
                        color={isPaid ? "#15803D" : "#94A3B8"}
                    />
                </Pressable>
            ) : null}

            <Pressable style={styles.mainPress} onPress={onPress}>
                <View style={styles.details}>
                    <Text
                        style={[styles.label, isPaid && styles.labelPaid]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {label}
                    </Text>

                    {subtitle ? (
                        <Text
                            style={[styles.subtitle, { color: subtitleColor }]}
                            numberOfLines={1}
                        >
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                <Text
                    style={[styles.amount, isPaid && styles.amountPaid]}
                    numberOfLines={1}
                >
                    ${amount.toFixed(2)}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 10,
    },

    rowPaid: {
        backgroundColor: "#F8FAFC",
        borderColor: "#DCFCE7",
    },

    paidToggle: {
        marginRight: 10,
    },

    mainPress: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    details: {
        flex: 1,
        marginRight: 16,
    },

    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0F172A",
    },

    labelPaid: {
        color: "#64748B",
        textDecorationLine: "line-through",
    },

    subtitle: {
        fontSize: 12,
        marginTop: 4,
    },

    amount: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
        textAlign: "right",
    },

    amountPaid: {
        color: "#94A3B8",
    },
});
