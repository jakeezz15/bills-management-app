import { dashboard } from "@/styles/dashboard";
import { screenStyles } from "@/styles/screen";
import { theme } from "@/theme";
import { ReactNode } from "react";
import { Text, View } from "react-native";

type PageHeaderProps = {
    title: string;
    subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
    return (
        <View style={dashboard.standaloneHeader}>
            <Text style={screenStyles.title}>{title}</Text>
            {subtitle ? (
                <Text style={screenStyles.screenDescription}>{subtitle}</Text>
            ) : null}
        </View>
    );
}

type TabScaffoldProps = {
    title: string;
    subtitle: string;
    children: ReactNode;
    segments?: ReactNode;
};

export function TabScaffold({
    title,
    subtitle,
    children,
    segments,
}: TabScaffoldProps) {
    return (
        <View style={dashboard.screen}>
            <View style={dashboard.tabHeader}>
                <Text style={screenStyles.title}>{title}</Text>
                <Text
                    style={[screenStyles.screenDescription, { marginBottom: 14 }]}
                >
                    {subtitle}
                </Text>
                {segments}
            </View>
            <View style={{ flex: 1, backgroundColor: theme.color.canvas }}>
                {children}
            </View>
        </View>
    );
}
