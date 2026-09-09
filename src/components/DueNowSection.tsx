import { useBills } from "@/app/contexts/BillsContext";
import { useDueAction } from "@/app/contexts/DueActionContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { CompactPlanRow, PlanGroup } from "@/components/CompactPlanRow";
import { dashboard } from "@/styles/dashboard";
import { text, theme } from "@/design";
import { todayIsoDate } from "@/utils/date";
import {
    dueNowLabel,
    dueNowTone,
    getDueNowItems,
} from "@/utils/due-now";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export function DueNowSection() {
    const { formatMoney } = useLocale();
    const { bills, payments: billPayments, toggleBillPaid } = useBills();
    const { debts, payments: debtPayments, recordPayment } = useDebt();
    const { openDueItem } = useDueAction();

    const items = useMemo(
        () => getDueNowItems(bills, billPayments, debts, debtPayments),
        [bills, billPayments, debts, debtPayments]
    );

    if (items.length === 0) {
        return null;
    }

    const asOfIso = todayIsoDate();

    return (
        <View style={styles.wrap}>
            <Text style={dashboard.sectionLabel}>Due now</Text>
            <Text style={styles.caption}>
                Log these to drop leftover. Overdue, due today, and due in 3 days.
            </Text>
            <PlanGroup>
                {items.map((item) => (
                    <CompactPlanRow
                        key={`${item.kind}-${item.id}`}
                        title={item.name}
                        meta={dueNowLabel(item)}
                        amountLabel={formatMoney(
                            item.remaining ?? item.amount,
                            { compact: true }
                        )}
                        amountHint={item.kind === "debt" ? "balance" : "due"}
                        actionAmountLabel={
                            item.kind === "debt"
                                ? formatMoney(item.amount, { compact: true })
                                : undefined
                        }
                        metaTone={dueNowTone(item)}
                        onPress={() =>
                            openDueItem({ kind: item.kind, id: item.id })
                        }
                        onToggle={() => {
                            if (item.kind === "bill") {
                                if (item.amountVaries) {
                                    openDueItem({ kind: "bill", id: item.id });
                                    return;
                                }
                                void toggleBillPaid(item.id, asOfIso);
                                return;
                            }
                            void recordPayment(item.id, undefined, asOfIso);
                        }}
                        toggleAccessibilityLabel={
                            item.kind === "bill" && item.amountVaries
                                ? "Enter this month’s amount"
                                : item.kind === "bill"
                                  ? "Mark as paid"
                                  : `Record ${formatMoney(item.amount, { compact: true })}`
                        }
                    />
                ))}
            </PlanGroup>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        marginTop: theme.space.md,
        marginBottom: theme.space.sm,
    },
    caption: {
        ...text.caption,
        marginBottom: theme.space.sm,
    },
});
