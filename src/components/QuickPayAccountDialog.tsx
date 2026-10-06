import { AccountPicker } from "@/components/AccountPicker";
import { FormDialog } from "@/components/FormDialog";
import { useFormStyles } from "@/styles/form";
import {
    getLastPayAccountId,
    setLastPayAccountId,
} from "@/utils/wallet-prefs";
import { useAccounts } from "@/app/contexts/AccountsContext";
import { defaultInboundAccountId } from "@/utils/accounts";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

type QuickPayAccountDialogProps = {
    visible: boolean;
    title: string;
    subtitle?: string;
    confirmLabel?: string;
    onCancel: () => void;
    onConfirm: (accountId: string) => void;
};

/**
 * Pick which pot to debit before a bill/debt quick-pay.
 * Remembers the last choice in AsyncStorage.
 */
export function QuickPayAccountDialog({
    visible,
    title,
    subtitle = "Money leaves this pot.",
    confirmLabel = "Record payment",
    onCancel,
    onConfirm,
}: QuickPayAccountDialogProps) {
    const form = useFormStyles();
    const { accounts } = useAccounts();
    const [accountId, setAccountId] = useState(() =>
        defaultInboundAccountId(accounts)
    );
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!visible) {
            return;
        }
        let cancelled = false;
        void getLastPayAccountId(accounts).then((id) => {
            if (!cancelled) {
                setAccountId(id);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [visible, accounts]);

    const handleConfirm = async () => {
        setBusy(true);
        try {
            await setLastPayAccountId(accountId);
            onConfirm(accountId);
        } finally {
            setBusy(false);
        }
    };

    return (
        <FormDialog
            visible={visible}
            onClose={onCancel}
            kicker="Pay from"
            title={title}
            saveLabel={confirmLabel}
            onSave={() => {
                if (!busy) {
                    void handleConfirm();
                }
            }}
        >
            <View style={form.field}>
                <Text style={form.label}>Account</Text>
                <AccountPicker
                    value={accountId}
                    onChange={setAccountId}
                    title="Pay from"
                />
                <Text style={form.helper}>{subtitle}</Text>
            </View>
        </FormDialog>
    );
}
