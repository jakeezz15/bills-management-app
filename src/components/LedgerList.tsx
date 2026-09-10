import { dashboard } from "@/styles/dashboard";
import { theme } from "@/theme";
import { parseIsoDate } from "@/utils/date";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const ACCENT_PALETTE = [
    theme.color.accent,
    theme.color.success,
    theme.color.warningBright,
    theme.color.info,
    theme.color.muted,
];

/** Stable accent from a label (category / source). */
export function accentForLabel(label: string): string {
    let hash = 0;
    for (let i = 0; i < label.length; i += 1) {
        hash = (hash + label.charCodeAt(i) * (i + 1)) % 997;
    }
    return ACCENT_PALETTE[hash % ACCENT_PALETTE.length];
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
    accentColor = theme.color.accent,
    isLast = false,
    onPress,
}: LedgerRowProps) {
    return (
        <Pressable
            onPress={onPress}
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
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.lg,
        overflow: "hidden",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 52,
        paddingVertical: 12,
        paddingRight: theme.space.lg,
        paddingLeft: theme.space.sm,
        gap: theme.space.sm,
    },
    rowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.color.border,
    },
    rowPressed: {
        backgroundColor: theme.color.surfaceMuted,
    },
    accent: {
        width: theme.size.strip,
        alignSelf: "stretch",
        borderRadius: theme.radius.pill,
        marginVertical: 4,
    },
    title: {
        flex: 1,
        minWidth: 64,
        color: theme.color.ink,
        fontSize: 15,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.2,
    },
    pill: {
        flexShrink: 1,
        maxWidth: "36%",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.color.accentSoft,
    },
    pillText: {
        color: theme.color.accentText,
        fontSize: 11,
        fontWeight: theme.font.weight.bold,
    },
    amount: {
        color: theme.color.ink,
        fontSize: 15,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.2,
        minWidth: 52,
        textAlign: "right",
    },
});
