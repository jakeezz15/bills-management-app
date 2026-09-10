import {
    loadDebtPayments,
    loadDebts,
    saveDebtPayments,
    saveDebts,
} from "@/services/storage";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { isSameCalendarMonth, parseIsoDate, toIsoDate } from "@/utils/date";
import { isDebtInstallmentPaidAsOf } from "@/utils/filters";
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
    /** Undo the latest installment payment for the as-of month (restores balance). */
    undoPayment: (id: string, paymentDate?: string) => Promise<void>;
    /** Undo one ledger row by id (restores remaining). */
    undoPaymentById: (paymentId: string) => Promise<void>;
    reload: () => Promise<void>;
};

const DebtsContext = createContext<DebtsContextValue | null>(null);

function roundCents(value: number): number {
    return Math.round(value * 100) / 100;
}

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

function restorePayment(
    debts: Debt[],
    payments: DebtPayment[],
    payment: DebtPayment
): { debts: Debt[]; payments: DebtPayment[] } {
    const updatedPayments = payments.filter((item) => item.id !== payment.id);
    const updatedDebts = debts.map((item) => {
        if (item.id !== payment.debtId) {
            return item;
        }
        const nextBalance = roundCents(item.balance + payment.amount);
        return {
            ...item,
            balance: nextBalance,
            paidOffDate: nextBalance <= 0 ? item.paidOffDate : undefined,
            ...stampUpdate(),
        };
    });
    return { debts: updatedDebts, payments: updatedPayments };
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
            const asOf = parseIsoDate(paidOn);
            const debt = debts.find((item) => item.id === id);
            if (!debt || debt.balance <= 0 || !asOf) {
                return;
            }

            // One installment per month — prevents double-taps from stacking payments.
            if (isDebtInstallmentPaidAsOf(debt, asOf, payments)) {
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

            const nextBalance = roundCents(debt.balance - paymentAmount);

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

    const undoPayment = useCallback(
        async (id: string, paymentDate?: string) => {
            const asOfIso = paymentDate ?? toIsoDate(new Date());
            const asOf = parseIsoDate(asOfIso);
            const debt = debts.find((item) => item.id === id);
            if (!debt || !asOf) {
                return;
            }

            const monthPayments = payments
                .filter((payment) => {
                    if (payment.debtId !== id) {
                        return false;
                    }
                    const paidOn = parseIsoDate(payment.date);
                    if (!paidOn) {
                        return false;
                    }
                    return isSameCalendarMonth(paidOn, asOf);
                })
                .sort((a, b) => b.date.localeCompare(a.date));

            const latest = monthPayments[0];
            if (!latest) {
                return;
            }

            const next = restorePayment(debts, payments, latest);
            setPayments(next.payments);
            setDebts(next.debts);
            await Promise.all([
                saveDebtPayments(next.payments),
                saveDebts(next.debts),
            ]);
        },
        [debts, payments]
    );

    const undoPaymentById = useCallback(
        async (paymentId: string) => {
            const payment = payments.find((item) => item.id === paymentId);
            if (!payment) {
                return;
            }
            if (!debts.some((item) => item.id === payment.debtId)) {
                return;
            }

            const next = restorePayment(debts, payments, payment);
            setPayments(next.payments);
            setDebts(next.debts);
            await Promise.all([
                saveDebtPayments(next.payments),
                saveDebts(next.debts),
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
                undoPayment,
                undoPaymentById,
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
