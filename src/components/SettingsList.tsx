import { theme } from "@/theme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

type SettingsSectionProps = {
    title: string;
    children: ReactNode;
};

export function SettingsSection({ title, children }: SettingsSectionProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.group}>{children}</View>
        </View>
    );
}

type SettingsRowProps = {
    title: string;
    subtitle?: string;
    icon?: ComponentProps<typeof Ionicons>["name"];
    value?: string;
    destructive?: boolean;
    disabled?: boolean;
    showChevron?: boolean;
    onPress?: () => void;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
};

export function SettingsRow({
    title,
    subtitle,
    icon,
    value,
    destructive = false,
    disabled = false,
    showChevron = false,
    onPress,
    switchValue,
    onSwitchChange,
}: SettingsRowProps) {
    const isSwitch = typeof switchValue === "boolean" && onSwitchChange;

    const content = (
        <>
            {icon ? (
                <View
                    style={[
                        styles.iconWrap,
                        destructive && styles.iconWrapDanger,
                    ]}
                >
                    <Ionicons
                        name={icon}
                        size={18}
                        color={
                            destructive
                                ? theme.color.danger
                                : theme.color.accentText
                        }
                    />
                </View>
            ) : null}

            <View style={styles.copy}>
                <Text
                    style={[
                        styles.rowTitle,
                        destructive && styles.rowTitleDanger,
                        disabled && styles.disabledText,
                    ]}
                    numberOfLines={1}
                >
                    {title}
                </Text>
                {subtitle ? (
                    <Text
                        style={[styles.rowSubtitle, disabled && styles.disabledText]}
                        numberOfLines={3}
                    >
                        {subtitle}
                    </Text>
                ) : null}
            </View>

            {value ? (
                <Text style={[styles.rowValue, disabled && styles.disabledText]}>
                    {value}
                </Text>
            ) : null}

            {isSwitch ? (
                <Switch
                    value={switchValue}
                    disabled={disabled}
                    onValueChange={onSwitchChange}
                    trackColor={{
                        false: theme.color.faint,
                        true: "#93C5FD",
                    }}
                    thumbColor={
                        switchValue ? theme.color.primary : theme.color.surface
                    }
                />
            ) : null}

            {showChevron && !isSwitch ? (
                <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.color.soft}
                />
            ) : null}
        </>
    );

    if (isSwitch) {
        return <View style={[styles.row, disabled && styles.rowDisabled]}>{content}</View>;
    }

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || !onPress}
            style={({ pressed }) => [
                styles.row,
                disabled && styles.rowDisabled,
                pressed && onPress && styles.rowPressed,
            ]}
        >
            {content}
        </Pressable>
    );
}

export function SettingsDivider() {
    return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
    section: {
        marginBottom: theme.space.xl,
    },
    sectionTitle: {
        color: theme.color.muted,
        fontSize: 12,
        fontWeight: theme.font.weight.semibold,
        letterSpacing: 0.4,
        marginBottom: theme.space.sm,
        marginLeft: theme.space.md,
        textTransform: "uppercase",
    },
    group: {
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.lg,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.border,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 56,
        paddingHorizontal: theme.space.lg,
        paddingVertical: 12,
        gap: theme.space.md,
    },
    rowPressed: {
        backgroundColor: theme.color.surfaceMuted,
    },
    rowDisabled: {
        opacity: 0.55,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: theme.color.accentSoft,
        alignItems: "center",
        justifyContent: "center",
    },
    iconWrapDanger: {
        backgroundColor: theme.color.dangerSoft,
    },
    copy: {
        flex: 1,
        minWidth: 0,
    },
    rowTitle: {
        color: theme.color.ink,
        fontSize: 16,
        fontWeight: theme.font.weight.semibold,
    },
    rowTitleDanger: {
        color: theme.color.danger,
    },
    rowSubtitle: {
        color: theme.color.muted,
        fontSize: 13,
        lineHeight: 17,
        marginTop: 2,
    },
    rowValue: {
        color: theme.color.muted,
        fontSize: 14,
        fontWeight: theme.font.weight.semibold,
        marginRight: 2,
    },
    disabledText: {
        color: theme.color.soft,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.color.border,
        marginLeft: 60,
    },
});
