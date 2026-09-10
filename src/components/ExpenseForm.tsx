import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { DateField } from "@/components/DateField";
import { CategoryPicker } from "@/components/CategoryPicker";
import { FormDialog } from "@/components/FormDialog";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { form, formColors } from "@/styles/form";
import { Expense } from "@/types/expense";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { currencySymbol } from "@/utils/money";
import { useFormSession } from "@/hooks/useFormSession";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

type ExpenseFormProps = {
    visible: boolean;
    onClose: () => void;
    expense?: Expense;
};

export default function ExpenseForm(props: ExpenseFormProps) {
    const session = useFormSession(props.visible, props.expense?.id);
    return <ExpenseEditor key={session} {...props} />;
}

function ExpenseEditor({ visible, onClose, expense }: ExpenseFormProps) {
    const { addExpense, updateExpense, deleteExpense } = useExpenses();
    const { currency } = useLocale();
    const symbol = currencySymbol(currency);

    const [name, setName] = useState(expense?.name ?? "");
    const [amount, setAmount] = useState(
        expense ? String(expense.amount) : ""
    );
    const [date, setDate] = useState(expense?.date ?? todayIsoDate());
    const [category, setCategory] = useState<string | null>(
        expense?.category ?? null
    );
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const amountHasError = showErrors && amount.trim() === "";
    const dateHasError = showErrors && parseIsoDate(date) === null;

    const handleSubmit = async () => {
        if (!name || !amount || parseIsoDate(date) === null) {
            setShowErrors(true);
            return;
        }

        const payload = {
            name,
            amount: Number(amount),
            date: date.trim(),
            category: category ?? undefined,
        };

        if (expense) {
            await updateExpense(expense.id, payload);
        } else {
            await addExpense({
                id: Date.now().toString(),
                ...payload,
            });
        }

        setShowErrors(false);
        onClose();
    };

    return (
        <FormDialog
            visible={visible}
            onClose={onClose}
            kicker="Everyday spend"
            title={expense ? "Edit expense" : "New expense"}
            saveLabel={expense ? "Save expense" : "Add expense"}
            onSave={() => {
                void handleSubmit();
            }}
            deleteLabel={expense ? "Delete expense" : undefined}
            deleteMessage="This removes this expense from the device."
            onDelete={
                expense
                    ? async () => {
                          await deleteExpense(expense.id);
                          onClose();
                      }
                    : undefined
            }
        >
            <View style={form.field}>
                <Text style={form.label}>Name</Text>
                <TextInput
                    style={[
                        form.input,
                        focusedInput === "name" && form.inputFocused,
                        nameHasError && form.inputError,
                    ]}
                    placeholder="Coffee, groceries…"
                    placeholderTextColor={formColors.placeholder}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput(null)}
                />
                {nameHasError && (
                    <Text style={form.error}>
                        Expense name is required.
                    </Text>
                )}
            </View>

            <View style={form.field}>
                <Text style={form.label}>Amount</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "amount" && form.inputFocused,
                        amountHasError && form.inputError,
                    ]}
                >
                    <Text style={form.amountPrefix}>{symbol}</Text>
                    <TextInput
                        style={form.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={formColors.placeholder}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("amount")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {amountHasError && (
                    <Text style={form.error}>Amount is required.</Text>
                )}
            </View>

            <View style={form.field}>
                <DateField
                    label="Date spent"
                    value={date}
                    onChange={setDate}
                    hasError={dateHasError}
                    errorMessage="Choose a valid date."
                />
            </View>

            <View style={form.field}>
                <Text style={form.label}>Category (optional)</Text>
                <CategoryPicker
                    options={EXPENSE_CATEGORIES}
                    selected={category}
                    onSelect={setCategory}
                />
            </View>
        </FormDialog>
    );
}
