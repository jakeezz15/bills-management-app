import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { BillsProvider } from "../contexts/BillsContext";
import { DebtsProvider } from "../contexts/DebtsContext";
import { ExpensesProvider } from "../contexts/ExpensesContext";
import { SavingsProvider } from "../contexts/SavingsContext";

export default function TabLayout() {
    return (
        <SavingsProvider>
            <DebtsProvider>
                <BillsProvider>
                    <ExpensesProvider>
                        <Tabs screenOptions={{ tabBarActiveTintColor: "#208AEF" }}>
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
                                name="expenses"
                                options={{
                                    title: "Expenses",
                                    tabBarIcon: ({ color, size }) => (
                                        <Ionicons
                                            name="receipt-outline"
                                            size={size}
                                            color={color}
                                        />
                                    ),
                                }}
                            />

                            <Tabs.Screen
                                name="bills"
                                options={{
                                    title: "Bills",
                                    tabBarIcon: ({ color, size }) => (
                                        <Ionicons
                                            name="calendar-outline"
                                            size={size}
                                            color={color}
                                        />
                                    ),
                                }}
                            />

                            <Tabs.Screen
                                name="savings"
                                options={{
                                    title: "Savings",
                                    tabBarIcon: ({ color, size }) => (
                                        <Ionicons
                                            name="cash-outline"
                                            size={size}
                                            color={color}
                                        />
                                    ),
                                }}
                            />

                            <Tabs.Screen
                                name="debts"
                                options={{
                                    title: "Debts",
                                    tabBarIcon: ({ color, size }) => (
                                        <Ionicons
                                            name="card-outline"
                                            size={size}
                                            color={color}
                                        />
                                    ),
                                }}
                            />
                        </Tabs>
                    </ExpensesProvider>
                </BillsProvider>
            </DebtsProvider>
        </SavingsProvider>
    );
}
