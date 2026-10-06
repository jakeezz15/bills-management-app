import {
    capReminderFires,
    dayKey,
    dueDateInMonth,
    firstDueOnOrAfter,
    formatReminderHour,
    formatReminderLead,
    formatReminderScheduleCaption,
    groupFiresForDigest,
    itemWantsReminder,
    nextCycleDenseFires,
    periodKey,
    upcomingReminderFires,
} from "@/utils/reminder-schedule";

describe("dueDateInMonth", () => {
    it("clamps day 31 onto the last day of a short month", () => {
        const feb = dueDateInMonth(31, 2026, 1);

        expect(feb.getFullYear()).toBe(2026);
        expect(feb.getMonth()).toBe(1);
        expect(feb.getDate()).toBe(28);
    });

    it("keeps day 31 in a 31-day month", () => {
        const jan = dueDateInMonth(31, 2026, 0);

        expect(jan.getDate()).toBe(31);
    });

    it("uses Feb 29 in a leap year", () => {
        expect(dueDateInMonth(31, 2024, 1).getDate()).toBe(29);
    });
});

describe("firstDueOnOrAfter", () => {
    it("rolls mid-month start past an earlier due day to the next month", () => {
        const first = firstDueOnOrAfter(5, new Date(2026, 2, 15));

        expect(first.getFullYear()).toBe(2026);
        expect(first.getMonth()).toBe(3);
        expect(first.getDate()).toBe(5);
    });

    it("keeps a due day on or after start in the same month", () => {
        const first = firstDueOnOrAfter(20, new Date(2026, 2, 15));

        expect(first.getMonth()).toBe(2);
        expect(first.getDate()).toBe(20);
    });
});

describe("nextCycleDenseFires", () => {
    it("schedules daily from lead through due and 5 overdue days", () => {
        const fires = nextCycleDenseFires(
            20,
            new Date(2026, 1, 1, 8, 0, 0),
            () => false,
            { leadDays: 2, overdueDays: 5, hour: 9 }
        );

        expect(fires[0]?.at.getDate()).toBe(18);
        expect(fires[0]?.kind).toBe("lead");
        expect(fires.find((f) => f.kind === "due")?.at.getDate()).toBe(20);
        expect(fires[fires.length - 1]?.kind).toBe("overdue");
        expect(fires[fires.length - 1]?.at.getDate()).toBe(25);
        expect(fires).toHaveLength(8);
    });

    it("skips a settled period and moves to the next cycle", () => {
        const fires = nextCycleDenseFires(
            10,
            new Date(2026, 1, 1, 8, 0, 0),
            (due) => due.getMonth() === 1,
            { leadDays: 0, overdueDays: 0, hour: 9 }
        );

        expect(fires[0]?.periodKey).toBe("2026-03");
        expect(fires[0]?.kind).toBe("due");
    });

    it("respects startDate so early dues before start are skipped", () => {
        const fires = nextCycleDenseFires(
            5,
            new Date(2026, 2, 1, 8, 0, 0),
            () => false,
            { leadDays: 0, overdueDays: 0, hour: 9, startDate: "2026-03-15" }
        );

        expect(fires[0]?.periodKey).toBe("2026-04");
        expect(fires[0]?.at.getDate()).toBe(5);
    });

    it("keeps remaining overdue days when syncing after the due hour", () => {
        const fires = nextCycleDenseFires(
            10,
            new Date(2026, 1, 10, 10, 0, 0),
            () => false,
            { leadDays: 0, overdueDays: 5, hour: 9 }
        );

        expect(fires[0]?.kind).toBe("overdue");
        expect(fires[0]?.at.getDate()).toBe(11);
        expect(fires).toHaveLength(5);
    });
});

