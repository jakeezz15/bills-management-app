import { CASH_ACCOUNT_ID, CashAccount } from "@/types/account";
import { BillPayment } from "@/types/bill-payment";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsContribution } from "@/types/savings-contribution";
import { Transfer } from "@/types/transfer";
import { DateRange, isIsoInRange, parseIsoDate, rangeThrough } from "@/utils/date";
import { onlineAccounts } from "@/utils/accounts";

function resolveAccountId(accountId: string | undefined): string {
    return accountId && accountId.trim() ? accountId : CASH_ACCOUNT_ID;
}

export type AccountBalance = {
    accountId: string;
    balance: number;
};

/**
 * Running balance for one pot through `range.end`.
 * Income / transfers-in add; expenses, payments, contributions, transfers-out subtract.
 */
export function getAccountBalanceThrough(
    accountId: string,
    range: DateRange,
    income: Income[],
    expenses: Expense[],
    billPayments: BillPayment[],
    debtPayments: DebtPayment[],
    savingsContributions: SavingsContribution[],
    transfers: Transfer[]
): number {
    const through = rangeThrough(range.end);
    const id = resolveAccountId(accountId);
    let balance = 0;

    for (const item of income) {
        if (!isIsoInRange(item.date, through)) continue;
        if (resolveAccountId(item.accountId) !== id) continue;
        balance += item.net;
    }
    for (const item of expenses) {
        if (!isIsoInRange(item.date, through)) continue;
        if (resolveAccountId(item.accountId) !== id) continue;
        balance -= item.amount;
    }
    for (const item of billPayments) {
        if (!isIsoInRange(item.date, through)) continue;
        if (resolveAccountId(item.accountId) !== id) continue;
        balance -= item.amount;
    }
    for (const item of debtPayments) {
        if (!isIsoInRange(item.date, through)) continue;
        if (resolveAccountId(item.accountId) !== id) continue;
        balance -= item.amount;
    }
    for (const item of savingsContributions) {
        if (!isIsoInRange(item.date, through)) continue;
        if (resolveAccountId(item.accountId) !== id) continue;
        balance -= item.amount;
    }
    for (const item of transfers) {
        if (!isIsoInRange(item.date, through)) continue;
        if (item.fromAccountId === id) {
            balance -= item.amount;
        }
        if (item.toAccountId === id) {
            balance += item.amount;
        }
    }

    return balance;
}

/** Balance in the pot through `asOfIso` (inclusive) — what you can transfer out. */
export function getAvailableToTransfer(
    fromAccountId: string,
    asOfIso: string,
    income: Income[],
    expenses: Expense[],
    billPayments: BillPayment[],
    debtPayments: DebtPayment[],
    savingsContributions: SavingsContribution[],
    transfers: Transfer[]
): number {
    const asOf = parseIsoDate(asOfIso);
    if (!asOf) {
        return 0;
    }
    return getAccountBalanceThrough(
        fromAccountId,
        rangeThrough(asOf),
        income,
        expenses,
        billPayments,
        debtPayments,
        savingsContributions,
        transfers
    );
}

export type AccountSplit = {
    cash: number;
    online: number;
    total: number;
    byAccount: AccountBalance[];
};

/** Cash vs Online rollup + per-account balances as of period end. */
export function getAccountSplitThrough(
    range: DateRange,
    accounts: CashAccount[],
    income: Income[],
    expenses: Expense[],
    billPayments: BillPayment[],
    debtPayments: DebtPayment[],
    savingsContributions: SavingsContribution[],
    transfers: Transfer[]
): AccountSplit {
    const byAccount: AccountBalance[] = accounts
        .filter((account) => account.archived !== true || account.kind === "cash")
        .map((account) => ({
            accountId: account.id,
            balance: getAccountBalanceThrough(
                account.id,
                range,
                income,
                expenses,
                billPayments,
                debtPayments,
                savingsContributions,
                transfers
            ),
        }));

    const cash =
        byAccount.find((row) => row.accountId === CASH_ACCOUNT_ID)?.balance ?? 0;
    const onlineIds = new Set(onlineAccounts(accounts).map((a) => a.id));
    const online = byAccount
        .filter((row) => onlineIds.has(row.accountId))
        .reduce((sum, row) => sum + row.balance, 0);

    return {
        cash,
        online,
        total: cash + online,
        byAccount,
    };
}
