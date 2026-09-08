import { StyleSheet, Text, View } from "react-native";

type SnapshotCardProps = {
    label: string;
    value: string;
    caption?: string;
};

/** One-number summary for list screens (total remaining, this month spent, etc.). */
export function SnapshotCard({ label, value, caption }: SnapshotCardProps) {
    return (
        <View style={styles.card}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
            {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
    },
    label: {
        color: "#64748B",
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.3,
        textTransform: "uppercase",
    },
    value: {
        color: "#0F172A",
        fontSize: 28,
        fontWeight: "700",
        marginTop: 4,
        letterSpacing: -0.4,
    },
    caption: {
        color: "#64748B",
        fontSize: 13,
        marginTop: 4,
    },
});
