import { theme } from "@/theme";
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
                        color={theme.color.successText}
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
                        paddingTop: Math.max(insets.top, 12),
                        paddingBottom: Math.max(insets.bottom, 12),
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
                        accessibilityLabel="Close"
                    >
                        <Ionicons
                            name="close"
                            size={22}
                            color={theme.color.ink}
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
                        color={theme.color.soft}
                    />
                    <TextInput
                        style={styles.searchInput}
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search code or name"
                        placeholderTextColor={theme.color.soft}
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
        backgroundColor: theme.color.canvas,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: theme.space.screenX,
        marginBottom: theme.space.sm,
    },
    kicker: {
        color: theme.color.muted,
        fontSize: 12,
        fontWeight: theme.font.weight.bold,
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    title: {
        color: theme.color.ink,
        fontSize: 28,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.4,
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.color.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    hint: {
        color: theme.color.muted,
        fontSize: 13,
        lineHeight: 18,
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
        minHeight: 44,
        borderRadius: theme.radius.md,
        backgroundColor: theme.color.surface,
        borderWidth: 1,
        borderColor: theme.color.border,
    },
    searchInput: {
        flex: 1,
        color: theme.color.ink,
        fontSize: 16,
        paddingVertical: 10,
    },
    listContent: {
        paddingHorizontal: theme.space.screenX,
        paddingBottom: 24,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.space.sm,
        backgroundColor: theme.color.surface,
        paddingHorizontal: theme.space.lg,
        paddingVertical: 14,
        minHeight: 56,
    },
    rowSelected: {
        backgroundColor: "#ECFDF5",
    },
    rowPressed: {
        opacity: 0.9,
    },
    rowCopy: {
        flex: 1,
        minWidth: 0,
    },
    rowCode: {
        color: theme.color.ink,
        fontSize: 16,
        fontWeight: theme.font.weight.bold,
    },
    rowLabel: {
        color: theme.color.muted,
        fontSize: 13,
        marginTop: 2,
    },
    rowSample: {
        color: theme.color.soft,
        fontSize: 13,
        fontWeight: theme.font.weight.semibold,
    },
    checkSpacer: {
        width: 22,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.color.border,
    },
    empty: {
        color: theme.color.muted,
        textAlign: "center",
        marginTop: 40,
        fontSize: 14,
    },
});
