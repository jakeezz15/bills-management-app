import {
    DateRange,
    PeriodUnit,
    formatPeriodLabel,
    getRangeForPeriod,
    shiftAnchor,
    startOfDay,
    toIsoDate,
} from "@/utils/date";
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

type DateRangeContextValue = {
    periodUnit: PeriodUnit;
    anchorIso: string;
    range: DateRange;
    label: string;
    setPeriodUnit: (unit: PeriodUnit) => void;
    shiftPeriod: (delta: -1 | 1) => void;
    resetToToday: () => void;
    selectDay: (iso: string) => void;
};

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
    const [periodUnit, setPeriodUnitState] = useState<PeriodUnit>("month");
    const [anchorIso, setAnchorIso] = useState(() => toIsoDate(new Date()));

    const anchor = useMemo(() => {
        const [y, m, d] = anchorIso.split("-").map(Number);
        return startOfDay(new Date(y, m - 1, d));
    }, [anchorIso]);

    const range = useMemo(
        () => getRangeForPeriod(anchor, periodUnit),
        [anchor, periodUnit]
    );

    const label = useMemo(
        () => formatPeriodLabel(anchor, periodUnit),
        [anchor, periodUnit]
    );

    const setPeriodUnit = useCallback((unit: PeriodUnit) => {
        setPeriodUnitState(unit);
    }, []);

    const shiftPeriod = useCallback(
        (delta: -1 | 1) => {
            setAnchorIso(toIsoDate(shiftAnchor(anchor, periodUnit, delta)));
        },
        [anchor, periodUnit]
    );

    const resetToToday = useCallback(() => {
        setAnchorIso(toIsoDate(new Date()));
        setPeriodUnitState("month");
    }, []);

    const selectDay = useCallback((iso: string) => {
        setAnchorIso(iso);
        setPeriodUnitState("day");
    }, []);

    const value = useMemo(
        () => ({
            periodUnit,
            anchorIso,
            range,
            label,
            setPeriodUnit,
            shiftPeriod,
            resetToToday,
            selectDay,
        }),
        [
            periodUnit,
            anchorIso,
            range,
            label,
            setPeriodUnit,
            shiftPeriod,
            resetToToday,
            selectDay,
        ]
    );

    return (
        <DateRangeContext.Provider value={value}>
            {children}
        </DateRangeContext.Provider>
    );
}

export function useDateRange() {
    const context = useContext(DateRangeContext);
    if (!context) {
        throw new Error("useDateRange must be used inside DateRangeProvider");
    }
    return context;
}
