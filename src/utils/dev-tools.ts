import Constants from "expo-constants";

/**
 * In-app test tools (seed data, test reminder). Shown in Expo Go and
 * expo-dev-client binaries. Hidden in production/preview release builds.
 *
 * StoreClient = Expo Go or a development build (Expo SDK Constants).
 * Standalone = store/preview release. Bare/web follow the JS bundle.
 */
export function isDevToolsBuild(): boolean {
    const environment = Constants.executionEnvironment;
    if (environment === "storeClient") {
        return true;
    }
    if (environment === "standalone") {
        return false;
    }
    return __DEV__;
}
