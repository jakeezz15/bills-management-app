import { useTheme } from "@/app/contexts/ThemeContext";
import { text } from "@/design";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useDashboardStyles } from "@/styles/dashboard";
import { goBackOrReplace } from "@/utils/navigation";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ReactNode, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type SettingsSubpageProps = {
    title: string;
    children: ReactNode;
};

/** Light settings detail chrome: back to hub + title + scroll body. */
export function SettingsSubpage({ title, children }: SettingsSubpageProps) {
    useStatusBarStyle("dark");
    const topPadding = useScreenTopPadding();
    const { theme } = useTheme();
    const dashboard = useDashboardStyles();
    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: theme.space.screenX,
                    paddingBottom: theme.space.xl,
                },
                backRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    gap: theme.space.xs,
                    minHeight: theme.size.tap,
                    marginLeft: -theme.space.xs,
                    marginBottom: theme.space.sm,
                },
                backLabel: {
                    color: theme.text.accent,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                },
                pageTitle: {
                    ...text.display,
                    marginBottom: theme.space.lg,
                    marginLeft: theme.space.xs,
                },
                pressed: {
                    opacity: 0.82,
                },
            }),
        [theme]
    );

    return (
        <View style={dashboard.screen}>
            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: topPadding },
                ]}
            >
                <Pressable
                    onPress={() => goBackOrReplace("/(tabs)/settings")}
                    style={({ pressed }) => [
                        styles.backRow,
                        pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Back to Settings"
                    hitSlop={8}
                >
                    <Ionicons
                        name="chevron-back"
                        size={22}
                        color={theme.text.accent}
                    />
                    <Text style={styles.backLabel}>Settings</Text>
                </Pressable>
                <Text style={styles.pageTitle}>{title}</Text>
                {children}
            </ScrollView>
        </View>
    );
}
