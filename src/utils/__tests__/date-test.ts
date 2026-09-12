import {
    countMonthsOverlapping,
    dueDayFallsInRange,
    getRangeForPeriod,
    isIsoInRange,
    isViewingCurrentPeriod,
    ordinalDay,
    paymentDateForAsOf,
    parseIsoDate,
    shiftAnchor,
    startOfWeek,
    toIsoDate,
} from "@/utils/date";

describe("parseIsoDate", () => {
    it("reads an ISO date as local midnight, with no UTC shift", () => {
        const parsed = parseIsoDate("2026-02-15");

        // The whole point of the hand-rolled parser: `new Date("2026-02-15")`
        // is UTC midnight, which is the 14th in any negative-offset timezone.
        expect(parsed?.getFullYear()).toBe(2026);
        expect(parsed?.getMonth()).toBe(1);
        expect(parsed?.getDate()).toBe(15);
        expect(parsed?.getHours()).toBe(0);
    });

    it("rejects calendar dates that do not exist", () => {
        expect(parseIsoDate("2026-02-30")).toBeNull();
        expect(parseIsoDate("2026-13-01")).toBeNull();
        expect(parseIsoDate("2025-02-29")).toBeNull();
    });

    it("accepts Feb 29 in a leap year", () => {
        expect(parseIsoDate("2024-02-29")).not.toBeNull();
    });

    it("rejects malformed input rather than guessing", () => {
        expect(parseIsoDate("")).toBeNull();
        expect(parseIsoDate("15/02/2026")).toBeNull();
        expect(parseIsoDate("2026-2-15")).toBeNull();
    });

    it("round-trips through toIsoDate", () => {
        expect(toIsoDate(new Date(2026, 1, 5))).toBe("2026-02-05");
    });
});

describe("paymentDateForAsOf", () => {
    it("stamps today when the viewed date is later in the current month", () => {
        const viewed = new Date(2026, 8, 30);
        const today = new Date(2026, 8, 10);

        expect(toIsoDate(paymentDateForAsOf(viewed, today))).toBe("2026-09-10");
    });

    it("keeps a past month's as-of date so history logs stay in that month", () => {
        const viewed = new Date(2026, 7, 31);
        const today = new Date(2026, 8, 10);

        expect(toIsoDate(paymentDateForAsOf(viewed, today))).toBe("2026-08-31");
    });
});

describe("isViewingCurrentPeriod", () => {
    const today = new Date(2026, 8, 12);

    it("is true for the month that contains today", () => {
        const range = getRangeForPeriod(today, "month");
        expect(isViewingCurrentPeriod(range, "month", today)).toBe(true);
    });

    it("is false for a previous month", () => {
        const range = getRangeForPeriod(new Date(2026, 7, 1), "month");
        expect(isViewingCurrentPeriod(range, "month", today)).toBe(false);
    });

    it("is false for a future month", () => {
        const range = getRangeForPeriod(new Date(2026, 9, 1), "month");
        expect(isViewingCurrentPeriod(range, "month", today)).toBe(false);
    });
});

describe("startOfWeek", () => {
    it("treats Monday as the first day", () => {
        // Sep 7 2026 is a Monday.
        expect(toIsoDate(startOfWeek(new Date(2026, 8, 9)))).toBe("2026-09-07");
        expect(toIsoDate(startOfWeek(new Date(2026, 8, 7)))).toBe("2026-09-07");
    });

    it("sends Sunday back to the Monday that started its week", () => {
        // Sunday is the *end* of the week here, not the start, so Sep 6 2026
        // belongs to the week beginning Aug 31 rather than Sep 7.
        expect(toIsoDate(startOfWeek(new Date(2026, 8, 6)))).toBe("2026-08-31");
    });
});

describe("getRangeForPeriod", () => {
    it("ends a month on its real last day", () => {
        const feb = getRangeForPeriod(new Date(2026, 1, 15), "month");

        expect(toIsoDate(feb.start)).toBe("2026-02-01");
        expect(toIsoDate(feb.end)).toBe("2026-02-28");
    });

    it("accounts for leap years", () => {
        const feb = getRangeForPeriod(new Date(2024, 1, 15), "month");

        expect(toIsoDate(feb.end)).toBe("2024-02-29");
    });

    it("covers the full final day, not just its midnight", () => {
        const day = getRangeForPeriod(new Date(2026, 1, 15), "day");

        expect(day.end.getHours()).toBe(23);
        expect(day.end.getMinutes()).toBe(59);
        // A payment logged at 6pm must fall inside the day that contains it.
        expect(isIsoInRange("2026-02-15", day)).toBe(true);
    });

    it("spans a whole year", () => {
        const year = getRangeForPeriod(new Date(2026, 5, 9), "year");

        expect(toIsoDate(year.start)).toBe("2026-01-01");
        expect(toIsoDate(year.end)).toBe("2026-12-31");
    });
});

