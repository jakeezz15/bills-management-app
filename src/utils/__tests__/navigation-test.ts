import {
    markOpenDuesOnHome,
    paramFlag,
    paramId,
    takeOpenDuesOnHome,
} from "@/utils/navigation";

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

describe("paramFlag", () => {
    it("accepts 1 and true", () => {
        expect(paramFlag("1")).toBe(true);
        expect(paramFlag("true")).toBe(true);
        expect(paramFlag(["1"])).toBe(true);
    });

    it("rejects other values", () => {
        expect(paramFlag("0")).toBe(false);
        expect(paramFlag(undefined)).toBe(false);
        expect(paramFlag("yes")).toBe(false);
    });
});

describe("open dues home flag", () => {
    it("is consumed once", () => {
        expect(takeOpenDuesOnHome()).toBe(false);
        markOpenDuesOnHome();
        expect(takeOpenDuesOnHome()).toBe(true);
        expect(takeOpenDuesOnHome()).toBe(false);
    });
});
