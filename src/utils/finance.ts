import { incomeData, savingsData } from "@/constants/sample-data";
import { Debt } from "@/types/debt";
import { Expenses } from "@/types/expense";




export function getTotalIncome() {
    return incomeData.reduce((sum, item) => sum + item.net, 0)
}

export function getTotalExpenses(expenses: Expenses[]) {
    return expenses.reduce((sum, item) => sum + item.amount, 0)
}
export function getTotalDebtPayments(debts: Debt[]) {
    return debts.reduce((sum, item) => sum + item.minimumPayment, 0)
}
export function getTotalSavings() {
    return savingsData.reduce((sum, item) => sum + (item.monthlyContribution ?? 0), 0)
}

export function getLeftOver(expenses: Expenses[], debts: Debt[]) {
    return (getTotalIncome() - getTotalExpenses(expenses) - getTotalDebtPayments(debts) - getTotalSavings())
}

