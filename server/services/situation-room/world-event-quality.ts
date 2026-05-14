import type { HelixWorldEvent } from "@shared/helix-world-event";

export type WorldEventQualitySummary = {
  has_evidence: boolean;
  has_source_id: boolean;
  has_actor: boolean;
  has_location: boolean;
  spatial_fidelity: {
    event_type: string;
    is_spatial_edit: boolean;
    has_integer_location: boolean;
    has_explicit_block_coordinates: boolean;
    geometry_usable: boolean;
    missing: string[];
  };
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
};

const hasNumber = (record: Record<string, unknown> | null, key: string): boolean =>
  readNumber(record?.[key]) !== null;

const isSpatialEditType = (eventType: string): boolean =>
  [
    "block_broken",
    "block_break",
    "block_mined",
    "block_placed",
    "block_place",
    "bucket_empty",
    "bucket_fill",
    "fluid_changed",
  ].includes(eventType.trim().toLowerCase());

export function summarizeWorldEventQuality(event: HelixWorldEvent): WorldEventQualitySummary {
  const location = readRecord(event.location);
  const meta = readRecord(event.meta);
  const locationX = readNumber(location?.x);
  const locationY = readNumber(location?.y);
  const locationZ = readNumber(location?.z);
  const hasIntegerLocation =
    locationX !== null &&
    locationY !== null &&
    locationZ !== null &&
    Number.isInteger(locationX) &&
    Number.isInteger(locationY) &&
    Number.isInteger(locationZ);
  const hasExplicitBlockCoordinates =
    (hasNumber(location, "block_x") && hasNumber(location, "block_y") && hasNumber(location, "block_z")) ||
    (hasNumber(meta, "block_x") && hasNumber(meta, "block_y") && hasNumber(meta, "block_z"));
  const spatialEdit = isSpatialEditType(event.event_type);
  const geometryUsable = spatialEdit ? hasExplicitBlockCoordinates || hasIntegerLocation : false;
  const missing = [
    spatialEdit && !hasExplicitBlockCoordinates && !hasIntegerLocation
      ? "exact_block_coordinates"
      : "",
  ].filter(Boolean);
  return {
    has_evidence: event.evidence_refs.length > 0,
    has_source_id: Boolean(event.source_id),
    has_actor: Boolean(event.actor_id || event.actor_label),
    has_location: Boolean(event.location),
    spatial_fidelity: {
      event_type: event.event_type,
      is_spatial_edit: spatialEdit,
      has_integer_location: hasIntegerLocation,
      has_explicit_block_coordinates: hasExplicitBlockCoordinates,
      geometry_usable: geometryUsable,
      missing,
    },
  };
}
