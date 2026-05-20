import type { HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";
import { auditEnvironmentSourceContract, type EnvironmentSourceContractAudit } from "./environment-source-contract-validator";
import {
  ingestEnvironmentStateSnapshot,
  normalizeEnvironmentStateSnapshot,
} from "./environment-state-snapshot-window";

const latestTickBySource = new Map<string, number>();

export type MinecraftPluginSnapshotIngestResult =
  | {
      accepted: true;
      snapshot: HelixEnvironmentStateSnapshot;
      audit: EnvironmentSourceContractAudit;
      reason: "accepted";
    }
  | {
      accepted: false;
      snapshot: HelixEnvironmentStateSnapshot | null;
      audit: EnvironmentSourceContractAudit | null;
      reason: string;
    };

export function normalizeMinecraftPluginSnapshot(input: {
  snapshot: unknown;
  now?: string;
}): HelixEnvironmentStateSnapshot | null {
  const record = input.snapshot && typeof input.snapshot === "object" && !Array.isArray(input.snapshot)
    ? input.snapshot as Record<string, unknown>
    : null;
  const domainSpecific = record?.domain_specific && typeof record.domain_specific === "object" && !Array.isArray(record.domain_specific)
    ? record.domain_specific as Record<string, unknown>
    : null;
  const minecraft = domainSpecific?.minecraft && typeof domainSpecific.minecraft === "object" && !Array.isArray(domainSpecific.minecraft)
    ? domainSpecific.minecraft as Record<string, unknown>
    : null;
  if (record?.raw_payload_included === true || minecraft?.raw_nbt_included === true) return null;
  const snapshot = normalizeEnvironmentStateSnapshot({ snapshot: input.snapshot });
  if (!snapshot || snapshot.domain !== "minecraft") return null;
  return snapshot;
}

export function ingestMinecraftPluginSnapshot(input: {
  snapshot: unknown;
  now?: string;
}): MinecraftPluginSnapshotIngestResult {
  const snapshot = normalizeMinecraftPluginSnapshot(input);
  if (!snapshot) {
    return { accepted: false, snapshot: null, audit: null, reason: "invalid_snapshot" };
  }
  const audit = auditEnvironmentSourceContract({ subject: snapshot, now: input.now ?? snapshot.ts });
  if (!audit.ok) {
    return { accepted: false, snapshot, audit, reason: "contract_rejected" };
  }
  if (typeof snapshot.source_tick === "number") {
    const previous = latestTickBySource.get(snapshot.source_id);
    if (typeof previous === "number" && snapshot.source_tick < previous) {
      return { accepted: false, snapshot, audit, reason: "out_of_order_tick" };
    }
    latestTickBySource.set(snapshot.source_id, snapshot.source_tick);
  }
  ingestEnvironmentStateSnapshot(snapshot);
  return { accepted: true, snapshot, audit, reason: "accepted" };
}

export function resetMinecraftPluginSnapshotNormalizerForTest(): void {
  latestTickBySource.clear();
}
