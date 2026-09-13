import { useTheme } from "@/app/contexts/ThemeContext";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";

export default function TabLayout() {
    const { theme } = useTheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.action.primary.bg,
                tabBarInactiveTintColor: theme.text.tertiary,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.bg.surface,
                    borderTopColor: theme.border.subtle,
                },
                tabBarLabelStyle: {
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.semibold,
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

            <Tabs.Screen name="income" options={{ href: null }} />
            <Tabs.Screen name="expenses" options={{ href: null }} />
            <Tabs.Screen name="bills" options={{ href: null }} />
            <Tabs.Screen name="savings" options={{ href: null }} />
            <Tabs.Screen name="debts" options={{ href: null }} />
        </Tabs>
    );
}
