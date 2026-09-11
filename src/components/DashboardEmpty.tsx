import { dashboard } from "@/styles/dashboard";
import { theme } from "@/design";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ComponentProps } from "react";
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
                <Text
                    style={dashboard.emptyButtonText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                >
                    {actionLabel}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.intent.info.bg,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginBottom: theme.space.md,
    },
});
