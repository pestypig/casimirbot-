export type EnvironmentConnectorDeviceHealth =
  | "unknown"
  | "online"
  | "degraded"
  | "offline";

/**
 * Device identity is possession-bound and installation-scoped. Device
 * credentials and producer epochs never appear in model-visible catalogs.
 */
export const environmentConnectorDeviceTable =
  "helix_environment_connector_devices" as const;

