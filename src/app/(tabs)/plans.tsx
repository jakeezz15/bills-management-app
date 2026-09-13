import { SegmentControl } from "@/components/SegmentControl";
import { TabScaffold } from "@/components/ui";
import { useWalkthroughOptional } from "@/components/walkthrough";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import BillsScreen from "./bills";
import DebtsScreen from "./debts";
import SavingsScreen from "./savings";

const SECTIONS = ["Bills", "Savings", "Debts"] as const;
type Section = (typeof SECTIONS)[number];
const STORAGE_KEY = "plansSection";

export default function PlansScreen() {
    useStatusBarStyle("dark");

    const [section, setSection] = useState<Section>("Bills");
    const walkthrough = useWalkthroughOptional();
    const activeId = walkthrough?.activeId;

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((value) => {
            if (value === "Bills" || value === "Savings" || value === "Debts") {
                setSection(value);
            }
        });
    }, []);

    const selectSection = (value: Section) => {
        setSection(value);
        void AsyncStorage.setItem(STORAGE_KEY, value);
    };

    const forcedSection: Section | null =
        activeId === "plans-bills"
            ? "Bills"
            : activeId === "plans-savings"
              ? "Savings"
              : activeId === "plans-debts"
                ? "Debts"
                : null;
    const visibleSection = forcedSection ?? section;

    return (
        <TabScaffold
            title="Plans"
            subtitle="Bills, goals, and installment plans"
            segments={
                <SegmentControl
                    options={SECTIONS}
                    selected={visibleSection}
                    onSelect={selectSection}
                />
            }
        >
            {visibleSection === "Bills" ? (
                <BillsScreen embedded />
            ) : visibleSection === "Savings" ? (
                <SavingsScreen embedded />
            ) : (
                <DebtsScreen embedded />
            )}
        </TabScaffold>
    );
}
