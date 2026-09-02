import { FinanceRow } from "@/components/FinanceRow";
import { savingsData } from "@/constants/sample-data";
import { screenStyles } from "@/styles/screen";
import { ScrollView, Text } from "react-native";

export default function SavingsScreen() {
    return (
        <ScrollView style={screenStyles.section} contentContainerStyle={screenStyles.content}>
            <Text style={screenStyles.title}>Savings</Text>
            {savingsData.map((goal) => (
                <FinanceRow
                    key={goal.id}
                    label={goal.name}
                    amount={goal.currentAmount}
                    subtitle={`$${goal.currentAmount} / $${goal.targetAmount}`}
                />
            ))}
        </ScrollView>
    );
}