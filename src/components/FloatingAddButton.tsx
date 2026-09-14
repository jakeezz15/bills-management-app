import { useTheme } from "@/app/contexts/ThemeContext";
import { WalkthroughAnchor } from "@/components/walkthrough/WalkthroughAnchor";
import { elevation } from "@/design";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";

type FloatingAddButtonProps = {
    onPress: () => void;
    accessibilityLabel: string;
    walkthroughId?: "activity-add";
};

/** Primary add control for list screens. Sits above the tab bar, not in the hero. */
export function FloatingAddButton({
    onPress,
    accessibilityLabel,
    walkthroughId,
}: FloatingAddButtonProps) {
    const { theme } = useTheme();
    const styles = useMemo(
        () =>
            StyleSheet.create({
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
                fabFill: {
                    width: theme.size.fab,
                    height: theme.size.fab,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.action.primary.bg,
                    alignItems: "center",
                    justifyContent: "center",
                },
                pressed: {
                    opacity: 0.9,
                    transform: [{ scale: 0.96 }],
                },
            }),
        [theme]
    );

    const button = (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={({ pressed }) => [
                walkthroughId ? styles.fabFill : styles.fab,
                pressed && styles.pressed,
            ]}
        >
            <Ionicons name="add" size={28} color={theme.action.primary.fg} />
        </Pressable>
    );

    if (!walkthroughId) {
        return button;
    }

    return (
        <WalkthroughAnchor id={walkthroughId} style={styles.fab}>
            {button}
        </WalkthroughAnchor>
    );
}
