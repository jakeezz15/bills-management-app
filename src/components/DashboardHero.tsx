import { useTheme } from "@/app/contexts/ThemeContext";
import { AnimatedMoneyText } from "@/components/AnimatedMoneyText";
import {
    PlanStatusTone,
    planStatusAccent,
    planStatusOnInverse,
} from "@/components/plan-status";
import { useDashboardStyles } from "@/styles/dashboard";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type DashboardHeroProps = {
    kicker: string;
    value: string;
    caption: string;
    /** Plan name on a detail page — read before the money. */
    title?: string;
    percent?: number;
    pace?: ReactNode;
    header?: ReactNode;
    /** Due-status light on bill/debt detail. Omit on catalogs and receipts. */
    statusTone?: PlanStatusTone;
    onAdd?: () => void;
    addAccessibilityLabel?: string;
};

export function DashboardHero({
    kicker,
    value,
    caption,
    title,
    percent,
    pace,
    header,
    statusTone,
    onAdd,
    addAccessibilityLabel = "Add",
}: DashboardHeroProps) {
    const { theme } = useTheme();
    const dashboard = useDashboardStyles();
    const fill = Math.max(0, Math.min(100, percent ?? 0));
    const showProgress = percent !== undefined;
    const spoken = [title, kicker, value, showProgress ? `${fill} percent` : null, caption]
        .filter(Boolean)
        .join(", ");
    const accent = statusTone ? planStatusAccent(statusTone, theme) : null;
    const captionColor = statusTone
        ? planStatusOnInverse(statusTone, theme)
        : undefined;

    return (
        <View style={[dashboard.hero, accent ? dashboard.heroWithStatus : null]}>
            {accent ? (
                <View
                    style={[dashboard.heroAccent, { backgroundColor: accent }]}
                    accessibilityElementsHidden
                />
            ) : null}
            <View style={accent ? dashboard.heroMain : undefined}>
                {header}
                <View
                    style={dashboard.heroDisplay}
                    accessibilityLabel={spoken}
                >
                {title ? (
                    <Text
                        style={dashboard.heroTitle}
                        accessibilityRole="header"
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                ) : null}
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
                <Text
                    style={[
                        dashboard.heroCaption,
                        captionColor ? { color: captionColor } : null,
                    ]}
                >
                    {caption}
                </Text>

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
        </View>
    );
}

type DashboardHeroCompactProps = {
    kicker: string;
    value: string;
    amount?: number;
    formatAmount?: (amount: number) => string;
    pace?: ReactNode;
    onAdd?: () => void;
    addAccessibilityLabel?: string;
    /** Optional control on the right (e.g. Due now badge). */
    trailing?: ReactNode;
};

/** Slim sticky summary: total + optional period nav / add. */
export function DashboardHeroCompact({
    kicker,
    value,
    amount,
    formatAmount,
    pace,
    onAdd,
    addAccessibilityLabel = "Add",
    trailing,
}: DashboardHeroCompactProps) {
    const { theme } = useTheme();
    const dashboard = useDashboardStyles();
    const figure =
        amount != null && formatAmount ? (
            <AnimatedMoneyText
                amount={amount}
                format={formatAmount}
                style={dashboard.heroCompactValue}
                numberOfLines={1}
            />
        ) : (
            <Text style={dashboard.heroCompactValue} numberOfLines={1}>
                {value}
            </Text>
        );
    return (
        <View style={dashboard.heroCompact} accessibilityRole="summary">
            <View style={dashboard.heroCompactTop}>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={dashboard.heroCompactKicker} numberOfLines={1}>
                        {kicker}
                    </Text>
                    {figure}
                </View>
                {trailing}
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
