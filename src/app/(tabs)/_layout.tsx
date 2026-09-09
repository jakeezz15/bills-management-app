import { theme } from "@/theme";
import { ReminderSync } from "@/components/ReminderSync";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { BillsProvider } from "../contexts/BillsContext";
import { DateRangeProvider } from "../contexts/DateRangeContext";
import { DebtsProvider } from "../contexts/DebtsContext";
import { ExpensesProvider } from "../contexts/ExpensesContext";
import { IncomeProvider } from "../contexts/IncomeContext";
import { LocaleProvider } from "../contexts/LocaleContext";
import { SavingsProvider } from "../contexts/SavingsContext";

export default function TabLayout() {
    return (
        <LocaleProvider>
            <DateRangeProvider>
                <IncomeProvider>
                    <SavingsProvider>
                        <DebtsProvider>
                            <BillsProvider>
                                <ExpensesProvider>
                                    <ReminderSync />
                                    <Tabs
                                        screenOptions={{
                                            tabBarActiveTintColor: theme.color.ink,
                                            tabBarInactiveTintColor: theme.color.soft,
                                            headerShown: false,
                                            tabBarStyle: {
                                                backgroundColor: theme.color.surface,
                                                borderTopColor: theme.color.border,
                                            },
                                            tabBarLabelStyle: {
                                                fontSize: 11,
                                                fontWeight: "600",
                                            },
                                        }}
                                    >
                                    <Tabs.Screen
                                        name="index"
                                        options={{
                                            title: "Home",
                                            tabBarIcon: ({ color, size }) => (
                                                <Ionicons
                                                    name="home-outline"
                                                    size={size}
                                                    color={color}
                                                />
                                            ),
                                        }}
                                    />

                                    <Tabs.Screen
                                        name="activity"
                                        options={{
                                            title: "Activity",
                                            tabBarIcon: ({ color, size }) => (
                                                <Ionicons
                                                    name="swap-vertical-outline"
                                                    size={size}
                                                    color={color}
                                                />
                                            ),
                                        }}
                                    />

                                    <Tabs.Screen
                                        name="plans"
                                        options={{
                                            title: "Plans",
                                            tabBarIcon: ({ color, size }) => (
                                                <Ionicons
                                                    name="albums-outline"
                                                    size={size}
                                                    color={color}
                                                />
                                            ),
                                        }}
                                    />

                                    <Tabs.Screen
                                        name="settings"
                                        options={{
                                            title: "Settings",
                                            tabBarIcon: ({ color, size }) => (
                                                <Ionicons
                                                    name="settings-outline"
                                                    size={size}
                                                    color={color}
                                                />
                                            ),
                                        }}
                                    />

                                    {/* Kept as routes for deep links; hidden from tab bar */}
                                    <Tabs.Screen
                                        name="income"
                                        options={{ href: null }}
                                    />
                                    <Tabs.Screen
                                        name="expenses"
                                        options={{ href: null }}
                                    />
                                    <Tabs.Screen
                                        name="bills"
                                        options={{ href: null }}
                                    />
                                    <Tabs.Screen
                                        name="savings"
                                        options={{ href: null }}
                                    />
                                    <Tabs.Screen
                                        name="debts"
                                        options={{ href: null }}
                                    />
                                </Tabs>
                            </ExpensesProvider>
                        </BillsProvider>
                    </DebtsProvider>
                </SavingsProvider>
            </IncomeProvider>
        </DateRangeProvider>
        </LocaleProvider>
    );
}
