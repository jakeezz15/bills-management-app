import {
    applyAppBackup,
    buildAppBackup,
    isAppBackupEmpty,
} from "@/services/backup";
import { getCurrentUser } from "@/services/auth";
import { db } from "@/services/firebase";
import { parseAppBackup, type AppBackup } from "@/utils/backup-parse";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

const LINKED_KEY = "sync.cloudLinked";
const LAST_SYNC_KEY = "sync.lastSyncedAt";

export type SyncLinkChoice = "keep-device" | "use-cloud";

export type SyncLinkResult =
    | { status: "skipped"; reason: "not-signed-in" }
    | { status: "already-linked" }
    | { status: "pushed" }
    | { status: "pulled" };

export type SyncNowResult =
    | { status: "skipped"; reason: "not-signed-in" }
    | { status: "pushed"; at: string };

type CloudMeta = {
    updatedAt?: string;
    empty?: boolean;
};

function userPaths(uid: string) {
    return {
        meta: doc(db, "users", uid, "meta", "sync"),
        snapshot: doc(db, "users", uid, "data", "snapshot"),
    };
}

/** Firestore rejects `undefined` — normalize via JSON round-trip. */
function toFirestorePayload(backup: AppBackup): Record<string, unknown> {
    return JSON.parse(JSON.stringify(backup)) as Record<string, unknown>;
}

export async function isCloudSyncLinked(): Promise<boolean> {
    const value = await AsyncStorage.getItem(LINKED_KEY);
    return value === "1";
}

export async function markCloudSyncLinked(): Promise<void> {
    await AsyncStorage.setItem(LINKED_KEY, "1");
}

export async function clearCloudSyncLinked(): Promise<void> {
    await AsyncStorage.multiRemove([LINKED_KEY, LAST_SYNC_KEY]);
}

export async function getLastSyncedAt(): Promise<string | null> {
    return AsyncStorage.getItem(LAST_SYNC_KEY);
}

async function setLastSyncedAt(iso: string): Promise<void> {
    await AsyncStorage.setItem(LAST_SYNC_KEY, iso);
}

async function cloudHasData(uid: string): Promise<boolean> {
    const { meta, snapshot } = userPaths(uid);
    const metaSnap = await getDoc(meta);
    if (!metaSnap.exists()) {
        const dataSnap = await getDoc(snapshot);
        if (!dataSnap.exists()) return false;
        const data = dataSnap.data() as { backup?: unknown };
        const checked = parseAppBackup(data.backup);
        return checked.ok && !isAppBackupEmpty(checked.backup);
    }

    const cloudMeta = metaSnap.data() as CloudMeta;
    if (cloudMeta.empty === true) return false;

    const dataSnap = await getDoc(snapshot);
    if (!dataSnap.exists()) return false;
    const data = dataSnap.data() as { backup?: unknown };
    const checked = parseAppBackup(data.backup);
    return checked.ok && !isAppBackupEmpty(checked.backup);
}

export async function pushLocalToCloud(): Promise<string> {
    const user = getCurrentUser();
    if (!user) {
        throw new Error("Sign in to sync.");
    }

    const backup = await buildAppBackup();
    const at = new Date().toISOString();
    const { meta, snapshot } = userPaths(user.uid);

    await setDoc(snapshot, {
        backup: toFirestorePayload(backup),
        updatedAt: at,
    });
    await setDoc(meta, {
        updatedAt: at,
        empty: isAppBackupEmpty(backup),
        serverUpdatedAt: serverTimestamp(),
    });

    await markCloudSyncLinked();
    await setLastSyncedAt(at);
    return at;
}

export async function pullCloudToLocal(): Promise<string> {
    const user = getCurrentUser();
    if (!user) {
        throw new Error("Sign in to sync.");
    }

    const { snapshot } = userPaths(user.uid);
    const snap = await getDoc(snapshot);
    if (!snap.exists()) {
        throw new Error("No cloud backup found for this account.");
    }

    const data = snap.data() as { backup?: unknown; updatedAt?: string };
    const checked = parseAppBackup(data.backup);
    if (!checked.ok) {
        throw new Error(checked.error);
    }

    await applyAppBackup(checked.backup, checked.prefs);
    const at =
        typeof data.updatedAt === "string" && data.updatedAt
            ? data.updatedAt
            : new Date().toISOString();

    await markCloudSyncLinked();
    await setLastSyncedAt(at);
    return at;
}

/**
 * First-time link for this install after Google sign-in.
 * - No cloud → upload this device
 * - Cloud only → download
 * - Both have data → ask the user (keep device vs use cloud)
 */
export async function ensureCloudLinked(
    askChoice: () => Promise<SyncLinkChoice>,
    onPhase?: (message: string) => void
): Promise<SyncLinkResult> {
    const user = getCurrentUser();
    if (!user) {
        return { status: "skipped", reason: "not-signed-in" };
    }

    if (await isCloudSyncLinked()) {
        return { status: "already-linked" };
    }

    onPhase?.("Checking cloud…");
    const local = await buildAppBackup();
    const localEmpty = isAppBackupEmpty(local);
    const remoteHasData = await cloudHasData(user.uid);

    if (!remoteHasData) {
        onPhase?.("Uploading to cloud…");
        await pushLocalToCloud();
        return { status: "pushed" };
    }

    if (localEmpty) {
        onPhase?.("Downloading from cloud…");
        await pullCloudToLocal();
        return { status: "pulled" };
    }

    const choice = await askChoice();
    if (choice === "use-cloud") {
        onPhase?.("Downloading from cloud…");
        await pullCloudToLocal();
        return { status: "pulled" };
    }

    onPhase?.("Uploading to cloud…");
    await pushLocalToCloud();
    return { status: "pushed" };
}

/** Manual sync: upload this device as the cloud copy. */
export async function syncNowUpload(): Promise<SyncNowResult> {
    const user = getCurrentUser();
    if (!user) {
        return { status: "skipped", reason: "not-signed-in" };
    }
    const at = await pushLocalToCloud();
    return { status: "pushed", at };
}
