import { text, theme } from "@/design";
import { dashboard } from "@/styles/dashboard";
import { parseIsoDate } from "@/utils/date";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/** Stable accent from a label (category / source). */
export function accentForLabel(label: string): string {
    let hash = 0;
    for (let i = 0; i < label.length; i += 1) {
        hash = (hash + label.charCodeAt(i) * (i + 1)) % 997;
    }
    return theme.chart[hash % theme.chart.length];
}

/** Section title like "Sep 7" or "Sep 7, 2025" when not this year. */
export function formatLedgerDayHeader(iso: string, today = new Date()): string {
    const parsed = parseIsoDate(iso);
    if (!parsed) {
        return iso;
    }
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const month = months[parsed.getMonth()];
    const day = parsed.getDate();
    if (parsed.getFullYear() === today.getFullYear()) {
        return `${month} ${day}`;
    }
    return `${month} ${day}, ${parsed.getFullYear()}`;
}

export type LedgerDayGroupModel<T> = {
    date: string;
    label: string;
    items: T[];
};

/** Newest day first; items within a day newest-first if they share a date. */
export function groupByLedgerDate<T extends { date: string }>(
    items: T[]
): LedgerDayGroupModel<T>[] {
    const map = new Map<string, T[]>();
    for (const item of items) {
        const list = map.get(item.date) ?? [];
        list.push(item);
        map.set(item.date, list);
    }

    return [...map.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dayItems]) => ({
            date,
            label: formatLedgerDayHeader(date),
            items: dayItems,
        }));
}

type LedgerDayGroupProps = {
    label: string;
    children: ReactNode;
};

export function LedgerDayGroup({ label, children }: LedgerDayGroupProps) {
    return (
        <View style={styles.section}>
            <Text style={dashboard.sectionLabel}>{label}</Text>
            <View style={styles.sheet}>{children}</View>
        </View>
    );
}

type LedgerRowProps = {
    title: string;
    meta: string;
    amountLabel: string;
    accentColor?: string;
    isLast?: boolean;
    onPress: () => void;
};

export function LedgerRow({
    title,
    meta,
    amountLabel,
    accentColor = theme.action.primary.bg,
    isLast = false,
    onPress,
}: LedgerRowProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.row,
                !isLast && styles.rowBorder,
                pressed && styles.rowPressed,
            ]}
        >
            <View style={[styles.accent, { backgroundColor: accentColor }]} />
            <Text style={styles.title} numberOfLines={1}>
                {title}
            </Text>
            <View style={styles.pill}>
                <Text style={styles.pillText} numberOfLines={1}>
                    {meta}
                </Text>
            </View>
            <Text style={styles.amount} numberOfLines={1}>
                {amountLabel}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: theme.space.md,
    },
    sheet: {
        backgroundColor: theme.bg.surface,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border.subtle,
        overflow: "hidden",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: theme.size.tap,
        paddingVertical: theme.space.sm,
        paddingRight: theme.space.md,
        paddingLeft: theme.space.sm,
        gap: theme.space.sm,
    },
    rowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border.subtle,
    },
    rowPressed: {
        backgroundColor: theme.bg.sunken,
    },
    accent: {
        width: 3,
        alignSelf: "stretch",
        borderRadius: theme.radius.pill,
        marginVertical: theme.space.xs,
    },
    title: {
        ...text.itemTitle,
        flex: 1,
        minWidth: 64,
    },
    pill: {
        flexShrink: 1,
        maxWidth: "36%",
        paddingHorizontal: theme.space.sm,
        paddingVertical: theme.space.xs,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.intent.info.bg,
    },
    pillText: {
        color: theme.text.accent,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.bold,
    },
    amount: {
        ...text.money,
        minWidth: 56,
        textAlign: "right",
    },
});
