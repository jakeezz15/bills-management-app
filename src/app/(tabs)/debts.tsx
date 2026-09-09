import { CompactPlanRow } from "@/components/CompactPlanRow";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import DebtForm from "@/components/DebtForm";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import { PageHeader } from "@/components/ui";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useStickyHero } from "@/hooks/useStickyHero";
import { dashboard } from "@/styles/dashboard";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { parseIsoDate, toIsoDate } from "@/utils/date";
import {
    billDueStatusReference,
    filterDebtsVisibleAsOf,
    getBillDueOffset,
    isDebtInstallmentPaidAsOf,
} from "@/utils/filters";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useDebt } from "../contexts/DebtsContext";
import { useLocale } from "../contexts/LocaleContext";

type DebtsScreenProps = {
    embedded?: boolean;
};

type DueDayGroup = {
    dueDay: number;
    label: string;
    debts: Debt[];
};

const MONTHS = [
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

function isFullyPaidOff(debt: Debt) {
    return debt.balance <= 0 || Boolean(debt.paidOffDate);
}

function dueDayLabel(dueDay: number, asOf: Date) {
    const daysInMonth = new Date(
        asOf.getFullYear(),
        asOf.getMonth() + 1,
        0
    ).getDate();
    const day = Math.min(Math.max(dueDay, 1), daysInMonth);
    return `${MONTHS[asOf.getMonth()]} ${day}`;
}

function hasPaymentThisPeriod(
    debtId: string,
    payments: DebtPayment[],
    asOf: Date
) {
    return payments.some((payment) => {
        if (payment.debtId !== debtId) {
            return false;
        }
        const paidOn = parseIsoDate(payment.date);
        if (!paidOn) {
            return false;
        }
        return (
            paidOn.getFullYear() === asOf.getFullYear() &&
            paidOn.getMonth() === asOf.getMonth() &&
            paidOn.getTime() <= asOf.getTime()
        );
    });
}

function debtMeta(
    debt: Debt,
    installmentPaid: boolean,
    dueRef: Date
): { label: string; tone: "overdue" | "due-soon" | "default" } {
    if (isFullyPaidOff(debt)) {
        return { label: "Paid off", tone: "default" };
    }
    if (installmentPaid) {
        return { label: "Paid", tone: "default" };
    }
    const offset = getBillDueOffset(debt.dueDay, dueRef);
    if (offset < 0) {
        return { label: "Overdue", tone: "overdue" };
    }
    if (offset <= 3) {
        return { label: "Soon", tone: "due-soon" };
    }
    return { label: "Upcoming", tone: "default" };
}

function sortDebtInGroup(
    a: Debt,
    b: Debt,
    payments: DebtPayment[],
    asOf: Date
) {
    const rank = (debt: Debt) => {
        if (isFullyPaidOff(debt)) {
            return 2;
        }
        if (isDebtInstallmentPaidAsOf(debt, asOf, payments)) {
            return 1;
        }
        return 0;
    };
    const diff = rank(a) - rank(b);
    if (diff !== 0) {
        return diff;
    }
    return a.name.localeCompare(b.name);
}

function groupDebtsByDueDay(
    debts: Debt[],
    payments: DebtPayment[],
    asOf: Date
): DueDayGroup[] {
    const map = new Map<number, Debt[]>();

    for (const debt of debts) {
        const day = Math.min(Math.max(debt.dueDay, 1), 31);
        const list = map.get(day) ?? [];
        list.push(debt);
        map.set(day, list);
    }

    return [...map.entries()]
        .sort(([a], [b]) => a - b)
        .map(([dueDay, groupDebts]) => ({
            dueDay,
            label: dueDayLabel(dueDay, asOf),
            debts: [...groupDebts].sort((a, b) =>
                sortDebtInGroup(a, b, payments, asOf)
            ),
        }));
}

export default function DebtsScreen({ embedded = false }: DebtsScreenProps) {
    const { formatMoney } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const { debts, payments, loading, recordPayment, undoPayment } = useDebt();
    const { range, label, shiftPeriod, resetToToday } = useDateRange();

    const asOf = range.end;
    const asOfIso = toIsoDate(asOf);
    const dueRef = billDueStatusReference(asOf);

    const visibleDebts = useMemo(
        () => filterDebtsVisibleAsOf(debts, asOf),
        [debts, asOf]
    );

    const unpaid = visibleDebts.filter(
        (debt) =>
            !isFullyPaidOff(debt) &&
            !isDebtInstallmentPaidAsOf(debt, asOf, payments)
    );
    const paidThisMonth = visibleDebts.filter(
        (debt) =>
            !isFullyPaidOff(debt) &&
            isDebtInstallmentPaidAsOf(debt, asOf, payments)
    );

    const dueDayGroups = useMemo(
        () => groupDebtsByDueDay(visibleDebts, payments, asOf),
        [visibleDebts, payments, asOf]
    );

    const remaining = visibleDebts.reduce(
        (sum, debt) => sum + Math.max(debt.balance, 0),
        0
    );
    const active = unpaid.length + paidThisMonth.length;
    const paidShare =
        active > 0 ? Math.round((paidThisMonth.length / active) * 100) : 0;
    const monthlyDue = unpaid.reduce(
        (sum, debt) => sum + debt.minimumPayment,
        0
    );
    const hiddenPaidOffCount = debts.length - visibleDebts.length;

    const openAdd = () => {
        setEditingDebt(null);
        setIsOpen(true);
    };

    const { collapsed, scrollProps } = useStickyHero();
    const heroValue = formatMoney(remaining, { compact: true });
    const showHero = debts.length > 0;
    const periodNav = (forCompact: boolean) => (
        <HeroPeriodNav
            label={label}
            onShift={shiftPeriod}
            onResetToToday={resetToToday}
            style={forCompact ? { marginTop: 8 } : undefined}
        />
    );

    const renderDebt = (debt: Debt) => {
        const fullyPaidOff = isFullyPaidOff(debt);
        const installmentPaid = isDebtInstallmentPaidAsOf(
            debt,
            asOf,
            payments
        );
        const canUndo = hasPaymentThisPeriod(debt.id, payments, asOf);
        const done = fullyPaidOff || installmentPaid;
        const meta = debtMeta(debt, installmentPaid, dueRef);

        return (
            <CompactPlanRow
                key={debt.id}
                title={debt.name}
                meta={meta.label}
                amountLabel={formatMoney(Math.max(debt.balance, 0), {
                    compact: true,
                })}
                done={done}
                metaTone={meta.tone}
                onPress={() => {
                    setEditingDebt(debt);
                    setIsOpen(true);
                }}
                onToggle={
                    canUndo
                        ? () => {
                              void undoPayment(debt.id, asOfIso);
                          }
                        : !fullyPaidOff && !installmentPaid
                          ? () => {
                                void recordPayment(
                                    debt.id,
                                    undefined,
                                    asOfIso
                                );
                            }
                          : undefined
                }
                toggleAccessibilityLabel={
                    canUndo
                        ? "Undo payment"
                        : !fullyPaidOff
                          ? "Record payment"
                          : undefined
                }
            />
        );
    };

    const heroCaption =
        unpaid.length > 0
            ? `${unpaid.length} unpaid · ${formatMoney(monthlyDue, { compact: true })} due this period`
            : paidThisMonth.length > 0
              ? "All current installments paid"
              : hiddenPaidOffCount > 0
                ? `${hiddenPaidOffCount} paid-off hidden from this date`
                : "No active installments on this date";

    return (
        <View style={dashboard.screen}>
            {loading && <LoadingScreen />}

            {showHero && collapsed ? (
                <View style={dashboard.heroCompactSticky}>
                    <DashboardHeroCompact
                        kicker="Remaining"
                        value={heroValue}
                        pace={periodNav(true)}
                        onAdd={openAdd}
                        addAccessibilityLabel="Add debt"
                    />
                </View>
            ) : null}

            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    !embedded && { paddingTop: 48 },
                ]}
                {...scrollProps}
            >
                {!embedded ? (
                    <PageHeader
                        title="Debts"
                        subtitle="Grouped by due day this period"
                    />
                ) : null}

                {showHero ? (
                    <DashboardHero
                        kicker="Remaining"
                        value={heroValue}
                        caption={heroCaption}
                        percent={
                            active > 0
                                ? paidShare
                                : fullyPaidHeroPercent(visibleDebts)
                        }
                        pace={periodNav(false)}
                        onAdd={openAdd}
                        addAccessibilityLabel="Add debt"
                    />
                ) : null}

                <DebtForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingDebt(null);
                    }}
                    debt={editingDebt ?? undefined}
                    paymentDate={asOfIso}
                />

                {debts.length === 0 && !loading && (
                    <DashboardEmpty
                        title="No debts yet"
                        text="Add a phone, laptop, or loan. Each payment lowers the remaining balance."
                        actionLabel="Add first debt"
                        onAction={openAdd}
                    />
                )}

                {debts.length > 0 && visibleDebts.length === 0 && !loading && (
                    <DashboardEmpty
                        title="Nothing for this date"
                        text="Paid-off plans hide after payoff day. Step the date back to see history."
                        actionLabel="Jump to today"
                        onAction={resetToToday}
                    />
                )}

                {dueDayGroups.map((group) => (
                    <View key={group.dueDay}>
                        <Text style={dashboard.sectionLabel}>{group.label}</Text>
                        {group.debts.map(renderDebt)}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

function fullyPaidHeroPercent(visibleDebts: Debt[]) {
    if (visibleDebts.length === 0) {
        return 0;
    }
    const paidOffCount = visibleDebts.filter(isFullyPaidOff).length;
    return Math.round((paidOffCount / visibleDebts.length) * 100);
}
