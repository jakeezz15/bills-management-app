import { useDashboardStyles } from "@/styles/dashboard";
import { theme } from "@/design";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";

type HeroPeriodNavProps = {
    label: string;
    onShift: (delta: -1 | 1) => void;
    onResetToToday: () => void;
    /** Show the "Today" hint only while viewing the current period. */
    isCurrentPeriod?: boolean;
    style?: StyleProp<ViewStyle>;
};

/** Period strip: previous / label (+ Today when current) / next. */
export function HeroPeriodNav({
    label,
    onShift,
    onResetToToday,
    isCurrentPeriod = false,
    style,
}: HeroPeriodNavProps) {
    const dashboard = useDashboardStyles();
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
                accessibilityLabel={
                    isCurrentPeriod
                        ? `Current period ${label}`
                        : `Period ${label}. Tap to jump to today.`
                }
                style={dashboard.periodLabelHit}
            >
                <Text style={dashboard.periodLabel} numberOfLines={1}>
                    {label}
                </Text>
                {isCurrentPeriod ? (
                    <Text style={dashboard.periodToday} numberOfLines={1}>
                        Today
                    </Text>
                ) : null}
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
