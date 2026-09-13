import { CurrencyPickerModal } from "@/components/CurrencyPickerModal";
import {
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { SettingsSubpage } from "@/components/SettingsSubpage";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { theme as spacingTheme } from "@/design";
import type { AccentId } from "@/design";
import { currencyLabel } from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SettingsGeneralScreen() {
    const { currency, setCurrency } = useLocale();
    const { accentId, setAccentId, presets, theme } = useTheme();
    const [currencyOpen, setCurrencyOpen] = useState(false);

    return (
        <SettingsSubpage title="General">
            <SettingsSection title="Display">
                <SettingsRow
                    icon="cash-outline"
                    title="Currency"
                    subtitle={currencyLabel(currency)}
                    value={currency}
                    showChevron
                    onPress={() => setCurrencyOpen(true)}
                />
            </SettingsSection>

            <SettingsSection title="Appearance">
                <View style={styles.accentBlock}>
                    <Text style={styles.accentTitle}>Accent color</Text>
                    <Text style={styles.accentSubtitle}>
                        Buttons, tabs, charts, and highlights. More themes later.
                    </Text>
                    <View style={styles.swatchRow}>
                        {presets.map((preset) => {
                            const selected = preset.id === accentId;
                            return (
                                <Pressable
                                    key={preset.id}
                                    onPress={() => {
                                        void setAccentId(preset.id as AccentId);
                                    }}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    accessibilityLabel={`${preset.label} accent`}
                                    style={({ pressed }) => [
                                        styles.swatchHit,
                                        pressed && styles.swatchPressed,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.swatch,
                                            {
                                                backgroundColor: preset.swatch,
                                                borderColor: selected
                                                    ? theme.text.primary
                                                    : theme.border.subtle,
                                            },
                                        ]}
                                    >
                                        {selected ? (
                                            <Ionicons
                                                name="checkmark"
                                                size={18}
                                                color={theme.action.primary.fg}
                                            />
                                        ) : null}
                                    </View>
                                    <Text
                                        style={[
                                            styles.swatchLabel,
                                            selected && {
                                                color: theme.text.accent,
                                                fontWeight:
                                                    spacingTheme.fontWeight
                                                        .semibold,
                                            },
                                        ]}
                                    >
                                        {preset.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </SettingsSection>

            <CurrencyPickerModal
                visible={currencyOpen}
                selected={currency}
                onClose={() => setCurrencyOpen(false)}
                onSelect={(code) => {
                    void setCurrency(code);
                }}
            />
        </SettingsSubpage>
    );
}

const styles = StyleSheet.create({
    accentBlock: {
        backgroundColor: spacingTheme.bg.surface,
        borderRadius: spacingTheme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: spacingTheme.border.subtle,
        padding: spacingTheme.space.md,
    },
    accentTitle: {
        color: spacingTheme.text.primary,
        fontSize: spacingTheme.fontSize.md,
        fontWeight: spacingTheme.fontWeight.semibold,
    },
    accentSubtitle: {
        color: spacingTheme.text.secondary,
        fontSize: spacingTheme.fontSize.xs,
        lineHeight: spacingTheme.lineHeight.xs,
        marginTop: spacingTheme.space.xs,
        marginBottom: spacingTheme.space.md,
    },
    swatchRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacingTheme.space.md,
    },
    swatchHit: {
        alignItems: "center",
        gap: spacingTheme.space.xs,
        minWidth: 64,
    },
    swatchPressed: {
        opacity: 0.85,
    },
    swatch: {
        width: 40,
        height: 40,
        borderRadius: spacingTheme.radius.pill,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    swatchLabel: {
        color: spacingTheme.text.secondary,
        fontSize: spacingTheme.fontSize.xs,
    },
});
