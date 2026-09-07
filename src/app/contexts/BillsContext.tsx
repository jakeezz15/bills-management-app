import { loadBills, saveBills } from "@/services/storage";
import { Bill } from "@/types/bill";
import { stampCreate, stampUpdate } from "@/utils/timestamps";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type BillsContextValue = {
    bills: Bill[];
    loading: boolean;
    addBill: (bill: Omit<Bill, "createdAt" | "updatedAt">) => Promise<void>;
    updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;
    deleteBill: (id: string) => Promise<void>;
    reload: () => Promise<void>;
};

const BillsContext = createContext<BillsContextValue | null>(null);

export function BillsProvider({ children }: { children: React.ReactNode }) {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBills().then(setBills).finally(() => setLoading(false));
    }, []);

    const addBill = useCallback(async (bill: Omit<Bill, "createdAt" | "updatedAt">) => {
        const stamped: Bill = { ...bill, ...stampCreate() };
        const updated = [...bills, stamped];
        setBills(updated);
        await saveBills(updated);
    }, [bills]);

    const updateBill = useCallback(async (id: string, updates: Partial<Bill>) => {
        const updated = bills.map((bill) => {
            if (bill.id === id) {
                return { ...bill, ...updates, ...stampUpdate() };
            }
            return bill;
        });
        setBills(updated);
        await saveBills(updated);
    }, [bills]);

    const deleteBill = useCallback(async (id: string) => {
        const updated = bills.filter((bill) => bill.id !== id);
        setBills(updated);
        await saveBills(updated);
    }, [bills]);

    const reload = useCallback(async () => {
        setLoading(true);
        const data = await loadBills();
        setBills(data);
        setLoading(false);
    }, []);

    return (
        <BillsContext.Provider
            value={{ bills, loading, addBill, updateBill, deleteBill, reload }}
        >
            {children}
        </BillsContext.Provider>
    );
}

export function useBills() {
    const context = useContext(BillsContext);
    if (!context) {
        throw new Error("useBills must be used inside BillsProvider");
    }
    return context;
}
