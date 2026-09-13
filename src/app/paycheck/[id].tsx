import { useIncome } from "@/app/contexts/IncomeContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { DashboardHero } from "@/components/DashboardHero";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { DetailHeroNav } from "@/components/DetailHeroNav";
import IncomeForm from "@/components/IncomeForm";
import {
    SettingsDivider,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useDashboardStyles } from "@/styles/dashboard";
import { formatDisplayDate } from "@/utils/date";
import { goBackOrReplace, paramId } from "@/utils/navigation";
import { chipFromPayCadence } from "@/utils/pay-cycle";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

export default function IncomeReceiptScreen() {
    const dashboard = useDashboardStyles();
    useStatusBarStyle("light");
    const topPadding = useScreenTopPadding();
    const { id: rawId } = useLocalSearchParams<{ id: string }>();
    const id = paramId(rawId);

    const { formatMoney } = useLocale();
    const { income, loading } = useIncome();
    const [editing, setEditing] = useState(false);

    const entry = income.find((item) => item.id === id);

    useEffect(() => {
        if (loading || !id) {
            return;
        }
        if (entry) {
            return;
        }
        goBackOrReplace("/(tabs)/activity");
    }, [loading, entry, id]);

    if (loading && !entry) {
        return (
            <View style={dashboard.screen}>
                <ScrollView
                    contentContainerStyle={[
                        dashboard.listContent,
                        { paddingTop: topPadding },
                    ]}
                >
                    <DashboardSkeleton />
                </ScrollView>
            </View>
        );
    }

    if (!entry) {
        return null;
    }

    const takeHome =
        entry.gross > 0 ? Math.round((entry.net / entry.gross) * 100) : 100;

    return (
        <View style={dashboard.screen}>
            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    { paddingTop: topPadding },
                ]}
            >
                <DashboardHero
                    title={entry.source}
                    kicker="Take-home"
                    value={formatMoney(entry.net, { compact: true })}
                    caption={`${formatDisplayDate(entry.date)} · ${chipFromPayCadence(entry.payCadence)}`}
                    percent={takeHome}
                    header={
                        <DetailHeroNav
                            backLabel="Income"
                            fallbackHref="/(tabs)/activity"
                            onEdit={() => setEditing(true)}
                            editAccessibilityLabel="Edit income"
                        />
                    }
                />

                <SettingsSection title="Pay stub">
                    <SettingsRow
                        title="Date"
                        value={formatDisplayDate(entry.date)}
                    />
                    <SettingsDivider />
                    <SettingsRow
                        title="Gross"
                        value={formatMoney(entry.gross)}
                    />
                    <SettingsDivider />
                    <SettingsRow
                        title="Take-home"
                        value={formatMoney(entry.net)}
                    />
                    <SettingsDivider />
                    <SettingsRow title="Kept" value={`${takeHome}%`} />
                    <SettingsDivider />
                    <SettingsRow
                        title="Pay cycle"
                        value={chipFromPayCadence(entry.payCadence)}
                    />
                </SettingsSection>
            </ScrollView>

            <IncomeForm
                visible={editing}
                onClose={() => setEditing(false)}
                entry={entry}
            />
        </View>
    );
}
