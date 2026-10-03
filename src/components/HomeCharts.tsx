import { useLocale } from "@/app/contexts/LocaleContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { iconForExpenseCategory } from "@/constants/categoryIcons";
import { text, type Theme } from "@/design";
import { useDashboardStyles } from "@/styles/dashboard";
import { CategorySpend, MonthTrendPoint } from "@/utils/finance";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

const CHART_BAR_HEIGHT = 12;
const TREND_TRACK_HEIGHT = 128;

type SpendByCategoryChartProps = {
    rows: CategorySpend[];
};

export function SpendByCategoryChart({ rows }: SpendByCategoryChartProps) {
    const { theme } = useTheme();
    const styles = useMemo(() => createChartStyles(theme), [theme]);
    const dashboard = useDashboardStyles();
    const { formatMoney } = useLocale();

    if (rows.length === 0) {
        return null;
    }

    const max = Math.max(...rows.map((row) => row.amount), 1);
    const total = rows.reduce((sum, row) => sum + row.amount, 0);

    return (
        <View style={[dashboard.card, styles.card]}>
            <Text style={[dashboard.sectionLabel, styles.cardTitle]}>
                Spend by category
            </Text>
            <Text style={styles.caption}>Selected period only</Text>
            {rows.map((row, index) => {
                const share = total > 0 ? (row.amount / total) * 100 : 0;
                const color = theme.chart[index % theme.chart.length];
                return (
                    <View key={row.category} style={styles.row}>
                        <View style={styles.rowTop}>
                            <View style={styles.legend}>
                                <Ionicons
                                    name={iconForExpenseCategory(row.category)}
                                    size={18}
                                    color={color}
                                />
                                <Text style={styles.label} numberOfLines={1}>
                                    {row.category}
                                </Text>
                            </View>
                            <Text style={styles.value}>
                                {formatMoney(row.amount, { compact: true })}
                                <Text style={styles.share}>
                                    {" "}
                                    · {Math.round(share)}%
                                </Text>
                            </Text>
                        </View>
                        <View style={styles.chartBarTrack}>
                            <View
                                style={[
                                    styles.chartBarFill,
                                    {
                                        width: `${(row.amount / max) * 100}%`,
                                        backgroundColor: color,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

type MonthTrendChartProps = {
    points: MonthTrendPoint[];
};

export function MonthTrendChart({ points }: MonthTrendChartProps) {
    const { theme } = useTheme();
    const styles = useMemo(() => createChartStyles(theme), [theme]);
    const dashboard = useDashboardStyles();
    const { formatMoney } = useLocale();

    if (points.length === 0) {
        return null;
    }

    const maxAbs = Math.max(
        ...points.map((point) => Math.abs(point.leftover)),
        1
    );

    return (
        <View style={[dashboard.card, styles.card]}>
            <Text style={[dashboard.sectionLabel, styles.cardTitle]}>
                Leftover trend
            </Text>
            <Text style={styles.caption}>
                Running balance at the end of each month
            </Text>
            <View style={styles.trendRow}>
                {points.map((point) => {
                    const height = Math.max(
                        8,
                        (Math.abs(point.leftover) / maxAbs) *
                            TREND_TRACK_HEIGHT
                    );
                    const positive = point.leftover >= 0;

                    return (
                        <View key={point.key} style={styles.trendCol}>
                            <Text
                                style={[
                                    styles.trendAmount,
                                    {
                                        color: positive
                                            ? theme.money.in.fg
                                            : theme.money.out.fg,
                                    },
                                ]}
                                numberOfLines={1}
                            >
                                {formatMoney(point.leftover, { compact: true })}
                            </Text>
                            <View style={styles.trendTrack}>
                                <View
                                    style={[
                                        styles.trendBar,
                                        {
                                            height,
                                            backgroundColor: positive
                                                ? theme.money.in.solid
                                                : theme.money.out.solid,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.trendLabel}>{point.label}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

function createChartStyles(theme: Theme) {
    return StyleSheet.create({
        card: {
            marginTop: theme.space.md,
        },
        cardTitle: {
            marginTop: 0,
        },
        caption: {
            ...text.caption,
            marginBottom: theme.space.md,
        },
        chartBarTrack: {
            height: CHART_BAR_HEIGHT,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.track.base,
            overflow: "hidden",
        },
        chartBarFill: {
            height: CHART_BAR_HEIGHT,
            borderRadius: theme.radius.pill,
        },
        row: {
            marginBottom: theme.space.lg,
        },
        rowTop: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: theme.space.sm,
            gap: theme.space.sm,
        },
        legend: {
            flexDirection: "row",
            alignItems: "center",
            gap: theme.space.sm,
            flex: 1,
        },
        label: {
            ...text.body,
            fontWeight: theme.fontWeight.semibold,
            flex: 1,
        },
        value: {
            ...text.body,
            fontWeight: theme.fontWeight.bold,
            fontVariant: ["tabular-nums"],
        },
        share: {
            color: theme.text.tertiary,
            fontWeight: theme.fontWeight.regular,
        },
        trendRow: {
            flexDirection: "row",
            alignItems: "flex-end",
            gap: theme.space.sm,
            minHeight: TREND_TRACK_HEIGHT + 56,
        },
        trendCol: {
            flex: 1,
            alignItems: "center",
        },
        trendAmount: {
            fontSize: theme.fontSize.xs,
            lineHeight: theme.lineHeight.xs,
            fontWeight: theme.fontWeight.semibold,
            marginBottom: theme.space.sm,
            fontVariant: ["tabular-nums"],
        },
        trendTrack: {
            height: TREND_TRACK_HEIGHT,
            width: "100%",
            justifyContent: "flex-end",
            alignItems: "center",
        },
        trendBar: {
            width: "70%",
            borderRadius: theme.radius.sm,
            minHeight: theme.size.bar,
        },
        trendLabel: {
            color: theme.text.primary,
            fontSize: theme.fontSize.xs,
            lineHeight: theme.lineHeight.xs,
            fontWeight: theme.fontWeight.semibold,
            marginTop: theme.space.sm,
        },
    });
}
