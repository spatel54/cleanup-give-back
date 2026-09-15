import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * True when running inside Expo Go (no custom native modules such as MapLibre).
 * Uses both `executionEnvironment` and `appOwnership` — some Expo Go / SDK
 * builds report a non-StoreClient environment while still lacking native
 * modules like `MLRNCameraModule`.
 */
export function isExpoGoClient(): boolean {
  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo'
  );
}
