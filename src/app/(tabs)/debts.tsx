import DebtForm from "@/components/DebtForm";
import { FinanceRow } from "@/components/FinanceRow";
import { screenStyles } from "@/styles/screen";
import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useDebt } from "../contexts/DebtsContext";

export default function DebtsScreen() {

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { debts } = useDebt();
    return (
        <ScrollView style={screenStyles.section} contentContainerStyle={screenStyles.content}>
            <Text style={screenStyles.title}>Debts</Text>
            <DebtForm visible={isOpen} onClose={() => setIsOpen(false)} />
            <Pressable onPress={() => setIsOpen(true)}>
                <Text style={{ color: "#208AEF", marginBottom: 16 }}>+ Add debt</Text>
            </Pressable>
            {debts.map((debt) => (
                <FinanceRow
                    key={debt.id}
                    label={debt.name}
                    amount={debt.minimumPayment}
                    subtitle={`Balance: $${debt.balance} · ${debt.type}`}
                />
            ))}
        </ScrollView>
    );
}

