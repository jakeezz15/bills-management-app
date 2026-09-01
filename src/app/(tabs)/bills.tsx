import { FinanceRow } from "@/components/FinanceRow";
import { billsData as bills } from "@/constants/sample-data";
import { screenStyles } from "@/styles/screen";
import { ScrollView, Text } from "react-native";

export default function BillsScreen() {
    return (
        <ScrollView style={screenStyles.section} contentContainerStyle={screenStyles.content}>
            <Text style={screenStyles.title}>Bills</Text>
            {bills.map((bill) => (
                <FinanceRow
                    key={bill.id}
                    label={bill.name}
                    amount={bill.amount}
                    subtitle={bill.isPaid ? "Paid" : "Unpaid"}
                />
            ))}
        </ScrollView>
    );
}

