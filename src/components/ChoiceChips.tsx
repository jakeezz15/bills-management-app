import { SelectMenu } from "@/components/SelectMenu";

type ChoiceChipsProps<T extends string> = {
    options: readonly T[];
    selected: T;
    onSelect: (value: T) => void;
    /** Sheet heading (e.g. "Pay cycle", "Time"). */
    title: string;
    disabled?: boolean;
};

/**
 * Always-one-selected menu. Same job as the old chip row, without the wrap.
 */
export function ChoiceChips<T extends string>({
    options,
    selected,
    onSelect,
    title,
    disabled = false,
}: ChoiceChipsProps<T>) {
    return (
        <SelectMenu
            options={options}
            value={selected}
            onChange={(value) => {
                if (value !== null) {
                    onSelect(value);
                }
            }}
            title={title}
            noneLabel={null}
            accessibilityLabel={title}
            disabled={disabled}
        />
    );
}
