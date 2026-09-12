import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income, PayCadence } from "@/types/income";
import { SavingsGoal } from "@/types/savings";
import { SavingsContribution } from "@/types/savings-contribution";
import { parseIsoDate } from "@/utils/date";

const PAY_CADENCES: readonly PayCadence[] = [
    "once",
    "weekly",
    "biweekly",
    "monthly",
];

/** Finite number (not NaN / ±Infinity). */
export function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

/** Money / balance fields: finite and not negative. */
export function isNonNegativeNumber(value: unknown): value is number {
    return isFiniteNumber(value) && value >= 0;
}

export function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

/** Calendar day of month used by bills/debts. */
export function isDueDay(value: unknown): value is number {
    return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= 31
    );
}

export function isIsoDateString(value: unknown): value is string {
    return typeof value === "string" && parseIsoDate(value) !== null;
}

function optionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== "string") {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
}

function optionalIsoDate(value: unknown): string | undefined {
    return isIsoDateString(value) ? value : undefined;
}

function optionalNonNegative(value: unknown): number | undefined {
    return isNonNegativeNumber(value) ? value : undefined;
}

function isPayCadence(value: unknown): value is PayCadence {
    return (
        typeof value === "string" &&
        (PAY_CADENCES as readonly string[]).includes(value)
    );
}

function optionalTimestamps(value: Record<string, unknown>): {
    createdAt?: string;
    updatedAt?: string;
} {
    return {
        createdAt:
            typeof value.createdAt === "string" ? value.createdAt : undefined,
        updatedAt:
            typeof value.updatedAt === "string" ? value.updatedAt : undefined,
    };
}

export function parseBill(value: unknown): Bill | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const v = value as Record<string, unknown>;
    if (!isNonEmptyString(v.id) || !isNonEmptyString(v.name)) {
        return null;
    }
    if (!isDueDay(v.dueDay)) {
        return null;
    }
    if (typeof v.isPaid !== "boolean" || typeof v.isRecurring !== "boolean") {
        return null;
    }

    const amountVaries = v.amountVaries === true;
    if (!isNonNegativeNumber(v.amount)) {
        return null;
    }

    return {
        id: v.id.trim(),
        name: v.name.trim(),
        amount: amountVaries ? 0 : v.amount,
        dueDay: v.dueDay,
        isPaid: v.isPaid,
        isRecurring: v.isRecurring,
        amountVaries: amountVaries || undefined,
        category: optionalString(v.category),
        remind: optionalBoolean(v.remind),
        ...optionalTimestamps(v),
    } as Bill;
}

export function parseExpense(value: unknown): Expense | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const v = value as Record<string, unknown>;
    if (
        !isNonEmptyString(v.id) ||
        !isNonEmptyString(v.name) ||
        !isNonNegativeNumber(v.amount) ||
        !isIsoDateString(v.date)
    ) {
        return null;
    }

    return {
        id: v.id.trim(),
        name: v.name.trim(),
        amount: v.amount,
        date: v.date,
        category: optionalString(v.category),
        ...optionalTimestamps(v),
    } as Expense;
}

export function parseIncome(value: unknown): Income | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const v = value as Record<string, unknown>;
    if (
        !isNonEmptyString(v.id) ||
        !isNonEmptyString(v.source) ||
        !isIsoDateString(v.date) ||
        !isNonNegativeNumber(v.gross) ||
        !isNonNegativeNumber(v.net)
    ) {
        return null;
    }

    const payCadence = isPayCadence(v.payCadence) ? v.payCadence : undefined;

    return {
        id: v.id.trim(),
        source: v.source.trim(),
        date: v.date,
        gross: v.gross,
        net: v.net,
        payCadence,
        ...optionalTimestamps(v),
    } as Income;
}

export function parseDebt(value: unknown): Debt | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const v = value as Record<string, unknown>;
    if (
        !isNonEmptyString(v.id) ||
        !isNonEmptyString(v.name) ||
        !isNonEmptyString(v.type) ||
        !isNonNegativeNumber(v.balance) ||
        !isNonNegativeNumber(v.minimumPayment) ||
        !isDueDay(v.dueDay)
    ) {
        return null;
    }

    // Older backups omit startDate; loaders fill from createdAt.
    if (v.startDate !== undefined && !isIsoDateString(v.startDate)) {
        return null;
    }
    if (v.paidOffDate !== undefined && !isIsoDateString(v.paidOffDate)) {
        return null;
    }
    if (
        v.lastPaymentDate !== undefined &&
        !isIsoDateString(v.lastPaymentDate)
    ) {
        return null;
    }
    if (v.totalPaid !== undefined && !isNonNegativeNumber(v.totalPaid)) {
        return null;
    }

    return {
        id: v.id.trim(),
        name: v.name.trim(),
        type: v.type.trim(),
        balance: v.balance,
        minimumPayment: v.minimumPayment,
        dueDay: v.dueDay,
        startDate: isIsoDateString(v.startDate) ? v.startDate : undefined,
        paidOffDate: optionalIsoDate(v.paidOffDate),
        remarks: optionalString(v.remarks),
        remind: optionalBoolean(v.remind),
        isPaid: optionalBoolean(v.isPaid),
        totalPaid: optionalNonNegative(v.totalPaid),
        lastPaymentDate: optionalIsoDate(v.lastPaymentDate),
        ...optionalTimestamps(v),
    } as Debt;
}

