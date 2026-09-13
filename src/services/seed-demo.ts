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
import { isDevToolsBuild } from "@/utils/dev-tools";
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
    if (!isDevToolsBuild()) {
        throw new Error("Demo seed is only available in a development build.");
    }
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
            amount: 0,
            dueDay: 15,
            isPaid: false,
            category: "Utilities",
            isRecurring: true,
            amountVaries: true,
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
            payCadence: "monthly",
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
            startDate: startIso,
            monthlyContribution: 200,
            ...ts(startIso),
        },
        {
            id: "demo-sav-vacation",
            name: "Vacation",
            targetAmount: 2000,
            currentAmount: vacation,
            startDate: startIso,
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

/**
 * Hand-crafted demo for Play Store / App Store screenshots.
 * Current month is photogenic: paid + unpaid bills, clear leftover,
 * readable income / spend / savings / debt rows. Dev builds only.
 */
export async function seedScreenshotData(
    today = new Date()
): Promise<DemoSeedResult> {
    if (!isDevToolsBuild()) {
        throw new Error("Screenshot seed is only available in a development build.");
    }

    const y = today.getFullYear();
    const m = today.getMonth();
    const todayIso = toIsoDate(today);
    const day = today.getDate();

    // Prefer mid-month-looking due days that still make sense near month edges.
    const dueSoonDay = clamp(day + 3, 2, 28);
    const overdueDay = clamp(day - 4, 1, 27);

    const thisMonthStart = isoOn(y, m, 1);
    const prev = m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 };
    const prev2 =
        prev.month === 0
            ? { year: prev.year - 1, month: 11 }
            : { year: prev.year, month: prev.month - 1 };

    await seedEmptyData();

    const bills: Bill[] = [
        {
            id: "shot-bill-rent",
            name: "Rent",
            amount: 1450,
            dueDay: 1,
            isPaid: true,
            category: "Housing",
            isRecurring: true,
            ...ts(thisMonthStart),
        },
        {
            id: "shot-bill-electric",
            name: "Electricity",
            amount: 0,
            dueDay: 15,
            isPaid: false,
            category: "Utilities",
            isRecurring: true,
            amountVaries: true,
            ...ts(thisMonthStart),
        },
        {
            id: "shot-bill-internet",
            name: "Internet",
            amount: 64.99,
            dueDay: 10,
            isPaid: true,
            category: "Utilities",
            isRecurring: true,
            ...ts(thisMonthStart),
        },
        {
            id: "shot-bill-spotify",
            name: "Spotify",
            amount: 11.99,
            dueDay: overdueDay,
            isPaid: false,
            category: "Subscriptions",
            isRecurring: true,
            ...ts(thisMonthStart),
        },
        {
            id: "shot-bill-phone",
            name: "Phone plan",
            amount: 45,
            dueDay: dueSoonDay,
            isPaid: false,
            category: "Subscriptions",
            isRecurring: true,
            ...ts(thisMonthStart),
        },
    ];

    const billPayments: BillPayment[] = [
        // Prior months — rent + utilities paid (electricity uses real amounts)
        {
            id: "shot-bp-rent-p2",
            billId: "shot-bill-rent",
            amount: 1450,
            date: isoOn(prev2.year, prev2.month, 1),
            ...stampCreate(),
        },
        {
            id: "shot-bp-electric-p2",
            billId: "shot-bill-electric",
            amount: 88.4,
            date: isoOn(prev2.year, prev2.month, 15),
            ...stampCreate(),
        },
        {
            id: "shot-bp-internet-p2",
            billId: "shot-bill-internet",
            amount: 64.99,
            date: isoOn(prev2.year, prev2.month, 10),
            ...stampCreate(),
        },
        {
            id: "shot-bp-spotify-p2",
            billId: "shot-bill-spotify",
            amount: 11.99,
            date: isoOn(prev2.year, prev2.month, 8),
            ...stampCreate(),
        },
        {
            id: "shot-bp-phone-p2",
            billId: "shot-bill-phone",
            amount: 45,
            date: isoOn(prev2.year, prev2.month, 20),
            ...stampCreate(),
        },
        {
            id: "shot-bp-rent-p1",
            billId: "shot-bill-rent",
            amount: 1450,
            date: isoOn(prev.year, prev.month, 1),
            ...stampCreate(),
        },
        {
            id: "shot-bp-electric-p1",
            billId: "shot-bill-electric",
            amount: 102.15,
            date: isoOn(prev.year, prev.month, 15),
            ...stampCreate(),
        },
        {
            id: "shot-bp-internet-p1",
            billId: "shot-bill-internet",
            amount: 64.99,
            date: isoOn(prev.year, prev.month, 10),
            ...stampCreate(),
        },
        {
            id: "shot-bp-spotify-p1",
            billId: "shot-bill-spotify",
            amount: 11.99,
            date: isoOn(prev.year, prev.month, 8),
            ...stampCreate(),
        },
        {
            id: "shot-bp-phone-p1",
            billId: "shot-bill-phone",
            amount: 45,
            date: isoOn(prev.year, prev.month, 20),
            ...stampCreate(),
        },
        // This month — rent + internet paid; electric / Spotify / phone still open
        {
            id: "shot-bp-rent-now",
            billId: "shot-bill-rent",
            amount: 1450,
            date: isoOn(y, m, 1),
            ...stampCreate(),
        },
        {
            id: "shot-bp-internet-now",
            billId: "shot-bill-internet",
            amount: 64.99,
            date: isoOn(y, m, 10),
            ...stampCreate(),
        },
    ].filter((payment) => payment.date <= todayIso);

    for (const bill of bills) {
        // Plans list paid cue is based on this month's payments only.
        bill.isPaid = billPayments.some((payment) => {
            if (payment.billId !== bill.id) {
                return false;
            }
            const [payY, payM] = payment.date.split("-").map(Number);
            return payY === y && payM === m + 1;
        });
    }

    const income: Income[] = [
        {
            id: "shot-income-p2",
            date: isoOn(prev2.year, prev2.month, 28),
            gross: 4200,
            net: 3180,
            source: "Primary job",
            payCadence: "monthly",
            ...ts(isoOn(prev2.year, prev2.month, 28)),
        },
        {
            id: "shot-income-p1",
            date: isoOn(prev.year, prev.month, 28),
            gross: 4200,
            net: 3180,
            source: "Primary job",
            payCadence: "monthly",
            ...ts(isoOn(prev.year, prev.month, 28)),
        },
        {
            id: "shot-income-now",
            date: isoOn(y, m, clamp(day >= 5 ? 5 : 1, 1, day)),
            gross: 4200,
            net: 3180,
            source: "Primary job",
            payCadence: "monthly",
            ...ts(isoOn(y, m, clamp(day >= 5 ? 5 : 1, 1, day))),
        },
        {
            id: "shot-income-side",
            date: isoOn(y, m, clamp(Math.min(12, day), 1, day)),
            gross: 275,
            net: 275,
            source: "Freelance design",
            payCadence: "once",
            ...ts(isoOn(y, m, clamp(Math.min(12, day), 1, day))),
        },
    ]
        .filter((row) => row.date <= todayIso) as Income[];

    const expenseSpecs: {
        name: string;
        amount: number;
        category: string;
        day: number;
        monthOffset: 0 | -1 | -2;
    }[] = [
        // This month — readable ledger rows
        { name: "Groceries", amount: 86.42, category: "Food", day: clamp(day - 1, 1, day), monthOffset: 0 },
        { name: "Coffee", amount: 5.75, category: "Food", day: clamp(day - 1, 1, day), monthOffset: 0 },
        { name: "Lunch out", amount: 14.5, category: "Food", day: clamp(day - 2, 1, day), monthOffset: 0 },
        { name: "Gas", amount: 48.2, category: "Transport", day: clamp(day - 3, 1, day), monthOffset: 0 },
        { name: "Metro pass", amount: 33, category: "Transport", day: clamp(day - 5, 1, day), monthOffset: 0 },
        { name: "Pharmacy", amount: 22.8, category: "Health", day: clamp(day - 6, 1, day), monthOffset: 0 },
        { name: "Online order", amount: 39.99, category: "Shopping", day: clamp(day - 7, 1, day), monthOffset: 0 },
        { name: "Movie night", amount: 28, category: "Entertainment", day: clamp(day - 9, 1, day), monthOffset: 0 },
        { name: "Groceries", amount: 72.15, category: "Food", day: clamp(day - 11, 1, day), monthOffset: 0 },
        { name: "Coffee", amount: 4.95, category: "Food", day: clamp(day - 12, 1, day), monthOffset: 0 },
        // Prior months — enough for Home trend
        { name: "Groceries", amount: 91.2, category: "Food", day: 8, monthOffset: -1 },
        { name: "Gas", amount: 52.4, category: "Transport", day: 14, monthOffset: -1 },
        { name: "Clothes", amount: 64, category: "Shopping", day: 19, monthOffset: -1 },
        { name: "Lunch out", amount: 18.75, category: "Food", day: 22, monthOffset: -1 },
        { name: "Groceries", amount: 79.5, category: "Food", day: 6, monthOffset: -2 },
        { name: "Transit pass", amount: 33, category: "Transport", day: 11, monthOffset: -2 },
        { name: "Games / apps", amount: 14.99, category: "Entertainment", day: 17, monthOffset: -2 },
    ];

    const expenses: Expense[] = expenseSpecs.map((spec, index) => {
        const monthRef =
            spec.monthOffset === 0
                ? { year: y, month: m }
                : spec.monthOffset === -1
                  ? prev
                  : prev2;
        const date = isoOn(monthRef.year, monthRef.month, spec.day);
        return {
            id: `shot-exp-${index + 1}`,
            name: spec.name,
            amount: spec.amount,
            date,
            category: spec.category,
            ...ts(date),
        };
    }).filter((expense) => expense.date <= todayIso);

    const debtPayments: DebtPayment[] = [
        {
            id: "shot-dp-car-p2",
            debtId: "shot-debt-car",
            amount: 285,
            date: isoOn(prev2.year, prev2.month, 15),
            ...stampCreate(),
        },
        {
            id: "shot-dp-student-p2",
            debtId: "shot-debt-student",
            amount: 175,
            date: isoOn(prev2.year, prev2.month, 15),
            ...stampCreate(),
        },
        {
            id: "shot-dp-car-p1",
            debtId: "shot-debt-car",
            amount: 285,
            date: isoOn(prev.year, prev.month, 15),
            ...stampCreate(),
        },
        {
            id: "shot-dp-student-p1",
            debtId: "shot-debt-student",
            amount: 175,
            date: isoOn(prev.year, prev.month, 15),
            ...stampCreate(),
        },
        {
            id: "shot-dp-car-now",
            debtId: "shot-debt-car",
            amount: 285,
            date: isoOn(y, m, clamp(Math.min(15, day), 1, day)),
            ...stampCreate(),
        },
    ].filter((payment) => payment.date <= todayIso);

    const debts: Debt[] = [
        {
            id: "shot-debt-car",
            name: "Car loan",
            balance: 6840,
            dueDay: 15,
            minimumPayment: 285,
            startDate: isoOn(prev2.year, prev2.month, 1),
            type: "Auto",
            ...ts(isoOn(prev2.year, prev2.month, 1)),
        },
        {
            id: "shot-debt-student",
            name: "Student loan",
            balance: 9125,
            dueDay: 20,
            minimumPayment: 175,
            startDate: isoOn(prev2.year, prev2.month, 1),
            type: "Student",
            ...ts(isoOn(prev2.year, prev2.month, 1)),
        },
    ];

    const contributions: SavingsContribution[] = [
        {
            id: "shot-sc-em-p2",
            savingsId: "shot-sav-emergency",
            amount: 200,
            date: isoOn(prev2.year, prev2.month, 5),
            ...stampCreate(),
        },
        {
            id: "shot-sc-vac-p2",
            savingsId: "shot-sav-vacation",
            amount: 100,
            date: isoOn(prev2.year, prev2.month, 5),
            ...stampCreate(),
        },
        {
            id: "shot-sc-em-p1",
            savingsId: "shot-sav-emergency",
            amount: 200,
            date: isoOn(prev.year, prev.month, 5),
            ...stampCreate(),
        },
        {
            id: "shot-sc-vac-p1",
            savingsId: "shot-sav-vacation",
            amount: 100,
            date: isoOn(prev.year, prev.month, 5),
            ...stampCreate(),
        },
        {
            id: "shot-sc-em-now",
            savingsId: "shot-sav-emergency",
            amount: 200,
            date: isoOn(y, m, clamp(Math.min(5, day), 1, day)),
            ...stampCreate(),
        },
        {
            id: "shot-sc-vac-now",
            savingsId: "shot-sav-vacation",
            amount: 100,
            date: isoOn(y, m, clamp(Math.min(5, day), 1, day)),
            ...stampCreate(),
        },
    ].filter((row) => row.date <= todayIso);

    const savings: SavingsGoal[] = [
        {
            id: "shot-sav-emergency",
            name: "Emergency fund",
            targetAmount: 5000,
            currentAmount: 1850,
            startDate: isoOn(prev2.year, prev2.month, 1),
            monthlyContribution: 200,
            ...ts(isoOn(prev2.year, prev2.month, 1)),
        },
        {
            id: "shot-sav-vacation",
            name: "Japan trip",
            targetAmount: 2400,
            currentAmount: 780,
            startDate: isoOn(prev2.year, prev2.month, 1),
            monthlyContribution: 100,
            ...ts(isoOn(prev2.year, prev2.month, 1)),
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
