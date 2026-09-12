import {
    clearStorageHealthIssues,
    getStorageHealthIssues,
    noteStoredArrayLoad,
    recordStorageHealthIssue,
} from "@/services/storage-health";

describe("storage-health", () => {
    afterEach(() => {
        clearStorageHealthIssues();
    });

    it("records and clears issues", () => {
        recordStorageHealthIssue("bills", "test");
        expect(getStorageHealthIssues()).toHaveLength(1);
        clearStorageHealthIssues();
        expect(getStorageHealthIssues()).toHaveLength(0);
    });

    it("notes corrupt loads", () => {
        noteStoredArrayLoad("expenses", {
            rawCorrupt: true,
            droppedCount: 0,
            kept: 0,
        });
        expect(getStorageHealthIssues()[0].message).toMatch(/unreadable/);
    });

    it("notes dropped rows", () => {
        noteStoredArrayLoad("income", {
            rawCorrupt: false,
            droppedCount: 2,
            kept: 3,
        });
        expect(getStorageHealthIssues()[0].message).toMatch(/2 income/);
    });
});
