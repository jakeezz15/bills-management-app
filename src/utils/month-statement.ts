import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsGoal } from "@/types/savings";
import { SavingsContribution } from "@/types/savings-contribution";
import {
    DateRange,
    addDays,
    endOfDay,
    formatDisplayDate,
    formatPeriodLabel,
    getRangeForPeriod,
    isIsoInRange,
    parseIsoDate,
    startOfMonth,
} from "@/utils/date";
import {
    PeriodTotals,
    getActivityForRange,
    getTotalsForRange,
} from "@/utils/finance";

export type StatementKind =
    | "income"
    | "expense"
    | "bill"
    | "debt"
    | "savings";

/** One ledger movement in a date range (no running balance). */
export type ActivityLine = {
    id: string;
    date: string;
    kind: StatementKind;
    label: string;
    direction: "in" | "out";
    amount: number;
    skipped?: boolean;
    /**
     * Entity to open: paycheck, expense, bill, debt, or savings goal id
     * (parent id for payment / contribution rows).
     */
    targetId: string;
};

export type StatementLine = {
    id: string;
    date: string;
    kind: StatementKind;
    label: string;
    direction: "in" | "out";
    amount: number;
    /** Running leftover after this row (starts from opening balance). */
    balanceAfter: number;
    skipped?: boolean;
};

export type MonthStatement = {
    range: DateRange;
    label: string;
    openingLeftover: number;
    closingLeftover: number;
    activity: PeriodTotals;
    lines: StatementLine[];
};

export type ActivityLedgers = {
    income: Income[];
    expenses: Expense[];
    bills: Bill[];
    debts: Debt[];
    savings: SavingsGoal[];
    billPayments: BillPayment[];
    debtPayments: DebtPayment[];
    savingsContributions: SavingsContribution[];
};

export type MonthStatementInput = {
    anchor: Date;
} & ActivityLedgers;

const KIND_ORDER: Record<StatementKind, number> = {
    income: 0,
    expense: 1,
    bill: 2,
    debt: 3,
    savings: 4,
};

/** Max rows on the Calendar browse feed. */
export const CALENDAR_ACTIVITY_LIMIT = 30;

/** `YYYY-MM` from a date, for route params. */
export function toMonthParam(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

/**
 * Earliest month a statement may show: the calendar month of the first
 * paycheck. With no income yet, only the current month is available.
 */
export function statementEarliestMonth(
    income: Pick<Income, "date">[],
    today = new Date()
): Date {
    const current = startOfMonth(today);
    let earliest: Date | null = null;

    for (const item of income) {
        const parsed = parseIsoDate(item.date);
        if (!parsed) continue;
        const month = startOfMonth(parsed);
        if (!earliest || month.getTime() < earliest.getTime()) {
            earliest = month;
        }
    }

    if (!earliest) {
        return current;
    }
    return earliest.getTime() > current.getTime() ? current : earliest;
}

/**
 * Clamp a statement month between first-income month and the current month.
 * Pass `earliest` from `statementEarliestMonth` when income is known.
 */
export function clampStatementMonth(
    anchor: Date,
    today = new Date(),
    earliest?: Date | null
): Date {
    let month = startOfMonth(anchor);
    const latest = startOfMonth(today);

    if (month.getTime() > latest.getTime()) {
        month = latest;
    }

    if (earliest) {
        const min = startOfMonth(earliest);
        if (min.getTime() > latest.getTime()) {
            return latest;
        }
        if (month.getTime() < min.getTime()) {
            month = min;
        }
    }

    return month;
}

/** True when `anchor` is already the newest month a statement may show. */
export function isStatementAtCurrentMonth(
    anchor: Date,
    today = new Date()
): boolean {
    return startOfMonth(anchor).getTime() >= startOfMonth(today).getTime();
}

/** True when `anchor` is already the oldest month a statement may show. */
export function isStatementAtEarliestMonth(
    anchor: Date,
    earliest: Date
): boolean {
    return startOfMonth(anchor).getTime() <= startOfMonth(earliest).getTime();
}

/**
 * Parse `YYYY-MM` into the first day of that month; fallback = current month.
 * Future months are clamped to the current calendar month. When `earliest` is
 * set, months before the first paycheck are clamped up.
 */
export function parseMonthParam(
    raw: string | string[] | undefined,
    fallback = new Date(),
    today = new Date(),
    earliest?: Date | null
): Date {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value === "string") {
        const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
        if (match) {
            const year = Number(match[1]);
            const month = Number(match[2]) - 1;
            if (month >= 0 && month <= 11) {
                return clampStatementMonth(
                    new Date(year, month, 1),
                    today,
                    earliest
                );
            }
        }
    }
    return clampStatementMonth(startOfMonth(fallback), today, earliest);
}

