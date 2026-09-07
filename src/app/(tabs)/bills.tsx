import BillForm from "@/components/BillForm";
import { FinanceRow } from "@/components/FinanceRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { buttonStyle } from "@/styles/button-style";
import { screenStyles } from "@/styles/screen";
import { Bill } from "@/types/bill";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";

export default function BillsScreen() {
    const { bills, loading } = useBills();

    const [isOpen, setIsOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);

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
                            Bills
                        </Text>

                        <Text style={screenStyles.screenDescription}>
                            Recurring payments and due dates
                        </Text>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.normalButton,
                            pressed && buttonStyle.buttonPressed,
                        ]}
                        onPress={() => {
                            setEditingBill(null);
                            setIsOpen(true);
                        }}
                    >
                        <Text style={buttonStyle.buttonText}>
                            + Add bill
                        </Text>
                    </Pressable>
                </View>

                <BillForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingBill(null);
                    }}
                    bill={editingBill ?? undefined}
                />

                {bills.length > 0 && (
                    <View style={screenStyles.listHeader}>
                        <Text style={screenStyles.listTitle}>
                            All bills
                        </Text>

                        <View style={screenStyles.countBadge}>
                            <Text style={screenStyles.countBadgeText}>
                                {bills.length}
                            </Text>
                        </View>
                    </View>
                )}

                {bills.length === 0 && !loading && (
                    <View style={screenStyles.emptyState}>
                        <View style={screenStyles.emptyStateIcon}>
                            <Text style={screenStyles.emptyStateIconText}>
                                B
                            </Text>
                        </View>

                        <Text style={screenStyles.emptyStateTitle}>
                            No bills yet
                        </Text>

                        <Text style={screenStyles.emptyStateText}>
                            Add rent, utilities, or subscriptions to track
                            recurring payments.
                        </Text>

                        <Pressable
                            style={({ pressed }) => [
                                buttonStyle.normalButton,
                                pressed && buttonStyle.buttonPressed,
                            ]}
                            onPress={() => {
                                setEditingBill(null);
                                setIsOpen(true);
                            }}
                        >
                            <Text style={buttonStyle.buttonText}>
                                + Add first bill
                            </Text>
                        </Pressable>
                    </View>
                )}

                {bills.map((bill) => (
                    <FinanceRow
                        key={bill.id}
                        label={bill.name}
                        amount={bill.amount}
                        subtitle={
                            bill.isPaid
                                ? `Due day ${bill.dueDay} · Paid`
                                : `Due day ${bill.dueDay} · Unpaid`
                        }
                        onPress={() => {
                            setEditingBill(bill);
                            setIsOpen(true);
                        }}
                    />
                ))}
            </ScrollView>
        </>
    );
}
