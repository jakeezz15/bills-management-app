import { useTheme } from "@/app/contexts/ThemeContext";
import { elevation, text } from "@/design";
import { confirmDestructive } from "@/utils/confirm";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ReactNode, useMemo } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type FormDialogProps = {
    visible: boolean;
    onClose: () => void;
    kicker: string;
    title: string;
    saveLabel: string;
    onSave: () => void;
    children: ReactNode;
    deleteLabel?: string;
    deleteMessage?: string;
    onDelete?: () => void;
};

export function FormDialog({
    visible,
    onClose,
    kicker,
    title,
    saveLabel,
    onSave,
    children,
    deleteLabel,
    deleteMessage,
    onDelete,
}: FormDialogProps) {
    const { theme } = useTheme();
    const styles = useMemo(
        () =>
            StyleSheet.create({
                overlay: {
                    flex: 1,
                    justifyContent: "center",
                    padding: theme.space.md,
                    backgroundColor: theme.overlay,
                },
                card: {
                    backgroundColor: theme.bg.surface,
                    borderRadius: theme.radius.lg,
                    maxHeight: "88%",
                    overflow: "hidden",
                    width: "100%",
                    flexShrink: 1,
                    maxWidth: 440,
                    alignSelf: "center",
                    ...elevation.dialog,
                },
                header: {
                    backgroundColor: theme.bg.inverse,
                    paddingHorizontal: theme.space.md,
                    paddingVertical: theme.space.md,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: theme.space.md,
                },
                kicker: {
                    ...text.kicker,
                    marginBottom: theme.space.xs,
                },
                title: text.dialogTitle,
                close: {
                    width: theme.size.control,
                    height: theme.size.control,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.action.onInverse.bg,
                    alignItems: "center",
                    justifyContent: "center",
                },
                closePressed: {
                    opacity: 0.7,
                },
                body: {
                    paddingHorizontal: theme.space.md,
                    paddingTop: theme.space.md,
                    paddingBottom: theme.space.lg,
                },
                footer: {
                    flexDirection: "row",
                    gap: theme.space.sm,
                    paddingHorizontal: theme.space.md,
                    paddingTop: theme.space.sm,
                    paddingBottom: theme.space.md,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.border.subtle,
                    backgroundColor: theme.bg.surface,
                },
                ghost: {
                    flex: 1,
                    minHeight: theme.size.tap,
                    borderRadius: theme.radius.sm,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.action.secondary.bg,
                },
                ghostText: {
                    color: theme.action.secondary.fg,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                },
                primary: {
                    flex: 1.3,
                    minHeight: theme.size.tap,
                    borderRadius: theme.radius.sm,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.action.primary.bg,
                },
                primaryText: text.button,
                deleteRow: {
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: theme.size.tap,
                    marginTop: theme.space.sm,
                },
                deleteText: {
                    color: theme.intent.negative.fg,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                },
            }),
        [theme]
    );

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView style={styles.overlay} behavior="padding">
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.kicker}>{kicker}</Text>
                            <Text style={styles.title} accessibilityRole="header">
                                {title}
                            </Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [
                                styles.close,
                                pressed && styles.closePressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            hitSlop={8}
                        >
                            <Ionicons
                                name="close"
                                size={20}
                                color={theme.text.inverse}
                            />
                        </Pressable>
                    </View>

                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        style={{ flexShrink: 1 }}
                        contentContainerStyle={styles.body}
                    >
                        {children}

                        {onDelete && deleteLabel ? (
                            <Pressable
                                onPress={() =>
                                    confirmDestructive(
                                        deleteLabel.endsWith("?")
                                            ? deleteLabel
                                            : `${deleteLabel}?`,
                                        deleteMessage ??
                                            "This cannot be undone.",
                                        onDelete
                                    )
                                }
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.deleteRow,
                                    pressed && { opacity: 0.7 },
                                ]}
                            >
                                <Text style={styles.deleteText}>
                                    {deleteLabel.replace(/\?$/, "")}
                                </Text>
                            </Pressable>
                        ) : null}
                    </ScrollView>

                    <View style={styles.footer}>
                        <Pressable
                            onPress={onClose}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                                styles.ghost,
                                pressed && { opacity: 0.7 },
                            ]}
                        >
                            <Text style={styles.ghostText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={onSave}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                                styles.primary,
                                pressed && { opacity: 0.9 },
                            ]}
                        >
                            <Text style={styles.primaryText}>{saveLabel}</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
