import {
    FormSession,
    advanceFormSession,
    formSessionKey,
} from "@/hooks/useFormSession";

const closed: FormSession = { visible: false, record: "new", count: 0 };

/** Replays a sequence of `[visible, record]` renders and returns each key. */
function replay(steps: [boolean, string][], from: FormSession = closed) {
    let session = from;
    return steps.map(([visible, record]) => {
        session = advanceFormSession(session, visible, record);
        return formSessionKey(session);
    });
}

describe("advanceFormSession", () => {
    it("does nothing while the dialog sits closed", () => {
        expect(advanceFormSession(closed, false, "new")).toBe(closed);
    });

    it("starts a new session when the dialog opens", () => {
        const [key] = replay([[true, "new"]]);

        expect(key).toBe("new:1");
    });

    it("keeps the session while the dialog stays open", () => {
        expect(replay([[true, "new"], [true, "new"], [true, "new"]])).toEqual([
            "new:1",
            "new:1",
            "new:1",
        ]);
    });

    it("starts a fresh session on every reopen, so old input is discarded", () => {
        expect(
            replay([[true, "new"], [false, "new"], [true, "new"]])
        ).toEqual(["new:1", "new:1", "new:2"]);
    });

    it("keeps the session when closing clears the record in the same render", () => {
        // Call sites do `setIsOpen(false); setEditing(null)` together. Treating
        // that as a new session would blank the fields mid fade-out.
        expect(replay([[true, "bill-1"], [false, "new"]])).toEqual([
            "bill-1:1",
            "bill-1:1",
        ]);
    });

    it("starts a new session when a different record is opened", () => {
        expect(
            replay([
                [true, "bill-1"],
                [false, "new"],
                [true, "bill-2"],
            ])
        ).toEqual(["bill-1:1", "bill-1:1", "bill-2:2"]);
    });

    it("starts a new session when switching records without closing", () => {
        expect(replay([[true, "bill-1"], [true, "bill-2"]])).toEqual([
            "bill-1:1",
            "bill-2:2",
        ]);
    });

    it("distinguishes editing a record from adding a new one", () => {
        expect(
            replay([
                [true, "bill-1"],
                [false, "new"],
                [true, "new"],
            ])
        ).toEqual(["bill-1:1", "bill-1:1", "new:2"]);
    });

    it("never reuses a key across two different open sessions", () => {
        const keys = replay([
            [true, "bill-1"],
            [false, "new"],
            [true, "bill-1"],
            [false, "new"],
            [true, "bill-1"],
        ]).filter((_, index) => index % 2 === 0);

        expect(new Set(keys).size).toBe(keys.length);
    });
});
