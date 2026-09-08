import { dashboard } from "@/styles/dashboard";
import { theme } from "@/theme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View } from "react-native";

type HeroPeriodNavProps = {
    label: string;
    onShift: (delta: -1 | 1) => void;
    onResetToToday: () => void;
};

export function HeroPeriodNav({
    label,
    onShift,
    onResetToToday,
}: HeroPeriodNavProps) {
    return (
        <View style={dashboard.periodRow}>
            <Pressable
                onPress={() => onShift(-1)}
                hitSlop={8}
                accessibilityLabel="Previous period"
            >
                <Ionicons name="chevron-back" size={18} color={theme.color.onHeroMuted} />
            </Pressable>
            <Pressable onPress={onResetToToday} style={{ flex: 1 }}>
                <Text style={dashboard.periodLabel}>{label}</Text>
            </Pressable>
            <Pressable
                onPress={() => onShift(1)}
                hitSlop={8}
                accessibilityLabel="Next period"
            >
                <Ionicons name="chevron-forward" size={18} color={theme.color.onHeroMuted} />
            </Pressable>
        </View>
    );
}