function nameById<T extends { id: string; name: string }>(
    items: T[],
    id: string,
    fallback: string
): string {
    return items.find((item) => item.id === id)?.name?.trim() || fallback;
}

function expenseLabel(expense: Expense): string {
    const name = expense.name.trim() || "Spending";
    const category = expense.category?.trim();
    return category ? `${name} · ${category}` : name;
}

function compareLinesAsc(a: ActivityLine, b: ActivityLine): number {
    if (a.date !== b.date) {
        return a.date < b.date ? -1 : 1;
    }
    const kindDiff = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (kindDiff !== 0) {
        return kindDiff;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function compareLinesDesc(a: ActivityLine, b: ActivityLine): number {
    return compareLinesAsc(b, a);
}

/**
 * Collect income / spending / bill / debt / savings movements in `range`.
 * `newestFirst` sorts for Calendar; statement uses chronological (false).
 */
export function collectActivityLinesForRange(
    range: DateRange,
    ledgers: ActivityLedgers,
    newestFirst = false
): ActivityLine[] {
    const lines: ActivityLine[] = [];

    for (const item of ledgers.income) {
        if (!isIsoInRange(item.date, range)) continue;
        lines.push({
            id: item.id,
            date: item.date,
            kind: "income",
            label: item.source.trim() || "Income",
            direction: "in",
            amount: item.net,
            targetId: item.id,
        });
    }

    for (const item of ledgers.expenses) {
        if (!isIsoInRange(item.date, range)) continue;
        lines.push({
            id: item.id,
            date: item.date,
            kind: "expense",
            label: expenseLabel(item),
            direction: "out",
            amount: item.amount,
            targetId: item.id,
        });
    }

    for (const item of ledgers.billPayments) {
        if (!isIsoInRange(item.date, range)) continue;
        const billName = nameById(ledgers.bills, item.billId, "Bill");
        const skipped = item.skipped === true;
        lines.push({
            id: item.id,
            date: item.date,
            kind: "bill",
            label: skipped ? `${billName} (skipped)` : billName,
            direction: "out",
            amount: skipped ? 0 : item.amount,
            skipped: skipped || undefined,
            targetId: item.billId,
        });
    }

    for (const item of ledgers.debtPayments) {
        if (!isIsoInRange(item.date, range)) continue;
        const debtName = nameById(ledgers.debts, item.debtId, "Debt");
        const skipped = item.skipped === true;
        lines.push({
            id: item.id,
            date: item.date,
            kind: "debt",
            label: skipped ? `${debtName} (skipped)` : debtName,
            direction: "out",
            amount: skipped ? 0 : item.amount,
            skipped: skipped || undefined,
            targetId: item.debtId,
        });
    }

    for (const item of ledgers.savingsContributions) {
        if (!isIsoInRange(item.date, range)) continue;
        lines.push({
            id: item.id,
            date: item.date,
            kind: "savings",
            label: nameById(ledgers.savings, item.savingsId, "Savings"),
            direction: "out",
            amount: item.amount,
            targetId: item.savingsId,
        });
    }

    lines.sort(newestFirst ? compareLinesDesc : compareLinesAsc);
    return lines;
}

export function activityKindLabel(line: Pick<ActivityLine, "kind" | "skipped">): string {
    switch (line.kind) {
        case "income":
            return "Income";
        case "expense":
            return "Spending";
        case "bill":
            return line.skipped ? "Bill · skipped" : "Bill payment";
        case "debt":
            return line.skipped ? "Debt · skipped" : "Debt payment";
        case "savings":
            return "Savings";
    }
}

export function activityLineHref(line: ActivityLine): string {
    switch (line.kind) {
        case "income":
            return `/paycheck/${line.targetId}`;
        case "expense":
            return `/expense/${line.targetId}`;
        case "bill":
            return `/bill/${line.targetId}`;
        case "debt":
            return `/debt/${line.targetId}`;
        case "savings":
            return `/goal/${line.targetId}`;
    }
}

/** Build a bank-style month statement from existing finance ledgers. */
export function buildMonthStatement(
    input: MonthStatementInput
): MonthStatement {
    const anchor = startOfMonth(input.anchor);
    const range = getRangeForPeriod(anchor, "month");
    const label = formatPeriodLabel(anchor, "month");

    const priorEnd = endOfDay(addDays(range.start, -1));
    const priorRange: DateRange = {
        start: priorEnd,
        end: priorEnd,
    };

    const openingLeftover = getTotalsForRange(
        priorRange,
        input.expenses,
        input.bills,
        input.debts,
        input.savings,
        input.income,
        input.debtPayments,
        input.billPayments,
        input.savingsContributions
    ).leftover;

    const closingLeftover = getTotalsForRange(
        range,
        input.expenses,
        input.bills,
        input.debts,
        input.savings,
        input.income,
        input.debtPayments,
        input.billPayments,
        input.savingsContributions
    ).leftover;

    const activity = getActivityForRange(
        range,
        input.expenses,
        input.bills,
        input.debts,
        input.savings,
        input.income,
        input.debtPayments,
        input.billPayments,
        input.savingsContributions
    );

    const collected = collectActivityLinesForRange(range, input, false);

    let running = openingLeftover;
    const withBalances: StatementLine[] = collected.map((line) => {
        if (line.direction === "in") {
            running += line.amount;
        } else {
            running -= line.amount;
        }
        return {
            id: line.id,
            date: line.date,
            kind: line.kind,
            label: line.label,
            direction: line.direction,
            amount: line.amount,
            skipped: line.skipped,
            balanceAfter: running,
        };
    });

    return {
        range,
        label,
        openingLeftover,
        closingLeftover,
        activity,
        lines: withBalances,
    };
}

export type StatementDayGroup = {
    date: string;
    lines: StatementLine[];
};

/** Group already-sorted statement lines under one header per calendar day. */
export function groupStatementLinesByDate(
    lines: StatementLine[]
): StatementDayGroup[] {
    const groups: StatementDayGroup[] = [];
    for (const line of lines) {
        const last = groups[groups.length - 1];
        if (last && last.date === line.date) {
            last.lines.push(line);
        } else {
            groups.push({ date: line.date, lines: [line] });
        }
    }
    return groups;
}

type FormatMoneyFn = (
    amount: number,
    options?: { sign?: "+" | "−" | "" }
) => string;

function signedMoney(
    amount: number,
    direction: "in" | "out" | "net",
    formatMoney: FormatMoneyFn
): string {
    if (direction === "in") {
        return formatMoney(amount, { sign: "+" });
    }
    if (direction === "out") {
        return formatMoney(amount, { sign: "−" });
    }
    if (amount > 0) {
        return formatMoney(amount, { sign: "+" });
    }
    if (amount < 0) {
        return formatMoney(Math.abs(amount), { sign: "−" });
    }
    return formatMoney(0);
}

/** Plain-text share body that mirrors the on-screen statement. */
export function formatStatementText(
    statement: MonthStatement,
    formatMoney: FormatMoneyFn
): string {
    const lines: string[] = [
        `On Hand — ${statement.label}`,
        "",
        `Opening balance  ${formatMoney(statement.openingLeftover)}`,
        `Balance at month end  ${formatMoney(statement.closingLeftover)}`,
        "",
    ];

    if (statement.lines.length === 0) {
        lines.push("No money moved this month.");
    } else {
        lines.push("Transactions");
        for (const group of groupStatementLinesByDate(statement.lines)) {
            lines.push("");
            lines.push(formatDisplayDate(group.date));
            for (const line of group.lines) {
                const amountText =
                    line.skipped && line.amount === 0
                        ? formatMoney(0)
                        : signedMoney(line.amount, line.direction, formatMoney);
                lines.push(
                    `  ${line.label}  ${amountText}  bal ${formatMoney(line.balanceAfter)}`
                );
            }
        }
    }

    const { activity } = statement;
    lines.push(
        "",
        "Month totals",
        `Income           ${signedMoney(activity.income, "in", formatMoney)}`,
        `Spending         ${signedMoney(activity.expenses, "out", formatMoney)}`,
        `Bills paid       ${signedMoney(activity.bills, "out", formatMoney)}`,
        `Debt payments    ${signedMoney(activity.debtPayments, "out", formatMoney)}`,
        `Savings          ${signedMoney(activity.savings, "out", formatMoney)}`,
        `Net this month   ${signedMoney(activity.leftover, "net", formatMoney)}`
    );

    return lines.join("\n");
}
