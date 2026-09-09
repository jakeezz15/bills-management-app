import { elevation, theme } from "@/design";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet } from "react-native";

type FloatingAddButtonProps = {
    onPress: () => void;
    accessibilityLabel: string;
};

/** Primary add control for list screens. Sits above the tab bar, not in the hero. */
export function FloatingAddButton({
    onPress,
    accessibilityLabel,
}: FloatingAddButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        >
            <Ionicons name="add" size={28} color={theme.action.primary.fg} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: "absolute",
        right: theme.space.md,
        bottom: theme.space.md,
        width: theme.size.fab,
        height: theme.size.fab,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.action.primary.bg,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
        ...elevation.floating,
    },
    pressed: {
        opacity: 0.9,
        transform: [{ scale: 0.96 }],
    },
});
