import { FinanceRow } from "@/components/FinanceRow";
import { debtData as debts } from "@/constants/sample-data";
import { screenStyles } from "@/styles/screen";
import { ScrollView, Text } from "react-native";

export default function DebtsScreen() {
    return (
        <ScrollView style={screenStyles.section} contentContainerStyle={screenStyles.content}>
            <Text style={screenStyles.title}>Debts</Text>
            {debts.map((debt) => (
                <FinanceRow
                    key={debt.id}
                    label={debt.name}
                    amount={debt.balance}
                    subtitle={debt.isPaid ? "Paid" : "Unpaid"}
                />
            ))}
        </ScrollView>
    );
}

