import { useLocale } from "@/app/contexts/LocaleContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { text, type Theme } from "@/design";
import { useDashboardStyles } from "@/styles/dashboard";
import { CategorySpend, MonthTrendPoint } from "@/utils/finance";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type SpendByCategoryChartProps = {
    rows: CategorySpend[];
};

export function SpendByCategoryChart({ rows }: SpendByCategoryChartProps) {
    const { theme } = useTheme();
    const styles = useMemo(() => createChartStyles(theme), [theme]);
    const dashboard = useDashboardStyles();
    const { formatMoney } = useLocale();
    const max = Math.max(...rows.map((row) => row.amount), 1);
    const total = rows.reduce((sum, row) => sum + row.amount, 0);

    return (
        <View style={styles.card}>
            <Text style={dashboard.sectionLabel}>Spend by category</Text>
            <Text style={styles.caption}>Selected period only</Text>
            {rows.length === 0 ? (
                <Text style={styles.empty}>
                    No everyday spending in this period yet.
                </Text>
            ) : (
                rows.map((row, index) => {
                    const share = total > 0 ? (row.amount / total) * 100 : 0;
                    const color = theme.chart[index % theme.chart.length];
                    return (
                        <View key={row.category} style={styles.row}>
                            <View style={styles.rowTop}>
                                <View style={styles.legend}>
                                    <View
                                        style={[
                                            styles.dot,
                                            { backgroundColor: color },
                                        ]}
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
                            <View style={dashboard.barTrack}>
                                <View
                                    style={[
                                        dashboard.barFill,
                                        {
                                            width: `${(row.amount / max) * 100}%`,
                                            backgroundColor: color,
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    );
                })
            )}
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
    const maxAbs = Math.max(
        ...points.map((point) => Math.abs(point.leftover)),
        1
    );

    return (
        <View style={styles.card}>
            <Text style={dashboard.sectionLabel}>Leftover trend</Text>
            <Text style={styles.caption}>
                Running balance at the end of each month
            </Text>
            <View style={styles.trendRow}>
                {points.map((point) => {
                    const height = Math.max(
                        8,
                        (Math.abs(point.leftover) / maxAbs) * 96
                    );
                    const positive = point.leftover >= 0;

                    return (
                        <View key={point.key} style={styles.trendCol}>
                            <Text style={styles.trendAmount} numberOfLines={1}>
                                {formatMoney(point.leftover, { compact: true })}
                            </Text>
                            <View style={styles.trendTrack}>
                                <View
                                    style={[
                                        styles.trendBar,
                                        {
                                            height,
                                            backgroundColor: positive
                                                ? theme.intent.positive.solid
                                                : theme.intent.negative.fg,
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
            marginTop: theme.space.lg,
            marginBottom: theme.space.sm,
            paddingHorizontal: 0,
            paddingTop: 0,
            paddingBottom: theme.space.sm,
        },
        empty: {
            ...text.caption,
            marginBottom: theme.space.sm,
        },
        caption: {
            ...text.caption,
            marginBottom: theme.space.md,
        },
        row: {
            marginBottom: theme.space.md,
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
        dot: {
            width: theme.space.sm,
            height: theme.space.sm,
            borderRadius: theme.radius.pill,
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
            minHeight: 144,
        },
        trendCol: {
            flex: 1,
            alignItems: "center",
        },
        trendAmount: {
            color: theme.text.secondary,
            fontSize: theme.fontSize.xs,
            lineHeight: theme.lineHeight.xs,
            fontWeight: theme.fontWeight.semibold,
            marginBottom: theme.space.sm,
            fontVariant: ["tabular-nums"],
        },
        trendTrack: {
            height: 96,
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
