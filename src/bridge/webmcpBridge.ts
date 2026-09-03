/**
 * The deployable bridge is emitted inline by worker/index.ts so the Worker can
 * inject it on the selected hostname. This file documents that choice and is
 * deliberately free of fetch or application-API logic.
 */
export const runtimeBridgeLocation = "worker/index.ts" as const;
