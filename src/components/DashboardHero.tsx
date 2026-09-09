import { dashboard } from "@/styles/dashboard";
import { theme } from "@/design";
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
    const fill = Math.max(0, Math.min(100, percent ?? 0));
    const showProgress = percent !== undefined;

    return (
        <View style={dashboard.hero}>
            <View
                style={dashboard.heroDisplay}
                accessibilityLabel={
                    showProgress
                        ? `${kicker}, ${value}, ${fill} percent`
                        : undefined
                }
            >
                <View style={dashboard.heroEyebrow}>
                    <Text style={dashboard.heroKicker}>{kicker}</Text>
                    {showProgress ? (
                        <Text style={dashboard.heroPct}>{fill}%</Text>
                    ) : null}
                </View>

                <Text
                    style={dashboard.heroValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                >
                    {value}
                </Text>
                <Text style={dashboard.heroCaption}>{caption}</Text>

                {showProgress ? (
                    <View
                        style={dashboard.heroTide}
                        accessibilityElementsHidden
                    >
                        <View
                            style={[
                                dashboard.barFill,
                                {
                                    width: `${fill}%`,
                                    backgroundColor: theme.intent.positive.bright,
                                },
                            ]}
                        />
                    </View>
                ) : null}
            </View>

            {pace || onAdd ? (
                <View style={dashboard.heroTools}>
                    <View style={dashboard.heroToolsMain}>
                        {typeof pace === "string" ? (
                            <Text
                                style={dashboard.heroDockText}
                                numberOfLines={2}
                            >
                                {pace}
                            </Text>
                        ) : (
                            pace
                        )}
                    </View>
                    {onAdd ? (
                        <Pressable
                            onPress={onAdd}
                            style={({ pressed }) => [
                                dashboard.heroToolsAdd,
                                pressed && { opacity: 0.82 },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={addAccessibilityLabel}
                            hitSlop={8}
                        >
                            <Ionicons
                                name="add"
                                size={22}
                                color={theme.text.inverse}
                            />
                        </Pressable>
                    ) : null}
                </View>
            ) : null}
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
                        style={({ pressed }) => [
                            dashboard.heroCompactAdd,
                            pressed && { opacity: 0.82 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={addAccessibilityLabel}
                        hitSlop={8}
                    >
                        <Ionicons
                            name="add"
                            size={20}
                            color={theme.text.primary}
                        />
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
