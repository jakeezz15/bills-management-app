import { toIsoDate } from "@/utils/date";

/** Audit timestamps shared by all persisted entries. */
export type Timestamps = {
    createdAt: string; // ISO datetime
    updatedAt: string; // ISO datetime
};

export function nowIso(): string {
    return new Date().toISOString();
}

export function stampCreate(): Timestamps {
    const now = nowIso();
    return { createdAt: now, updatedAt: now };
}

export function stampUpdate(): Pick<Timestamps, "updatedAt"> {
    return { updatedAt: nowIso() };
}

/** Ensure older AsyncStorage records get timestamps (and optional defaults). */
export function ensureTimestamps<T extends Partial<Timestamps>>(
    item: T,
    fallbackDate?: string
): T & Timestamps {
    const fallback =
        fallbackDate != null
            ? `${fallbackDate}T00:00:00.000Z`
            : nowIso();

    return {
        ...item,
        createdAt: item.createdAt ?? fallback,
        updatedAt: item.updatedAt ?? item.createdAt ?? fallback,
    };
}

/** Calendar start date for a debt: explicit startDate, else createdAt day. */
export function debtStartDate(debt: {
    startDate?: string;
    createdAt?: string;
}): string {
    if (debt.startDate) {
        return debt.startDate;
    }
    if (debt.createdAt) {
        return debt.createdAt.slice(0, 10);
    }
    return toIsoDate(new Date());
}
