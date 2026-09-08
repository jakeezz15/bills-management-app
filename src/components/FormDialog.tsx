import { modalForm } from "@/styles/modal-form";
import { confirmDestructive } from "@/utils/confirm";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
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
    children: React.ReactNode;
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
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={modalForm.dialogOverlay}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={modalForm.dialogCard}>
                    <View style={modalForm.dialogHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={modalForm.dialogKicker}>{kicker}</Text>
                            <Text style={modalForm.dialogTitle}>{title}</Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            style={modalForm.dialogClose}
                            accessibilityLabel="Close"
                            hitSlop={8}
                        >
                            <Ionicons name="close" size={18} color="#FFFFFF" />
                        </Pressable>
                    </View>

                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={modalForm.dialogBody}
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
                                style={modalForm.dialogDelete}
                            >
                                <Text style={modalForm.destroyText}>
                                    {deleteLabel.replace(/\?$/, "")}
                                </Text>
                            </Pressable>
                        ) : null}
                    </ScrollView>

                    <View style={modalForm.dialogFooter}>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [
                                modalForm.dialogGhost,
                                pressed && { opacity: 0.7 },
                            ]}
                        >
                            <Text style={modalForm.dialogGhostText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={onSave}
                            style={({ pressed }) => [
                                modalForm.dialogPrimary,
                                pressed && { opacity: 0.9 },
                            ]}
                        >
                            <Text style={modalForm.dialogPrimaryText}>
                                {saveLabel}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