describe("groupFiresForDigest", () => {
    it("keeps individual banners at or under the threshold", () => {
        const fires = Array.from({ length: 5 }, (_, i) => ({
            id: `b${i}`,
            dayKey: "2026-02-20",
            at: new Date(2026, 1, 20, 9, 0, 0),
        }));

        const grouped = groupFiresForDigest(fires, 5);
        expect(grouped.every((g) => g.mode === "item")).toBe(true);
        expect(grouped).toHaveLength(5);
    });

    it("collapses more than five same-day plans into one digest", () => {
        const fires = Array.from({ length: 8 }, (_, i) => ({
            id: `b${i}`,
            dayKey: "2026-02-20",
            at: new Date(2026, 1, 20, 9, 0, 0),
        }));

        const grouped = groupFiresForDigest(fires, 5);
        expect(grouped).toHaveLength(1);
        expect(grouped[0]?.mode).toBe("digest");
        if (grouped[0]?.mode === "digest") {
            expect(grouped[0].count).toBe(8);
        }
    });
});

describe("upcomingReminderFires", () => {
    it("warns three days before the due date, then again on the day", () => {
        const fires = upcomingReminderFires(20, new Date(2026, 1, 1, 8, 0, 0), {
            horizon: 1,
        });

        expect(fires).toHaveLength(2);
        expect(fires[0]?.kind).toBe("lead");
        expect(fires[0]?.at.getDate()).toBe(17);
        expect(fires[1]?.kind).toBe("due");
        expect(fires[1]?.at.getDate()).toBe(20);
        expect(fires[0]?.periodKey).toBe("2026-02");
    });

    it("skips a lead that has already passed", () => {
        const fires = upcomingReminderFires(20, new Date(2026, 1, 18, 10, 0, 0), {
            horizon: 1,
        });

        expect(fires.map((fire) => fire.kind)).toEqual(["due"]);
        expect(fires[0]?.at.getDate()).toBe(20);
    });

    it("pulls a 1st-of-month lead back into the previous month", () => {
        const fires = upcomingReminderFires(1, new Date(2026, 1, 20, 8, 0, 0), {
            horizon: 1,
        });

        expect(fires[0]?.kind).toBe("lead");
        expect(fires[0]?.at.getMonth()).toBe(1);
        expect(fires[0]?.at.getDate()).toBe(26);
        expect(fires[0]?.periodKey).toBe("2026-03");
    });

    it("omits the lead ping when lead days is zero", () => {
        const fires = upcomingReminderFires(20, new Date(2026, 1, 1, 8, 0, 0), {
            horizon: 1,
            leadDays: 0,
        });

        expect(fires.map((fire) => fire.kind)).toEqual(["due"]);
    });
});

describe("capReminderFires", () => {
    it("keeps the soonest fires so iOS stays under the pending limit", () => {
        const fires = [
            { at: new Date(2026, 5, 1) },
            { at: new Date(2026, 1, 1) },
            { at: new Date(2026, 3, 1) },
        ];

        expect(capReminderFires(fires, 2).map((fire) => fire.at.getMonth())).toEqual(
            [1, 3]
        );
    });
});

describe("periodKey and dayKey", () => {
    it("zero-pads the month and day", () => {
        expect(periodKey(new Date(2026, 1, 5))).toBe("2026-02");
        expect(dayKey(new Date(2026, 1, 5))).toBe("2026-02-05");
    });
});

describe("reminder copy", () => {
    it("formats 12-hour clock labels", () => {
        expect(formatReminderHour(9)).toBe("9:00 AM");
        expect(formatReminderHour(12)).toBe("12:00 PM");
        expect(formatReminderHour(18)).toBe("6:00 PM");
    });

    it("describes lead options", () => {
        expect(formatReminderLead(0)).toBe("Due day only");
        expect(formatReminderLead(1)).toBe("1 day before");
        expect(formatReminderLead(3)).toBe("3 days before");
        expect(formatReminderLead(7)).toBe("1 week before");
    });

    it("builds the Settings caption for daily-until-paid", () => {
        expect(formatReminderScheduleCaption(9, 3)).toBe(
            "9:00 AM, daily from 3 days before through due and 5 days after while unpaid"
        );
        expect(formatReminderScheduleCaption(18, 0)).toBe(
            "6:00 PM, daily on the due day and 5 days after while unpaid"
        );
    });

    it("treats a missing remind flag as on", () => {
        expect(itemWantsReminder({})).toBe(true);
        expect(itemWantsReminder({ remind: true })).toBe(true);
        expect(itemWantsReminder({ remind: false })).toBe(false);
    });
});
