import {
    loadDebtPayments,
    loadDebts,
    saveDebtPayments,
    saveDebts,
} from "@/services/storage";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { toIsoDate } from "@/utils/date";
import { stampCreate, stampUpdate } from "@/utils/timestamps";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

type DebtsContextValue = {
    debts: Debt[];
    payments: DebtPayment[];
    loading: boolean;
    addDebt: (debt: Omit<Debt, "createdAt" | "updatedAt">) => Promise<void>;
    updateDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
    deleteDebt: (id: string) => Promise<void>;
    recordPayment: (
        id: string,
        amount?: number,
        paymentDate?: string
    ) => Promise<void>;
    reload: () => Promise<void>;
};

const DebtsContext = createContext<DebtsContextValue | null>(null);

function withPaidOffState(
    debt: Debt,
    nextBalance: number,
    paymentDate: string
): Partial<Debt> {
    if (nextBalance <= 0) {
        return {
            balance: 0,
            paidOffDate: debt.paidOffDate ?? paymentDate,
        };
    }

    return {
        balance: nextBalance,
        paidOffDate: undefined,
    };
}

export function DebtsProvider({ children }: { children: React.ReactNode }) {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [payments, setPayments] = useState<DebtPayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([loadDebts(), loadDebtPayments()])
            .then(([nextDebts, nextPayments]) => {
                setDebts(nextDebts);
                setPayments(nextPayments);
            })
            .finally(() => setLoading(false));
    }, []);

    const addDebt = useCallback(
        async (debt: Omit<Debt, "createdAt" | "updatedAt">) => {
            const stamped: Debt = {
                ...debt,
                ...stampCreate(),
                startDate: debt.startDate || toIsoDate(new Date()),
            };
            const updated = [...debts, stamped];
            setDebts(updated);
            await saveDebts(updated);
        },
        [debts]
    );

    const updateDebt = useCallback(
        async (id: string, updates: Partial<Debt>) => {
            const updated = debts.map((debt) => {
                if (debt.id !== id) {
                    return debt;
                }

                const merged = { ...debt, ...updates, ...stampUpdate() };
                if (typeof updates.balance === "number") {
                    const paymentDate = toIsoDate(new Date());
                    return {
                        ...merged,
                        ...withPaidOffState(
                            merged,
                            updates.balance,
                            paymentDate
                        ),
                    };
                }
                return merged;
            });
            setDebts(updated);
            await saveDebts(updated);
        },
        [debts]
    );

    const deleteDebt = useCallback(
        async (id: string) => {
            const updatedDebts = debts.filter((debt) => debt.id !== id);
            const updatedPayments = payments.filter(
                (payment) => payment.debtId !== id
            );
            setDebts(updatedDebts);
            setPayments(updatedPayments);
            await Promise.all([
                saveDebts(updatedDebts),
                saveDebtPayments(updatedPayments),
            ]);
        },
        [debts, payments]
    );

    const recordPayment = useCallback(
        async (id: string, amount?: number, paymentDate?: string) => {
            const paidOn = paymentDate ?? toIsoDate(new Date());
            const debt = debts.find((item) => item.id === id);
            if (!debt || debt.balance <= 0) {
                return;
            }

            const requested = amount ?? debt.minimumPayment;
            const paymentAmount = Math.min(
                Math.max(requested, 0),
                debt.balance
            );
            if (paymentAmount <= 0) {
                return;
            }

            const nextBalance =
                Math.round((debt.balance - paymentAmount) * 100) / 100;

            const payment: DebtPayment = {
                id: `${Date.now()}-${id}`,
                debtId: id,
                amount: paymentAmount,
                date: paidOn,
                ...stampCreate(),
            };

            const updatedPayments = [...payments, payment];
            const updatedDebts = debts.map((item) => {
                if (item.id !== id) {
                    return item;
                }
                return {
                    ...item,
                    ...stampUpdate(),
                    ...withPaidOffState(item, nextBalance, paidOn),
                };
            });

            setPayments(updatedPayments);
            setDebts(updatedDebts);
            await Promise.all([
                saveDebtPayments(updatedPayments),
                saveDebts(updatedDebts),
            ]);
        },
        [debts, payments]
    );

    const reload = useCallback(async () => {
        setLoading(true);
        const [nextDebts, nextPayments] = await Promise.all([
            loadDebts(),
            loadDebtPayments(),
        ]);
        setDebts(nextDebts);
        setPayments(nextPayments);
        setLoading(false);
    }, []);

    return (
        <DebtsContext.Provider
            value={{
                debts,
                payments,
                loading,
                addDebt,
                updateDebt,
                deleteDebt,
                recordPayment,
                reload,
            }}
        >
            {children}
        </DebtsContext.Provider>
    );
}

export function useDebt() {
    const context = useContext(DebtsContext);
    if (!context) {
        throw new Error("useDebt must be used inside DebtsProvider");
    }
    return context;
}
