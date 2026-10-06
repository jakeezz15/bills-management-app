import { useAccounts } from "@/app/contexts/AccountsContext";
import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useIncome } from "@/app/contexts/IncomeContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import type { DebitExclude, DebitLedger } from "@/utils/account-balances";
import {
    debitFundsErrorMessage,
    getAvailableToDebit,
    getDebitShortfall,
} from "@/utils/account-balances";
import { alertInsufficientFunds } from "@/utils/confirm";
import { useMemo } from "react";

/** Shared ledger snapshot for pot debit checks across pay flows. */
export function useDebitLedger(): DebitLedger {
    const { income } = useIncome();
    const { expenses } = useExpenses();
    const { payments: billPayments } = useBills();
    const { payments: debtPayments } = useDebt();
    const { contributions: savingsContributions } = useSavings();
    const { transfers, adjustments } = useAccounts();

    return useMemo(
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
}

/**
 * Returns false (and alerts) when the pot cannot cover `amount`.
 * Call before recording a bill/debt/expense/savings debit.
 */
export function ensureCanDebit(args: {
    accountId: string;
    amount: number;
    asOfIso: string;
    accountName: string;
    ledger: DebitLedger;
    exclude?: DebitExclude;
    formatMoney: (amount: number) => string;
}): boolean {
    const shortfall = getDebitShortfall(
        args.accountId,
        args.amount,
        args.asOfIso,
        args.ledger,
        args.exclude
    );
    if (shortfall <= 0) {
        return true;
    }
    const available = getAvailableToDebit(
        args.accountId,
        args.asOfIso,
        args.ledger,
        args.exclude
    );
    alertInsufficientFunds(
        debitFundsErrorMessage(available, args.accountName, args.formatMoney)
    );
    return false;
}
