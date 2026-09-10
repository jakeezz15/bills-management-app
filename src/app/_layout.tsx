import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BillsProvider } from "@/app/contexts/BillsContext";
import { DateRangeProvider } from "@/app/contexts/DateRangeContext";
import { DebtsProvider } from "@/app/contexts/DebtsContext";
import { ExpensesProvider } from "@/app/contexts/ExpensesContext";
import { IncomeProvider } from "@/app/contexts/IncomeContext";
import { LocaleProvider } from "@/app/contexts/LocaleContext";
import { SavingsProvider } from "@/app/contexts/SavingsContext";
import { NotificationTapHandler } from "@/components/NotificationTapHandler";
import { ReminderSync } from "@/components/ReminderSync";

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            {/* Explicit provider: required for static web rendering, and it
                guarantees insets resolve rather than silently reading zero. */}
            <SafeAreaProvider>
                <LocaleProvider>
                    <DateRangeProvider>
                        <IncomeProvider>
                            <SavingsProvider>
                                <DebtsProvider>
                                    <BillsProvider>
                                        <ExpensesProvider>
                                            <ReminderSync />
                                            <NotificationTapHandler />
                                            <Stack
                                                screenOptions={{
                                                    headerShown: false,
                                                }}
                                            >
                                                <Stack.Screen name="(tabs)" />
                                                <Stack.Screen
                                                    name="debt/[id]"
                                                    options={{
                                                        animation:
                                                            "slide_from_right",
                                                    }}
                                                />
                                                <Stack.Screen
                                                    name="bill/[id]"
                                                    options={{
                                                        animation:
                                                            "slide_from_right",
                                                    }}
                                                />
                                                <Stack.Screen
                                                    name="expense/[id]"
                                                    options={{
                                                        animation:
                                                            "slide_from_right",
                                                    }}
                                                />
                                                <Stack.Screen
                                                    name="paycheck/[id]"
                                                    options={{
                                                        animation:
                                                            "slide_from_right",
                                                    }}
                                                />
                                                <Stack.Screen
                                                    name="goal/[id]"
                                                    options={{
                                                        animation:
                                                            "slide_from_right",
                                                    }}
                                                />
                                            </Stack>
                                        </ExpensesProvider>
                                    </BillsProvider>
                                </DebtsProvider>
                            </SavingsProvider>
                        </IncomeProvider>
                    </DateRangeProvider>
                </LocaleProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
