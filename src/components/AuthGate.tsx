import { useTheme } from "@/app/contexts/ThemeContext";
import { subscribeToAuth } from "@/services/auth";
import {
    hasChosenGuest,
    hasCompletedWelcome,
    hasWelcomeMigrated,
    markWelcomeDone,
    markWelcomeMigrated,
} from "@/services/auth-preference";
import { hasCompletedFirstRun } from "@/services/storage";
import { useRouter, useSegments } from "expo-router";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

type AuthGateProps = {
    children: ReactNode;
};

/**
 * Welcome is required on first entry and again after Google sign-out.
 * Guest or Google both clear the gate until the next sign-out.
 */
export function AuthGate({ children }: AuthGateProps) {
    const router = useRouter();
    const segments = useSegments();
    const { theme } = useTheme();
    const [ready, setReady] = useState(false);
    const [signedIn, setSignedIn] = useState(false);
    const [welcomeTick, setWelcomeTick] = useState(0);

    const migrateExistingInstall = useCallback(async (isSignedIn: boolean) => {
        const welcomeDone = await hasCompletedWelcome();
        const migrated = await hasWelcomeMigrated();

        if (!welcomeDone && !migrated) {
            const [guest, firstRunDone] = await Promise.all([
                hasChosenGuest(),
                hasCompletedFirstRun(),
            ]);
            if (isSignedIn || guest || firstRunDone) {
                await markWelcomeDone();
            }
            await markWelcomeMigrated();
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const unsubscribe = subscribeToAuth((user) => {
            void (async () => {
                const isSignedIn = user != null;
                await migrateExistingInstall(isSignedIn);
                if (cancelled) return;
                setSignedIn(isSignedIn);
                setWelcomeTick((n) => n + 1);
                setReady(true);
            })();
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [migrateExistingInstall]);

    useEffect(() => {
        if (!ready) return;

        let cancelled = false;

        void (async () => {
            const welcomeDone = await hasCompletedWelcome();
            if (cancelled) return;

            const onWelcome = segments[0] === "welcome";

            if (!welcomeDone && !onWelcome) {
                router.replace("/welcome");
                return;
            }

            if (welcomeDone && onWelcome) {
                router.replace("/(tabs)");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [ready, segments, router, signedIn, welcomeTick]);

    if (!ready) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.bg.canvas,
                }}
            >
                <ActivityIndicator color={theme.text.accent} />
            </View>
        );
    }

    return <>{children}</>;
}
