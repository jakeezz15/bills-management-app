import { dashboard } from "@/styles/dashboard";
import { theme } from "@/theme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type DashboardHeroProps = {
    kicker: string;
    value: string;
    caption: string;
    percent?: number;
    pace?: ReactNode;
    onAdd?: () => void;
    addAccessibilityLabel?: string;
};

export function DashboardHero({
    kicker,
    value,
    caption,
    percent,
    pace,
    onAdd,
    addAccessibilityLabel = "Add",
}: DashboardHeroProps) {
    const width = Math.max(0, Math.min(100, percent ?? 0));

    return (
        <View style={dashboard.hero}>
            <View style={dashboard.heroTop}>
                <View style={{ flex: 1 }}>
                    <Text style={dashboard.heroKicker}>{kicker}</Text>
                    <Text style={dashboard.heroValue}>{value}</Text>
                    <Text style={dashboard.heroCaption}>{caption}</Text>
                </View>
                {onAdd ? (
                    <Pressable
                        onPress={onAdd}
                        style={dashboard.heroAdd}
                        accessibilityLabel={addAccessibilityLabel}
                    >
                        <Ionicons name="add" size={22} color={theme.color.ink} />
                    </Pressable>
                ) : null}
            </View>

            {percent !== undefined ? (
                <View style={dashboard.heroBarTrack}>
                    <View style={[dashboard.heroBarFill, { width: `${width}%` }]} />
                </View>
            ) : null}

            {typeof pace === "string" ? (
                <Text style={dashboard.heroPace}>{pace}</Text>
            ) : (
                pace
            )}
        </View>
    );
}

type DashboardHeroCompactProps = {
    kicker: string;
    value: string;
    pace?: ReactNode;
    onAdd?: () => void;
    addAccessibilityLabel?: string;
};

/** Slim sticky summary: total + optional period nav / add. */
export function DashboardHeroCompact({
    kicker,
    value,
    pace,
    onAdd,
    addAccessibilityLabel = "Add",
}: DashboardHeroCompactProps) {
    return (
        <View style={dashboard.heroCompact} accessibilityRole="summary">
            <View style={dashboard.heroCompactTop}>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={dashboard.heroCompactKicker} numberOfLines={1}>
                        {kicker}
                    </Text>
                    <Text style={dashboard.heroCompactValue} numberOfLines={1}>
                        {value}
                    </Text>
                </View>
                {onAdd ? (
                    <Pressable
                        onPress={onAdd}
                        style={dashboard.heroCompactAdd}
                        accessibilityLabel={addAccessibilityLabel}
                        hitSlop={8}
                    >
                        <Ionicons name="add" size={20} color={theme.color.ink} />
                    </Pressable>
                ) : null}
            </View>
            {typeof pace === "string" ? (
                <Text style={dashboard.heroCompactPaceText} numberOfLines={1}>
                    {pace}
                </Text>
            ) : (
                pace
            )}
        </View>
    );
}
