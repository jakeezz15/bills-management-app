import { ChoiceChips } from "@/components/ChoiceChips";
import {
    SettingsDivider,
    SettingsInset,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { SettingsSubpage } from "@/components/SettingsSubpage";
import {
    areDueRemindersEnabled,
    disableDueReminders,
    enableDueReminders,
    getReminderPrefs,
    setReminderPrefs,
    syncDueReminders,
    remindersUnavailableReason,
    type ReminderPrefs,
} from "@/services/reminders";
import {
    formatReminderHour,
    formatReminderLead,
    formatReminderScheduleCaption,
    REMINDER_HOUR_OPTIONS,
    REMINDER_LEAD_OPTIONS,
} from "@/utils/reminder-schedule";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";

export default function SettingsNotificationsScreen() {
    const { bills } = useBills();
    const { debts } = useDebt();
    const [remindersOn, setRemindersOn] = useState(false);
    const [reminderBusy, setReminderBusy] = useState(false);
    const [reminderPrefs, setReminderPrefsState] = useState<ReminderPrefs>({
        hour: 9,
        leadDays: 3,
    });
    const remindersBlocked = remindersUnavailableReason();
    const scheduleCaption = formatReminderScheduleCaption(
        reminderPrefs.hour,
        reminderPrefs.leadDays
    );
    const hourLabels = REMINDER_HOUR_OPTIONS.map(formatReminderHour);
    const leadLabels = REMINDER_LEAD_OPTIONS.map(formatReminderLead);

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
                const result = await enableDueReminders(bills, debts);
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
                await syncDueReminders(bills, debts);
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
                    </>
                )}
            </SettingsSection>
        </SettingsSubpage>
    );
}
