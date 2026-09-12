import {
    DUE_DAY_OPTIONS,
    dueDayOption,
    moneyFieldError,
    optionalMoneyFieldError,
    parseMoneyInput,
    parseOptionalMoneyInput,
} from "@/utils/amount-input";
import { ordinalDay } from "@/utils/date";

describe("parseMoneyInput", () => {
    it("accepts plain decimals greater than zero", () => {
        expect(parseMoneyInput("12.50")).toBe(12.5);
        expect(parseMoneyInput(" 100 ")).toBe(100);
        expect(parseMoneyInput("1,234.5")).toBe(1234.5);
    });

    it("rejects empty, zero, negative, and junk by default", () => {
        expect(parseMoneyInput("")).toBeNull();
        expect(parseMoneyInput("0")).toBeNull();
        expect(parseMoneyInput("-5")).toBeNull();
        expect(parseMoneyInput("12abc")).toBeNull();
        expect(parseMoneyInput("1e3")).toBeNull();
        expect(parseMoneyInput("NaN")).toBeNull();
    });

    it("allows zero when asked", () => {
        expect(parseMoneyInput("0", { allowZero: true })).toBe(0);
        expect(parseMoneyInput("0.00", { allowZero: true })).toBe(0);
    });
});

describe("parseOptionalMoneyInput", () => {
    it("treats empty as omitted", () => {
        expect(parseOptionalMoneyInput("")).toBeUndefined();
        expect(parseOptionalMoneyInput("  ")).toBeUndefined();
    });

    it("returns null for invalid non-empty input", () => {
        expect(parseOptionalMoneyInput("nope")).toBeNull();
    });
});

describe("field errors", () => {
    it("explains required vs invalid", () => {
        expect(moneyFieldError("")).toBe("Amount is required.");
        expect(moneyFieldError("abc")).toMatch(/greater than zero/);
        expect(moneyFieldError("10")).toBeNull();
    });

    it("allows empty optional fields", () => {
        expect(optionalMoneyFieldError("")).toBeNull();
        expect(optionalMoneyFieldError("x")).toMatch(/greater than zero/);
    });
});

describe("due day options", () => {
    it("covers 1–31", () => {
        expect(DUE_DAY_OPTIONS).toHaveLength(31);
        expect(DUE_DAY_OPTIONS[0]).toBe("1");
        expect(DUE_DAY_OPTIONS[30]).toBe("31");
        expect(dueDayOption(15)).toBe("15");
        expect(dueDayOption(0)).toBeNull();
    });

    it("pairs with ordinal labels for display helpers", () => {
        expect(ordinalDay(1)).toBe("1st");
        expect(ordinalDay(22)).toBe("22nd");
    });
});
