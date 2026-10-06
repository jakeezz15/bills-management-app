import { useAccounts } from "@/app/contexts/AccountsContext";
import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useIncome } from "@/app/contexts/IncomeContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { AccountPicker } from "@/components/AccountPicker";
import { DateField } from "@/components/DateField";
import { CategoryPicker } from "@/components/CategoryPicker";
import { FormDialog } from "@/components/FormDialog";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { useFormStyles, useFormColors } from "@/styles/form";
import { Expense } from "@/types/expense";
import {
    debitFundsErrorMessage,
    getAvailableToDebit,
    getDebitShortfall,
} from "@/utils/account-balances";
import { moneyFieldError, parseMoneyInput } from "@/utils/amount-input";
import { defaultSpendAccountId } from "@/utils/accounts";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { currencySymbol } from "@/utils/money";
import { useFormSession } from "@/hooks/useFormSession";
import { useMemo, useState } from "react";
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
    const form = useFormStyles();
    const formColors = useFormColors();
    const { expenses, addExpense, updateExpense, deleteExpense } =
        useExpenses();
    const { accounts, transfers, adjustments } = useAccounts();
    const { income } = useIncome();
    const { payments: billPayments } = useBills();
    const { payments: debtPayments } = useDebt();
    const { contributions: savingsContributions } = useSavings();
    const { currency, formatMoney } = useLocale();
    const symbol = currencySymbol(currency);

    const [name, setName] = useState(expense?.name ?? "");
    const [amount, setAmount] = useState(
        expense ? String(expense.amount) : ""
    );
    const [date, setDate] = useState(expense?.date ?? todayIsoDate());
    const [category, setCategory] = useState<string | null>(
        expense?.category ?? null
    );
    const [accountId, setAccountId] = useState(
        expense?.accountId ?? defaultSpendAccountId(accounts)
    );
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const ledger = useMemo(
        () => ({
            income,
            expenses,
            billPayments,
            debtPayments,
            savingsContributions,
            transfers,
            adjustments,
        }),
        [
            income,
            expenses,
            billPayments,
            debtPayments,
            savingsContributions,
            transfers,
            adjustments,
        ]
    );

    const excludeExpenseId = expense?.id;
    const exclude = excludeExpenseId
        ? { expenseId: excludeExpenseId }
        : undefined;
    const available = useMemo(
        () =>
            getAvailableToDebit(
                accountId,
                date,
                ledger,
                excludeExpenseId
                    ? { expenseId: excludeExpenseId }
                    : undefined
            ),
        [accountId, date, ledger, excludeExpenseId]
    );

    const accountName =
        accounts.find((account) => account.id === accountId)?.name ?? "Account";

    const nameHasError = showErrors && name.trim() === "";
    const amountError = showErrors ? moneyFieldError(amount) : null;
    const dateHasError = showErrors && parseIsoDate(date) === null;
    const amountNumber = parseMoneyInput(amount);
    const fundsError =
        showErrors &&
        amountNumber !== null &&
        getDebitShortfall(accountId, amountNumber, date, ledger, exclude) > 0
            ? debitFundsErrorMessage(available, accountName, (value) =>
                  formatMoney(value, { compact: true })
              )
            : null;

    const handleSubmit = async () => {
        const parsed = parseMoneyInput(amount);
        if (!name.trim() || parsed === null || parseIsoDate(date) === null) {
            setShowErrors(true);
            return;
        }
        if (getDebitShortfall(accountId, parsed, date, ledger, exclude) > 0) {
            setShowErrors(true);
            return;
        }

        const payload = {
            name,
            amount: parsed,
            date: date.trim(),
            category: category ?? undefined,
            accountId,
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
                        (amountError || fundsError) && form.inputError,
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
                {amountError ? (
                    <Text style={form.error}>{amountError}</Text>
                ) : null}
                {fundsError ? (
                    <Text style={form.error}>{fundsError}</Text>
                ) : null}
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
                <Text style={form.label}>Paid from</Text>
                <AccountPicker
                    value={accountId}
                    onChange={setAccountId}
                    title="Paid from"
                />
                <Text style={form.helper}>
                    {available > 0
                        ? `${formatMoney(available, { compact: true })} available`
                        : "Nothing available on this date"}
                </Text>
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
