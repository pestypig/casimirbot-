export const HELIX_PAPER_SENSOR_LOOPBACK_CERTIFICATE_SCHEMA =
  "helix.paper_sensor_loopback_certificate.v1" as const;

export type HelixPaperSensorLoopbackCertificate = {
  schema: typeof HELIX_PAPER_SENSOR_LOOPBACK_CERTIFICATE_SCHEMA;
  ok: boolean;
  plugin_loaded: boolean;
  manifest_received: boolean;
  heartbeat_received: boolean;
  snapshot_received: boolean;
  read_only_probe_completed: boolean;
  forbidden_probe_blocked: boolean;
  raw_nbt_seen: boolean;
  side_effects_seen: boolean;
  duration_ms: number;
  evidence_refs: string[];
  created_at: string;
};
