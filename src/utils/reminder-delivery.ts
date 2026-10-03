/**
 * Delivery prefs for due reminders (sound / vibrate / alert style).
 * Pure helpers so channel ids and defaults stay unit-testable.
 */

export const REMINDER_ALERT_STYLES = ["default", "prominent"] as const;
export type ReminderAlertStyle = (typeof REMINDER_ALERT_STYLES)[number];

export type ReminderDeliveryPrefs = {
    soundEnabled: boolean;
    vibrateEnabled: boolean;
    alertStyle: ReminderAlertStyle;
};

export const DEFAULT_REMINDER_DELIVERY: ReminderDeliveryPrefs = {
    soundEnabled: true,
    vibrateEnabled: true,
    alertStyle: "default",
};

/** Stable channel id for the default delivery combo (matches app.json). */
export const DEFAULT_REMINDER_CHANNEL_ID = "due-reminders";

export function isReminderAlertStyle(
    value: unknown
): value is ReminderAlertStyle {
    return (
        typeof value === "string" &&
        (REMINDER_ALERT_STYLES as readonly string[]).includes(value)
    );
}

export function parseSoundEnabled(raw: string | null): boolean {
    if (raw === null) {
        return DEFAULT_REMINDER_DELIVERY.soundEnabled;
    }
    return raw !== "false";
}

export function parseVibrateEnabled(raw: string | null): boolean {
    if (raw === null) {
        return DEFAULT_REMINDER_DELIVERY.vibrateEnabled;
    }
    return raw !== "false";
}

export function parseAlertStyle(raw: string | null): ReminderAlertStyle {
    if (isReminderAlertStyle(raw)) {
        return raw;
    }
    return DEFAULT_REMINDER_DELIVERY.alertStyle;
}

/**
 * Android channels freeze sound/vibrate/importance after create.
 * Map prefs to a stable channel id; default combo keeps `due-reminders`.
 */
export function reminderChannelId(
    prefs: Pick<
        ReminderDeliveryPrefs,
        "soundEnabled" | "vibrateEnabled" | "alertStyle"
    >
): string {
    if (
        prefs.soundEnabled &&
        prefs.vibrateEnabled &&
        prefs.alertStyle === "default"
    ) {
        return DEFAULT_REMINDER_CHANNEL_ID;
    }
    const sound = prefs.soundEnabled ? "sound" : "mute";
    const vib = prefs.vibrateEnabled ? "vib" : "novib";
    const style = prefs.alertStyle === "prominent" ? "high" : "default";
    return `due-reminders-${sound}-${vib}-${style}`;
}

export function reminderChannelName(
    prefs: Pick<ReminderDeliveryPrefs, "alertStyle">
): string {
    return prefs.alertStyle === "prominent"
        ? "Due day reminders (prominent)"
        : "Due day reminders";
}

export function formatReminderAlertStyle(style: ReminderAlertStyle): string {
    return style === "prominent" ? "Prominent" : "Default";
}
