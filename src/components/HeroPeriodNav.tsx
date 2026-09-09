import { dashboard } from "@/styles/dashboard";
import { theme } from "@/design";
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
                accessibilityRole="button"
                accessibilityLabel="Previous period"
                style={dashboard.periodChevron}
            >
                <Ionicons
                    name="chevron-back"
                    size={20}
                    color={theme.text.inverseTertiary}
                />
            </Pressable>
            <Pressable
                onPress={onResetToToday}
                accessibilityRole="button"
                accessibilityLabel={`Current period ${label}. Tap to jump to today.`}
                style={dashboard.periodLabelHit}
            >
                <Text style={dashboard.periodLabel} numberOfLines={1}>
                    {label}
                </Text>
            </Pressable>
            <Pressable
                onPress={() => onShift(1)}
                accessibilityRole="button"
                accessibilityLabel="Next period"
                style={dashboard.periodChevron}
            >
                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.text.inverseTertiary}
                />
            </Pressable>
        </View>
    );
}
