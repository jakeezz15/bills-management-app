import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_KEY = "auth.choseGuest";
const WELCOME_DONE_KEY = "auth.welcomeDone";
const WELCOME_MIGRATED_KEY = "auth.welcomeMigrated";

/** True when the user chose Continue as guest (local-only, no Google). */
export async function hasChosenGuest(): Promise<boolean> {
    const value = await AsyncStorage.getItem(GUEST_KEY);
    return value === "1";
}

export async function markChosenGuest(): Promise<void> {
    await AsyncStorage.setItem(GUEST_KEY, "1");
    await markWelcomeDone();
}

/** Clear after a successful Google sign-in so guest mode is not sticky. */
export async function clearChosenGuest(): Promise<void> {
    await AsyncStorage.removeItem(GUEST_KEY);
}

/**
 * Welcome is a one-time soft gate (policy C).
 * Sign-out does not clear this — user stays in the main app.
 */
export async function hasCompletedWelcome(): Promise<boolean> {
    const value = await AsyncStorage.getItem(WELCOME_DONE_KEY);
    return value === "1";
}

export async function markWelcomeDone(): Promise<void> {
    await AsyncStorage.setItem(WELCOME_DONE_KEY, "1");
}

export async function hasWelcomeMigrated(): Promise<boolean> {
    const value = await AsyncStorage.getItem(WELCOME_MIGRATED_KEY);
    return value === "1";
}

export async function markWelcomeMigrated(): Promise<void> {
    await AsyncStorage.setItem(WELCOME_MIGRATED_KEY, "1");
}

/**
 * Dev helper: show Welcome again without re-running the “existing user” skip.
 */
export async function resetWelcomeForDev(): Promise<void> {
    await AsyncStorage.multiRemove([GUEST_KEY, WELCOME_DONE_KEY]);
}
