import { SegmentControl } from "@/components/SegmentControl";
import { TabScaffold } from "@/components/ui";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import ExpensesScreen from "./expenses";
import IncomeScreen from "./income";

const SECTIONS = ["Income", "Spending"] as const;
type Section = (typeof SECTIONS)[number];
const STORAGE_KEY = "activitySection";

export default function ActivityScreen() {
    const [section, setSection] = useState<Section>("Income");

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

    return (
        <TabScaffold
            title="Activity"
            subtitle="Record money in and everyday spending"
            segments={
                <SegmentControl
                    options={SECTIONS}
                    selected={section}
                    onSelect={selectSection}
                />
            }
        >
            {section === "Income" ? (
                <IncomeScreen embedded />
            ) : (
                <ExpensesScreen embedded />
            )}
        </TabScaffold>
    );
}
