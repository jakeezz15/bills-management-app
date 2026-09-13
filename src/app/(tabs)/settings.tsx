import {
    SettingsDivider,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { text, theme } from "@/design";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import {
    getCurrentUser,
    subscribeToAuth,
} from "@/services/auth";
import {
    areDueRemindersEnabled,
    getReminderPrefs,
    remindersUnavailableReason,
} from "@/services/reminders";
import { useDashboardStyles } from "@/styles/dashboard";
import { isDevToolsBuild } from "@/utils/dev-tools";
import {
    formatReminderScheduleCaption,
} from "@/utils/reminder-schedule";
import { getLastSyncedAt } from "@/utils/sync-ui";
import Constants from "expo-constants";
import { router, useFocusEffect } from "expo-router";
import type { User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function SettingsScreen() {
    const dashboard = useDashboardStyles();
    useStatusBarStyle("dark");
    const topPadding = useScreenTopPadding();
    const [user, setUser] = useState<User | null>(getCurrentUser());
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const [remindersOn, setRemindersOn] = useState(false);
    const [scheduleCaption, setScheduleCaption] = useState("…");
    const remindersBlocked = remindersUnavailableReason();
    const version = Constants.expoConfig?.version ?? "1.0.0";

    useEffect(() => {
        const unsubscribe = subscribeToAuth((next) => {
            setUser(next);
            if (next) {
                void getLastSyncedAt().then(setLastSyncedAt);
            } else {
                setLastSyncedAt(null);
            }
        });
        return unsubscribe;
    }, []);

    useFocusEffect(
        useCallback(() => {
            void Promise.all([
                areDueRemindersEnabled(),
                getReminderPrefs(),
                getLastSyncedAt(),
            ]).then(([enabled, prefs, synced]) => {
                setRemindersOn(enabled);
                setScheduleCaption(
                    formatReminderScheduleCaption(prefs.hour, prefs.leadDays)
                );
                if (getCurrentUser()) {
                    setLastSyncedAt(synced);
                }
            });
        }, [])
    );

    const accountSubtitle = user
        ? user.email ??
        (lastSyncedAt
            ? `Synced ${new Date(lastSyncedAt).toLocaleDateString()}`
            : "Signed in · cloud sync")
        : "Sign in optional · sync across devices";

    const notificationsSubtitle = remindersBlocked
        ? remindersBlocked
        : remindersOn
            ? `On · ${scheduleCaption}`
            : "Off";

    return (
        <View style={dashboard.screen}>
            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: topPadding },
                ]}
            >
                <Text style={styles.pageTitle}>Settings</Text>

                <SettingsSection title="Preferences">
                    <SettingsRow
                        icon="options-outline"
                        title="General"
                        // subtitle={currencyLabel(currency)}
                        showChevron
                        onPress={() => {
                            router.push("/settings/general");
                        }}
                    />
                    <SettingsDivider />


                    <SettingsRow
                        icon="notifications-outline"
                        title="Notifications"
                        subtitle={notificationsSubtitle}
                        showChevron
                        onPress={() => {
                            router.push("/settings/notifications");
                        }}
                    />
                    <SettingsDivider />

                    <SettingsRow
                        icon="folder-outline"
                        title="Data & privacy"
                        subtitle="Export, import, or reset"
                        showChevron
                        onPress={() => {
                            router.push("/settings/data");
                        }}
                    />
                    <SettingsDivider />

                    <SettingsRow
                        icon="person-circle-outline"
                        title="Account"
                        subtitle={accountSubtitle}
                        showChevron
                        onPress={() => {
                            router.push("/settings/account");
                        }}
                    />
                    <SettingsDivider />
                </SettingsSection>

                <SettingsSection title="App">
                    <SettingsRow
                        icon="information-circle-outline"
                        title="About"
                        subtitle={`On Hand ${version}`}
                        showChevron
                        onPress={() => {
                            router.push("/settings/about");
                        }}
                    />
                    {isDevToolsBuild() ? (
                        <>
                            <SettingsDivider />
                            <SettingsRow
                                icon="construct-outline"
                                title="Development"
                                subtitle="Seeds, tests, and welcome replay"
                                showChevron
                                onPress={() => {
                                    router.push("/settings/development");
                                }}
                            />
                        </>
                    ) : null}
                </SettingsSection>
            </ScrollView>
        </View>
    );
}

const styles = {
    content: {
        paddingHorizontal: theme.space.screenX,
        paddingBottom: theme.space.xl,
    },
    pageTitle: {
        ...text.display,
        marginBottom: theme.space.lg,
        marginLeft: theme.space.xs,
    },
};
