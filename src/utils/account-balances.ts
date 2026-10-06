import { CASH_ACCOUNT_ID, CashAccount } from "@/types/account";
import { AccountAdjustment } from "@/types/account-adjustment";
import { BillPayment } from "@/types/bill-payment";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsContribution } from "@/types/savings-contribution";
import { Transfer } from "@/types/transfer";
import { DateRange, isIsoInRange, parseIsoDate, rangeThrough } from "@/utils/date";

export function resolveAccountId(accountId: string | undefined): string {
    return accountId && accountId.trim() ? accountId : CASH_ACCOUNT_ID;
}

export type AccountBalance = {
    accountId: string;
    balance: number;
};

/**
 * Running balance for one pot through `range.end`.
 * Income / transfers-in / adjustments add; expenses, payments, contributions, transfers-out subtract.
 */
export function getAccountBalanceThrough(
    accountId: string,
    range: DateRange,
    income: Income[],
    expenses: Expense[],
    billPayments: BillPayment[],
    debtPayments: DebtPayment[],
    savingsContributions: SavingsContribution[],
    transfers: Transfer[],
    adjustments: AccountAdjustment[] = []
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
        if (item.skipped === true) continue;
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
    for (const item of adjustments) {
        if (!isIsoInRange(item.date, through)) continue;
        if (item.accountId !== id) continue;
        balance += item.delta;
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
    transfers: Transfer[],
    adjustments: AccountAdjustment[] = []
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
        transfers,
        adjustments
    );
}

export type DebitLedger = {
    income: Income[];
    expenses: Expense[];
    billPayments: BillPayment[];
    debtPayments: DebtPayment[];
    savingsContributions: SavingsContribution[];
    transfers: Transfer[];
    adjustments?: AccountAdjustment[];
};

/** Rows to ignore when checking funds (e.g. the expense being edited). */
export type DebitExclude = {
    expenseId?: string;
    billPaymentId?: string;
    debtPaymentId?: string;
    savingsContributionId?: string;
    transferId?: string;
};

/** Available balance for a debit, optionally excluding a row being replaced. */
export function getAvailableToDebit(
    accountId: string,
    asOfIso: string,
    ledger: DebitLedger,
    exclude?: DebitExclude
): number {
    const expenses = exclude?.expenseId
        ? ledger.expenses.filter((item) => item.id !== exclude.expenseId)
        : ledger.expenses;
    const billPayments = exclude?.billPaymentId
        ? ledger.billPayments.filter(
              (item) => item.id !== exclude.billPaymentId
          )
        : ledger.billPayments;
    const debtPayments = exclude?.debtPaymentId
        ? ledger.debtPayments.filter(
              (item) => item.id !== exclude.debtPaymentId
          )
        : ledger.debtPayments;
    const savingsContributions = exclude?.savingsContributionId
        ? ledger.savingsContributions.filter(
              (item) => item.id !== exclude.savingsContributionId
          )
        : ledger.savingsContributions;
    const transfers = exclude?.transferId
        ? ledger.transfers.filter((item) => item.id !== exclude.transferId)
        : ledger.transfers;

    return getAvailableToTransfer(
        accountId,
        asOfIso,
        ledger.income,
        expenses,
        billPayments,
        debtPayments,
        savingsContributions,
        transfers,
        ledger.adjustments ?? []
    );
}

/**
 * How much the debit exceeds available funds (0 = ok).
 * Negative pots always shortfall for any positive amount.
 */
export function getDebitShortfall(
    accountId: string,
    amount: number,
    asOfIso: string,
    ledger: DebitLedger,
    exclude?: DebitExclude
): number {
    if (!(amount > 0)) {
        return 0;
    }
    const available = getAvailableToDebit(
        accountId,
        asOfIso,
        ledger,
        exclude
    );
    if (amount <= available) {
        return 0;
    }
    return amount - available;
}

