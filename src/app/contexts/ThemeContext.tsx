import {
    ACCENT_PRESETS,
    buildTheme,
    DEFAULT_ACCENT_ID,
    isAccentId,
    type AccentId,
    type Theme,
} from "@/design";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export const ACCENT_STORAGE_KEY = "appearance.accentId";

type ThemeContextValue = {
    accentId: AccentId;
    theme: Theme;
    ready: boolean;
    setAccentId: (id: AccentId) => Promise<void>;
    presets: typeof ACCENT_PRESETS;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [accentId, setAccentIdState] = useState<AccentId>(DEFAULT_ACCENT_ID);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        void (async () => {
            const stored = await AsyncStorage.getItem(ACCENT_STORAGE_KEY);
            if (stored && isAccentId(stored)) {
                setAccentIdState(stored);
            }
            setReady(true);
        })();
    }, []);

    const setAccentId = useCallback(async (id: AccentId) => {
        setAccentIdState(id);
        await AsyncStorage.setItem(ACCENT_STORAGE_KEY, id);
    }, []);

    const theme = useMemo(() => buildTheme(accentId), [accentId]);

    const value = useMemo(
        () => ({
            accentId,
            theme,
            ready,
            setAccentId,
            presets: ACCENT_PRESETS,
        }),
        [accentId, theme, ready, setAccentId]
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used inside ThemeProvider");
    }
    return context;
}
