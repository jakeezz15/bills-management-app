import { useAccounts } from "@/app/contexts/AccountsContext";
import { AccountAvatar } from "@/components/AccountAvatar";
import { SelectMenu } from "@/components/SelectMenu";
import { CashAccount } from "@/types/account";
import { activeAccounts } from "@/utils/accounts";
import { useMemo } from "react";

type AccountPickerProps = {
    value: string;
    onChange: (accountId: string) => void;
    /** Sheet heading. Defaults to "Account". */
    title?: string;
    /** Hide these account ids (e.g. the other side of a transfer). */
    excludeIds?: readonly string[];
    disabled?: boolean;
};

/**
 * Pick Cash or an Online pot. Uses active (non-archived) accounts.
 */
export function AccountPicker({
    value,
    onChange,
    title = "Account",
    excludeIds,
    disabled = false,
}: AccountPickerProps) {
    const { accounts } = useAccounts();
    const options = useMemo(() => {
        const active = activeAccounts(accounts);
        const excluded = excludeIds ? new Set(excludeIds) : null;
        return excluded
            ? active.filter((account) => !excluded.has(account.id))
            : active;
    }, [accounts, excludeIds]);

    const byId = useMemo(() => {
        const map = new Map<string, CashAccount>();
        for (const account of options) {
            map.set(account.id, account);
        }
        return map;
    }, [options]);

    const ids = useMemo(
        () => options.map((account) => account.id),
        [options]
    );

    const selected = ids.includes(value) ? value : (ids[0] ?? value);

    const avatarFor = (id: string) => {
        const account = byId.get(id);
        if (!account) {
            return null;
        }
        return (
            <AccountAvatar name={account.name} color={account.color} size={28} />
        );
    };

    return (
        <SelectMenu
            options={ids}
            value={selected}
            onChange={(next) => {
                if (next) {
                    onChange(next);
                }
            }}
            title={title}
            noneLabel={null}
            accessibilityLabel={title}
            disabled={disabled || ids.length === 0}
            getOptionLabel={(id) => byId.get(id)?.name ?? id}
            renderOptionLeading={avatarFor}
            renderTriggerLeading={avatarFor}
        />
    );
}
