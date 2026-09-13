import { useTheme } from "@/app/contexts/ThemeContext";
import { useFormStyles } from "@/styles/form";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SelectMenuProps<T extends string> = {
    options: readonly T[];
    value: T | null;
    onChange: (value: T | null) => void;
    title: string;
    placeholder?: string;
    noneLabel?: string | null;
    accessibilityLabel?: string;
    disabled?: boolean;
};

/**
 * Compact one-line control that opens a short option sheet.
 */
export function SelectMenu<T extends string>({
    options,
    value,
    onChange,
    title,
    placeholder = "Select",
    noneLabel = null,
    accessibilityLabel,
    disabled = false,
}: SelectMenuProps<T>) {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const form = useFormStyles();
    const [open, setOpen] = useState(false);
    const styles = useMemo(() => createSelectStyles(theme, form), [theme, form]);

    const display = value ?? placeholder;
    const isPlaceholder = value === null;

    const close = () => setOpen(false);

    const pick = (next: T | null) => {
        onChange(next);
        close();
    };

    return (
        <>
            <Pressable
                disabled={disabled}
                onPress={() => setOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel ?? title}
                accessibilityHint="Opens a menu"
                accessibilityState={{ expanded: open, disabled }}
                style={({ pressed }) => [
                    styles.trigger,
                    disabled && styles.triggerDisabled,
                    pressed && !disabled && styles.triggerPressed,
                ]}
            >
                <Text
                    style={[
                        styles.triggerText,
                        isPlaceholder && styles.triggerPlaceholder,
                        disabled && styles.triggerTextDisabled,
                    ]}
                    numberOfLines={1}
                >
                    {display}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={18}
                    color={
                        disabled ? theme.text.disabled : theme.text.tertiary
                    }
                />
            </Pressable>

            <Modal
                visible={open}
                animationType="fade"
                transparent
                onRequestClose={close}
            >
                <View style={styles.overlay}>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={close}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss"
                    />
                    <View
                        style={[
                            styles.sheet,
                            {
                                paddingBottom: Math.max(
                                    insets.bottom,
                                    theme.space.md
                                ),
                            },
                        ]}
                    >
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>{title}</Text>
                            <Pressable
                                onPress={close}
                                hitSlop={10}
                                style={styles.closeBtn}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                            >
                                <Ionicons
                                    name="close"
                                    size={20}
                                    color={theme.text.primary}
                                />
                            </Pressable>
                        </View>

                        <ScrollView
                            bounces={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {noneLabel ? (
                                <OptionRow
                                    label={noneLabel}
                                    selected={value === null}
                                    onPress={() => pick(null)}
                                    styles={styles}
                                    checkColor={theme.intent.positive.fg}
                                />
                            ) : null}
                            {options.map((option) => (
                                <OptionRow
                                    key={option}
                                    label={option}
                                    selected={option === value}
                                    onPress={() => pick(option)}
                                    styles={styles}
                                    checkColor={theme.intent.positive.fg}
                                />
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
}

type OptionRowProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
    styles: ReturnType<typeof createSelectStyles>;
    checkColor: string;
};

function OptionRow({
    label,
    selected,
    onPress,
    styles,
    checkColor,
}: OptionRowProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                pressed && styles.rowPressed,
            ]}
        >
            <Text
                style={[styles.rowText, selected && styles.rowTextSelected]}
                numberOfLines={1}
            >
                {label}
            </Text>
            {selected ? (
                <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={checkColor}
                />
            ) : (
                <View style={styles.checkSpacer} />
            )}
        </Pressable>
    );
}

function createSelectStyles(
    theme: ReturnType<typeof useTheme>["theme"],
    form: ReturnType<typeof useFormStyles>
) {
    return StyleSheet.create({
        trigger: {
            ...form.input,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.space.sm,
        },
        triggerPressed: {
            opacity: 0.85,
        },
        triggerDisabled: {
            opacity: 0.55,
            backgroundColor: theme.bg.sunken,
        },
        triggerText: {
            flex: 1,
            color: theme.text.primary,
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
        },
        triggerPlaceholder: {
            color: theme.text.tertiary,
            fontWeight: theme.fontWeight.regular,
        },
        triggerTextDisabled: {
            color: theme.text.disabled,
        },
        overlay: {
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: theme.overlay,
        },
        sheet: {
            backgroundColor: theme.bg.canvas,
            borderTopLeftRadius: theme.radius.lg,
            borderTopRightRadius: theme.radius.lg,
            maxHeight: "70%",
            paddingTop: theme.space.md,
        },
        sheetHeader: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: theme.space.screenX,
            marginBottom: theme.space.sm,
            gap: theme.space.sm,
        },
        sheetTitle: {
            flex: 1,
            color: theme.text.primary,
            fontSize: theme.fontSize.lg,
            lineHeight: theme.lineHeight.lg,
            fontWeight: theme.fontWeight.bold,
            letterSpacing: -0.3,
        },
        closeBtn: {
            width: 36,
            height: 36,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.bg.surface,
            alignItems: "center",
            justifyContent: "center",
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: theme.space.sm,
            marginHorizontal: theme.space.screenX,
            marginBottom: theme.space.xs,
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.md,
            minHeight: theme.size.tap,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.bg.surface,
            borderWidth: 1,
            borderColor: theme.border.subtle,
        },
        rowSelected: {
            borderColor: theme.border.focus,
            backgroundColor: theme.intent.info.bg,
        },
        rowPressed: {
            opacity: 0.88,
        },
        rowText: {
            flex: 1,
            color: theme.text.primary,
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.regular,
        },
        rowTextSelected: {
            color: theme.text.accent,
            fontWeight: theme.fontWeight.semibold,
        },
        checkSpacer: {
            width: 22,
        },
    });
}
