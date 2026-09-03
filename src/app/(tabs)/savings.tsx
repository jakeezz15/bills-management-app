import { FinanceRow } from "@/components/FinanceRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import SavingsForm from "@/components/SavingsForm";
import { buttonStyle } from "@/styles/button-style";
import { screenStyles } from "@/styles/screen";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSavings } from "../contexts/SavingsContext";

export default function SavingsScreen() {
    const [isOpen, setIsOpen] = useState(false);
    const { savings, loading } = useSavings();

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
                            Savings
                        </Text>

                        <Text style={screenStyles.screenDescription}>
                            Track goals and monthly contributions
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
                            + Add savings
                        </Text>
                    </Pressable>
                </View>

                <SavingsForm
                    visible={isOpen}
                    onClose={() => setIsOpen(false)}
                />

                {savings.length > 0 && (
                    <View style={screenStyles.listHeader}>
                        <Text style={screenStyles.listTitle}>
                            All savings
                        </Text>

                        <View style={screenStyles.countBadge}>
                            <Text style={screenStyles.countBadgeText}>
                                {savings.length}
                            </Text>
                        </View>
                    </View>
                )}

                {savings.length === 0 && !loading && (
                    <View style={screenStyles.emptyState}>
                        <View style={screenStyles.emptyStateIcon}>
                            <Text style={screenStyles.emptyStateIconText}>
                                S
                            </Text>
                        </View>

                        <Text style={screenStyles.emptyStateTitle}>
                            No savings yet
                        </Text>

                        <Text style={screenStyles.emptyStateText}>
                            Add your first savings goal to begin tracking
                            progress toward your targets.
                        </Text>

                        <Pressable
                            style={({ pressed }) => [
                                buttonStyle.normalButton,
                                pressed && buttonStyle.buttonPressed
                            ]}
                            onPress={() => setIsOpen(true)}
                        >
                            <Text style={buttonStyle.buttonText}>
                                + Add first savings
                            </Text>
                        </Pressable>
                    </View>
                )}

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
