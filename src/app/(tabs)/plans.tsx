import { SegmentControl } from "@/components/SegmentControl";
import { TabScaffold } from "@/components/ui";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import BillsScreen from "./bills";
import DebtsScreen from "./debts";
import SavingsScreen from "./savings";

const SECTIONS = ["Bills", "Savings", "Debts"] as const;
type Section = (typeof SECTIONS)[number];
const STORAGE_KEY = "plansSection";

export default function PlansScreen() {
    const [section, setSection] = useState<Section>("Bills");

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

    return (
        <TabScaffold
            title="Plans"
            subtitle="Bills, goals, and installment plans"
            segments={
                <SegmentControl
                    options={SECTIONS}
                    selected={section}
                    onSelect={selectSection}
                />
            }
        >
            {section === "Bills" ? (
                <BillsScreen embedded />
            ) : section === "Savings" ? (
                <SavingsScreen embedded />
            ) : (
                <DebtsScreen embedded />
            )}
        </TabScaffold>
    );
}
