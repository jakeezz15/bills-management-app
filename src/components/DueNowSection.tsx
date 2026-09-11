import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { CompactPlanRow } from "@/components/CompactPlanRow";
import { dashboard } from "@/styles/dashboard";
import { text, theme } from "@/design";
import { Bill } from "@/types/bill";
import { Debt } from "@/types/debt";
import { todayIsoDate } from "@/utils/date";
import { hapticConfirm } from "@/utils/haptics";
import {
    dueNowLabel,
    dueNowTone,
    getDueNowItems,
} from "@/utils/due-now";
import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOutRight,
    LinearTransition,
    ReduceMotion,
    ZoomIn,
} from "react-native-reanimated";

const layout = LinearTransition.duration(220).reduceMotion(ReduceMotion.System);
const rowEnter = FadeIn.duration(180).reduceMotion(ReduceMotion.System);
const rowExit = FadeOutRight.duration(260).reduceMotion(ReduceMotion.System);
const clearEnter = FadeInDown.duration(280).reduceMotion(ReduceMotion.System);
const badgeEnter = ZoomIn.springify()
    .damping(14)
    .reduceMotion(ReduceMotion.System);

function hasTrackedPlans(bills: Bill[], debts: Debt[]): boolean {
    if (bills.length > 0) {
        return true;
    }
    return debts.some((debt) => debt.balance > 0 && !debt.paidOffDate);
}

type DueNowSectionProps = {
    title?: string;
    caption?: string;
    clearCaption?: string;
    soonWithinDays?: number;
};

export function DueNowSection({
    title = "Due now",
    caption = "Log these to drop leftover. Overdue, due today, and due in 3 days.",
    clearCaption = "Nothing waiting in the next 3 days.",
    soonWithinDays,
}: DueNowSectionProps) {
    const { formatMoney } = useLocale();
    const { bills, payments: billPayments, toggleBillPaid } = useBills();
    const { debts, payments: debtPayments, recordPayment } = useDebt();

    const items = useMemo(
        () =>
            getDueNowItems(
                bills,
                billPayments,
                debts,
                debtPayments,
                new Date(),
                soonWithinDays
            ),
        [bills, billPayments, debts, debtPayments, soonWithinDays]
    );
    const showClear = items.length === 0 && hasTrackedPlans(bills, debts);

    if (items.length === 0 && !showClear) {
        return null;
    }

    const asOfIso = todayIsoDate();

    return (
        <Animated.View layout={layout} style={styles.wrap}>
            <Text style={dashboard.sectionLabel}>{title}</Text>
            <Text style={styles.caption}>
                {showClear ? clearCaption : caption}
            </Text>

            <View style={[styles.list, items.length === 0 && styles.listIdle]}>
                {items.map((item) => (
                    <Animated.View
                        key={`${item.kind}-${item.id}`}
                        layout={layout}
                        entering={rowEnter}
                        exiting={rowExit}
                    >
                        <CompactPlanRow
                            title={item.name}
                            meta={dueNowLabel(item)}
                            amountLabel={formatMoney(
                                item.remaining ?? item.amount,
                                { compact: true }
                            )}
                            amountHint={
                                item.kind === "debt" ? "balance" : "due"
                            }
                            actionAmountLabel={
                                item.kind === "debt"
                                    ? formatMoney(item.amount, {
                                          compact: true,
                                      })
                                    : undefined
                            }
                            metaTone={dueNowTone(item)}
                            onPress={() => {
                                router.push(
                                    item.kind === "debt"
                                        ? `/debt/${item.id}`
                                        : `/bill/${item.id}`
                                );
                            }}
                            onToggle={() => {
                                if (item.kind === "bill") {
                                    if (item.amountVaries) {
                                        router.push(`/bill/${item.id}`);
                                        return;
                                    }
                                    hapticConfirm();
                                    void toggleBillPaid(item.id, asOfIso);
                                    return;
                                }
                                hapticConfirm();
                                void recordPayment(
                                    item.id,
                                    undefined,
                                    asOfIso
                                );
                            }}
                            toggleAccessibilityLabel={
                                item.kind === "bill" && item.amountVaries
                                    ? "Enter this month’s amount"
                                    : item.kind === "bill"
                                      ? "Mark as paid"
                                      : `Record ${formatMoney(item.amount, { compact: true })}`
                            }
                        />
                    </Animated.View>
                ))}
            </View>

            {showClear ? <DueClearCard /> : null}
        </Animated.View>
    );
}

function DueClearCard() {
    return (
        <Animated.View
            entering={clearEnter}
            accessibilityRole="summary"
            accessibilityLabel="You're clear for now. Nothing overdue, due today, or due in 3 days."
            style={styles.clearCard}
        >
            <Animated.View entering={badgeEnter} style={styles.badge}>
                <View style={styles.badgeRing} />
                <View style={styles.badgeCore}>
                    <Ionicons
                        name="checkmark"
                        size={28}
                        color={theme.intent.positive.fg}
                    />
                </View>
            </Animated.View>
            <Text style={styles.clearTitle}>You’re clear for now</Text>
            <Text style={styles.clearText}>
                Nothing overdue, due today, or due in the next 3 days.
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        marginTop: theme.space.md,
        marginBottom: theme.space.sm,
    },
    caption: {
        ...text.caption,
        marginBottom: theme.space.sm,
    },
    list: {
        gap: theme.space.sm,
        marginBottom: theme.space.md,
    },
    listIdle: {
        marginBottom: 0,
        gap: 0,
    },
    clearCard: {
        backgroundColor: theme.intent.positive.bg,
        borderRadius: theme.radius.md,
        paddingVertical: theme.space.lg,
        paddingHorizontal: theme.space.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.intent.positive.strong,
        alignItems: "center",
    },
    badge: {
        width: 72,
        height: 72,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.space.md,
    },
    badgeRing: {
        ...StyleSheet.absoluteFill,
        borderRadius: theme.radius.pill,
        borderWidth: 3,
        borderColor: theme.intent.positive.strong,
        opacity: 0.55,
    },
    badgeCore: {
        width: 56,
        height: 56,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.bg.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    clearTitle: {
        ...text.itemTitle,
        color: theme.intent.positive.fg,
        textAlign: "center",
    },
    clearText: {
        ...text.bodyMuted,
        marginTop: theme.space.sm,
        textAlign: "center",
    },
});
