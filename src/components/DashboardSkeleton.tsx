import { Bone } from "@/components/Skeleton";
import { useDashboardStyles } from "@/styles/dashboard";
import { theme } from "@/design";
import { StyleSheet, View } from "react-native";

type DashboardSkeletonProps = {
    /** Home uses a masthead-shaped block; list screens use the card hero. */
    variant?: "list" | "home";
};

/**
 * Layout-shaped loading state. Matches the hero + first rows so AsyncStorage
 * resolving does not jump from a spinner (or ₱0) into the real screen.
 */
export function DashboardSkeleton({
    variant = "list",
}: DashboardSkeletonProps) {
    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel="Loading"
            accessibilityLiveRegion="polite"
        >
            {variant === "home" ? <HomeBones /> : <ListBones />}
        </View>
    );
}

function ListBones() {
    const dashboard = useDashboardStyles();
    return (
        <>
            <View style={dashboard.hero}>
                <View style={dashboard.heroDisplay}>
                    <Bone
                        width={72}
                        height={theme.lineHeight.xs}
                        tone="inverse"
                    />
                    <Bone
                        width="55%"
                        height={theme.lineHeight.hero}
                        radius={theme.radius.md}
                        tone="inverse"
                        style={{ marginTop: theme.space.sm }}
                    />
                    <Bone
                        width="70%"
                        height={theme.lineHeight.xs}
                        tone="inverse"
                        style={{ marginTop: theme.space.sm }}
                    />
                    <View style={dashboard.heroTide} />
                </View>
                <View style={dashboard.heroTools}>
                    <Bone
                        width="40%"
                        height={theme.lineHeight.xs}
                        tone="inverse"
                        style={{ marginLeft: theme.space.md }}
                    />
                </View>
            </View>

            <Bone
                width={88}
                height={theme.lineHeight.xs}
                style={{ marginBottom: theme.space.sm }}
            />
            <View style={styles.group}>
                <RowBone />
                <RowBone />
                <RowBone />
            </View>
        </>
    );
}

function HomeBones() {
    return (
        <View style={styles.homeBody}>
            <Bone
                width={96}
                height={theme.lineHeight.xs}
                style={{ marginBottom: theme.space.md }}
            />
            <RowBone />
            <RowBone />
            <View style={styles.statementGap} />
            <Bone
                width={104}
                height={theme.lineHeight.xs}
                style={{ marginBottom: theme.space.sm }}
            />
            <LineBone />
            <LineBone />
            <LineBone />
            <LineBone />
            <LineBone />
        </View>
    );
}

function RowBone() {
    return (
        <View style={styles.row}>
            <View style={styles.accent} />
            <Bone
                width={theme.size.control}
                height={theme.size.control}
                radius={theme.radius.pill}
            />
            <View style={styles.copy}>
                <Bone width="62%" height={theme.lineHeight.md} />
                <Bone width="38%" height={theme.lineHeight.xs} />
            </View>
            <Bone width={56} height={theme.lineHeight.md} />
        </View>
    );
}

function LineBone() {
    const dashboard = useDashboardStyles();
    return (
        <View style={styles.line}>
            <View style={styles.lineTop}>
                <Bone width={96} height={theme.lineHeight.sm} />
                <Bone width={64} height={theme.lineHeight.sm} />
            </View>
            <View style={dashboard.barTrack} />
        </View>
    );
}

const styles = StyleSheet.create({
    group: {
        backgroundColor: theme.bg.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border.subtle,
        overflow: "hidden",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 64,
        paddingVertical: theme.space.md,
        paddingRight: theme.space.md,
        paddingLeft: theme.space.sm,
        gap: theme.space.sm,
        backgroundColor: theme.bg.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border.subtle,
    },
    accent: {
        width: 4,
        alignSelf: "stretch",
        borderRadius: theme.radius.pill,
        backgroundColor: theme.border.base,
        marginVertical: theme.space.xs,
    },
    copy: {
        flex: 1,
        gap: theme.space.xs,
        minWidth: 0,
    },
    homeBody: {
        paddingTop: theme.space.md,
    },
    statementGap: {
        height: theme.space.lg,
    },
    line: {
        paddingVertical: theme.space.sm,
        marginBottom: theme.space.sm,
    },
    lineTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.space.sm,
    },
});
