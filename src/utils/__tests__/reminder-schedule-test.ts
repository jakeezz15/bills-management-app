import {
    capReminderFires,
    dueDateInMonth,
    formatReminderHour,
    formatReminderLead,
    formatReminderScheduleCaption,
    itemWantsReminder,
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

    it("skips this month once the due time has passed", () => {
        const fires = upcomingReminderFires(10, new Date(2026, 1, 10, 10, 0, 0), {
            horizon: 1,
        });

        expect(fires[0]?.periodKey).toBe("2026-03");
        expect(fires[0]?.at.getMonth()).toBe(2);
        expect(fires[0]?.at.getDate()).toBe(7);
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

    it("warns on Feb 25 for a day-28 bill in a 28-day February", () => {
        const fires = upcomingReminderFires(31, new Date(2026, 1, 1, 8, 0, 0), {
            horizon: 1,
        });

        expect(fires[0]?.at.getDate()).toBe(25);
        expect(fires[1]?.at.getDate()).toBe(28);
        expect(fires[1]?.periodKey).toBe("2026-02");
    });

    it("omits the lead ping when lead days is zero", () => {
        const fires = upcomingReminderFires(20, new Date(2026, 1, 1, 8, 0, 0), {
            horizon: 1,
            leadDays: 0,
        });

        expect(fires.map((fire) => fire.kind)).toEqual(["due"]);
    });

    it("uses the chosen hour on both fires", () => {
        const fires = upcomingReminderFires(20, new Date(2026, 1, 1, 8, 0, 0), {
            horizon: 1,
            hour: 18,
            leadDays: 3,
        });

        expect(fires[0]?.at.getHours()).toBe(18);
        expect(fires[1]?.at.getHours()).toBe(18);
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

describe("periodKey", () => {
    it("zero-pads the month", () => {
        expect(periodKey(new Date(2026, 1, 5))).toBe("2026-02");
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

    it("builds the Settings caption from hour and lead", () => {
        expect(formatReminderScheduleCaption(9, 3)).toBe(
            "9:00 AM, 3 days before and on the day"
        );
        expect(formatReminderScheduleCaption(18, 0)).toBe("6:00 PM on the due day");
    });

    it("treats a missing remind flag as on", () => {
        expect(itemWantsReminder({})).toBe(true);
        expect(itemWantsReminder({ remind: true })).toBe(true);
        expect(itemWantsReminder({ remind: false })).toBe(false);
    });
});
