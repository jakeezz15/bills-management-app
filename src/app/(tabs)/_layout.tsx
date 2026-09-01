import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";


export default function TabLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: "#208AEF" }}>
            <Tabs.Screen name="index" options={{
                title: "Home",
                tabBarIcon: ({ color, size }) => (<Ionicons name="home-outline" size={size} color={color} />)
            }} />

            <Tabs.Screen name="bills" options={{
                title: "Bills",
                tabBarIcon: ({ color, size }) => (<Ionicons name="receipt-outline" size={size} color={color} />)
            }} />
            <Tabs.Screen name="income" options={{
                title: "Incomes",
                tabBarIcon: ({ color, size }) => (<Ionicons name="cash-outline" size={size} color={color} />)
            }} />
            <Tabs.Screen name="debts" options={{
                title: "Debts",
                tabBarIcon: ({ color, size }) => (<Ionicons name="card-outline" size={size} color={color} />)
            }} />

        </Tabs>
    )
}