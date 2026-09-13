import {
    clearCloudSyncLinked,
    ensureCloudLinked,
    getLastSyncedAt,
    pullCloudToLocal,
    syncNowUpload,
    type SyncLinkChoice,
} from "@/services/sync";
import { clearAllData } from "@/services/storage";
import { Alert } from "react-native";

type ProgressHandlers = {
    showSyncProgress: (message: string) => void;
    hideSyncProgress: () => void;
};

/** Alert-based “this device vs cloud” for first link. */
export function askSyncLinkChoice(): Promise<SyncLinkChoice> {
    return new Promise((resolve) => {
        Alert.alert(
            "Cloud data found",
            "This Google account already has On Hand data. Which copy should we keep?",
            [
                {
                    text: "Keep this device",
                    onPress: () => resolve("keep-device"),
                },
                {
                    text: "Use cloud copy",
                    style: "destructive",
                    onPress: () => resolve("use-cloud"),
                },
            ],
            { cancelable: false }
        );
    });
}

export async function runEnsureCloudLinked(
    progress?: ProgressHandlers
): Promise<void> {
    try {
        progress?.showSyncProgress("Preparing sync…");
        const result = await ensureCloudLinked(
            async () => {
                progress?.hideSyncProgress();
                const choice = await askSyncLinkChoice();
                progress?.showSyncProgress(
                    choice === "use-cloud"
                        ? "Downloading from cloud…"
                        : "Uploading to cloud…"
                );
                return choice;
            },
            (message) => progress?.showSyncProgress(message)
        );
        progress?.hideSyncProgress();
        if (result.status === "pushed") {
            Alert.alert("Synced", "This device was uploaded to the cloud.");
        } else if (result.status === "pulled") {
            Alert.alert("Synced", "Cloud data was downloaded to this device.");
        }
    } catch (error) {
        progress?.hideSyncProgress();
        throw error;
    }
}

export async function runUploadSync(
    progress?: ProgressHandlers
): Promise<void> {
    try {
        progress?.showSyncProgress("Uploading to cloud…");
        const result = await syncNowUpload();
        progress?.hideSyncProgress();
        if (result.status === "skipped") {
            Alert.alert("Sign in required", "Sign in with Google to sync.");
            return;
        }
        Alert.alert("Uploaded", "This device’s data is now in the cloud.");
    } catch (error) {
        progress?.hideSyncProgress();
        throw error;
    }
}

/**
 * Sign-out prep: upload cloud backup, then wipe local finance data.
 * Throws on upload failure — caller must not sign out or clear further.
 */
export async function runBackupAndClearForSignOut(
    progress?: ProgressHandlers
): Promise<void> {
    try {
        progress?.showSyncProgress("Saving to cloud…");
        const result = await syncNowUpload();
        if (result.status === "skipped") {
            throw new Error("Sign in required");
        }
        progress?.showSyncProgress("Clearing this device…");
        await clearAllData();
        await clearCloudSyncLinked();
        progress?.hideSyncProgress();
    } catch (error) {
        progress?.hideSyncProgress();
        throw error;
    }
}

export async function runDownloadSync(
    onApplied: () => Promise<void>,
    progress?: ProgressHandlers
): Promise<void> {
    Alert.alert(
        "Download from cloud?",
        "This replaces all finance data on this device with the cloud copy.",
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Download",
                style: "destructive",
                onPress: () => {
                    void (async () => {
                        try {
                            progress?.showSyncProgress(
                                "Downloading from cloud…"
                            );
                            await pullCloudToLocal();
                            progress?.showSyncProgress("Updating this device…");
                            await onApplied();
                            progress?.hideSyncProgress();
                            Alert.alert(
                                "Downloaded",
                                "Cloud data is now on this device."
                            );
                        } catch (error) {
                            progress?.hideSyncProgress();
                            Alert.alert(
                                "Download failed",
                                messageForSyncError(error)
                            );
                        }
                    })();
                },
            },
        ]
    );
}

export { clearCloudSyncLinked, getLastSyncedAt };

/** Short copy for sync alerts — avoid raw Firebase / network jargon. */
export function messageForSyncError(error: unknown): string {
    const raw =
        error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "";
    if (/network|offline|unavailable/i.test(raw)) {
        return "Check your internet connection and try again.";
    }
    if (/permission|insufficient|unauthenticated/i.test(raw)) {
        return "You don’t have access to sync right now. Sign in again and try once more.";
    }
    return "Something went wrong while syncing. Please try again.";
}

