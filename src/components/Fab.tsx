import { theme } from "@/theme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet } from "react-native";

type FabProps = {
    onPress: () => void;
    accessibilityLabel?: string;
};

/** 56pt primary FAB, sits above the tab bar. */
export function Fab({
    onPress,
    accessibilityLabel = "Add",
}: FabProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        >
            <Ionicons name="add" size={28} color={theme.color.inverse} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: "absolute",
        right: theme.space.lg,
        bottom: theme.space.lg,
        width: theme.size.fab,
        height: theme.size.fab,
        borderRadius: theme.size.fab / 2,
        backgroundColor: theme.color.primary,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
    },
    pressed: {
        opacity: 0.9,
    },
});
