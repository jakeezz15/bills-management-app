import { clearAllData } from "@/services/storage";
import { screenStyles } from "@/styles/screen";
import { getLeftOver, getTotalDebtPayments, getTotalExpenses, getTotalIncome, getTotalSavings } from "@/utils/finance";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useDebt } from "../contexts/DebtsContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useSavings } from "../contexts/SavingsContext";



export default function HomeScreen() {

    const { expenses, reload: reloadExpenses } = useExpenses();
    const { debts, reload: reloadDebts } = useDebt();
    const { savings, reload: reloadSavings } = useSavings();


    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses(expenses)
    const totalDebtPayments = getTotalDebtPayments(debts);
    const totalSavings = getTotalSavings(savings)
    const leftover = getLeftOver(expenses, debts, savings)

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
                            reloadExpenses(),
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
            <View style={screenStyles.summaryCard}>
                <Text style={screenStyles.title}>Finance Summary</Text>

                {/* Suggested addition: make leftover the primary information */}
                <View style={screenStyles.leftoverSection}>
                    <Text style={screenStyles.leftoverLabel}>
                        Available after commitments
                    </Text>

                    <Text
                        style={[
                            screenStyles.leftover,
                            {
                                color: leftover >= 0
                                    ? "#15803D"
                                    : "#DC2626"
                            },
                        ]}
                    >
                        ${leftover.toFixed(2)}
                    </Text>

                    {/* Suggested addition: short status explanation */}
                    <Text style={screenStyles.leftoverMessage}>
                        {leftover >= 0
                            ? "Your planned finances are within budget."
                            : "Your commitments are higher than your income."}
                    </Text>
                </View>

                {/* Suggested addition: supporting financial details */}
                <View style={screenStyles.summaryDetails}>
                    <View style={screenStyles.summaryRow}>
                        <Text style={screenStyles.summaryLabel}>
                            Income
                        </Text>

                        <Text style={screenStyles.incomeSummaryAmount}>
                            ${totalIncome.toFixed(2)}
                        </Text>
                    </View>

                    <View style={screenStyles.summaryDivider} />

                    <View style={screenStyles.summaryRow}>
                        <Text style={screenStyles.summaryLabel}>
                            Expenses
                        </Text>

                        <Text style={screenStyles.expenseSummaryAmount}>
                            ${totalExpenses.toFixed(2)}
                        </Text>
                    </View>

                    <View style={screenStyles.summaryDivider} />

                    <View style={screenStyles.summaryRow}>
                        <Text style={screenStyles.summaryLabel}>
                            Debt payments
                        </Text>

                        <Text style={screenStyles.summaryValue}>
                            ${totalDebtPayments.toFixed(2)}
                        </Text>
                    </View>

                    <View style={screenStyles.summaryDivider} />

                    <View style={screenStyles.summaryRow}>
                        <Text style={screenStyles.summaryLabel}>
                            Savings
                        </Text>

                        <Text style={screenStyles.savingsSummaryAmount}>
                            ${totalSavings.toFixed(2)}
                        </Text>
                    </View>
                </View>
            </View>

            <Pressable
                onPress={handleReset}
                style={({ pressed }) => [
                    { marginTop: 24 },

                    // Suggested addition: pressed feedback
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

