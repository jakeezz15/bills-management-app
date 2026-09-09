import {
    loadBillPayments,
    loadBills,
    saveBillPayments,
    saveBills,
} from "@/services/storage";
import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { parseIsoDate, toIsoDate } from "@/utils/date";
import { isBillPaidAsOf } from "@/utils/filters";
import { stampCreate, stampUpdate } from "@/utils/timestamps";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

type BillsContextValue = {
    bills: Bill[];
    payments: BillPayment[];
    loading: boolean;
    addBill: (
        bill: Omit<Bill, "createdAt" | "updatedAt">,
        paidAsOfIso?: string
    ) => Promise<void>;
    updateBill: (
        id: string,
        updates: Partial<Bill>,
        paidAsOfIso?: string
    ) => Promise<void>;
    deleteBill: (id: string) => Promise<void>;
    toggleBillPaid: (id: string, asOfIso?: string) => Promise<void>;
    reload: () => Promise<void>;
};

const BillsContext = createContext<BillsContextValue | null>(null);

export function BillsProvider({ children }: { children: React.ReactNode }) {
    const [bills, setBills] = useState<Bill[]>([]);
    const [payments, setPayments] = useState<BillPayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([loadBills(), loadBillPayments()])
            .then(([nextBills, nextPayments]) => {
                setBills(nextBills);
                setPayments(nextPayments);
            })
            .finally(() => setLoading(false));
    }, []);

    const addBill = useCallback(
        async (
            bill: Omit<Bill, "createdAt" | "updatedAt">,
            paidAsOfIso?: string
        ) => {
            const stamped: Bill = { ...bill, ...stampCreate() };
            const updatedBills = [...bills, stamped];
            let updatedPayments = payments;

            if (bill.isPaid) {
                const asOf =
                    parseIsoDate(paidAsOfIso ?? toIsoDate(new Date())) ??
                    new Date();
                const payment: BillPayment = {
                    id: `${Date.now()}-${stamped.id}`,
                    billId: stamped.id,
                    amount: stamped.amount,
                    date: toIsoDate(asOf),
                    ...stampCreate(),
                };
                updatedPayments = [...payments, payment];
            }

            setBills(updatedBills);
            setPayments(updatedPayments);
            await Promise.all([
                saveBills(updatedBills),
                saveBillPayments(updatedPayments),
            ]);
        },
        [bills, payments]
    );

    const updateBill = useCallback(
        async (
            id: string,
            updates: Partial<Bill>,
            paidAsOfIso?: string
        ) => {
            const existing = bills.find((bill) => bill.id === id);
            if (!existing) {
                return;
            }

            let nextPayments = payments;
            if (typeof updates.isPaid === "boolean") {
                const asOf =
                    parseIsoDate(paidAsOfIso ?? toIsoDate(new Date())) ??
                    new Date();
                const currentlyPaid = isBillPaidAsOf(
                    existing,
                    payments,
                    asOf
                );

                if (currentlyPaid && !updates.isPaid) {
                    nextPayments = payments.filter((payment) => {
                        if (payment.billId !== id) {
                            return true;
                        }
                        const paidOn = parseIsoDate(payment.date);
                        if (!paidOn) {
                            return true;
                        }
                        return !(
                            paidOn.getFullYear() === asOf.getFullYear() &&
                            paidOn.getMonth() === asOf.getMonth()
                        );
                    });
                } else if (!currentlyPaid && updates.isPaid) {
                    const payment: BillPayment = {
                        id: `${Date.now()}-${id}`,
                        billId: id,
                        amount: updates.amount ?? existing.amount,
                        date: toIsoDate(asOf),
                        ...stampCreate(),
                    };
                    nextPayments = [...payments, payment];
                }
            }

            const updatedBills = bills.map((bill) => {
                if (bill.id !== id) {
                    return bill;
                }
                return { ...bill, ...updates, ...stampUpdate() };
            });

            setBills(updatedBills);
            setPayments(nextPayments);
            await Promise.all([
                saveBills(updatedBills),
                saveBillPayments(nextPayments),
            ]);
        },
        [bills, payments]
    );

    const deleteBill = useCallback(
        async (id: string) => {
            const updatedBills = bills.filter((bill) => bill.id !== id);
            const updatedPayments = payments.filter((p) => p.billId !== id);
            setBills(updatedBills);
            setPayments(updatedPayments);
            await Promise.all([
                saveBills(updatedBills),
                saveBillPayments(updatedPayments),
            ]);
        },
        [bills, payments]
    );

    const toggleBillPaid = useCallback(
        async (id: string, asOfIso?: string) => {
            const asOf = parseIsoDate(asOfIso ?? toIsoDate(new Date()));
            if (!asOf) {
                return;
            }

            const bill = bills.find((item) => item.id === id);
            if (!bill) {
                return;
            }

            const currentlyPaid = isBillPaidAsOf(bill, payments, asOf);

            let nextPayments: BillPayment[];
            if (currentlyPaid) {
                nextPayments = payments.filter((payment) => {
                    if (payment.billId !== id) {
                        return true;
                    }
                    const paidOn = parseIsoDate(payment.date);
                    if (!paidOn) {
                        return true;
                    }
                    return !(
                        paidOn.getFullYear() === asOf.getFullYear() &&
                        paidOn.getMonth() === asOf.getMonth()
                    );
                });
            } else {
                const payment: BillPayment = {
                    id: `${Date.now()}-${id}`,
                    billId: id,
                    amount: bill.amount,
                    date: toIsoDate(asOf),
                    ...stampCreate(),
                };
                nextPayments = [...payments, payment];
            }

            const nextBills = bills.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          isPaid: !currentlyPaid,
                          ...stampUpdate(),
                      }
                    : item
            );

            setPayments(nextPayments);
            setBills(nextBills);
            await Promise.all([
                saveBillPayments(nextPayments),
                saveBills(nextBills),
            ]);
        },
        [bills, payments]
    );

    const reload = useCallback(async () => {
        setLoading(true);
        const [nextBills, nextPayments] = await Promise.all([
            loadBills(),
            loadBillPayments(),
        ]);
        setBills(nextBills);
        setPayments(nextPayments);
        setLoading(false);
    }, []);

    return (
        <BillsContext.Provider
            value={{
                bills,
                payments,
                loading,
                addBill,
                updateBill,
                deleteBill,
                toggleBillPaid,
                reload,
            }}
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
