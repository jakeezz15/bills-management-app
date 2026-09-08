import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, Text } from "react-native";

type AddListRowProps = {
    label: string;
    onPress: () => void;
};

/** iOS Reminders-style create row — sits in the list, not in the date chrome. */
export function AddListRow({ label, onPress }: AddListRowProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
            <Ionicons name="add-circle" size={28} color="#2563EB" />
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    pressed: {
        opacity: 0.6,
    },
    label: {
        color: "#2563EB",
        fontSize: 16,
        fontWeight: "600",
    },
});
