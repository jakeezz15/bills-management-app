import BillForm from "@/components/BillForm";
import { FilterChips, PaidFilterChips } from "@/components/FilterChips";
import { FinanceRow } from "@/components/FinanceRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { BILL_CATEGORIES, PAID_FILTERS, PaidFilter } from "@/constants/categories";
import { buttonStyle } from "@/styles/button-style";
import { screenStyles } from "@/styles/screen";
import { Bill } from "@/types/bill";
import {
    filterBillsByPaidStatus,
    filterByCategory,
    formatBillSubtitle,
    getBillDueStatus,
} from "@/utils/filters";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";

export default function BillsScreen() {
    const { bills, loading, updateBill } = useBills();

    const [isOpen, setIsOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [paidFilter, setPaidFilter] = useState<PaidFilter>("All");
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    const filteredBills = useMemo(() => {
        const byPaid = filterBillsByPaidStatus(bills, paidFilter);
        return filterByCategory(byPaid, categoryFilter);
    }, [bills, paidFilter, categoryFilter]);

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
                    <>
                        <PaidFilterChips
                            options={PAID_FILTERS}
                            selected={paidFilter}
                            onSelect={(value) => setPaidFilter(value as PaidFilter)}
                        />
                        <FilterChips
                            options={BILL_CATEGORIES}
                            selected={categoryFilter}
                            onSelect={setCategoryFilter}
                        />

                        <View style={screenStyles.listHeader}>
                            <Text style={screenStyles.listTitle}>
                                All bills
                            </Text>

                            <View style={screenStyles.countBadge}>
                                <Text style={screenStyles.countBadgeText}>
                                    {filteredBills.length}
                                </Text>
                            </View>
                        </View>
                    </>
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

                {bills.length > 0 && filteredBills.length === 0 && (
                    <View style={screenStyles.emptyState}>
                        <Text style={screenStyles.emptyStateTitle}>
                            No matching bills
                        </Text>
                        <Text style={screenStyles.emptyStateText}>
                            Try a different paid status or category filter.
                        </Text>
                    </View>
                )}

                {filteredBills.map((bill) => {
                    const dueStatus = getBillDueStatus(bill);
                    const dueTone =
                        dueStatus === "overdue"
                            ? "overdue"
                            : dueStatus === "due-soon"
                                ? "due-soon"
                                : "default";

                    return (
                        <FinanceRow
                            key={bill.id}
                            label={bill.name}
                            amount={bill.amount}
                            subtitle={formatBillSubtitle(bill)}
                            isPaid={bill.isPaid}
                            dueTone={dueTone}
                            onTogglePaid={() =>
                                updateBill(bill.id, { isPaid: !bill.isPaid })
                            }
                            onPress={() => {
                                setEditingBill(bill);
                                setIsOpen(true);
                            }}
                        />
                    );
                })}
            </ScrollView>
        </>
    );
}
