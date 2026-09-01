import { FinanceRow } from "@/components/FinanceRow";
import { incomeData as incomes } from "@/constants/sample-data";
import { screenStyles } from "@/styles/screen";
import { ScrollView, Text } from "react-native";

export default function IncomeScreen() {
    return (
        <ScrollView style={screenStyles.section} contentContainerStyle={screenStyles.content}>
            <Text style={screenStyles.title}>Income</Text>
            {incomes.map((income) => (
                <FinanceRow
                    key={income.id}
                    label={income.source}
                    amount={income.gross}
                // subtitle={income.isPaid ? "Paid" : "Unpaid"}
                />
            ))}
        </ScrollView>
    );
}

