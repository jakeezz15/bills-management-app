import { theme } from "@/design";
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
 * Soft gate (policy C): Welcome once until the user enters the app.
 * Sign-out does not return to Welcome.
 *
 * Re-reads storage on navigation so "Continue as guest" (no auth event)
 * does not loop back to Welcome.
 */
export function AuthGate({ children }: AuthGateProps) {
    const router = useRouter();
    const segments = useSegments();
    const [ready, setReady] = useState(false);

    const migrateExistingInstall = useCallback(async (signedIn: boolean) => {
        const welcomeDone = await hasCompletedWelcome();
        const migrated = await hasWelcomeMigrated();

        if (!welcomeDone && !migrated) {
            const [guest, firstRunDone] = await Promise.all([
                hasChosenGuest(),
                hasCompletedFirstRun(),
            ]);
            if (signedIn || guest || firstRunDone) {
                await markWelcomeDone();
            }
            await markWelcomeMigrated();
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const unsubscribe = subscribeToAuth((user) => {
            void (async () => {
                await migrateExistingInstall(user != null);
                if (!cancelled) setReady(true);
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
    }, [ready, segments, router]);

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
