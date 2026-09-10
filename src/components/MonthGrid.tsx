import { theme } from "@/design";
import { startOfMonth, toIsoDate } from "@/utils/date";
import { Pressable, StyleSheet, Text, View } from "react-native";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

type MonthGridProps = {
    month: Date;
    selectedIso?: string;
    markedIso: Set<string>;
    onSelectDay: (iso: string) => void;
};

function mondayOffset(date: Date) {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
}

export function MonthGrid({
    month,
    selectedIso,
    markedIso,
    onSelectDay,
}: MonthGridProps) {
    const start = startOfMonth(month);
    const days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const lead = mondayOffset(start);
    const todayIso = toIsoDate(new Date());

    const cells: (number | null)[] = [];
    for (let i = 0; i < lead; i += 1) {
        cells.push(null);
    }
    for (let day = 1; day <= days; day += 1) {
        cells.push(day);
    }
    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return (
        <View style={styles.card}>
            <View style={styles.weekRow}>
                {WEEKDAYS.map((label, index) => (
                    <Text key={`${label}-${index}`} style={styles.weekday}>
                        {label}
                    </Text>
                ))}
            </View>
            <View style={styles.grid}>
                {cells.map((day, index) => {
                    if (day === null) {
                        return <View key={`blank-${index}`} style={styles.cell} />;
                    }

                    const iso = toIsoDate(
                        new Date(start.getFullYear(), start.getMonth(), day)
                    );
                    const selected = selectedIso === iso;
                    const isToday = iso === todayIso;
                    const marked = markedIso.has(iso);

                    return (
                        <Pressable
                            key={iso}
                            onPress={() => onSelectDay(iso)}
                            style={[
                                styles.cell,
                                selected && styles.cellSelected,
                                isToday && !selected && styles.cellToday,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={iso}
                        >
                            <Text
                                style={[
                                    styles.day,
                                    selected && styles.daySelected,
                                    isToday && !selected && styles.dayToday,
                                ]}
                            >
                                {day}
                            </Text>
                            <View
                                style={[
                                    styles.dot,
                                    marked && styles.dotOn,
                                    selected && marked && styles.dotOnSelected,
                                ]}
                            />
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: theme.space.sm,
        marginBottom: theme.space.md,
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: theme.space.sm,
    },
    weekRow: {
        flexDirection: "row",
        marginBottom: theme.space.xs,
    },
    weekday: {
        flex: 1,
        textAlign: "center",
        color: theme.text.secondary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.bold,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    cell: {
        width: "14.285%",
        minHeight: theme.size.tap,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: theme.space.xs,
        borderRadius: theme.radius.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "transparent",
    },
    cellSelected: {
        backgroundColor: theme.bg.inverse,
    },
    cellToday: {
        backgroundColor: theme.bg.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border.subtle,
    },
    day: {
        color: theme.text.primary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.semibold,
    },
    daySelected: {
        color: theme.text.inverse,
    },
    dayToday: {
        fontWeight: theme.fontWeight.bold,
    },
    dot: {
        width: theme.space.xs,
        height: theme.space.xs,
        borderRadius: theme.radius.pill,
        marginTop: theme.space.xs,
        backgroundColor: "transparent",
    },
    dotOn: {
        backgroundColor: theme.action.primary.bg,
    },
    dotOnSelected: {
        backgroundColor: theme.text.inverse,
    },
});