/** User-facing copy when a pot cannot cover a debit. */
export function debitFundsErrorMessage(
    available: number,
    accountName: string,
    formatMoney: (amount: number) => string
): string {
    if (available <= 0) {
        return `${accountName} has nothing available on this date.`;
    }
    return `Only ${formatMoney(available)} available in ${accountName}.`;
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
    transfers: Transfer[],
    adjustments: AccountAdjustment[] = []
): AccountSplit {
    // Include archived Online pots so archived money still appears in Online total.
    const byAccount: AccountBalance[] = accounts.map((account) => ({
        accountId: account.id,
        balance: getAccountBalanceThrough(
            account.id,
            range,
            income,
            expenses,
            billPayments,
            debtPayments,
            savingsContributions,
            transfers,
            adjustments
        ),
    }));

    const cash =
        byAccount.find((row) => row.accountId === CASH_ACCOUNT_ID)?.balance ?? 0;
    const onlineIds = new Set(
        accounts.filter((a) => a.kind === "online").map((a) => a.id)
    );
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

export type PotActivityKind =
    | "income"
    | "expense"
    | "bill"
    | "debt"
    | "savings"
    | "transfer-in"
    | "transfer-out"
    | "adjustment";

export type PotActivityRow = {
    id: string;
    kind: PotActivityKind;
    date: string;
    title: string;
    amount: number;
};

/** Chronological activity for one pot (newest first). Untagged money = Cash. */
export function getPotActivity(
    accountId: string,
    income: Income[],
    expenses: Expense[],
    billPayments: BillPayment[],
    debtPayments: DebtPayment[],
    savingsContributions: SavingsContribution[],
    transfers: Transfer[],
    adjustments: AccountAdjustment[] = []
): PotActivityRow[] {
    const id = resolveAccountId(accountId);
    const rows: PotActivityRow[] = [];

    for (const item of income) {
        if (resolveAccountId(item.accountId) !== id) continue;
        rows.push({
            id: `income-${item.id}`,
            kind: "income",
            date: item.date,
            title: item.source || "Income",
            amount: item.net,
        });
    }
    for (const item of expenses) {
        if (resolveAccountId(item.accountId) !== id) continue;
        rows.push({
            id: `expense-${item.id}`,
            kind: "expense",
            date: item.date,
            title: item.name || "Spending",
            amount: -item.amount,
        });
    }
    for (const item of billPayments) {
        if (resolveAccountId(item.accountId) !== id) continue;
        rows.push({
            id: `bill-${item.id}`,
            kind: "bill",
            date: item.date,
            title: "Bill payment",
            amount: -item.amount,
        });
    }
    for (const item of debtPayments) {
        if (item.skipped === true) continue;
        if (resolveAccountId(item.accountId) !== id) continue;
        rows.push({
            id: `debt-${item.id}`,
            kind: "debt",
            date: item.date,
            title: "Debt payment",
            amount: -item.amount,
        });
    }
    for (const item of savingsContributions) {
        if (resolveAccountId(item.accountId) !== id) continue;
        rows.push({
            id: `savings-${item.id}`,
            kind: "savings",
            date: item.date,
            title: "Savings",
            amount: -item.amount,
        });
    }
    for (const item of transfers) {
        if (item.fromAccountId === id) {
            rows.push({
                id: `xfer-out-${item.id}`,
                kind: "transfer-out",
                date: item.date,
                title: item.note?.trim() || "Transfer out",
                amount: -item.amount,
            });
        }
        if (item.toAccountId === id) {
            rows.push({
                id: `xfer-in-${item.id}`,
                kind: "transfer-in",
                date: item.date,
                title: item.note?.trim() || "Transfer in",
                amount: item.amount,
            });
        }
    }
    for (const item of adjustments) {
        if (item.accountId !== id) continue;
        rows.push({
            id: `adj-${item.id}`,
            kind: "adjustment",
            date: item.date,
            title: item.note?.trim() || "Balance adjustment",
            amount: item.delta,
        });
    }

    return rows.sort((a, b) => {
        if (a.date !== b.date) {
            return a.date < b.date ? 1 : -1;
        }
        return a.id < b.id ? 1 : -1;
    });
}
