import {
    DEFAULT_REMINDER_CHANNEL_ID,
    DEFAULT_REMINDER_DELIVERY,
    formatReminderAlertStyle,
    isReminderAlertStyle,
    parseAlertStyle,
    parseSoundEnabled,
    parseVibrateEnabled,
    reminderChannelId,
    reminderChannelName,
} from "@/utils/reminder-delivery";

describe("reminder delivery prefs parse", () => {
    it("defaults missing AsyncStorage values to on / default style", () => {
        expect(parseSoundEnabled(null)).toBe(
            DEFAULT_REMINDER_DELIVERY.soundEnabled
        );
        expect(parseVibrateEnabled(null)).toBe(
            DEFAULT_REMINDER_DELIVERY.vibrateEnabled
        );
        expect(parseAlertStyle(null)).toBe(DEFAULT_REMINDER_DELIVERY.alertStyle);
    });

    it("treats only the string false as off for sound and vibrate", () => {
        expect(parseSoundEnabled("false")).toBe(false);
        expect(parseSoundEnabled("true")).toBe(true);
        expect(parseVibrateEnabled("false")).toBe(false);
        expect(parseVibrateEnabled("true")).toBe(true);
    });

    it("accepts known alert styles and falls back otherwise", () => {
        expect(isReminderAlertStyle("default")).toBe(true);
        expect(isReminderAlertStyle("prominent")).toBe(true);
        expect(isReminderAlertStyle("loud")).toBe(false);
        expect(parseAlertStyle("prominent")).toBe("prominent");
        expect(parseAlertStyle("loud")).toBe("default");
    });
});

describe("reminderChannelId", () => {
    it("keeps the stable due-reminders id for the default combo", () => {
        expect(reminderChannelId(DEFAULT_REMINDER_DELIVERY)).toBe(
            DEFAULT_REMINDER_CHANNEL_ID
        );
    });

    it("derives variant ids when sound, vibrate, or style change", () => {
        expect(
            reminderChannelId({
                soundEnabled: false,
                vibrateEnabled: true,
                alertStyle: "default",
            })
        ).toBe("due-reminders-mute-vib-default");

        expect(
            reminderChannelId({
                soundEnabled: true,
                vibrateEnabled: false,
                alertStyle: "default",
            })
        ).toBe("due-reminders-sound-novib-default");

        expect(
            reminderChannelId({
                soundEnabled: true,
                vibrateEnabled: true,
                alertStyle: "prominent",
            })
        ).toBe("due-reminders-sound-vib-high");

        expect(
            reminderChannelId({
                soundEnabled: false,
                vibrateEnabled: false,
                alertStyle: "prominent",
            })
        ).toBe("due-reminders-mute-novib-high");
    });
});

describe("reminder channel labels", () => {
    it("names prominent channels distinctly", () => {
        expect(reminderChannelName({ alertStyle: "default" })).toBe(
            "Due day reminders"
        );
        expect(reminderChannelName({ alertStyle: "prominent" })).toBe(
            "Due day reminders (prominent)"
        );
        expect(formatReminderAlertStyle("default")).toBe("Default");
        expect(formatReminderAlertStyle("prominent")).toBe("Prominent");
    });
});
