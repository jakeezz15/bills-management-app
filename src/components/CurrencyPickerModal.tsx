import { text, theme } from "@/design";
import {
    CurrencyCode,
    CurrencyOption,
    currencyLabel,
    formatMoney,
    getCurrencyOptions,
} from "@/utils/money";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CurrencyPickerModalProps = {
    visible: boolean;
    selected: CurrencyCode;
    onSelect: (code: CurrencyCode) => void;
    onClose: () => void;
};

export function CurrencyPickerModal({
    visible,
    selected,
    onSelect,
    onClose,
}: CurrencyPickerModalProps) {
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState("");
    const options = useMemo(() => getCurrencyOptions(), []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) {
            return options;
        }
        return options.filter(
            (option) =>
                option.code.toLowerCase().includes(q) ||
                option.label.toLowerCase().includes(q)
        );
    }, [options, query]);

    const handleClose = () => {
        setQuery("");
        onClose();
    };

    const renderItem = ({ item }: { item: CurrencyOption }) => {
        const isSelected = item.code === selected;
        return (
            <Pressable
                onPress={() => {
                    onSelect(item.code);
                    handleClose();
                }}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.row,
                    isSelected && styles.rowSelected,
                    pressed && styles.rowPressed,
                ]}
            >
                <View style={styles.rowCopy}>
                    <Text style={styles.rowCode}>{item.code}</Text>
                    <Text style={styles.rowLabel} numberOfLines={1}>
                        {item.label}
                    </Text>
                </View>
                <Text style={styles.rowSample}>
                    {formatMoney(1234.5, item.code, { compact: true })}
                </Text>
                {isSelected ? (
                    <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={theme.intent.positive.fg}
                    />
                ) : (
                    <View style={styles.checkSpacer} />
                )}
            </Pressable>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View
                style={[
                    styles.sheet,
                    {
                        paddingTop: Math.max(insets.top, theme.space.md),
                        paddingBottom: Math.max(insets.bottom, theme.space.md),
                    },
                ]}
            >
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.kicker}>Display</Text>
                        <Text style={styles.title}>Currency</Text>
                    </View>
                    <Pressable
                        onPress={handleClose}
                        hitSlop={10}
                        style={styles.closeBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                    >
                        <Ionicons
                            name="close"
                            size={22}
                            color={theme.text.primary}
                        />
                    </Pressable>
                </View>

                <Text style={styles.hint}>
                    Changes how amounts look. Stored numbers stay the same —
                    display only, not conversion. Currently{" "}
                    {currencyLabel(selected)}.
                </Text>

                <View style={styles.searchWrap}>
                    <Ionicons
                        name="search"
                        size={18}
                        color={theme.text.tertiary}
                    />
                    <TextInput
                        style={styles.searchInput}
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search code or name"
                        placeholderTextColor={theme.text.tertiary}
                        autoCorrect={false}
                        autoCapitalize="none"
                        clearButtonMode="while-editing"
                    />
                </View>

                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.code}
                    renderItem={renderItem}
                    keyboardShouldPersistTaps="handled"
                    ItemSeparatorComponent={() => (
                        <View style={styles.separator} />
                    )}
                    ListEmptyComponent={
                        <Text style={styles.empty}>No currencies match.</Text>
                    }
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    sheet: {
        flex: 1,
        backgroundColor: theme.bg.canvas,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: theme.space.screenX,
        marginBottom: theme.space.sm,
    },
    kicker: text.sectionLabel,
    title: {
        color: theme.text.primary,
        fontSize: theme.fontSize.xl,
        lineHeight: theme.lineHeight.xl,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: -0.4,
        marginTop: theme.space.xs,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.bg.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    hint: {
        ...text.caption,
        paddingHorizontal: theme.space.screenX,
        marginBottom: theme.space.md,
    },
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.space.sm,
        marginHorizontal: theme.space.screenX,
        marginBottom: theme.space.md,
        paddingHorizontal: theme.space.md,
        minHeight: theme.size.tap,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.bg.surface,
        borderWidth: 1,
        borderColor: theme.border.subtle,
    },
    searchInput: {
        flex: 1,
        color: theme.text.primary,
        fontSize: theme.fontSize.md,
        paddingVertical: theme.space.sm,
    },
    listContent: {
        paddingHorizontal: theme.space.screenX,
        paddingBottom: theme.space.lg,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.space.sm,
        backgroundColor: theme.bg.surface,
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.md,
        minHeight: theme.size.fab,
    },
    rowSelected: {
        backgroundColor: theme.intent.positive.bg,
    },
    rowPressed: {
        opacity: 0.9,
    },
    rowCopy: {
        flex: 1,
        minWidth: 0,
    },
    rowCode: text.itemTitle,
    rowLabel: {
        ...text.caption,
        marginTop: theme.space.xs,
    },
    rowSample: {
        color: theme.text.tertiary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.semibold,
    },
    checkSpacer: {
        width: 22,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.border.subtle,
    },
    empty: {
        ...text.bodyMuted,
        textAlign: "center",
        marginTop: theme.space.xl,
    },
});
