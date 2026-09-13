import { useTheme } from "@/app/contexts/ThemeContext";
import {
    PlanStatusTone,
    planStatusAccent,
    planStatusFg,
} from "@/components/plan-status";
import { text, type Theme } from "@/design";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ReactNode, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CompactPlanRowProps = {
    title: string;
    meta: string;
    amountLabel: string;
    /** Caption under the amount (e.g. "balance", "due"). */
    amountHint?: string;
    /** When set and unpaid, the toggle is a pay chip (e.g. debt monthly). */
    actionAmountLabel?: string;
    done?: boolean;
    metaTone?: PlanStatusTone;
    onPress: () => void;
    onToggle?: () => void;
    toggleAccessibilityLabel?: string;
};

/**
 * Plan row: pay/check · name + status · amount + hint.
 */
export function CompactPlanRow({
    title,
    meta,
    amountLabel,
    amountHint,
    actionAmountLabel,
    done = false,
    metaTone = "default",
    onPress,
    onToggle,
    toggleAccessibilityLabel,
}: CompactPlanRowProps) {
    const { theme } = useTheme();
    const styles = useMemo(() => createCompactStyles(theme), [theme]);
    const tone: PlanStatusTone = done ? "paid" : metaTone;
    const accent = planStatusAccent(tone, theme);
    const metaColor = planStatusFg(tone, theme);

    const showPayChip = Boolean(actionAmountLabel) && !done;
    const spokenAmount = amountHint
        ? `${amountHint} ${amountLabel}`
        : amountLabel;

    return (
        <View
            style={[
                styles.row,
                done && styles.rowDone,
            ]}
        >
            <View style={[styles.accent, { backgroundColor: accent }]} />

            {onToggle ? (
                <Pressable
                    onPress={onToggle}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                        toggleAccessibilityLabel ??
                        (done
                            ? "Mark as unpaid"
                            : actionAmountLabel
                              ? `Record ${actionAmountLabel}`
                              : "Mark as paid")
                    }
                    style={({ pressed }) => [
                        showPayChip ? styles.payChip : styles.toggle,
                        !showPayChip &&
                            (done ? styles.toggleDone : styles.toggleIdle),
                        pressed && { opacity: 0.82 },
                    ]}
                >
                    {showPayChip ? (
                        <Text style={styles.payChipText} numberOfLines={1}>
                            {actionAmountLabel}
                        </Text>
                    ) : (
                        <Ionicons
                            name={done ? "checkmark" : "ellipse-outline"}
                            size={done ? 16 : 20}
                            color={
                                done
                                    ? theme.intent.positive.fg
                                    : theme.text.tertiary
                            }
                        />
                    )}
                </Pressable>
            ) : null}

            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={`${title}, ${meta}, ${spokenAmount}`}
                style={({ pressed }) => [
                    styles.main,
                    pressed && styles.mainPressed,
                ]}
            >
                <View style={styles.copy}>
                    <Text
                        style={[styles.title, done && styles.titleDone]}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                    <Text
                        style={[styles.meta, { color: metaColor }]}
                        numberOfLines={1}
                    >
                        {meta}
                    </Text>
                </View>

                <View style={styles.amountCol}>
                    <Text
                        style={[styles.amount, done && styles.amountDone]}
                        numberOfLines={1}
                    >
                        {amountLabel}
                    </Text>
                    {amountHint ? (
                        <Text
                            style={[
                                styles.amountHint,
                                done && styles.amountHintDone,
                            ]}
                            numberOfLines={1}
                        >
                            {amountHint}
                        </Text>
                    ) : (
                        <Text style={styles.amountHintSpacer}> </Text>
                    )}
                </View>
            </Pressable>
        </View>
    );
}

type PlanGroupProps = {
    children: ReactNode;
};

/** One sheet for a due-day (or Due now) group — not a card per row. */
export function PlanGroup({ children }: PlanGroupProps) {
    const { theme } = useTheme();
    const styles = useMemo(() => createCompactStyles(theme), [theme]);
    return <View style={styles.group}>{children}</View>;
}

function createCompactStyles(theme: Theme) {
    return StyleSheet.create({
    group: {
        gap: theme.space.sm,
        marginBottom: theme.space.md,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.bg.surface,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border.subtle,
        paddingVertical: theme.space.md,
        paddingRight: theme.space.md,
        paddingLeft: theme.space.sm,
        minHeight: 64,
    },
    rowDone: {
        backgroundColor: theme.bg.sunken,
    },
    accent: {
        width: 4,
        alignSelf: "stretch",
        borderRadius: theme.radius.pill,
        marginRight: theme.space.sm,
        marginVertical: theme.space.xs,
    },
    toggle: {
        width: theme.size.control,
        height: theme.size.control,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
        marginRight: theme.space.sm,
    },
    toggleIdle: {
        backgroundColor: theme.bg.canvas,
    },
    toggleDone: {
        backgroundColor: theme.intent.positive.strong,
    },
    // Tonal, not solid: one row of many, so it must sit below the FAB.
    payChip: {
        minWidth: theme.size.tap,
        minHeight: theme.size.tap,
        paddingHorizontal: theme.space.sm,
        borderRadius: theme.radius.sm,
        alignItems: "center",
        justifyContent: "center",
        marginRight: theme.space.sm,
        backgroundColor: theme.intent.info.bg,
    },
    payChipText: {
        ...text.money,
        color: theme.text.accent,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
    },
    main: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.space.md,
        minWidth: 0,
        minHeight: theme.size.tap,
    },
    mainPressed: {
        opacity: 0.88,
    },
    copy: {
        flex: 1,
        minWidth: 0,
        gap: theme.space.xs,
    },
    title: text.itemTitle,
    titleDone: {
        color: theme.text.secondary,
        textDecorationLine: "line-through",
        fontWeight: theme.fontWeight.semibold,
    },
    meta: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.semibold,
        lineHeight: theme.lineHeight.xs,
    },
    amountCol: {
        alignItems: "flex-end",
        justifyContent: "center",
        gap: theme.space.xs,
        flexShrink: 0,
    },
    amount: {
        ...text.money,
        textAlign: "right",
    },
    amountDone: {
        color: theme.text.tertiary,
    },
    amountHint: {
        ...text.caption,
        textAlign: "right",
    },
    amountHintDone: {
        color: theme.text.tertiary,
    },
    amountHintSpacer: {
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
    },
});
}
