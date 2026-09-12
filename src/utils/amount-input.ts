/**
 * Parse user-typed money fields. Rejects NaN, Infinity, negatives, and
 * junk like "12abc" that `Number()` would partially accept.
 */

export type MoneyParseOptions = {
    /** When true, 0 is allowed. Default requires value > 0. */
    allowZero?: boolean;
};

/**
 * Required money field. Returns the number, or `null` if empty/invalid.
 */
export function parseMoneyInput(
    raw: string,
    options: MoneyParseOptions = {}
): number | null {
    const trimmed = raw.trim().replace(/,/g, "");
    if (trimmed === "") {
        return null;
    }
    // Plain non-negative decimal only — no scientific notation or letters.
    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
        return null;
    }
    const value = Number(trimmed);
    if (!Number.isFinite(value)) {
        return null;
    }
    if (options.allowZero) {
        return value >= 0 ? value : null;
    }
    return value > 0 ? value : null;
}

/**
 * Optional money field. Empty → `undefined`. Invalid text → `null`.
 * Valid → number.
 */
export function parseOptionalMoneyInput(
    raw: string,
    options: MoneyParseOptions = {}
): number | null | undefined {
    if (raw.trim() === "") {
        return undefined;
    }
    return parseMoneyInput(raw, options);
}

/** User-facing error for a required amount field, or null when valid. */
export function moneyFieldError(
    raw: string,
    options: MoneyParseOptions = {}
): string | null {
    if (raw.trim() === "") {
        return "Amount is required.";
    }
    if (parseMoneyInput(raw, options) === null) {
        return options.allowZero
            ? "Enter a valid amount (0 or more)."
            : "Enter a valid amount greater than zero.";
    }
    return null;
}

/** User-facing error for an optional amount field (empty is fine). */
export function optionalMoneyFieldError(
    raw: string,
    options: MoneyParseOptions = {}
): string | null {
    if (raw.trim() === "") {
        return null;
    }
    if (parseMoneyInput(raw, options) === null) {
        return options.allowZero
            ? "Enter a valid amount (0 or more)."
            : "Enter a valid amount greater than zero.";
    }
    return null;
}

/** Days 1–31 as strings for SelectMenu options. */
export const DUE_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) =>
    String(i + 1)
);

export type DueDayOption = string;

export function dueDayOption(day: number): string | null {
    if (!Number.isInteger(day) || day < 1 || day > 31) {
        return null;
    }
    return String(day);
}
