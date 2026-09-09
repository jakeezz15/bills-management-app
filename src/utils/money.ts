import AsyncStorage from "@react-native-async-storage/async-storage";

/** AsyncStorage key for the user's display currency preference. */
export const CURRENCY_STORAGE_KEY = "currencyCode";

/**
 * ISO 4217 codes offered in Settings (display formatting only).
 * Curated to active / commonly used currencies — searchable in the picker.
 * Not every obscure/historical code; easy to extend.
 */
export const CURRENCY_CODES = [
    "AED",
    "AFN",
    "ALL",
    "AMD",
    "ANG",
    "AOA",
    "ARS",
    "AUD",
    "AWG",
    "AZN",
    "BAM",
    "BBD",
    "BDT",
    "BGN",
    "BHD",
    "BIF",
    "BMD",
    "BND",
    "BOB",
    "BRL",
    "BSD",
    "BTN",
    "BWP",
    "BYN",
    "BZD",
    "CAD",
    "CDF",
    "CHF",
    "CLP",
    "CNY",
    "COP",
    "CRC",
    "CUP",
    "CVE",
    "CZK",
    "DJF",
    "DKK",
    "DOP",
    "DZD",
    "EGP",
    "ERN",
    "ETB",
    "EUR",
    "FJD",
    "FKP",
    "GBP",
    "GEL",
    "GHS",
    "GIP",
    "GMD",
    "GNF",
    "GTQ",
    "GYD",
    "HKD",
    "HNL",
    "HTG",
    "HUF",
    "IDR",
    "ILS",
    "INR",
    "IQD",
    "IRR",
    "ISK",
    "JMD",
    "JOD",
    "JPY",
    "KES",
    "KGS",
    "KHR",
    "KMF",
    "KRW",
    "KWD",
    "KYD",
    "KZT",
    "LAK",
    "LBP",
    "LKR",
    "LRD",
    "LSL",
    "LYD",
    "MAD",
    "MDL",
    "MGA",
    "MKD",
    "MMK",
    "MNT",
    "MOP",
    "MRU",
    "MUR",
    "MVR",
    "MWK",
    "MXN",
    "MYR",
    "MZN",
    "NAD",
    "NGN",
    "NIO",
    "NOK",
    "NPR",
    "NZD",
    "OMR",
    "PAB",
    "PEN",
    "PGK",
    "PHP",
    "PKR",
    "PLN",
    "PYG",
    "QAR",
    "RON",
    "RSD",
    "RUB",
    "RWF",
    "SAR",
    "SBD",
    "SCR",
    "SDG",
    "SEK",
    "SGD",
    "SHP",
    "SLE",
    "SOS",
    "SRD",
    "SSP",
    "STN",
    "SVC",
    "SYP",
    "SZL",
    "THB",
    "TJS",
    "TMT",
    "TND",
    "TOP",
    "TRY",
    "TTD",
    "TWD",
    "TZS",
    "UAH",
    "UGX",
    "USD",
    "UYU",
    "UZS",
    "VES",
    "VND",
    "VUV",
    "WST",
    "XAF",
    "XCD",
    "XOF",
    "XPF",
    "YER",
    "ZAR",
    "ZMW",
    "ZWG",
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export type CurrencyOption = {
    code: CurrencyCode;
    label: string;
};

export type FormatMoneyOptions = {
    /** Whole units only (dashboard heroes / chips). Default false → 2 fraction digits when the currency uses them. */
    compact?: boolean;
    /** Prefix like + or − before the formatted amount. */
    sign?: "+" | "−" | "";
};

const ZERO_DECIMAL = new Set([
    "BIF",
    "CLP",
    "DJF",
    "GNF",
    "ISK",
    "JPY",
    "KMF",
    "KRW",
    "PYG",
    "RWF",
    "UGX",
    "UYI",
    "VND",
    "VUV",
    "XAF",
    "XOF",
    "XPF",
]);

const REGION_CURRENCY: Record<string, CurrencyCode> = {
    US: "USD",
    GB: "GBP",
    PH: "PHP",
    CA: "CAD",
    AU: "AUD",
    NZ: "NZD",
    JP: "JPY",
    IN: "INR",
    CN: "CNY",
    HK: "HKD",
    SG: "SGD",
    KR: "KRW",
    TW: "TWD",
    TH: "THB",
    ID: "IDR",
    MY: "MYR",
    VN: "VND",
    AE: "AED",
    SA: "SAR",
    BR: "BRL",
    MX: "MXN",
    AR: "ARS",
    ZA: "ZAR",
    NG: "NGN",
    EG: "EGP",
    TR: "TRY",
    RU: "RUB",
    UA: "UAH",
    PL: "PLN",
    SE: "SEK",
    NO: "NOK",
    DK: "DKK",
    CH: "CHF",
    DE: "EUR",
    FR: "EUR",
    ES: "EUR",
    IT: "EUR",
    NL: "EUR",
    IE: "EUR",
    BE: "EUR",
    AT: "EUR",
    PT: "EUR",
    FI: "EUR",
};

export function isCurrencyCode(value: string): value is CurrencyCode {
    return (CURRENCY_CODES as readonly string[]).includes(value);
}

/** Localized currency name when the runtime supports it. */
export function currencyLabel(code: string): string {
    try {
        const name = new Intl.DisplayNames(undefined, { type: "currency" }).of(
            code
        );
        if (name) {
            return name;
        }
    } catch {
        // ignore
    }
    return code;
}

/** Options for pickers — labels resolved via Intl. */
export function getCurrencyOptions(): CurrencyOption[] {
    return CURRENCY_CODES.map((code) => ({
        code,
        label: currencyLabel(code),
    }));
}

/**
 * Best-effort currency from the JS locale (no native module).
 * Avoids expo-localization so older / Expo Go clients keep working.
 */
export function detectDeviceCurrency(): CurrencyCode {
    try {
        const tag =
            Intl.DateTimeFormat().resolvedOptions().locale ||
            Intl.NumberFormat().resolvedOptions().locale ||
            "en-US";
        const region = tag.split("-").pop()?.toUpperCase();

        if (region && REGION_CURRENCY[region]) {
            return REGION_CURRENCY[region];
        }
    } catch {
        // ignore
    }
    return "USD";
}

export function formatMoney(
    amount: number,
    currency: string,
    options: FormatMoneyOptions = {}
): string {
    const { compact = false, sign = "" } = options;
    const code = isCurrencyCode(currency) ? currency : "USD";
    const fraction = compact || ZERO_DECIMAL.has(code) ? 0 : 2;

    let formatted: string;
    try {
        formatted = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: code,
            minimumFractionDigits: fraction,
            maximumFractionDigits: fraction,
        }).format(amount);
    } catch {
        formatted = `${code} ${amount.toFixed(fraction)}`;
    }

    return sign ? `${sign}${formatted}` : formatted;
}

export function currencySymbol(currency: string): string {
    const code = isCurrencyCode(currency) ? currency : "USD";
    try {
        const parts = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: code,
        }).formatToParts(0);
        return parts.find((part) => part.type === "currency")?.value ?? code;
    } catch {
        return code;
    }
}

/** Read saved currency for non-React code (e.g. reminder notification bodies). */
export async function getStoredCurrency(): Promise<CurrencyCode> {
    const stored = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && isCurrencyCode(stored)) {
        return stored;
    }
    return detectDeviceCurrency();
}

/** @deprecated Prefer getCurrencyOptions() — kept for older imports. */
export const CURRENCY_OPTIONS = getCurrencyOptions();
