type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

export const providerBridgeCapabilityLaneEvidenceReentryCompatible = (
  value: unknown,
): boolean => {
  const bridge = readRecord(value);
  if (!bridge) return false;
  return (
    readBoolean(bridge.all_capability_lane_observations_reentry_compatible) ??
    readBoolean(bridge.all_capability_lane_observations_succeeded) ??
    false
  );
};

export const providerBridgeAllEvidenceReentryCompatible = (
  value: unknown,
): boolean => {
  const bridge = readRecord(value);
  if (!bridge) return false;
  return (
    readBoolean(bridge.all_observations_reentry_compatible) ??
    readBoolean(bridge.all_observations_succeeded) ??
    false
  );
};
