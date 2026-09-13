import { WalkthroughAnchor } from "@/components/walkthrough";
import type { WalkthroughStepId } from "@/components/walkthrough";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useDashboardStyles } from "@/styles/dashboard";
import { screenStyles } from "@/styles/screen";
import { theme } from "@/design";
import { ReactNode } from "react";
import { Text, View } from "react-native";

type PageHeaderProps = {
    title: string;
    subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
    const dashboard = useDashboardStyles();
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
    /** Spotlight the segment control for the active tour step. */
    walkthroughSegmentsId?: WalkthroughStepId;
};

export function TabScaffold({
    title,
    subtitle,
    children,
    segments,
    walkthroughSegmentsId,
}: TabScaffoldProps) {
    const topPadding = useScreenTopPadding();
    const dashboard = useDashboardStyles();

    const segmentNode =
        segments && walkthroughSegmentsId ? (
            <WalkthroughAnchor id={walkthroughSegmentsId}>
                {segments}
            </WalkthroughAnchor>
        ) : (
            segments
        );

    return (
        <View style={dashboard.screen}>
            <View style={[dashboard.tabHeader, { paddingTop: topPadding }]}>
                <Text style={screenStyles.title}>{title}</Text>
                <Text
                    style={[
                        screenStyles.screenDescription,
                        { marginBottom: theme.space.md },
                    ]}
                >
                    {subtitle}
                </Text>
                {segmentNode}
            </View>
            <View style={{ flex: 1, backgroundColor: theme.bg.canvas }}>
                {children}
            </View>
        </View>
    );
}
