import DebtForm from "@/components/DebtForm";
import { FinanceRow } from "@/components/FinanceRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { buttonStyle } from "@/styles/button-style";
import { screenStyles } from "@/styles/screen";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useDebt } from "../contexts/DebtsContext";

export default function DebtsScreen() {
    const [isOpen, setIsOpen] = useState(false);
    const { debts, loading } = useDebt();

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
                            Track balances and minimum payments
                        </Text>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.normalButton,
                            pressed && buttonStyle.buttonPressed
                        ]}
                        onPress={() => setIsOpen(true)}
                    >
                        <Text style={buttonStyle.buttonText}>
                            + Add debt
                        </Text>
                    </Pressable>
                </View>

                <DebtForm
                    visible={isOpen}
                    onClose={() => setIsOpen(false)}
                />

                {debts.length > 0 && (
                    <View style={screenStyles.listHeader}>
                        <Text style={screenStyles.listTitle}>
                            All debts
                        </Text>

                        <View style={screenStyles.countBadge}>
                            <Text style={screenStyles.countBadgeText}>
                                {debts.length}
                            </Text>
                        </View>
                    </View>
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
                            Add a loan or credit card to begin tracking
                            balances and minimum payments.
                        </Text>

                        <Pressable
                            style={({ pressed }) => [
                                buttonStyle.normalButton,
                                pressed && buttonStyle.buttonPressed
                            ]}
                            onPress={() => setIsOpen(true)}
                        >
                            <Text style={buttonStyle.buttonText}>
                                + Add first debt
                            </Text>
                        </Pressable>
                    </View>
                )}

                {debts.map((debt) => (
                    <FinanceRow
                        key={debt.id}
                        label={debt.name}
                        amount={debt.minimumPayment}
                        subtitle={`Balance: $${debt.balance} · ${debt.type}`}
                    />
                ))}
            </ScrollView>
        </>
    );
}
