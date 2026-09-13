import { SegmentControl } from "@/components/SegmentControl";
import { TabScaffold } from "@/components/ui";
import { useWalkthroughOptional } from "@/components/walkthrough";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import ExpensesScreen from "./expenses";
import IncomeScreen from "./income";

const SECTIONS = ["Income", "Spending"] as const;
type Section = (typeof SECTIONS)[number];
const STORAGE_KEY = "activitySection";

export default function ActivityScreen() {
    useStatusBarStyle("dark");

    const [section, setSection] = useState<Section>("Income");
    const walkthrough = useWalkthroughOptional();
    const activeId = walkthrough?.activeId;

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((value) => {
            if (value === "Income" || value === "Spending") {
                setSection(value);
            }
        });
    }, []);

    const selectSection = (value: Section) => {
        setSection(value);
        void AsyncStorage.setItem(STORAGE_KEY, value);
    };

    const forcedSection: Section | null =
        activeId === "activity-spending"
            ? "Spending"
            : activeId === "activity-income" || activeId === "activity-add"
              ? "Income"
              : null;
    const visibleSection = forcedSection ?? section;

    return (
        <TabScaffold
            title="Activity"
            subtitle="Record money in and everyday spending"
            segments={
                <SegmentControl
                    options={SECTIONS}
                    selected={visibleSection}
                    onSelect={selectSection}
                />
            }
        >
            {visibleSection === "Income" ? (
                <IncomeScreen embedded />
            ) : (
                <ExpensesScreen embedded />
            )}
        </TabScaffold>
    );
}
