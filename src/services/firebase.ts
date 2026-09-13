import { getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";


const firebaseConfig = {
    apiKey: "AIzaSyBhXU0NnFJRaDpWUhSjJINnwzEA1jUKUoE",
    authDomain: "on-hand-app.firebaseapp.com",
    projectId: "on-hand-app",
    storageBucket: "on-hand-app.firebasestorage.app",
    messagingSenderId: "714106654750",
    appId: "1:714106654750:web:492ccaa62059ef8b2ade0f",
    measurementId: "G-0SMBT9KMSE"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

function createAuth(){
    try {
        return initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });
    }catch{
        return getAuth(app);

    }
}

export const auth = createAuth();
export const db = getFirestore(app);