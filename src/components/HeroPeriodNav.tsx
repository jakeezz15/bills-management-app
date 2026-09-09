import { dashboard } from "@/styles/dashboard";
import { theme } from "@/theme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";

type HeroPeriodNavProps = {
    label: string;
    onShift: (delta: -1 | 1) => void;
    onResetToToday: () => void;
    style?: StyleProp<ViewStyle>;
};

/** Period strip: previous / label (tap = today) / next. No full-screen swipe. */
export function HeroPeriodNav({
    label,
    onShift,
    onResetToToday,
    style,
}: HeroPeriodNavProps) {
    return (
        <View style={[dashboard.periodRow, style]}>
            <Pressable
                onPress={() => onShift(-1)}
                hitSlop={16}
                accessibilityLabel="Previous period"
                style={dashboard.periodChevron}
            >
                <Ionicons
                    name="chevron-back"
                    size={20}
                    color={theme.color.onHeroMuted}
                />
            </Pressable>
            <Pressable
                onPress={onResetToToday}
                style={{ flex: 1 }}
                accessibilityLabel={`Current period ${label}. Tap to jump to today.`}
            >
                <Text style={dashboard.periodLabel}>{label}</Text>
            </Pressable>
            <Pressable
                onPress={() => onShift(1)}
                hitSlop={16}
                accessibilityLabel="Next period"
                style={dashboard.periodChevron}
            >
                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.color.onHeroMuted}
                />
            </Pressable>
        </View>
    );
}
