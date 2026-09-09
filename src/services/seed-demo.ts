import { EXPENSE_CATEGORIES } from "@/constants/categories";
import {
    markFirstRunComplete,
    saveBillPayments,
    saveBills,
    saveDebtPayments,
    saveDebts,
    saveExpenses,
    saveIncome,
    saveSavings,
    saveSavingsContributions,
    seedEmptyData,
} from "@/services/storage";
import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsGoal } from "@/types/savings";
import { SavingsContribution } from "@/types/savings-contribution";
import { toIsoDate } from "@/utils/date";
import { stampCreate } from "@/utils/timestamps";

type DemoSeedResult = {
    income: number;
    expenses: number;
    bills: number;
    billPayments: number;
    debts: number;
    debtPayments: number;
    savings: number;
    contributions: number;
};

function ts(isoDate: string) {
    return {
        createdAt: `${isoDate}T12:00:00.000Z`,
        updatedAt: `${isoDate}T12:00:00.000Z`,
    };
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

function roundMoney(n: number) {
    return Math.round(n * 100) / 100;
}

function daysInMonth(year: number, monthIndex: number) {
    return new Date(year, monthIndex + 1, 0).getDate();
}

function isoOn(year: number, monthIndex: number, day: number) {
    const dim = daysInMonth(year, monthIndex);
    return toIsoDate(new Date(year, monthIndex, clamp(day, 1, dim)));
}

/** Simple seeded PRNG so re-seeds look varied but stable within a run. */
function createRng(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pick<T>(rng: () => number, list: readonly T[]): T {
    return list[Math.floor(rng() * list.length) % list.length];
}

function monthsFromJulyThrough(today: Date): { year: number; month: number }[] {
    const endYear = today.getFullYear();
    const endMonth = today.getMonth();
    let year = endYear;
    let month = 6; // July
    if (endMonth < 6) {
        year = endYear - 1;
    }

    const months: { year: number; month: number }[] = [];
    while (year < endYear || (year === endYear && month <= endMonth)) {
        months.push({ year, month });
        month += 1;
        if (month > 11) {
            month = 0;
            year += 1;
        }
    }
    return months;
}

const EXPENSE_CATALOG: {
    name: string;
    category: (typeof EXPENSE_CATEGORIES)[number];
    min: number;
    max: number;
}[] = [
    { name: "Groceries", category: "Food", min: 35, max: 95 },
    { name: "Coffee", category: "Food", min: 3.5, max: 7.5 },
    { name: "Lunch out", category: "Food", min: 8, max: 22 },
    { name: "Gas", category: "Transport", min: 30, max: 55 },
    { name: "Grab / ride", category: "Transport", min: 5, max: 18 },
    { name: "Transit pass", category: "Transport", min: 20, max: 40 },
    { name: "Online order", category: "Shopping", min: 15, max: 80 },
    { name: "Clothes", category: "Shopping", min: 25, max: 120 },
    { name: "Movie / streaming night", category: "Entertainment", min: 10, max: 35 },
    { name: "Games / apps", category: "Entertainment", min: 5, max: 40 },
    { name: "Pharmacy", category: "Health", min: 8, max: 45 },
    { name: "Clinic co-pay", category: "Health", min: 20, max: 60 },
    { name: "Misc", category: "Other", min: 5, max: 30 },
];

/**
 * Wipe finance data and load realistic demo entries from July through today.
 * Dev helper only — replaces all income/expenses/bills/debts/savings.
 */
export async function seedDemoData(
    today = new Date()
): Promise<DemoSeedResult> {
    const rng = createRng(
        today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    );
    const months = monthsFromJulyThrough(today);
    const startIso = isoOn(months[0].year, months[0].month, 1);

    await seedEmptyData();

    const bills: Bill[] = [
        {
            id: "demo-bill-rent",
            name: "Rent",
            amount: 850,
            dueDay: 1,
            isPaid: false,
            category: "Housing",
            isRecurring: true,
            ...ts(startIso),
        },
        {
            id: "demo-bill-electric",
            name: "Electricity",
            amount: roundMoney(95 + rng() * 40),
            dueDay: 15,
            isPaid: false,
            category: "Utilities",
            isRecurring: true,
            ...ts(startIso),
        },
        {
            id: "demo-bill-internet",
            name: "Internet",
            amount: 49.99,
            dueDay: 10,
            isPaid: false,
            category: "Utilities",
            isRecurring: true,
            ...ts(startIso),
        },
        {
            id: "demo-bill-spotify",
            name: "Spotify",
            amount: 10.99,
            dueDay: 8,
            isPaid: false,
            category: "Subscriptions",
            isRecurring: true,
            ...ts(startIso),
        },
        {
            id: "demo-bill-phone",
            name: "Phone plan",
            amount: 35,
            dueDay: 20,
            isPaid: false,
            category: "Subscriptions",
            isRecurring: true,
            ...ts(startIso),
        },
    ];

    const billPayments: BillPayment[] = [];
    const todayIso = toIsoDate(today);

    for (const month of months) {
        const isCurrent =
            month.year === today.getFullYear() &&
            month.month === today.getMonth();

        for (const bill of bills) {
            const dueIso = isoOn(month.year, month.month, bill.dueDay);
            if (dueIso > todayIso) {
                continue;
            }

            // Past months: always paid. Current month: pay if due day has passed.
            const shouldPay = !isCurrent || bill.dueDay <= today.getDate();
            if (!shouldPay) {
                continue;
            }

            // Slight realism: current month might leave one utility unpaid.
            if (isCurrent && bill.category === "Utilities" && rng() < 0.35) {
                continue;
            }

            billPayments.push({
                id: `demo-bp-${bill.id}-${month.year}-${month.month}`,
                billId: bill.id,
                amount: bill.amount,
                date: dueIso,
                ...stampCreate(),
            });
        }
    }

    const paidThisMonth = new Set(
        billPayments
            .filter((payment) => {
                const [y, m] = payment.date.split("-").map(Number);
                return (
                    y === today.getFullYear() && m === today.getMonth() + 1
                );
            })
            .map((payment) => payment.billId)
    );
    for (const bill of bills) {
        bill.isPaid = paidThisMonth.has(bill.id);
    }

    const income: Income[] = [];
    for (const month of months) {
        const payDay = isoOn(month.year, month.month, 28);
        if (payDay > todayIso) {
            continue;
        }
        const gross = roundMoney(2800 + rng() * 200);
        const net = roundMoney(gross * (0.72 + rng() * 0.06));
        income.push({
            id: `demo-income-${month.year}-${month.month}`,
            date: payDay,
            gross,
            net,
            source: "Salary",
            ...ts(payDay),
        });

        // Occasional side income
        if (rng() < 0.4) {
            const sideDay = isoOn(month.year, month.month, 12 + Math.floor(rng() * 10));
            if (sideDay <= todayIso) {
                const amount = roundMoney(80 + rng() * 220);
                income.push({
                    id: `demo-income-side-${month.year}-${month.month}`,
                    date: sideDay,
                    gross: amount,
                    net: amount,
                    source: pick(rng, ["Freelance", "Refund", "Gift"]),
                    ...ts(sideDay),
                });
            }
        }
    }

    const expenses: Expense[] = [];
    let expenseSeq = 0;
    for (const month of months) {
        const dim = daysInMonth(month.year, month.month);
        const isCurrent =
            month.year === today.getFullYear() &&
            month.month === today.getMonth();
        const lastDay = isCurrent ? today.getDate() : dim;
        const count = 14 + Math.floor(rng() * 10);

        for (let i = 0; i < count; i += 1) {
            const day = 1 + Math.floor(rng() * lastDay);
            const date = isoOn(month.year, month.month, day);
            if (date > todayIso) {
                continue;
            }
            const item = pick(rng, EXPENSE_CATALOG);
            const amount = roundMoney(
                item.min + rng() * (item.max - item.min)
            );
            expenseSeq += 1;
            expenses.push({
                id: `demo-exp-${expenseSeq}`,
                name: item.name,
                amount,
                date,
                category: item.category,
                ...ts(date),
            });
        }
    }

    let phoneBalance = 720;
    let laptopBalance = 1100;
    const phoneMin = 45;
    const laptopMin = 75;
    const debtPayments: DebtPayment[] = [];
    let debtPaySeq = 0;

    for (const month of months) {
        const payDay = isoOn(month.year, month.month, 15);
        if (payDay > todayIso) {
            continue;
        }

        if (phoneBalance > 0) {
            const amount = roundMoney(Math.min(phoneMin, phoneBalance));
            phoneBalance = roundMoney(phoneBalance - amount);
            debtPaySeq += 1;
            debtPayments.push({
                id: `demo-dp-phone-${debtPaySeq}`,
                debtId: "demo-debt-phone",
                amount,
                date: payDay,
                ...stampCreate(),
            });
        }

        if (laptopBalance > 0 && rng() > 0.15) {
            const amount = roundMoney(Math.min(laptopMin, laptopBalance));
            laptopBalance = roundMoney(laptopBalance - amount);
            debtPaySeq += 1;
            debtPayments.push({
                id: `demo-dp-laptop-${debtPaySeq}`,
                debtId: "demo-debt-laptop",
                amount,
                date: payDay,
                ...stampCreate(),
            });
        }
    }

    const debts: Debt[] = [
        {
            id: "demo-debt-phone",
            name: "iPhone installment",
            balance: phoneBalance,
            dueDay: 15,
            minimumPayment: phoneMin,
            startDate: startIso,
            type: "Device / Installment",
            paidOffDate:
                phoneBalance <= 0
                    ? debtPayments.filter((p) => p.debtId === "demo-debt-phone").slice(-1)[0]
                          ?.date
                    : undefined,
            ...ts(startIso),
        },
        {
            id: "demo-debt-laptop",
            name: "MacBook installment",
            balance: laptopBalance,
            dueDay: 15,
            minimumPayment: laptopMin,
            startDate: startIso,
            type: "Device / Installment",
            paidOffDate:
                laptopBalance <= 0
                    ? debtPayments
                          .filter((p) => p.debtId === "demo-debt-laptop")
                          .slice(-1)[0]?.date
                    : undefined,
            ...ts(startIso),
        },
    ];

    const contributions: SavingsContribution[] = [];
    let emergency = 400;
    let vacation = 150;
    let contribSeq = 0;

    for (const month of months) {
        const day = isoOn(month.year, month.month, 5);
        if (day > todayIso) {
            continue;
        }
        const emergencyAmt = 150 + Math.floor(rng() * 80);
        const vacationAmt = 75 + Math.floor(rng() * 50);
        emergency += emergencyAmt;
        vacation += vacationAmt;
        contribSeq += 1;
        contributions.push({
            id: `demo-sc-em-${contribSeq}`,
            savingsId: "demo-sav-emergency",
            amount: emergencyAmt,
            date: day,
            ...stampCreate(),
        });
        contribSeq += 1;
        contributions.push({
            id: `demo-sc-vac-${contribSeq}`,
            savingsId: "demo-sav-vacation",
            amount: vacationAmt,
            date: day,
            ...stampCreate(),
        });
    }

    const savings: SavingsGoal[] = [
        {
            id: "demo-sav-emergency",
            name: "Emergency fund",
            targetAmount: 5000,
            currentAmount: emergency,
            monthlyContribution: 200,
            ...ts(startIso),
        },
        {
            id: "demo-sav-vacation",
            name: "Vacation",
            targetAmount: 2000,
            currentAmount: vacation,
            monthlyContribution: 100,
            ...ts(startIso),
        },
    ];

    await Promise.all([
        saveBills(bills),
        saveBillPayments(billPayments),
        saveIncome(income),
        saveExpenses(expenses),
        saveDebts(debts),
        saveDebtPayments(debtPayments),
        saveSavings(savings),
        saveSavingsContributions(contributions),
        markFirstRunComplete(),
    ]);

    return {
        income: income.length,
        expenses: expenses.length,
        bills: bills.length,
        billPayments: billPayments.length,
        debts: debts.length,
        debtPayments: debtPayments.length,
        savings: savings.length,
        contributions: contributions.length,
    };
}
