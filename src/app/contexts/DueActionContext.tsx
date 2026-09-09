import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import BillForm from "@/components/BillForm";
import DebtForm from "@/components/DebtForm";
import { todayIsoDate } from "@/utils/date";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

export type DueAction = { kind: "bill" | "debt"; id: string };

type DueActionContextValue = {
    openDueItem: (action: DueAction) => void;
    closeDueItem: () => void;
};

const DueActionContext = createContext<DueActionContextValue | null>(null);

export function DueActionProvider({ children }: { children: React.ReactNode }) {
    const [action, setAction] = useState<DueAction | null>(null);

    const openDueItem = useCallback((next: DueAction) => {
        setAction(next);
    }, []);

    const closeDueItem = useCallback(() => {
        setAction(null);
    }, []);

    const value = useMemo(
        () => ({ openDueItem, closeDueItem }),
        [openDueItem, closeDueItem]
    );

    return (
        <DueActionContext.Provider value={value}>
            {children}
            <DueActionHost action={action} onClose={closeDueItem} />
        </DueActionContext.Provider>
    );
}

export function useDueAction() {
    const context = useContext(DueActionContext);
    if (!context) {
        throw new Error("useDueAction must be used inside DueActionProvider");
    }
    return context;
}

function DueActionHost({
    action,
    onClose,
}: {
    action: DueAction | null;
    onClose: () => void;
}) {
    const { bills, loading: billsLoading } = useBills();
    const { debts, loading: debtsLoading } = useDebt();
    const todayIso = todayIsoDate();

    const bill =
        action?.kind === "bill"
            ? bills.find((item) => item.id === action.id)
            : undefined;
    const debt =
        action?.kind === "debt"
            ? debts.find((item) => item.id === action.id)
            : undefined;

    useEffect(() => {
        if (!action) {
            return;
        }
        if (
            action.kind === "bill" &&
            !billsLoading &&
            !bills.some((item) => item.id === action.id)
        ) {
            onClose();
        }
        if (
            action.kind === "debt" &&
            !debtsLoading &&
            !debts.some((item) => item.id === action.id)
        ) {
            onClose();
        }
    }, [action, bills, debts, billsLoading, debtsLoading, onClose]);

    return (
        <>
            <BillForm
                visible={action?.kind === "bill" && Boolean(bill)}
                onClose={onClose}
                bill={bill}
                asOfIso={todayIso}
            />
            <DebtForm
                visible={action?.kind === "debt" && Boolean(debt)}
                onClose={onClose}
                debt={debt}
                paymentDate={todayIso}
            />
        </>
    );
}
