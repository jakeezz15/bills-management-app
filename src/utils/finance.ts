import { incomeData } from "@/constants/sample-data";
import { Bill } from "@/types/bill";
import { Debt } from "@/types/debt";
import { Expense } from "@/types/expense";
import { SavingsGoal } from "@/types/savings";

export function getTotalIncome() {
    return incomeData.reduce((sum, item) => sum + item.net, 0);
}

export function getTotalExpenses(expenses: Expense[]) {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
}

export function getTotalBills(bills: Bill[]) {
    return bills.reduce((sum, item) => sum + item.amount, 0);
}

export function getTotalDebtPayments(debts: Debt[]) {
    return debts.reduce((sum, item) => sum + item.minimumPayment, 0);
}

export function getTotalSavings(savings: SavingsGoal[]) {
    return savings.reduce((sum, item) => sum + (item.monthlyContribution ?? 0), 0);
}

export function getLeftOver(
    expenses: Expense[],
    bills: Bill[],
    debts: Debt[],
    savings: SavingsGoal[]
) {
    return (
        getTotalIncome() -
        getTotalExpenses(expenses) -
        getTotalBills(bills) -
        getTotalDebtPayments(debts) -
        getTotalSavings(savings)
    );
}
