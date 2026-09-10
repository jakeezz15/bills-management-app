import { paramId } from "@/utils/navigation";

describe("paramId", () => {
    it("returns a string as-is", () => {
        expect(paramId("abc")).toBe("abc");
    });

    it("unwraps a one-item array from Expo Router", () => {
        expect(paramId(["abc"])).toBe("abc");
    });

    it("returns undefined when the param is missing", () => {
        expect(paramId(undefined)).toBeUndefined();
    });
});
