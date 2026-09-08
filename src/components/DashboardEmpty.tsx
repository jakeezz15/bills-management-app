import { dashboard } from "@/styles/dashboard";
import { Pressable, Text, View } from "react-native";

type DashboardEmptyProps = {
    title: string;
    text: string;
    actionLabel: string;
    onAction: () => void;
};

export function DashboardEmpty({
    title,
    text,
    actionLabel,
    onAction,
}: DashboardEmptyProps) {
    return (
        <View style={dashboard.emptyCard}>
            <Text style={dashboard.emptyTitle}>{title}</Text>
            <Text style={dashboard.emptyText}>{text}</Text>
            <Pressable
                onPress={onAction}
                style={({ pressed }) => [
                    dashboard.emptyButton,
                    pressed && { opacity: 0.9 },
                ]}
            >
                <Text style={dashboard.emptyButtonText}>{actionLabel}</Text>
            </Pressable>
        </View>
    );
}
