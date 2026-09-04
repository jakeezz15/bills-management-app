import { Pressable, StyleSheet, Text, View } from "react-native";

// Suggested future change: wait until you approve an API change
type FinanceRowProps = {
    label: string;
    amount: number;
    subtitle?: string;
    isPaid?: boolean;
    isRecurring?: boolean;
    onPress?: () => void;

}

export function FinanceRow({
    label,
    amount,
    subtitle,
    onPress
}: FinanceRowProps) {
    return (
        <Pressable onPress={onPress}>
            <View style={styles.row}>
                {/* Suggested addition: controls the left-side width */}
                <View style={styles.details}>
                    <Text
                        style={styles.label}

                        // Suggested addition: prevents long labels from
                        // pushing the amount outside the row
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {label}
                    </Text>

                    {subtitle ? (
                        <Text
                            style={styles.subtitle}

                            // Suggested addition: protects the row layout
                            numberOfLines={1}
                        >
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                <Text
                    style={styles.amount}

                    // Suggested addition: protects the amount layout
                    numberOfLines={1}
                >
                    {/* Suggested change: consistent decimal formatting */}
                    ${amount.toFixed(2)}
                </Text>
            </View>
        </Pressable>

    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",

        // Suggested design adjustments
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 10,
    },

    // Suggested addition: allows the label to shrink safely
    details: {
        flex: 1,
        marginRight: 16,
    },

    label: {
        fontSize: 16,
        fontWeight: "600",

        // Suggested design adjustment
        color: "#0F172A",
    },

    subtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 4,
    },

    amount: {
        fontSize: 16,
        fontWeight: "700",

        // Suggested design additions
        color: "#0F172A",
        textAlign: "right",
    }
});