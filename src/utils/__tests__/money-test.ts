import { formatMoney, moneyFractionDigits } from "@/utils/money";

describe("moneyFractionDigits", () => {
    it("uses 2 digits for non-compact decimal currencies", () => {
        expect(moneyFractionDigits(12, "USD", false)).toBe(2);
        expect(moneyFractionDigits(12.5, "USD", false)).toBe(2);
    });

    it("keeps compact whole amounts without cents", () => {
        expect(moneyFractionDigits(120, "USD", true)).toBe(0);
        expect(moneyFractionDigits(120.0, "USD", true)).toBe(0);
    });

    it("shows 2 digits in compact when there are cents", () => {
        expect(moneyFractionDigits(12.5, "USD", true)).toBe(2);
        expect(moneyFractionDigits(12.01, "USD", true)).toBe(2);
        expect(moneyFractionDigits(-3.75, "USD", true)).toBe(2);
    });

    it("stays at 0 for zero-decimal currencies", () => {
        expect(moneyFractionDigits(1200.5, "JPY", true)).toBe(0);
        expect(moneyFractionDigits(1200.5, "JPY", false)).toBe(0);
    });
});

describe("formatMoney compact cents", () => {
    it("renders cents for fractional compact amounts", () => {
        expect(formatMoney(12.5, "USD", { compact: true })).toMatch(
            /12[.,]50/
        );
    });

    it("omits .00 for whole compact amounts", () => {
        const label = formatMoney(12, "USD", { compact: true });
        expect(label).not.toMatch(/12[.,]00/);
        expect(label).toMatch(/12/);
    });
});
