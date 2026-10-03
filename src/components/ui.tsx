import { WalkthroughAnchor } from "@/components/walkthrough/WalkthroughAnchor";
import type { WalkthroughStepId } from "@/components/walkthrough";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useDashboardStyles } from "@/styles/dashboard";
import { screenStyles } from "@/styles/screen";
import { theme } from "@/design";
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    backLabel?: string;
    onBack?: () => void;
};

export function PageHeader({
    title,
    subtitle,
    backLabel,
    onBack,
}: PageHeaderProps) {
    const dashboard = useDashboardStyles();
    return (
        <View style={dashboard.standaloneHeader}>
            {backLabel && onBack ? (
                <Pressable
                    onPress={onBack}
                    accessibilityRole="button"
                    accessibilityLabel={`Back to ${backLabel}`}
                    hitSlop={8}
                    style={({ pressed }) => [
                        { marginBottom: theme.space.sm, alignSelf: "flex-start" },
                        pressed && { opacity: 0.7 },
                    ]}
                >
                    <Text
                        style={{
                            color: theme.text.accent,
                            fontSize: theme.fontSize.sm,
                            fontWeight: theme.fontWeight.semibold,
                        }}
                    >
                        ← {backLabel}
                    </Text>
                </Pressable>
            ) : null}
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
