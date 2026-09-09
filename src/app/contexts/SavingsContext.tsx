import {
    loadSavings,
    loadSavingsContributions,
    saveSavings,
    saveSavingsContributions,
} from "@/services/storage";
import { SavingsGoal } from "@/types/savings";
import { SavingsContribution } from "@/types/savings-contribution";
import { parseIsoDate, toIsoDate } from "@/utils/date";
import { getLatestSavingsContributionInMonth } from "@/utils/filters";
import { stampCreate, stampUpdate } from "@/utils/timestamps";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

type SavingsContextValue = {
    savings: SavingsGoal[];
    contributions: SavingsContribution[];
    loading: boolean;
    addSavings: (
        saving: Omit<SavingsGoal, "createdAt" | "updatedAt">
    ) => Promise<void>;
    updateSavings: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
    deleteSavings: (id: string) => Promise<void>;
    addContribution: (
        savingsId: string,
        amount: number,
        date?: string
    ) => Promise<void>;
    undoContribution: (savingsId: string, asOfIso?: string) => Promise<void>;
    reload: () => Promise<void>;
};

const SavingsContext = createContext<SavingsContextValue | null>(null);

export function SavingsProvider({ children }: { children: React.ReactNode }) {
    const [savings, setSavings] = useState<SavingsGoal[]>([]);
    const [contributions, setContributions] = useState<SavingsContribution[]>(
        []
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([loadSavings(), loadSavingsContributions()])
            .then(([nextSavings, nextContributions]) => {
                setSavings(nextSavings);
                setContributions(nextContributions);
            })
            .finally(() => setLoading(false));
    }, []);

    const addSavings = useCallback(
        async (saving: Omit<SavingsGoal, "createdAt" | "updatedAt">) => {
            const stamped: SavingsGoal = { ...saving, ...stampCreate() };
            const updated = [...savings, stamped];
            setSavings(updated);
            await saveSavings(updated);
        },
        [savings]
    );

    const updateSavings = useCallback(
        async (id: string, updates: Partial<SavingsGoal>) => {
            const updated = savings.map((item) => {
                if (item.id === id) {
                    return { ...item, ...updates, ...stampUpdate() };
                }
                return item;
            });
            setSavings(updated);
            await saveSavings(updated);
        },
        [savings]
    );

    const deleteSavings = useCallback(
        async (id: string) => {
            const updatedSavings = savings.filter((item) => item.id !== id);
            const updatedContributions = contributions.filter(
                (item) => item.savingsId !== id
            );
            setSavings(updatedSavings);
            setContributions(updatedContributions);
            await Promise.all([
                saveSavings(updatedSavings),
                saveSavingsContributions(updatedContributions),
            ]);
        },
        [savings, contributions]
    );

    const addContribution = useCallback(
        async (savingsId: string, amount: number, date?: string) => {
            if (amount <= 0) {
                return;
            }

            const contributionDate = date ?? toIsoDate(new Date());
            const contribution: SavingsContribution = {
                id: `${Date.now()}-${savingsId}`,
                savingsId,
                amount,
                date: contributionDate,
                ...stampCreate(),
            };

            const updatedContributions = [...contributions, contribution];
            const updatedSavings = savings.map((item) => {
                if (item.id !== savingsId) {
                    return item;
                }
                return {
                    ...item,
                    currentAmount: item.currentAmount + amount,
                    ...stampUpdate(),
                };
            });

            setContributions(updatedContributions);
            setSavings(updatedSavings);
            await Promise.all([
                saveSavingsContributions(updatedContributions),
                saveSavings(updatedSavings),
            ]);
        },
        [contributions, savings]
    );

    const undoContribution = useCallback(
        async (savingsId: string, asOfIso?: string) => {
            const asOf = parseIsoDate(asOfIso ?? toIsoDate(new Date()));
            if (!asOf) {
                return;
            }

            const latest = getLatestSavingsContributionInMonth(
                savingsId,
                contributions,
                asOf
            );
            if (!latest) {
                return;
            }

            const updatedContributions = contributions.filter(
                (item) => item.id !== latest.id
            );
            const updatedSavings = savings.map((item) => {
                if (item.id !== savingsId) {
                    return item;
                }
                return {
                    ...item,
                    currentAmount: Math.max(
                        0,
                        Math.round((item.currentAmount - latest.amount) * 100) /
                            100
                    ),
                    ...stampUpdate(),
                };
            });

            setContributions(updatedContributions);
            setSavings(updatedSavings);
            await Promise.all([
                saveSavingsContributions(updatedContributions),
                saveSavings(updatedSavings),
            ]);
        },
        [contributions, savings]
    );

    const reload = useCallback(async () => {
        setLoading(true);
        const [nextSavings, nextContributions] = await Promise.all([
            loadSavings(),
            loadSavingsContributions(),
        ]);
        setSavings(nextSavings);
        setContributions(nextContributions);
        setLoading(false);
    }, []);

    return (
        <SavingsContext.Provider
            value={{
                savings,
                contributions,
                loading,
                addSavings,
                reload,
                updateSavings,
                deleteSavings,
                addContribution,
                undoContribution,
            }}
        >
            {children}
        </SavingsContext.Provider>
    );
}

export function useSavings() {
    const context = useContext(SavingsContext);
    if (!context) {
        throw new Error("useSavings must be used inside SavingsProvider");
    }
    return context;
}
