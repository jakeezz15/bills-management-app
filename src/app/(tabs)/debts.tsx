import { DashboardEmpty } from "@/components/DashboardEmpty";
import { DashboardHero } from "@/components/DashboardHero";
import DebtForm from "@/components/DebtForm";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import { PageHeader } from "@/components/ui";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PlanItemCard } from "@/components/PlanItemCard";
import { dashboard } from "@/styles/dashboard";
import { Debt } from "@/types/debt";
import { toIsoDate } from "@/utils/date";
import {
    filterDebtsVisibleAsOf,
    isDebtInstallmentPaidAsOf,
} from "@/utils/filters";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useDebt } from "../contexts/DebtsContext";

type DebtsScreenProps = {
    embedded?: boolean;
};

function isFullyPaidOff(debt: Debt) {
    return debt.balance <= 0 || Boolean(debt.paidOffDate);
}

function monthsLeft(debt: Debt) {
    if (debt.balance <= 0 || debt.minimumPayment <= 0) {
        return null;
    }
    return Math.ceil(debt.balance / debt.minimumPayment);
}

function debtSubtitle(debt: Debt, paidThisPeriod: boolean) {
    if (isFullyPaidOff(debt)) {
        return debt.paidOffDate ? `Paid off ${debt.paidOffDate}` : "Paid off";
    }
    const months = monthsLeft(debt);
    if (paidThisPeriod) {
        return months
            ? `Paid this period · about ${months} months left`
            : "Paid this period";
    }
    if (months === 1) {
        return `Due day ${debt.dueDay} · about 1 month left`;
    }
    if (months) {
        return `Due day ${debt.dueDay} · about ${months} months left`;
    }
    return `Due day ${debt.dueDay}`;
}

export default function DebtsScreen({ embedded = false }: DebtsScreenProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const { debts, payments, loading, recordPayment } = useDebt();
    const { range, label, shiftPeriod, resetToToday } = useDateRange();

    const visibleDebts = useMemo(
        () => filterDebtsVisibleAsOf(debts, range.end),
        [debts, range.end]
    );

    const unpaid = visibleDebts.filter(
        (debt) =>
            !isFullyPaidOff(debt) &&
            !isDebtInstallmentPaidAsOf(debt, range.end, payments)
    );
    const paidThisMonth = visibleDebts.filter(
        (debt) =>
            !isFullyPaidOff(debt) &&
            isDebtInstallmentPaidAsOf(debt, range.end, payments)
    );
    const paidOff = visibleDebts.filter((debt) => isFullyPaidOff(debt));

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
    const asOfIso = toIsoDate(range.end);

    const openAdd = () => {
        setEditingDebt(null);
        setIsOpen(true);
    };

    const renderDebt = (debt: Debt) => {
        const fullyPaidOff = isFullyPaidOff(debt);
        const installmentPaid = isDebtInstallmentPaidAsOf(
            debt,
            range.end,
            payments
        );
        const done = fullyPaidOff || installmentPaid;

        return (
            <PlanItemCard
                key={debt.id}
                title={debt.name}
                subtitle={debtSubtitle(debt, installmentPaid)}
                rightLabel={`$${Math.max(debt.balance, 0).toFixed(0)}`}
                percent={done ? 100 : 0}
                done={done}
                amounts={
                    fullyPaidOff
                        ? "Remaining $0"
                        : `Min $${debt.minimumPayment.toFixed(0)}`
                }
                chipLabel={
                    !fullyPaidOff && !installmentPaid
                        ? `Record $${debt.minimumPayment.toFixed(0)}`
                        : undefined
                }
                onPress={() => {
                    setEditingDebt(debt);
                    setIsOpen(true);
                }}
                onChip={
                    !fullyPaidOff && !installmentPaid
                        ? () => {
                              void recordPayment(
                                  debt.id,
                                  undefined,
                                  asOfIso
                              );
                          }
                        : undefined
                }
            />
        );
    };

    const heroCaption =
        unpaid.length > 0
            ? `${unpaid.length} unpaid · $${monthlyDue.toFixed(0)} due this period`
            : paidThisMonth.length > 0
              ? "All current installments paid"
              : hiddenPaidOffCount > 0
                ? `${hiddenPaidOffCount} paid-off hidden from this date`
                : "No active installments on this date";

    return (
        <View style={dashboard.screen}>
            {loading && <LoadingScreen />}

            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    !embedded && { paddingTop: 48 },
                ]}
            >
                {!embedded ? (
                    <PageHeader
                        title="Debts"
                        subtitle="Remaining balances and this period’s payments"
                    />
                ) : null}

                {debts.length > 0 ? (
                    <DashboardHero
                        kicker="Remaining"
                        value={`$${remaining.toFixed(0)}`}
                        caption={heroCaption}
                        percent={
                            active > 0
                                ? paidShare
                                : fullyPaidHeroPercent(visibleDebts)
                        }
                        pace={
                            <HeroPeriodNav
                                label={label}
                                onShift={shiftPeriod}
                                onResetToToday={resetToToday}
                            />
                        }
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

                {unpaid.length > 0 && (
                    <Text style={dashboard.sectionLabel}>Needs payment</Text>
                )}
                {unpaid.map(renderDebt)}

                {paidThisMonth.length > 0 && (
                    <Text style={dashboard.sectionLabel}>Paid this period</Text>
                )}
                {paidThisMonth.map(renderDebt)}

                {paidOff.length > 0 && (
                    <Text style={dashboard.sectionLabel}>Paid off</Text>
                )}
                {paidOff.map(renderDebt)}
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
