import { dashboard } from "@/styles/dashboard";
import { theme } from "@/design";
import { goBackOrReplace } from "@/utils/navigation";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type DetailHeroNavProps = {
    backLabel: string;
    fallbackHref: Href;
    onEdit: () => void;
    editAccessibilityLabel: string;
};

/**
 * Dark-hero Back + Edit. Detail pages pass labels; the layout stays one place.
 */
export function DetailHeroNav({
    backLabel,
    fallbackHref,
    onEdit,
    editAccessibilityLabel,
}: DetailHeroNavProps) {
    return (
        <View style={dashboard.heroNav}>
            <Pressable
                onPress={() => goBackOrReplace(fallbackHref)}
                style={({ pressed }) => [
                    dashboard.heroNavSide,
                    pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={8}
            >
                <Ionicons
                    name="chevron-back"
                    size={22}
                    color={theme.text.inverse}
                />
                <Text style={dashboard.heroNavLabel}>{backLabel}</Text>
            </Pressable>
            <Pressable
                onPress={onEdit}
                style={({ pressed }) => [
                    dashboard.heroNavSide,
                    pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={editAccessibilityLabel}
                hitSlop={8}
            >
                <Text style={dashboard.heroNavLabel}>Edit</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    pressed: {
        opacity: 0.82,
    },
});
