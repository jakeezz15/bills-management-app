import { ChipRow } from "@/components/Chip";
import { Fab } from "@/components/Fab";
import { Hero } from "@/components/Hero";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import { dashboard } from "@/styles/dashboard";
import { isIsoInRange } from "@/utils/date";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useLocale } from "../contexts/LocaleContext";
import ExpensesScreen from "./expenses";
import IncomeScreen from "./income";

const SECTIONS = ["Income", "Spending"] as const;
type Section = (typeof SECTIONS)[number];
const STORAGE_KEY = "activitySection";

export default function ActivityScreen() {
    const { formatMoney } = useLocale();
    const { income } = useIncome();
    const { expenses } = useExpenses();
    const { range, label, shiftPeriod, resetToToday } = useDateRange();
    const [section, setSection] = useState<Section>("Income");
    const [addNonce, setAddNonce] = useState(0);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((value) => {
            if (value === "Income" || value === "Spending") {
                setSection(value);
            }
        });
    }, []);

    const selectSection = (value: string) => {
        const next = value as Section;
        setSection(next);
        void AsyncStorage.setItem(STORAGE_KEY, next);
    };

    const incomeTotal = useMemo(
        () =>
            income
                .filter((item) => isIsoInRange(item.date, range))
                .reduce((sum, item) => sum + item.net, 0),
        [income, range]
    );

    const spendTotal = useMemo(
        () =>
            expenses
                .filter((item) => isIsoInRange(item.date, range))
                .reduce((sum, item) => sum + item.amount, 0),
        [expenses, range]
    );

    const isIncome = section === "Income";
    const heroValue = isIncome
        ? formatMoney(incomeTotal, { sign: "+" })
        : formatMoney(spendTotal, { sign: "−" });

    return (
        <View style={dashboard.screen}>
            <StatusBar style="light" />
            <Hero
                kicker="Activity"
                value={heroValue}
                caption={
                    isIncome
                        ? "Paychecks logged this period"
                        : "Everyday spending this period"
                }
            >
                <View style={{ marginTop: 16 }}>
                    <ChipRow
                        options={SECTIONS}
                        selected={section}
                        onSelect={selectSection}
                        appearance="hero"
                    />
                </View>
                <HeroPeriodNav
                    label={label}
                    onShift={shiftPeriod}
                    onResetToToday={resetToToday}
                />
            </Hero>

            <View style={{ flex: 1 }}>
                {isIncome ? (
                    <IncomeScreen
                        embedded
                        requestAdd={addNonce}
                    />
                ) : (
                    <ExpensesScreen
                        embedded
                        requestAdd={addNonce}
                    />
                )}
            </View>

            <Fab
                onPress={() => setAddNonce((n) => n + 1)}
                accessibilityLabel={
                    isIncome ? "Add paycheck" : "Add spending"
                }
            />
        </View>
    );
}
