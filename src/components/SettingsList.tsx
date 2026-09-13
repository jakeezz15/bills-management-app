import { useTheme } from "@/app/contexts/ThemeContext";
import { text } from "@/design";
import { useFormColors } from "@/styles/form";
import Ionicons from "@react-native-vector-icons/ionicons";
import { ComponentProps, ReactNode, useMemo } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

type SettingsSectionProps = {
    title: string;
    children: ReactNode;
};

export function SettingsSection({ title, children }: SettingsSectionProps) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

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
    icon?: IconName;
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
    const { theme } = useTheme();
    const formColors = useFormColors();
    const styles = useMemo(() => createStyles(theme), [theme]);
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
                                ? theme.intent.negative.fg
                                : theme.text.accent
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
                        false: formColors.switchTrackOff,
                        true: formColors.switchTrackOn,
                    }}
                    thumbColor={formColors.switchThumb}
                />
            ) : null}

            {showChevron && !isSwitch ? (
                <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.text.tertiary}
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
            accessibilityRole="button"
            accessibilityLabel={title}
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
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    return <View style={styles.divider} />;
}

type SettingsInsetProps = {
    title: string;
    children: ReactNode;
};

export function SettingsInset({ title, children }: SettingsInsetProps) {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.inset}>
            <Text style={styles.insetTitle}>{title}</Text>
            {children}
        </View>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>["theme"]) {
    return StyleSheet.create({
        section: {
            marginBottom: theme.space.lg,
        },
        sectionTitle: {
            ...text.sectionLabel,
            color: theme.text.accent,
            marginBottom: theme.space.sm,
            marginLeft: theme.space.md,
        },
        group: {
            backgroundColor: theme.bg.surface,
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border.subtle,
            overflow: "hidden",
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            minHeight: 48,
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            gap: theme.space.md,
        },
        rowPressed: {
            backgroundColor: theme.bg.sunken,
        },
        rowDisabled: {
            opacity: 0.55,
        },
        iconWrap: {
            width: theme.size.control,
            height: theme.size.control,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.intent.info.bg,
            alignItems: "center",
            justifyContent: "center",
        },
        iconWrapDanger: {
            backgroundColor: theme.intent.negative.bg,
        },
        copy: {
            flex: 1,
            minWidth: 0,
        },
        rowTitle: {
            color: theme.text.primary,
            fontSize: theme.fontSize.md,
            lineHeight: theme.lineHeight.md,
            fontWeight: theme.fontWeight.semibold,
        },
        rowTitleDanger: {
            color: theme.intent.negative.fg,
        },
        rowSubtitle: {
            ...text.caption,
            marginTop: theme.space.xs,
        },
        rowValue: {
            color: theme.text.secondary,
            fontSize: theme.fontSize.sm,
            lineHeight: theme.lineHeight.sm,
            fontWeight: theme.fontWeight.semibold,
            marginRight: theme.space.xs,
        },
        disabledText: {
            color: theme.text.tertiary,
        },
        divider: {
            height: StyleSheet.hairlineWidth,
            backgroundColor: theme.border.subtle,
            marginLeft: theme.space.md * 2 + theme.size.control,
        },
        inset: {
            paddingHorizontal: theme.space.md,
            paddingBottom: theme.space.md,
            paddingTop: theme.space.xs,
            gap: theme.space.sm,
        },
        insetTitle: {
            ...text.caption,
            fontWeight: theme.fontWeight.semibold,
            color: theme.text.secondary,
        },
    });
}
