import {
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    type User,
} from "firebase/auth";

import { GOOGLE_WEB_CLIENT_ID } from "@/constants/google";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { clearChosenGuest, markWelcomeDone } from "./auth-preference";
import { auth } from "./firebase";

let configure = false;

export function configureGoogleSignIn(): void {
    if (configure) return;
    GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
    });
    configure = true;
}

/**
 * Map auth failures to short, non-technical copy for alerts.
 * Returns null when the user cancelled — callers should stay quiet.
 */
export function messageForSignInError(error: unknown): string | null {
    const code =
        error && typeof error === "object" && "code" in error
            ? String((error as { code: unknown }).code)
            : "";
    const raw =
        error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "";

    const cancelled =
        code === "SIGN_IN_CANCELLED" ||
        code === "12501" ||
        /cancel(led)?/i.test(raw);
    if (cancelled) {
        return null;
    }

    if (
        code === "PLAY_SERVICES_NOT_AVAILABLE" ||
        /play services/i.test(raw)
    ) {
        return "Google Play services needs an update on this device. Update it in the Play Store, then try again.";
    }

    if (
        code === "10" ||
        code === "DEVELOPER_ERROR" ||
        /developer_error|idtoken|oauth|sha/i.test(raw)
    ) {
        return "Google sign-in isn’t available for this build yet. Please try again later, or continue as a guest.";
    }

    if (
        code === "NETWORK_ERROR" ||
        code === "auth/network-request-failed" ||
        /network/i.test(raw)
    ) {
        return "Check your internet connection and try again.";
    }

    if (code === "auth/invalid-credential" || /credential/i.test(raw)) {
        return "We couldn’t verify your Google account. Please try signing in again.";
    }

    if (/idtoken/i.test(raw)) {
        return "Google sign-in didn’t finish. Please try again.";
    }

    // Never surface raw SDK / Firebase strings to users.
    return "Something went wrong with Google sign-in. Please try again, or continue as a guest.";
}

export async function signInWithGoogle(): Promise<User> {
    configureGoogleSignIn();

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    const idToken =
        "data" in response && response.data
            ? response.data.idToken
            : (response as { idToken?: string | null }).idToken;

    if (!idToken) {
        throw new Error("Google sign-in didn’t finish. Please try again.");
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    await clearChosenGuest();
    await markWelcomeDone();
    return result.user;
}

export async function signOut(): Promise<void> {
    configureGoogleSignIn();
    try {
        await GoogleSignin.signOut();
    } catch {
        // Still clear Firebase even if Google sign-out fails
    }
    await firebaseSignOut(auth);
}

export function subscribeToAuth(
    callback: (user: User | null) => void
): () => void {
    return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
    return auth.currentUser;
}
