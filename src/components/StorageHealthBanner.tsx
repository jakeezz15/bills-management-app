import { text, theme } from "@/design";
import {
    clearStorageHealthIssues,
    getStorageHealthIssues,
    subscribeStorageHealth,
} from "@/services/storage-health";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Shows when AsyncStorage loads dropped corrupt data or a save failed.
 * Dismissible; does not block navigation.
 */
export function StorageHealthBanner() {
    const insets = useSafeAreaInsets();
    const issues = useSyncExternalStore(
        subscribeStorageHealth,
        getStorageHealthIssues,
        getStorageHealthIssues
    );

    if (issues.length === 0) {
        return null;
    }

    const summary =
        issues.length === 1
            ? issues[0].message
            : `${issues.length} storage problems were found. Some data may be incomplete.`;

    return (
        <View
            style={[styles.wrap, { paddingTop: Math.max(insets.top, theme.space.sm) }]}
            accessibilityRole="alert"
        >
            <View style={styles.card}>
                <Ionicons
                    name="warning-outline"
                    size={20}
                    color={theme.intent.caution.fg}
                    style={styles.icon}
                />
                <View style={styles.copy}>
                    <Text style={styles.title}>Storage issue</Text>
                    <Text style={styles.body}>{summary}</Text>
                    <Text style={styles.hint}>
                        Export a backup if you have one, then use Reset if this
                        keeps happening.
                    </Text>
                </View>
                <Pressable
                    onPress={clearStorageHealthIssues}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss storage warning"
                    hitSlop={8}
                    style={({ pressed }) => [
                        styles.dismiss,
                        pressed && { opacity: 0.7 },
                    ]}
                >
                    <Ionicons
                        name="close"
                        size={20}
                        color={theme.text.secondary}
                    />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        backgroundColor: theme.bg.canvas,
        paddingHorizontal: theme.space.screenX,
        paddingBottom: theme.space.sm,
        zIndex: 20,
    },
    card: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: theme.space.sm,
        backgroundColor: theme.intent.caution.bg,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.intent.caution.solid,
        padding: theme.space.md,
    },
    icon: {
        marginTop: 2,
    },
    copy: {
        flex: 1,
        minWidth: 0,
        gap: theme.space.xs,
    },
    title: {
        color: theme.intent.caution.fg,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.sm,
        fontWeight: theme.fontWeight.bold,
    },
    body: {
        ...text.bodyMuted,
        color: theme.text.primary,
    },
    hint: {
        ...text.caption,
    },
    dismiss: {
        minWidth: theme.size.control,
        minHeight: theme.size.control,
        alignItems: "center",
        justifyContent: "center",
    },
});
