import { useTheme } from "@/app/contexts/ThemeContext";
import { useDashboardStyles } from "@/styles/dashboard";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ComponentProps, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

type DashboardEmptyProps = {
    title: string;
    text: string;
    actionLabel: string;
    onAction: () => void;
    icon?: IconName;
};

export function DashboardEmpty({
    title,
    text,
    actionLabel,
    onAction,
    icon = "add-circle-outline",
}: DashboardEmptyProps) {
    const { theme } = useTheme();
    const dashboard = useDashboardStyles();
    const styles = useMemo(
        () =>
            StyleSheet.create({
                iconWrap: {
                    alignSelf: "center",
                    marginBottom: theme.space.sm,
                },
            }),
        [theme]
    );

    return (
        <View style={dashboard.emptyCard}>
            <View style={styles.iconWrap} accessibilityElementsHidden>
                <Ionicons
                    name={icon}
                    size={28}
                    color={theme.action.primary.bg}
                />
            </View>
            <Text style={dashboard.emptyTitle}>{title}</Text>
            <Text style={dashboard.emptyText}>{text}</Text>
            <Pressable
                onPress={onAction}
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
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