describe("shiftAnchor", () => {
    it("clamps the day instead of skipping a short month", () => {
        // Regression: naive setMonth turns Jan 31 into Mar 3, so "next month"
        // from the 31st used to skip February entirely.
        const next = shiftAnchor(new Date(2026, 0, 31), "month", 1);

        expect(toIsoDate(next)).toBe("2026-02-28");
    });

    it("steps back into a short month without landing where it started", () => {
        const previous = shiftAnchor(new Date(2026, 2, 31), "month", -1);

        expect(toIsoDate(previous)).toBe("2026-02-28");
    });

    it("clamps Feb 29 when shifting into a non-leap year", () => {
        const next = shiftAnchor(new Date(2024, 1, 29), "year", 1);

        expect(toIsoDate(next)).toBe("2025-02-28");
    });

    it("rolls the year over at the boundaries", () => {
        expect(toIsoDate(shiftAnchor(new Date(2026, 11, 15), "month", 1))).toBe(
            "2027-01-15"
        );
        expect(toIsoDate(shiftAnchor(new Date(2026, 0, 15), "month", -1))).toBe(
            "2025-12-15"
        );
    });

    it("moves whole weeks and single days", () => {
        expect(toIsoDate(shiftAnchor(new Date(2026, 8, 9), "week", 1))).toBe(
            "2026-09-16"
        );
        expect(toIsoDate(shiftAnchor(new Date(2026, 8, 9), "day", -1))).toBe(
            "2026-09-08"
        );
    });
});

describe("dueDayFallsInRange", () => {
    it("is always true for a month range, whatever the due day", () => {
        const feb = getRangeForPeriod(new Date(2026, 1, 15), "month");

        expect(dueDayFallsInRange(1, feb)).toBe(true);
        expect(dueDayFallsInRange(28, feb)).toBe(true);
    });

    it("pulls a due day past month end back onto the last day", () => {
        const feb = getRangeForPeriod(new Date(2026, 1, 15), "month");

        // Day 31 does not exist in February, so it lands on the 28th.
        expect(dueDayFallsInRange(31, feb)).toBe(true);
    });

    it("only matches a week range when the due day falls inside it", () => {
        const week = getRangeForPeriod(new Date(2026, 8, 9), "week");

        // Week of Sep 7–13.
        expect(dueDayFallsInRange(10, week)).toBe(true);
        expect(dueDayFallsInRange(20, week)).toBe(false);
    });
});

describe("ordinalDay", () => {
    it("uses st/nd/rd/th for 1, 2, 3, 4", () => {
        expect(ordinalDay(1)).toBe("1st");
        expect(ordinalDay(2)).toBe("2nd");
        expect(ordinalDay(3)).toBe("3rd");
        expect(ordinalDay(4)).toBe("4th");
    });

    it("keeps 11–13 as th", () => {
        expect(ordinalDay(11)).toBe("11th");
        expect(ordinalDay(12)).toBe("12th");
        expect(ordinalDay(13)).toBe("13th");
    });

    it("clamps to a calendar day", () => {
        expect(ordinalDay(0)).toBe("1st");
        expect(ordinalDay(31)).toBe("31st");
        expect(ordinalDay(40)).toBe("31st");
    });
});

describe("countMonthsOverlapping", () => {
    it("counts a single month as one", () => {
        expect(
            countMonthsOverlapping(getRangeForPeriod(new Date(2026, 1, 15), "month"))
        ).toBe(1);
    });

    it("counts twelve months in a year", () => {
        expect(
            countMonthsOverlapping(getRangeForPeriod(new Date(2026, 1, 15), "year"))
        ).toBe(12);
    });

    it("counts both months when a week straddles them", () => {
        // Aug 31 – Sep 6 2026.
        expect(
            countMonthsOverlapping(getRangeForPeriod(new Date(2026, 8, 2), "week"))
        ).toBe(2);
    });
});
