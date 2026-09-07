import { PeriodPicker } from "@/components/PeriodPicker";
import { clearAllData } from "@/services/storage";
import { screenStyles } from "@/styles/screen";
import { getTotalsForRange } from "@/utils/finance";
import { useMemo } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useDateRange } from "../contexts/DateRangeContext";
import { useDebt } from "../contexts/DebtsContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useSavings } from "../contexts/SavingsContext";

export default function HomeScreen() {
    const { income, reload: reloadIncome } = useIncome();
    const { expenses, reload: reloadExpenses } = useExpenses();
    const { bills, reload: reloadBills } = useBills();
    const { debts, reload: reloadDebts } = useDebt();
    const { savings, reload: reloadSavings } = useSavings();
    const {
        periodUnit,
        range,
        label,
        setPeriodUnit,
        shiftPeriod,
        resetToToday,
    } = useDateRange();

    const totals = useMemo(
        () => getTotalsForRange(range, expenses, bills, debts, savings, income),
        [range, expenses, bills, debts, savings, income]
    );

    const handleReset = () => {
        Alert.alert(
            "Reset all data?",
            "This will erase everything saved on this device.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await clearAllData();
                        await Promise.all([
                            reloadIncome(),
                            reloadExpenses(),
                            reloadBills(),
                            reloadDebts(),
                            reloadSavings(),
                        ]);
                    },
                },
            ]
        );
    };

    return (
        <ScrollView
            style={screenStyles.section}
            contentContainerStyle={screenStyles.content}
        >
            <Text style={screenStyles.title}>Finance Summary</Text>
            <Text style={[screenStyles.screenDescription, { marginBottom: 12 }]}>
                Running balance as of the selected date
            </Text>

            <PeriodPicker
                periodUnit={periodUnit}
                label={label}
                onChangeUnit={setPeriodUnit}
                onShift={shiftPeriod}
                onResetToToday={resetToToday}
            />

            <View style={screenStyles.summaryCard}>
                <View style={screenStyles.leftoverSection}>
                    <Text style={screenStyles.leftoverLabel}>
                        Balance after money in and out
                    </Text>

                    <Text
                        style={[
                            screenStyles.leftover,
                            {
                                color: totals.leftover >= 0
                                    ? "#15803D"
                                    : "#DC2626",
                            },
                        ]}
                    >
                        ${totals.leftover.toFixed(2)}
                    </Text>

                    <Text style={screenStyles.leftoverMessage}>
                        {totals.leftover >= 0
                            ? "Income received so far covers what you have spent and paid."
                            : "Outflows so far are higher than income received."}
                    </Text>
                </View>

                <View style={screenStyles.summaryDetails}>
                    <View style={screenStyles.summaryRow}>
                        <Text style={screenStyles.summaryLabel}>
                            Income
                        </Text>

                        <Text style={screenStyles.incomeSummaryAmount}>
                            ${totals.income.toFixed(2)}
                        </Text>
                    </View>

                    <View style={screenStyles.summaryDivider} />

                    <View style={screenStyles.summaryRow}>
                        <Text style={screenStyles.summaryLabel}>
                            Expenses
                        </Text>

                        <Text style={screenStyles.expenseSummaryAmount}>
                            ${totals.expenses.toFixed(2)}
                        </Text>
                    </View>

                    <View style={screenStyles.summaryDivider} />

                    <View style={screenStyles.summaryRow}>
                        <Text style={screenStyles.summaryLabel}>
                            Bills
                        </Text>

                        <Text style={screenStyles.expenseSummaryAmount}>
                            ${totals.bills.toFixed(2)}
                        </Text>
                    </View>

                    <View style={screenStyles.summaryDivider} />

                    <View style={screenStyles.summaryRow}>
                        <Text style={screenStyles.summaryLabel}>
                            Debt payments
                        </Text>

                        <Text style={screenStyles.summaryValue}>
                            ${totals.debtPayments.toFixed(2)}
                        </Text>
                    </View>

                    <View style={screenStyles.summaryDivider} />

                    <View style={screenStyles.summaryRow}>
                        <Text style={screenStyles.summaryLabel}>
                            Savings
                        </Text>

                        <Text style={screenStyles.savingsSummaryAmount}>
                            ${totals.savings.toFixed(2)}
                        </Text>
                    </View>
                </View>
            </View>

            <Pressable
                onPress={handleReset}
                style={({ pressed }) => [
                    { marginTop: 24 },
                    pressed && screenStyles.resetButtonPressed,
                ]}
            >
                <Text style={screenStyles.resetButtonText}>
                    Reset all data
                </Text>
            </Pressable>
        </ScrollView>
    );
}
