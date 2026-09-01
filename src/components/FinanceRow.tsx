import { StyleSheet, Text, View } from "react-native";

type FinanceRowProps = {
    label: string;
    amount: number;
    subtitle?: string;
}


export function FinanceRow({ label, amount, subtitle }: FinanceRowProps) {
    return (
        <View style={styles.row}>
            <View>
                <Text style={styles.label}>
                    {label}
                </Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle} </Text> : null}
            </View>
            <Text style={styles.amount}>${amount}</Text>

        </View>
    )
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee"
    },
    label: {
        fontSize: 16, fontWeight: "500",
    },
    subtitle: {
        fontSize: 12,
        color: "#666", marginTop: 2
    },
    amount: {
        fontSize: 16, fontWeight: "600"
    }

})