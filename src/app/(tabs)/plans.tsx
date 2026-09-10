import { ChipRow } from "@/components/Chip";
import { dashboard } from "@/styles/dashboard";
import { theme } from "@/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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

    const selectSection = (value: string) => {
        const next = value as Section;
        setSection(next);
        void AsyncStorage.setItem(STORAGE_KEY, next);
    };

    return (
        <View style={dashboard.screen}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <Text style={styles.title}>Plans</Text>
                <Text style={styles.subtitle}>
                    Bills, savings goals, and debts. Unpaid bills do not reduce
                    leftover.
                </Text>
                <ChipRow
                    options={SECTIONS}
                    selected={section}
                    onSelect={selectSection}
                    appearance="light"
                />
            </View>
            <View style={{ flex: 1 }}>
                {section === "Bills" ? (
                    <BillsScreen embedded />
                ) : section === "Savings" ? (
                    <SavingsScreen embedded />
                ) : (
                    <DebtsScreen embedded />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: theme.color.surface,
        paddingHorizontal: theme.space.lg,
        paddingTop: theme.space.screenTop,
        paddingBottom: theme.space.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.color.border,
        gap: theme.space.md,
    },
    title: {
        color: theme.color.ink,
        fontSize: theme.font.display,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.4,
    },
    subtitle: {
        color: theme.color.muted,
        fontSize: theme.font.body,
        lineHeight: 20,
    },
});
