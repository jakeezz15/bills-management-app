import {
    CURRENCY_STORAGE_KEY,
    CurrencyCode,
    FormatMoneyOptions,
    detectDeviceCurrency,
    formatMoney as formatMoneyValue,
    isCurrencyCode,
} from "@/utils/money";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

type LocaleContextValue = {
    currency: CurrencyCode;
    loading: boolean;
    setCurrency: (code: CurrencyCode) => Promise<void>;
    formatMoney: (amount: number, options?: FormatMoneyOptions) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void (async () => {
            const stored = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
            if (stored && isCurrencyCode(stored)) {
                setCurrencyState(stored);
            } else {
                setCurrencyState(detectDeviceCurrency());
            }
            setLoading(false);
        })();
    }, []);

    const setCurrency = useCallback(async (code: CurrencyCode) => {
        setCurrencyState(code);
        await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, code);
    }, []);

    const formatMoney = useCallback(
        (amount: number, options?: FormatMoneyOptions) =>
            formatMoneyValue(amount, currency, options),
        [currency]
    );

    const value = useMemo(
        () => ({
            currency,
            loading,
            setCurrency,
            formatMoney,
        }),
        [currency, loading, setCurrency, formatMoney]
    );

    return (
        <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    );
}

export function useLocale() {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error("useLocale must be used inside LocaleProvider");
    }
    return context;
}