export function parseSavingsGoal(value: unknown): SavingsGoal | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const v = value as Record<string, unknown>;
    if (
        !isNonEmptyString(v.id) ||
        !isNonEmptyString(v.name) ||
        !isNonNegativeNumber(v.targetAmount) ||
        !isNonNegativeNumber(v.currentAmount)
    ) {
        return null;
    }
    if (v.startDate !== undefined && !isIsoDateString(v.startDate)) {
        return null;
    }
    if (
        v.monthlyContribution !== undefined &&
        !isNonNegativeNumber(v.monthlyContribution)
    ) {
        return null;
    }

    return {
        id: v.id.trim(),
        name: v.name.trim(),
        targetAmount: v.targetAmount,
        currentAmount: v.currentAmount,
        startDate: isIsoDateString(v.startDate) ? v.startDate : undefined,
        monthlyContribution: optionalNonNegative(v.monthlyContribution),
        ...optionalTimestamps(v),
    } as SavingsGoal;
}

export function parseBillPayment(value: unknown): BillPayment | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const v = value as Record<string, unknown>;
    if (
        !isNonEmptyString(v.id) ||
        !isNonEmptyString(v.billId) ||
        !isNonNegativeNumber(v.amount) ||
        !isIsoDateString(v.date)
    ) {
        return null;
    }

    return {
        id: v.id.trim(),
        billId: v.billId.trim(),
        amount: v.amount,
        date: v.date,
        ...optionalTimestamps(v),
    } as BillPayment;
}

export function parseDebtPayment(value: unknown): DebtPayment | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const v = value as Record<string, unknown>;
    if (
        !isNonEmptyString(v.id) ||
        !isNonEmptyString(v.debtId) ||
        !isNonNegativeNumber(v.amount) ||
        !isIsoDateString(v.date)
    ) {
        return null;
    }

    return {
        id: v.id.trim(),
        debtId: v.debtId.trim(),
        amount: v.amount,
        date: v.date,
        ...optionalTimestamps(v),
    } as DebtPayment;
}

export function parseSavingsContribution(
    value: unknown
): SavingsContribution | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const v = value as Record<string, unknown>;
    if (
        !isNonEmptyString(v.id) ||
        !isNonEmptyString(v.savingsId) ||
        !isNonNegativeNumber(v.amount) ||
        !isIsoDateString(v.date)
    ) {
        return null;
    }

    return {
        id: v.id.trim(),
        savingsId: v.savingsId.trim(),
        amount: v.amount,
        date: v.date,
        ...optionalTimestamps(v),
    } as SavingsContribution;
}

/**
 * Parse a JSON array from storage. Corrupt / non-array payloads become `[]`
 * so a bad key cannot crash the app. Invalid items are dropped.
 */
export type StoredArrayParse<T> = {
    items: T[];
    /** True when JSON.parse failed or the root value was not an array. */
    rawCorrupt: boolean;
    /** How many array entries failed entity validation. */
    droppedCount: number;
};

export function parseStoredArrayDetailed<T>(
    raw: string | null,
    parseItem: (value: unknown) => T | null
): StoredArrayParse<T> {
    if (raw === null) {
        return { items: [], rawCorrupt: false, droppedCount: 0 };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { items: [], rawCorrupt: true, droppedCount: 0 };
    }

    if (!Array.isArray(parsed)) {
        return { items: [], rawCorrupt: true, droppedCount: 0 };
    }

    const items: T[] = [];
    let droppedCount = 0;
    for (const entry of parsed) {
        const item = parseItem(entry);
        if (item) {
            items.push(item);
        } else {
            droppedCount += 1;
        }
    }
    return { items, rawCorrupt: false, droppedCount };
}

export function parseStoredArray<T>(
    raw: string | null,
    parseItem: (value: unknown) => T | null
): T[] {
    return parseStoredArrayDetailed(raw, parseItem).items;
}

/**
 * Require every entry to parse, or fail the whole list (backup import).
 * Missing / non-array → fail. Empty array is fine.
 */
export function parseRequiredArray<T>(
    value: unknown,
    parseItem: (value: unknown) => T | null,
    label: string
): { ok: true; items: T[] } | { ok: false; error: string } {
    if (!Array.isArray(value)) {
        return { ok: false, error: `Backup ${label} must be an array.` };
    }

    const items: T[] = [];
    for (let i = 0; i < value.length; i++) {
        const item = parseItem(value[i]);
        if (!item) {
            return {
                ok: false,
                error: `Backup ${label}[${i}] is invalid.`,
            };
        }
        items.push(item);
    }
    return { ok: true, items };
}

/**
 * Optional ledger arrays: omit / null → []; present → must be fully valid.
 */
export function parseOptionalArray<T>(
    value: unknown,
    parseItem: (value: unknown) => T | null,
    label: string
): { ok: true; items: T[] } | { ok: false; error: string } {
    if (value === undefined || value === null) {
        return { ok: true, items: [] };
    }
    return parseRequiredArray(value, parseItem, label);
}
