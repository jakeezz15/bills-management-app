import { dashboard } from "@/styles/dashboard";
import { Pressable, Text, View } from "react-native";

type PlanItemCardProps = {
    title: string;
    subtitle: string;
    rightLabel: string;
    percent: number;
    done?: boolean;
    amounts: string;
    amountsMuted?: string;
    chipLabel?: string;
    onPress: () => void;
    onChip?: () => void;
    fill?: "accent" | "success";
};

export function PlanItemCard({
    title,
    subtitle,
    rightLabel,
    percent,
    done = false,
    amounts,
    amountsMuted,
    chipLabel,
    onPress,
    onChip,
    fill = "accent",
}: PlanItemCardProps) {
    const width = Math.max(0, Math.min(100, percent));

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [dashboard.card, pressed && { opacity: 0.94 }]}
        >
            <View style={dashboard.cardTop}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={dashboard.cardTitle} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={dashboard.cardSubtitle}>{subtitle}</Text>
                </View>
                <Text style={dashboard.cardRight}>{rightLabel}</Text>
            </View>

            <View style={dashboard.barTrack}>
                <View
                    style={[
                        dashboard.barFill,
                        (done || fill === "success") && dashboard.barFillDone,
                        { width: `${width}%` },
                    ]}
                />
            </View>

            <View style={dashboard.cardMeta}>
                <Text style={dashboard.cardAmounts}>
                    {amounts}
                    {amountsMuted ? (
                        <Text style={dashboard.cardAmountsMuted}>
                            {amountsMuted}
                        </Text>
                    ) : null}
                </Text>

                {chipLabel && onChip ? (
                    <Pressable
                        onPress={(event) => {
                            event.stopPropagation();
                            onChip();
                        }}
                        style={({ pressed }) => [
                            dashboard.chip,
                            pressed && { opacity: 0.75 },
                        ]}
                    >
                        <Text style={dashboard.chipText}>{chipLabel}</Text>
                    </Pressable>
                ) : null}
            </View>
        </Pressable>
    );
}
