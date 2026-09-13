import { useTheme } from "@/app/contexts/ThemeContext";
import { text } from "@/design";
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    View,
} from "react-native";

type SyncProgressContextValue = {
    visible: boolean;
    message: string;
    showSyncProgress: (message: string) => void;
    hideSyncProgress: () => void;
};

const SyncProgressContext = createContext<SyncProgressContextValue | null>(
    null
);

export function SyncProgressProvider({ children }: { children: ReactNode }) {
    const { theme } = useTheme();
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("Syncing…");

    const showSyncProgress = useCallback((next: string) => {
        setMessage(next);
        setVisible(true);
    }, []);

    const hideSyncProgress = useCallback(() => {
        setVisible(false);
    }, []);

    const value = useMemo(
        () => ({
            visible,
            message,
            showSyncProgress,
            hideSyncProgress,
        }),
        [visible, message, showSyncProgress, hideSyncProgress]
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: "rgba(15, 23, 42, 0.45)",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: theme.space.lg,
                },
                card: {
                    width: "100%",
                    maxWidth: 320,
                    backgroundColor: theme.bg.canvas,
                    borderRadius: theme.radius.md,
                    paddingVertical: theme.space.xl,
                    paddingHorizontal: theme.space.lg,
                    alignItems: "center",
                    gap: theme.space.sm,
                },
                title: {
                    ...text.pageTitle,
                    textAlign: "center",
                    marginTop: theme.space.sm,
                },
                caption: {
                    ...text.body,
                    color: theme.text.secondary,
                    textAlign: "center",
                },
            }),
        [theme]
    );

    return (
        <SyncProgressContext.Provider value={value}>
            {children}
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => {
                    // Block back while syncing — dismiss only when work finishes.
                }}
            >
                <View style={styles.backdrop} accessibilityViewIsModal>
                    <View style={styles.card}>
                        <ActivityIndicator
                            size="large"
                            color={theme.text.accent}
                        />
                        <Text style={styles.title}>{message}</Text>
                        <Text style={styles.caption}>
                            Please keep the app open
                        </Text>
                    </View>
                </View>
            </Modal>
        </SyncProgressContext.Provider>
    );
}

export function useSyncProgress(): SyncProgressContextValue {
    const ctx = useContext(SyncProgressContext);
    if (!ctx) {
        throw new Error(
            "useSyncProgress must be used within SyncProgressProvider"
        );
    }
    return ctx;
}
