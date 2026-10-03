import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultInboundAccountId } from "@/utils/accounts";
import type { CashAccount } from "@/types/account";

const LAST_PAY_ACCOUNT_KEY = "wallet.lastPayAccountId";

/** Last pot used for bill/debt quick-pay, or primary Online / Cash fallback. */
export async function getLastPayAccountId(
    accounts: CashAccount[]
): Promise<string> {
    const stored = await AsyncStorage.getItem(LAST_PAY_ACCOUNT_KEY);
    if (stored && accounts.some((a) => a.id === stored && a.archived !== true)) {
        return stored;
    }
    return defaultInboundAccountId(accounts);
}

export async function setLastPayAccountId(accountId: string): Promise<void> {
    await AsyncStorage.setItem(LAST_PAY_ACCOUNT_KEY, accountId);
}
