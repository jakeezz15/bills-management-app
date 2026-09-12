import { SelectMenu } from "@/components/SelectMenu";

type CategoryPickerProps = {
    options: readonly string[];
    selected: string | null;
    onSelect: (value: string | null) => void;
    /**
     * Label for the "no category" option. Pass `null` to hide it.
     */
    noneLabel?: string | null;
    /** Sheet heading. Defaults to "Category". */
    title?: string;
};

/**
 * Optional category select. One compact row instead of a wrapping chip strip.
 */
export function CategoryPicker({
    options,
    selected,
    onSelect,
    noneLabel = "None",
    title = "Category",
}: CategoryPickerProps) {
    return (
        <SelectMenu
            options={options}
            value={selected}
            onChange={onSelect}
            title={title}
            placeholder={noneLabel ?? "Select"}
            noneLabel={noneLabel}
            accessibilityLabel={title}
        />
    );
}
