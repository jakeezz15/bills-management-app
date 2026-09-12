/**
 * Collects soft failures from AsyncStorage loads/saves so the UI can warn
 * without crashing. Module singleton — fine for a single-device local app.
 */

export type StorageHealthIssue = {
    id: string;
    collection: string;
    message: string;
};

type Listener = () => void;

let issues: StorageHealthIssue[] = [];
let seq = 0;
const listeners = new Set<Listener>();

function emit() {
    listeners.forEach((listener) => listener());
}

export function getStorageHealthIssues(): readonly StorageHealthIssue[] {
    return issues;
}

export function subscribeStorageHealth(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function clearStorageHealthIssues() {
    if (issues.length === 0) {
        return;
    }
    issues = [];
    emit();
}

export function recordStorageHealthIssue(
    collection: string,
    message: string
) {
    seq += 1;
    issues = [
        ...issues,
        {
            id: `storage-${seq}`,
            collection,
            message,
        },
    ];
    emit();
}

/** Apply parse diagnostics from a storage load. */
export function noteStoredArrayLoad(
    collection: string,
    report: { rawCorrupt: boolean; droppedCount: number; kept: number }
) {
    if (report.rawCorrupt) {
        recordStorageHealthIssue(
            collection,
            `Saved ${collection} data was unreadable and was skipped.`
        );
        return;
    }
    if (report.droppedCount > 0) {
        const noun = report.droppedCount === 1 ? "entry" : "entries";
        recordStorageHealthIssue(
            collection,
            `${report.droppedCount} ${collection} ${noun} looked invalid and ${
                report.kept > 0 ? "were skipped" : "could not be loaded"
            }.`
        );
    }
}

export function noteStorageSaveFailure(collection: string) {
    recordStorageHealthIssue(
        collection,
        `Could not save ${collection} on this device. Check free storage and try again.`
    );
}
