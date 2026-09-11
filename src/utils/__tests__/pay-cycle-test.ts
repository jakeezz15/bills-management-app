import { toIsoDate } from "@/utils/date";
import { resolvePayCycle } from "@/utils/pay-cycle";
import { makeIncome } from "./factories";

describe("resolvePayCycle", () => {
    it("spans from the last paycheck to the day before the next one", () => {
        const cycle = resolvePayCycle(
            [makeIncome({ date: "2026-09-01", payCadence: "biweekly" })],
            new Date(2026, 8, 10)
        );

        expect(toIsoDate(cycle!.start)).toBe("2026-09-01");
        expect(toIsoDate(cycle!.nextPayday)).toBe("2026-09-15");
        expect(toIsoDate(cycle!.end)).toBe("2026-09-14");
    });

    it("starts a new cycle on payday", () => {
        const cycle = resolvePayCycle(
            [makeIncome({ date: "2026-09-01", payCadence: "biweekly" })],
            new Date(2026, 8, 15)
        );

        expect(toIsoDate(cycle!.start)).toBe("2026-09-15");
        expect(toIsoDate(cycle!.nextPayday)).toBe("2026-09-29");
    });

    it("ignores one-off income", () => {
        const cycle = resolvePayCycle(
            [makeIncome({ date: "2026-09-01", payCadence: "once" })],
            new Date(2026, 8, 10)
        );

        expect(cycle).toBeNull();
    });

    it("picks the soonest upcoming payday among repeating jobs", () => {
        const cycle = resolvePayCycle(
            [
                makeIncome({
                    date: "2026-09-01",
                    payCadence: "biweekly",
                    source: "Salary",
                }),
                makeIncome({
                    date: "2026-09-04",
                    payCadence: "weekly",
                    source: "Side",
                }),
            ],
            new Date(2026, 8, 10)
        );

        expect(cycle!.source).toBe("Side");
        expect(toIsoDate(cycle!.nextPayday)).toBe("2026-09-11");
    });

    it("shifts forward one cycle with a positive offset", () => {
        const cycle = resolvePayCycle(
            [makeIncome({ date: "2026-09-01", payCadence: "biweekly" })],
            new Date(2026, 8, 10),
            1
        );

        expect(toIsoDate(cycle!.start)).toBe("2026-09-15");
        expect(toIsoDate(cycle!.nextPayday)).toBe("2026-09-29");
    });
});
