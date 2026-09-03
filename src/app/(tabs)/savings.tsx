import { FinanceRow } from "@/components/FinanceRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import SavingsForm from "@/components/SavingsForm";
import { screenStyles } from "@/styles/screen";
import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useSavings } from "../contexts/SavingsContext";

export default function SavingsScreen() {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { savings, loading } = useSavings();
    return (
        <>
            {loading && <LoadingScreen />}
            <ScrollView style={screenStyles.section} contentContainerStyle={screenStyles.content}>
                <Text style={screenStyles.title}>Savings</Text>
                <SavingsForm visible={isOpen} onClose={() => setIsOpen(false)} />
                <Pressable onPress={() => setIsOpen(true)}>
                    <Text style={{ color: "#208AEF", marginBottom: 16 }}>+ Add Savings</Text>
                </Pressable>
                {savings.map((goal) => (
                    <FinanceRow
                        key={goal.id}
                        label={goal.name}
                        amount={goal.monthlyContribution || 0}
                        subtitle={`$${goal.currentAmount} / $${goal.targetAmount}`}
                    />
                ))}
            </ScrollView>
        </>



    );
}