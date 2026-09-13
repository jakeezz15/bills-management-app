import { signOut as firebaseSignOut, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, type User } from "firebase/auth";

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


export async function signInWithGoogle(): Promise<User> {

    configureGoogleSignIn();

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();


    const idToken = "data" in response && response.data ? response.data.idToken : (response as { idToken?: string | null }).idToken;

    if (!idToken) {
        throw new Error("Google Sign-in did not return an idToken")
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
export function subscribeToAuth(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
}
export function getCurrentUser(): User | null {
    return auth.currentUser;
}