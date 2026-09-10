import { DashboardEmpty } from "@/components/DashboardEmpty";
import ExpenseForm from "@/components/ExpenseForm";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RowGroup, StatusRow } from "@/components/StatusRow";
import { dashboard } from "@/styles/dashboard";
import { Expense } from "@/types/expense";
import { isIsoInRange } from "@/utils/date";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useLocale } from "../contexts/LocaleContext";

type ExpensesScreenProps = {
    embedded?: boolean;
    requestAdd?: number;
};

export default function ExpensesScreen({
    embedded = false,
    requestAdd = 0,
}: ExpensesScreenProps) {
    const { formatMoney } = useLocale();
    const { expenses, loading } = useExpenses();
    const { range } = useDateRange();
    const [isOpen, setIsOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const lastRequest = useRef(0);

    const inPeriod = useMemo(
        () =>
            expenses
                .filter((expense) => isIsoInRange(expense.date, range))
                .sort((a, b) => b.date.localeCompare(a.date)),
        [expenses, range]
    );

    useEffect(() => {
        if (requestAdd > 0 && requestAdd !== lastRequest.current) {
            lastRequest.current = requestAdd;
            setEditingExpense(null);
            setIsOpen(true);
        }
    }, [requestAdd]);

    return (
        <View style={dashboard.screen}>
            {loading && <LoadingScreen />}

            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    !embedded && { paddingTop: 48 },
                ]}
            >
                <ExpenseForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingExpense(null);
                    }}
                    expense={editingExpense ?? undefined}
                />

                {expenses.length === 0 && !loading && (
                    <DashboardEmpty
                        title="No spending yet"
                        text="Log coffee, groceries, or other everyday spending with the date you spent it."
                        actionLabel="Add first expense"
                        onAction={() => {
                            setEditingExpense(null);
                            setIsOpen(true);
                        }}
                    />
                )}

                {expenses.length > 0 && inPeriod.length === 0 && (
                    <DashboardEmpty
                        title="Nothing in this period"
                        text="Step the date, or jump to today, to find purchases you already logged."
                        actionLabel="Add spending"
                        onAction={() => {
                            setEditingExpense(null);
                            setIsOpen(true);
                        }}
                    />
                )}

                {inPeriod.length > 0 ? (
                    <RowGroup>
                        {inPeriod.map((expense, index) => (
                            <StatusRow
                                key={expense.id}
                                title={expense.name}
                                subtitle={
                                    expense.category?.trim() || expense.date
                                }
                                amount={formatMoney(expense.amount, {
                                    sign: "−",
                                })}
                                showChip={false}
                                isLast={index === inPeriod.length - 1}
                                onPress={() => {
                                    setEditingExpense(expense);
                                    setIsOpen(true);
                                }}
                            />
                        ))}
                    </RowGroup>
                ) : null}
            </ScrollView>
        </View>
    );
}
