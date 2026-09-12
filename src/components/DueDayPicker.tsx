import { SelectMenu } from "@/components/SelectMenu";
import { DUE_DAY_OPTIONS } from "@/utils/amount-input";
import { ordinalDay } from "@/utils/date";
import { useMemo } from "react";

type DueDayPickerProps = {
    value: number | null;
    onChange: (day: number | null) => void;
    title?: string;
};

/**
 * Due day of month (1–31) as a compact dropdown with ordinal labels.
 */
export function DueDayPicker({
    value,
    onChange,
    title = "Due day",
}: DueDayPickerProps) {
    const labels = useMemo(
        () => DUE_DAY_OPTIONS.map((day) => ordinalDay(Number(day))),
        []
    );
    const selected = value !== null ? ordinalDay(value) : null;

    return (
        <SelectMenu
            options={labels}
            value={selected}
            onChange={(label) => {
                if (!label) {
                    onChange(null);
                    return;
                }
                const day = Number(label.replace(/\D/g, ""));
                onChange(Number.isInteger(day) ? day : null);
            }}
            title={title}
            placeholder="Choose day"
            noneLabel={null}
            accessibilityLabel={title}
        />
    );
}
