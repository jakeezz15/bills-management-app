import { CurrencyPickerModal } from "@/components/CurrencyPickerModal";
import {
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { SettingsSubpage } from "@/components/SettingsSubpage";
import { useLocale } from "@/app/contexts/LocaleContext";
import { currencyLabel } from "@/utils/money";
import { useState } from "react";

export default function SettingsGeneralScreen() {
    const { currency, setCurrency } = useLocale();
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
