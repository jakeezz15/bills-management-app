import DebtForm from "@/components/DebtForm";
import { FinanceRow } from "@/components/FinanceRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PeriodPicker } from "@/components/PeriodPicker";
import { buttonStyle } from "@/styles/button-style";
import { screenStyles } from "@/styles/screen";
import { Debt } from "@/types/debt";
import { toIsoDate } from "@/utils/date";
import {
    filterDebtsVisibleAsOf,
    isDebtInstallmentPaidAsOf,
} from "@/utils/filters";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useDebt } from "../contexts/DebtsContext";

function debtSubtitle(debt: Debt, asOf: Date) {
    if (debt.balance <= 0 || debt.paidOffDate) {
        return `Paid off ${debt.paidOffDate ?? ""} · ${debt.type}`.trim();
    }

    const installmentPaid = isDebtInstallmentPaidAsOf(debt, asOf);
    const paid = debt.totalPaid ?? 0;
    const status = installmentPaid ? "Paid this month" : "Unpaid this month";
    const paidPart = paid > 0 ? ` · Total paid $${paid.toFixed(0)}` : "";
    const start = debt.startDate ? ` · Starts ${debt.startDate}` : "";
    return `Balance $${debt.balance.toFixed(0)} · ${status}${paidPart}${start}`;
}

export default function DebtsScreen() {
    const [isOpen, setIsOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const { debts, loading, recordPayment } = useDebt();
    const {
        periodUnit,
        range,
        label,
        setPeriodUnit,
        shiftPeriod,
        resetToToday,
    } = useDateRange();

    const visibleDebts = useMemo(
        () => filterDebtsVisibleAsOf(debts, range.end),
        [debts, range.end]
    );

    const hiddenPaidOffCount = debts.length - visibleDebts.length;
    const asOfIso = toIsoDate(range.end);

    return (
        <>
            {loading && <LoadingScreen />}

            <ScrollView
                style={screenStyles.section}
                contentContainerStyle={screenStyles.content}
            >
                <View style={screenStyles.header}>
                    <View>
                        <Text style={screenStyles.title}>
                            Debts
                        </Text>

                        <Text style={screenStyles.screenDescription}>
                            Installments — paid-off items stay in history
                        </Text>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.normalButton,
                            pressed && buttonStyle.buttonPressed,
                        ]}
                        onPress={() => {
                            setEditingDebt(null);
                            setIsOpen(true);
                        }}
                    >
                        <Text style={buttonStyle.buttonText}>
                            + Add debt
                        </Text>
                    </Pressable>
                </View>

                <PeriodPicker
                    periodUnit={periodUnit}
                    label={label}
                    onChangeUnit={setPeriodUnit}
                    onShift={shiftPeriod}
                    onResetToToday={resetToToday}
                />

                <DebtForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingDebt(null);
                    }}
                    debt={editingDebt ?? undefined}
                    paymentDate={asOfIso}
                />

                {visibleDebts.length > 0 && (
                    <View style={screenStyles.listHeader}>
                        <Text style={screenStyles.listTitle}>
                            Debts as of this date
                        </Text>

                        <View style={screenStyles.countBadge}>
                            <Text style={screenStyles.countBadgeText}>
                                {visibleDebts.length}
                            </Text>
                        </View>
                    </View>
                )}

                {hiddenPaidOffCount > 0 && (
                    <Text
                        style={[
                            screenStyles.screenDescription,
                            { marginBottom: 12 },
                        ]}
                    >
                        {hiddenPaidOffCount} paid-off debt
                        {hiddenPaidOffCount === 1 ? "" : "s"} hidden — go back
                        in the date picker to see them.
                    </Text>
                )}

                {debts.length === 0 && !loading && (
                    <View style={screenStyles.emptyState}>
                        <View style={screenStyles.emptyStateIcon}>
                            <Text style={screenStyles.emptyStateIconText}>
                                D
                            </Text>
                        </View>

                        <Text style={screenStyles.emptyStateTitle}>
                            No debts yet
                        </Text>

                        <Text style={screenStyles.emptyStateText}>
                            Add a phone, laptop, or loan installment. Each
                            payment lowers the remaining balance.
                        </Text>

                        <Pressable
                            style={({ pressed }) => [
                                buttonStyle.normalButton,
                                pressed && buttonStyle.buttonPressed,
                            ]}
                            onPress={() => {
                                setEditingDebt(null);
                                setIsOpen(true);
                            }}
                        >
                            <Text style={buttonStyle.buttonText}>
                                + Add first debt
                            </Text>
                        </Pressable>
                    </View>
                )}

                {debts.length > 0 && visibleDebts.length === 0 && !loading && (
                    <View style={screenStyles.emptyState}>
                        <Text style={screenStyles.emptyStateTitle}>
                            No debts for this date
                        </Text>
                        <Text style={screenStyles.emptyStateText}>
                            Paid-off installments are hidden after their payoff
                            day. Move the date back to review history.
                        </Text>
                    </View>
                )}

                {visibleDebts.map((debt) => {
                    const fullyPaidOff =
                        debt.balance <= 0 || Boolean(debt.paidOffDate);
                    const installmentPaid = isDebtInstallmentPaidAsOf(
                        debt,
                        range.end
                    );

                    return (
                        <FinanceRow
                            key={debt.id}
                            label={debt.name}
                            amount={debt.minimumPayment}
                            subtitle={debtSubtitle(debt, range.end)}
                            isPaid={installmentPaid}
                            onTogglePaid={
                                fullyPaidOff
                                    ? undefined
                                    : () =>
                                        recordPayment(
                                            debt.id,
                                            undefined,
                                            asOfIso
                                        )
                            }
                            onPress={() => {
                                setEditingDebt(debt);
                                setIsOpen(true);
                            }}
                        />
                    );
                })}
            </ScrollView>
        </>
    );
}
