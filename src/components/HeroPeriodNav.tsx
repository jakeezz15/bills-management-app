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
    /**
     * `inverse` for dark mastheads / heroes; `default` for light canvas
     * (Calendar tab).
     */
    tone?: "inverse" | "default";
    style?: StyleProp<ViewStyle>;
};

/** Period strip: previous / label (+ Today when current) / next. */
export function HeroPeriodNav({
    label,
    onShift,
    onResetToToday,
    isCurrentPeriod = false,
    tone = "inverse",
    style,
}: HeroPeriodNavProps) {
    const dashboard = useDashboardStyles();
    const onLight = tone === "default";
    const chevronColor = onLight
        ? theme.text.secondary
        : theme.text.inverseTertiary;
    const labelStyle = onLight
        ? styles.labelDefault
        : dashboard.periodLabel;
    const todayStyle = onLight
        ? styles.todayDefault
        : dashboard.periodToday;

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
                    color={chevronColor}
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
                <Text style={labelStyle} numberOfLines={1}>
                    {label}
                </Text>
                {isCurrentPeriod ? (
                    <Text style={todayStyle} numberOfLines={1}>
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
                    color={chevronColor}
                />
            </Pressable>
        </View>
    );
}

const styles = {
    labelDefault: {
        color: theme.text.primary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.semibold,
        textAlign: "center" as const,
        includeFontPadding: false,
        textAlignVertical: "center" as const,
    },
    todayDefault: {
        color: theme.text.secondary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        textAlign: "center" as const,
    },
};
