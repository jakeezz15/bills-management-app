import type { ComponentProps } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const EXPENSE_CATEGORY_ICONS: Record<string, IoniconName> = {
    Food: "restaurant-outline",
    Transport: "car-outline",
    Shopping: "bag-handle-outline",
    Entertainment: "game-controller-outline",
    Health: "medical-outline",
    Other: "ellipse-outline",
};

/** Ionicon for an expense category label; unknown → generic mark. */
export function iconForExpenseCategory(category: string): IoniconName {
    return EXPENSE_CATEGORY_ICONS[category] ?? "pricetag-outline";
}
