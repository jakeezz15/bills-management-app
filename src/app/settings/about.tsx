import {
    SettingsDivider,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { SettingsSubpage } from "@/components/SettingsSubpage";
import {
    PRIVACY_POLICY_URL,
    SUPPORT_URL,
} from "@/constants/support";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

export default function SettingsAboutScreen() {
    const version = Constants.expoConfig?.version ?? "1.0.0";

    return (
        <SettingsSubpage title="About">
            <SettingsSection title="On Hand">
                <SettingsRow
                    icon="information-circle-outline"
                    title="On Hand"
                    subtitle="What's left after what you logged."
                    value={version}
                />
                <SettingsDivider />
                <SettingsRow
                    icon="phone-portrait-outline"
                    title="Storage"
                    subtitle="Data stays on this device by default. Optional Google sync uploads a backup when you choose."
                />
            </SettingsSection>

            <SettingsSection title="Help">
                <SettingsRow
                    icon="document-text-outline"
                    title="Privacy policy"
                    subtitle="On-device by default; optional Google sync"
                    showChevron
                    onPress={() => {
                        void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
                    }}
                />
                <SettingsDivider />
                <SettingsRow
                    icon="mail-outline"
                    title="Contact support"
                    subtitle="Questions, bugs, or privacy requests"
                    showChevron
                    onPress={() => {
                        void Linking.openURL(SUPPORT_URL);
                    }}
                />
            </SettingsSection>
        </SettingsSubpage>
    );
}
