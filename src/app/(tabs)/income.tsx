import IncomeForm from "@/components/IncomeForm";
import { FinanceRow } from "@/components/FinanceRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { buttonStyle } from "@/styles/button-style";
import { screenStyles } from "@/styles/screen";
import { Income } from "@/types/income";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useIncome } from "../contexts/IncomeContext";

export default function IncomeScreen() {
    const { income, loading } = useIncome();

    const [isOpen, setIsOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Income | null>(null);

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
                            Income
                        </Text>

                        <Text style={screenStyles.screenDescription}>
                            Paychecks and other money in
                        </Text>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.normalButton,
                            pressed && buttonStyle.buttonPressed,
                        ]}
                        onPress={() => {
                            setEditingEntry(null);
                            setIsOpen(true);
                        }}
                    >
                        <Text style={buttonStyle.buttonText}>
                            + Add income
                        </Text>
                    </Pressable>
                </View>

                <IncomeForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingEntry(null);
                    }}
                    entry={editingEntry ?? undefined}
                />

                {income.length > 0 && (
                    <View style={screenStyles.listHeader}>
                        <Text style={screenStyles.listTitle}>
                            All income
                        </Text>

                        <View style={screenStyles.countBadge}>
                            <Text style={screenStyles.countBadgeText}>
                                {income.length}
                            </Text>
                        </View>
                    </View>
                )}

                {income.length === 0 && !loading && (
                    <View style={screenStyles.emptyState}>
                        <View style={screenStyles.emptyStateIcon}>
                            <Text style={screenStyles.emptyStateIconText}>
                                I
                            </Text>
                        </View>

                        <Text style={screenStyles.emptyStateTitle}>
                            No income yet
                        </Text>

                        <Text style={screenStyles.emptyStateText}>
                            Add a paycheck with its pay date so Home can
                            include it in the selected period.
                        </Text>

                        <Pressable
                            style={({ pressed }) => [
                                buttonStyle.normalButton,
                                pressed && buttonStyle.buttonPressed,
                            ]}
                            onPress={() => {
                                setEditingEntry(null);
                                setIsOpen(true);
                            }}
                        >
                            <Text style={buttonStyle.buttonText}>
                                + Add first income
                            </Text>
                        </Pressable>
                    </View>
                )}

                {income.map((entry) => (
                    <FinanceRow
                        key={entry.id}
                        label={entry.source}
                        amount={entry.net}
                        subtitle={entry.date}
                        onPress={() => {
                            setEditingEntry(entry);
                            setIsOpen(true);
                        }}
                    />
                ))}
            </ScrollView>
        </>
    );
}
