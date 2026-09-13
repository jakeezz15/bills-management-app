import {
    SettingsDivider,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { SettingsSubpage } from "@/components/SettingsSubpage";
import { useSyncProgress } from "@/components/SyncProgressOverlay";
import {
    getCurrentUser,
    messageForSignInError,
    signInWithGoogle,
    signOut,
    subscribeToAuth,
} from "@/services/auth";
import {
    areDueRemindersEnabled,
    getReminderPrefs,
} from "@/services/reminders";
import { getStoredCurrency } from "@/utils/money";
import {
    getLastSyncedAt,
    messageForSyncError,
    runBackupAndClearForSignOut,
    runDownloadSync,
    runEnsureCloudLinked,
    runUploadSync,
} from "@/utils/sync-ui";
import type { User } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useIncome } from "@/app/contexts/IncomeContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";

export default function SettingsAccountScreen() {
    const [user, setUser] = useState<User | null>(getCurrentUser());
    const [authBusy, setAuthBusy] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const { showSyncProgress, hideSyncProgress } = useSyncProgress();
    const { setCurrency } = useLocale();
    const { reload: reloadIncome } = useIncome();
    const { reload: reloadExpenses } = useExpenses();
    const { reload: reloadBills } = useBills();
    const { reload: reloadDebts } = useDebt();
    const { reload: reloadSavings } = useSavings();

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

    const reloadAll = async () => {
        await Promise.all([
            reloadIncome(),
            reloadExpenses(),
            reloadBills(),
            reloadDebts(),
            reloadSavings(),
        ]);
    };

    const handleSignIn = async () => {
        try {
            setAuthBusy(true);
            await signInWithGoogle();
        } catch (error) {
            const message = messageForSignInError(error);
            if (message) {
                Alert.alert("Sign-in failed", message);
            }
            setAuthBusy(false);
            return;
        }

        try {
            await runEnsureCloudLinked({ showSyncProgress, hideSyncProgress });
            await reloadAll();
            setLastSyncedAt(await getLastSyncedAt());
        } catch (error) {
            Alert.alert("Sync failed", messageForSyncError(error));
        } finally {
            setAuthBusy(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            "Sign out?",
            "We’ll save a cloud backup, then clear finance data on this device and return to Welcome. Sign in again anytime to restore.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign out",
                    style: "destructive",
                    onPress: () => {
                        void (async () => {
                            try {
                                setAuthBusy(true);
                                await runBackupAndClearForSignOut({
                                    showSyncProgress,
                                    hideSyncProgress,
                                });
                                await reloadAll();
                                await signOut();
                                setLastSyncedAt(null);
                                router.replace("/welcome");
                            } catch (error) {
                                Alert.alert(
                                    "Sign-out paused",
                                    `${messageForSyncError(error)} Your data is still on this device and you’re still signed in.`
                                );
                            } finally {
                                setAuthBusy(false);
                            }
                        })();
                    },
                },
            ]
        );
    };

    return (
        <SettingsSubpage title="Account">
            {user ? (
                <SettingsSection title="Google">
                    <SettingsRow
                        title={user.displayName ?? "Signed in"}
                        subtitle={user.email ?? "Google account"}
                        icon="person-circle-outline"
                    />
                    <SettingsDivider />
                    <SettingsRow
                        title="Sign out"
                        subtitle="Backup to cloud, then clear this device"
                        icon="log-out-outline"
                        destructive
                        disabled={authBusy}
                        onPress={handleSignOut}
                    />
                </SettingsSection>
            ) : (
                <SettingsSection title="Google">
                    <SettingsRow
                        title="Sign in with Google"
                        subtitle="Optional — unlock sync across devices"
                        icon="logo-google"
                        disabled={authBusy}
                        showChevron
                        onPress={() => {
                            void handleSignIn();
                        }}
                    />
                </SettingsSection>
            )}

            {user ? (
                <SettingsSection title="Cloud sync">
                    <SettingsRow
                        title="Upload to cloud"
                        subtitle={
                            lastSyncedAt
                                ? `Last sync ${new Date(lastSyncedAt).toLocaleString()}`
                                : "Save this device as the cloud copy"
                        }
                        icon="cloud-upload-outline"
                        disabled={authBusy}
                        showChevron
                        onPress={() => {
                            void (async () => {
                                try {
                                    setAuthBusy(true);
                                    await runUploadSync({
                                        showSyncProgress,
                                        hideSyncProgress,
                                    });
                                    setLastSyncedAt(await getLastSyncedAt());
                                } catch (error) {
                                    Alert.alert(
                                        "Upload failed",
                                        messageForSyncError(error)
                                    );
                                } finally {
                                    setAuthBusy(false);
                                }
                            })();
                        }}
                    />
                    <SettingsDivider />
                    <SettingsRow
                        title="Download from cloud"
                        subtitle="Replace this device with the cloud copy"
                        icon="cloud-download-outline"
                        disabled={authBusy}
                        showChevron
                        onPress={() => {
                            void runDownloadSync(
                                async () => {
                                    await reloadAll();
                                    const code = await getStoredCurrency();
                                    await setCurrency(code);
                                    await getReminderPrefs();
                                    await areDueRemindersEnabled();
                                    setLastSyncedAt(await getLastSyncedAt());
                                },
                                { showSyncProgress, hideSyncProgress }
                            );
                        }}
                    />
                </SettingsSection>
            ) : null}
        </SettingsSubpage>
    );
}
