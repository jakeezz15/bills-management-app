import { AddListRow } from "@/components/AddListRow";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import DebtForm from "@/components/DebtForm";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RowGroup, StatusRow } from "@/components/StatusRow";
import { dashboard } from "@/styles/dashboard";
import { StatusTone } from "@/theme";
import { Debt } from "@/types/debt";
import { toIsoDate } from "@/utils/date";
import {
    billDueStatusReference,
    filterDebtsVisibleAsOf,
    getBillDueOffset,
    isDebtInstallmentPaidAsOf,
} from "@/utils/filters";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useDateRange } from "../../contexts/DateRangeContext";
import { useDebt } from "../../contexts/DebtsContext";
import { useLocale } from "../../contexts/LocaleContext";

type DebtsScreenProps = {
    embedded?: boolean;
};

function isFullyPaidOff(debt: Debt) {
    return debt.balance <= 0 || Boolean(debt.paidOffDate);
}

function debtTone(
    debt: Debt,
    installmentPaid: boolean,
    dueRef: Date
): StatusTone {
    if (isFullyPaidOff(debt) || installmentPaid) {
        return "paid";
    }
    const offset = getBillDueOffset(debt.dueDay, dueRef);
    if (offset < 0) {
        return "overdue";
    }
    if (offset <= 3) {
        return "due-soon";
    }
    return "upcoming";
}

export default function DebtsScreen({ embedded = false }: DebtsScreenProps) {
    const { formatMoney } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const { debts, payments, loading } = useDebt();
    const { range } = useDateRange();

    const asOf = range.end;
    const asOfIso = toIsoDate(asOf);
    const dueRef = billDueStatusReference(asOf);

    const visibleDebts = useMemo(
        () => filterDebtsVisibleAsOf(debts, asOf),
        [debts, asOf]
    );

    const openAdd = () => setIsOpen(true);

    return (
        <View style={dashboard.screen}>
            {loading && <LoadingScreen />}

            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    !embedded && { paddingTop: 48 },
                ]}
            >
                <DebtForm
                    visible={isOpen}
                    onClose={() => setIsOpen(false)}
                    paymentDate={asOfIso}
                />

                {debts.length === 0 && !loading ? (
                    <DashboardEmpty
                        title="No debts yet"
                        text="Add a car loan or installment. Payments you log lower the balance and leftover."
                        actionLabel="Add first debt"
                        onAction={openAdd}
                    />
                ) : (
                    <>
                        <AddListRow label="Add debt" onPress={openAdd} />
                        <RowGroup>
                            {visibleDebts.map((debt, index) => {
                                const installmentPaid =
                                    isDebtInstallmentPaidAsOf(
                                        debt,
                                        asOf,
                                        payments
                                    );
                                const tone = debtTone(
                                    debt,
                                    installmentPaid,
                                    dueRef
                                );
                                return (
                                    <StatusRow
                                        key={debt.id}
                                        title={debt.name}
                                        subtitle={`Min ${formatMoney(debt.minimumPayment)} · due day ${debt.dueDay}`}
                                        amount={formatMoney(
                                            Math.max(debt.balance, 0)
                                        )}
                                        tone={tone}
                                        onPress={() => {
                                            router.push(`/debts/${debt.id}`);
                                        }}
                                        isLast={
                                            index === visibleDebts.length - 1
                                        }
                                    />
                                );
                            })}
                        </RowGroup>
                    </>
                )}
            </ScrollView>
        </View>
    );
}
