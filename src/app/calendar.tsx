import { Redirect } from "expo-router";

/** Old stack entry — Calendar now lives as a tab. */
export default function CalendarRedirect() {
    return <Redirect href="/(tabs)/calendar" />;
}
