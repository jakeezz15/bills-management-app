import { screenStyles } from "@/styles/screen";
import { getLeftOver, getTotalDebtPayments, getTotalExpenses, getTotalIncome, getTotalSavings } from "@/utils/finance";
import { ScrollView, Text, View } from "react-native";
import { useDebt } from "../contexts/DebtsContext";
import { useExpenses } from "../contexts/ExpensesContext";



export default function HomeScreen() {

    const { expenses } = useExpenses();
    const { debts } = useDebt()


    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses(expenses)
    const totalDebtPayments = getTotalDebtPayments(debts);
    const totalSavings = getTotalSavings()
    const leftover = getLeftOver(expenses, debts)


    return (
        <ScrollView
            style={screenStyles.section}
            contentContainerStyle={screenStyles.content}
        >
            <View style={screenStyles.summaryCard}>
                <Text style={screenStyles.title}>Finance Summary</Text>
                <Text>Income: ${totalIncome}</Text>
                <Text>Expenses: ${totalExpenses}</Text>
                <Text>Debt payments: ${totalDebtPayments}</Text>
                <Text>Savings: ${totalSavings}</Text>

                <Text
                    style={[
                        screenStyles.leftover,
                        { color: leftover >= 0 ? "green" : "red" },
                    ]}
                >
                    Leftover: ${leftover}
                </Text>
            </View>
        </ScrollView>

    );
}

