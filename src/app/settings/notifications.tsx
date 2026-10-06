import { ChoiceChips } from "@/components/ChoiceChips";
import {
    SettingsDivider,
    SettingsInset,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { SettingsSubpage } from "@/components/SettingsSubpage";
import { useTheme } from "@/app/contexts/ThemeContext";
import { useFormStyles } from "@/styles/form";
import {
    areDueRemindersEnabled,
    DEFAULT_REMINDER_PREFS,
    disableDueReminders,
    enableDueReminders,
    getReminderPrefs,
    setReminderPrefs,
    syncDueReminders,
    remindersUnavailableReason,
    type ReminderPrefs,
} from "@/services/reminders";
import {
    formatReminderAlertStyle,
    REMINDER_ALERT_STYLES,
    type ReminderAlertStyle,
} from "@/utils/reminder-delivery";
import {
    formatReminderHour,
    formatReminderLead,
    formatReminderScheduleCaption,
    REMINDER_HOUR_OPTIONS,
    REMINDER_LEAD_OPTIONS,
} from "@/utils/reminder-schedule";
import { useEffect, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";

export default function SettingsNotificationsScreen() {
    const { theme } = useTheme();
    const form = useFormStyles();
    const { bills, payments: billPayments } = useBills();
    const { debts, payments: debtPayments } = useDebt();
    const [remindersOn, setRemindersOn] = useState(false);
    const [reminderBusy, setReminderBusy] = useState(false);
    const [reminderPrefs, setReminderPrefsState] = useState<ReminderPrefs>(
        DEFAULT_REMINDER_PREFS
    );
    const remindersBlocked = remindersUnavailableReason();
    const scheduleCaption = formatReminderScheduleCaption(
        reminderPrefs.hour,
        reminderPrefs.leadDays
    );
    const hourLabels = REMINDER_HOUR_OPTIONS.map(formatReminderHour);
    const leadLabels = REMINDER_LEAD_OPTIONS.map(formatReminderLead);
    const alertStyleLabels = REMINDER_ALERT_STYLES.map(formatReminderAlertStyle);

    useEffect(() => {
        void Promise.all([areDueRemindersEnabled(), getReminderPrefs()]).then(
            ([enabled, prefs]) => {
                setRemindersOn(enabled);
                setReminderPrefsState(prefs);
            }
        );
    }, []);

    const handleToggleReminders = async (next: boolean) => {
        if (remindersBlocked) {
            Alert.alert("Reminders unavailable", remindersBlocked);
            return;
        }

        setReminderBusy(true);
        try {
            if (next) {
                const result = await enableDueReminders(
                    bills,
                    debts,
                    billPayments,
                    debtPayments
                );
                if (!result.ok) {
                    setRemindersOn(false);
                    Alert.alert(
                        "Reminders off",
                        result.reason ?? "Could not enable reminders.",
                        result.reason?.includes("system Settings")
                            ? [
                                  { text: "Not now", style: "cancel" },
                                  {
                                      text: "Open Settings",
                                      onPress: () => {
                                          void Linking.openSettings();
                                      },
                                  },
                              ]
                            : undefined
                    );
                    return;
                }
                setRemindersOn(true);
                Alert.alert(
                    "Reminders on",
                    result.scheduled === 0
                        ? "No bills or debts to remind about yet. Add one and we will schedule it."
                        : `${result.scheduled} reminders set: ${scheduleCaption}.`
                );
            } else {
                await disableDueReminders();
                setRemindersOn(false);
            }
        } finally {
            setReminderBusy(false);
        }
    };

    const applyReminderPrefs = async (next: ReminderPrefs) => {
        setReminderPrefsState(next);
        setReminderBusy(true);
        try {
            await setReminderPrefs(next);
            if (remindersOn) {
                await syncDueReminders({
                    bills,
                    debts,
                    billPayments,
                    debtPayments,
                });
            }
        } finally {
            setReminderBusy(false);
        }
    };

    const handleHourChange = (label: string) => {
        const hour = REMINDER_HOUR_OPTIONS.find(
            (option) => formatReminderHour(option) === label
        );
        if (hour == null || hour === reminderPrefs.hour) {
            return;
        }
        void applyReminderPrefs({ ...reminderPrefs, hour });
    };

    const handleLeadChange = (label: string) => {
        const leadDays = REMINDER_LEAD_OPTIONS.find(
            (option) => formatReminderLead(option) === label
        );
        if (leadDays == null || leadDays === reminderPrefs.leadDays) {
            return;
        }
        void applyReminderPrefs({ ...reminderPrefs, leadDays });
    };

    const handleAlertStyleChange = (label: string) => {
        const alertStyle = REMINDER_ALERT_STYLES.find(
            (option) => formatReminderAlertStyle(option) === label
        ) as ReminderAlertStyle | undefined;
        if (alertStyle == null || alertStyle === reminderPrefs.alertStyle) {
            return;
        }
        void applyReminderPrefs({ ...reminderPrefs, alertStyle });
    };

    return (
        <SettingsSubpage title="Notifications">
            <SettingsSection title="Due reminders">
                <SettingsRow
                    icon="notifications-outline"
                    title="Due-day reminders"
                    subtitle={
                        remindersBlocked ? remindersBlocked : scheduleCaption
                    }
                    disabled={reminderBusy || Boolean(remindersBlocked)}
                    switchValue={remindersOn}
                    onSwitchChange={(value) => {
                        void handleToggleReminders(value);
                    }}
                />
                {remindersBlocked ? null : (
                    <>
                        <SettingsDivider />
                        <SettingsInset title="Time">
                            <ChoiceChips
                                options={hourLabels}
                                selected={formatReminderHour(reminderPrefs.hour)}
                                onSelect={handleHourChange}
                                title="Time"
                                disabled={!remindersOn || reminderBusy}
                            />
                        </SettingsInset>
                        <SettingsDivider />
                        <SettingsInset title="Lead">
                            <ChoiceChips
                                options={leadLabels}
                                selected={formatReminderLead(
                                    reminderPrefs.leadDays
                                )}
                                onSelect={handleLeadChange}
                                title="Lead"
                                disabled={!remindersOn || reminderBusy}
                            />
                        </SettingsInset>
                        <SettingsDivider />
                        <View
                            style={{
                                paddingHorizontal: theme.space.md,
                                paddingBottom: theme.space.md,
                                paddingTop: theme.space.xs,
                            }}
                        >
                            <Text style={[form.helper, { marginTop: 0 }]}>
                                When many are due the same day, you get one
                                summary banner.
                            </Text>
                        </View>
                    </>
                )}
            </SettingsSection>

            {remindersBlocked ? null : (
                <SettingsSection title="Delivery">
                    <SettingsRow
                        icon="volume-high-outline"
                        title="Sound"
                        disabled={reminderBusy}
                        switchValue={reminderPrefs.soundEnabled}
                        onSwitchChange={(value) => {
                            void applyReminderPrefs({
                                ...reminderPrefs,
                                soundEnabled: value,
                            });
                        }}
                    />
                    <SettingsDivider />
                    <SettingsRow
                        icon="phone-portrait-outline"
                        title="Vibration"
                        subtitle={
                            Platform.OS === "ios"
                                ? "Follows iPhone settings when sound is on"
                                : undefined
                        }
                        disabled={reminderBusy}
                        switchValue={reminderPrefs.vibrateEnabled}
                        onSwitchChange={(value) => {
                            void applyReminderPrefs({
                                ...reminderPrefs,
                                vibrateEnabled: value,
                            });
                        }}
                    />
                    <SettingsDivider />
                    <SettingsInset title="Alert style">
                        <ChoiceChips
                            options={alertStyleLabels}
                            selected={formatReminderAlertStyle(
                                reminderPrefs.alertStyle
                            )}
                            onSelect={handleAlertStyleChange}
                            title="Alert style"
                            disabled={reminderBusy}
                        />
                        {Platform.OS === "android" &&
                        reminderPrefs.alertStyle === "prominent" ? (
                            <Text style={[form.helper, { marginTop: 0 }]}>
                                Pop on screen when the phone is unlocked
                            </Text>
                        ) : Platform.OS === "ios" ? (
                            <Text style={[form.helper, { marginTop: 0 }]}>
                                Prominent is mainly for Android heads-up alerts
                            </Text>
                        ) : null}
                    </SettingsInset>
                    <SettingsDivider />
                    <SettingsRow
                        icon="settings-outline"
                        title="Open system notification settings"
                        showChevron
                        onPress={() => {
                            void Linking.openSettings();
                        }}
                    />
                </SettingsSection>
            )}
        </SettingsSubpage>
    );
}
