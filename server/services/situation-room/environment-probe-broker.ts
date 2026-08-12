import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA,
  HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA,
  type HelixEnvironmentProbeRequest,
  type HelixEnvironmentProbeResult,
  type HelixEnvironmentProbeType,
} from "@shared/helix-environment-probe";
import { policyForEnvironmentSensorScope } from "@shared/helix-environment-sensor-scope";
import type { EnvironmentSourceContractAudit } from "./environment-source-contract-validator";
import { auditEnvironmentProbeContract } from "./environment-probe-contract-validator";
import { getEnvironmentSourceManifest } from "./environment-source-registry";
import {
  assertHelixRoomSourceNamespaceAdmission,
  isHelixRoomSourceIngressSourceId,
  matchesHelixRoomSourceAdmission,
  type HelixRoomSourceAdmission,
} from "@shared/helix-room-source-ingress";

const pendingBySource = new Map<string, HelixEnvironmentProbeRequest[]>();
const resultsByRequest = new Map<string, HelixEnvironmentProbeResult>();

const DEFAULT_TTL_MS = 10_000;
const MAX_PENDING_PER_SOURCE = 16;
const ROUTE_MAX_RADIUS_BLOCKS = 64;
const FORBIDDEN_PROBE_TYPES = new Set<string>([
  "move_actor",
  "use_item",
  "take_item",
  "place_block",
  "break_block",
  "attack_entity",
  "open_container",
]);

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const equivalentKey = (request: Pick<HelixEnvironmentProbeRequest, "source_id" | "room_id" | "probe_type" | "target" | "objective">): string =>
  JSON.stringify({
    source_id: request.source_id,
    room_id: request.room_id,
    probe_type: request.probe_type,
    target: request.target ?? null,
    objective: request.objective ?? null,
  });

export function createEnvironmentProbeRequest(input: {
  sourceId: string;
  roomId: string;
  domain: string;
  probeType: HelixEnvironmentProbeType;
  reason: HelixEnvironmentProbeRequest["reason"];
  target?: HelixEnvironmentProbeRequest["target"];
  objective?: string | null;
  evidenceRefs: string[];
  ttlMs?: number;
  sourceAdmission?: HelixRoomSourceAdmission | null;
}): HelixEnvironmentProbeRequest {
  if (FORBIDDEN_PROBE_TYPES.has(String(input.probeType))) {
    throw new Error(`forbidden environment probe type: ${String(input.probeType)}`);
  }
  const manifest = getEnvironmentSourceManifest(input.sourceId, {
    sourceAdmission: input.sourceAdmission,
  });
  assertHelixRoomSourceNamespaceAdmission(
    {
      source_id: input.sourceId,
      room_id: input.roomId,
      domain_adapter: manifest?.domain_adapter ?? null,
    },
    input.sourceAdmission,
  );
  if (manifest && !manifest.supported_probe_types.includes(input.probeType)) {
    throw new Error(`unsupported environment probe type for source ${input.sourceId}: ${input.probeType}`);
  }
  if (manifest && manifest.forbidden_probe_types.includes(input.probeType as never)) {
    throw new Error(`forbidden environment probe type for source ${input.sourceId}: ${String(input.probeType)}`);
  }
  const now = new Date();
  const ttlMs = Math.max(1, input.ttlMs ?? DEFAULT_TTL_MS);
  const pending = pendingBySource.get(input.sourceId) ?? [];
  const key = equivalentKey({
    source_id: input.sourceId,
    room_id: input.roomId,
    probe_type: input.probeType,
    target: input.target,
    objective: input.objective ?? null,
  });
  const existing = pending.find((request) => equivalentKey(request) === key && Date.parse(request.expires_at) > now.getTime());
  if (existing) return existing;
  if (pending.length >= MAX_PENDING_PER_SOURCE) {
    throw new Error(`max pending environment probes reached for source ${input.sourceId}`);
  }
  const routeProbe = input.probeType === "route_feasibility" || input.probeType === "reachability";
  const request: HelixEnvironmentProbeRequest = {
    schema: HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA,
    probe_request_id: `environment_probe_request:${hashShort([key, now.toISOString(), ttlMs])}`,
    source_id: input.sourceId,
    room_id: input.roomId,
    domain: input.domain,
    domain_adapter: manifest?.domain_adapter ?? null,
    probe_type: input.probeType,
    reason: input.reason,
    objective: input.objective ?? null,
    target: input.target,
    constraints: {
      read_only: true,
      side_effects_allowed: false,
      max_radius: routeProbe ? ROUTE_MAX_RADIUS_BLOCKS : null,
      max_duration_ms: Math.min(ttlMs, DEFAULT_TTL_MS),
      ttl_ms: ttlMs,
    },
    evidence_refs: input.evidenceRefs,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + ttlMs).toISOString(),
  };
  pendingBySource.set(input.sourceId, [...pending, request]);
  return request;
}

export function listPendingEnvironmentProbeRequests(input: {
  sourceId: string;
  limit?: number;
  now?: string;
  sourceAdmission?: HelixRoomSourceAdmission | null;
}): HelixEnvironmentProbeRequest[] {
  const manifest = getEnvironmentSourceManifest(input.sourceId, {
    sourceAdmission: input.sourceAdmission,
  });
  assertHelixRoomSourceNamespaceAdmission(
    {
      source_id: input.sourceId,
      room_id:
        manifest?.room_id ??
        input.sourceAdmission?.room_id ??
        "",
      domain_adapter:
        manifest?.domain_adapter ??
        input.sourceAdmission?.domain_adapter ??
        null,
    },
    input.sourceAdmission,
  );
  expireEnvironmentProbeRequests({
    sourceId: input.sourceId,
    now: input.now,
    sourceAdmission: input.sourceAdmission,
  });
  return (pendingBySource.get(input.sourceId) ?? []).slice(0, input.limit ?? 8);
}

/**
 * Read-only queue presence check used to keep empty connector polls out of the
 * durable ingress receipt ledger. Exact source admission is still enforced by
 * the authenticated poll itself before any request can be returned.
 */
export function hasPendingEnvironmentProbeRequestsForSource(input: {
  sourceId: string;
  now?: string;
}): boolean {
  const now = Date.parse(input.now ?? new Date().toISOString());
  const pending = pendingBySource.get(input.sourceId) ?? [];
  const active = pending.filter(
    (request) => Date.parse(request.expires_at) > now,
  );
  if (active.length !== pending.length) {
    pendingBySource.set(input.sourceId, active);
  }
  return active.length > 0;
}

export function recordEnvironmentProbeResult(
  result: HelixEnvironmentProbeResult,
  options: {
    sourceAdmission?: HelixRoomSourceAdmission | null;
  } = {},
): {
  result: HelixEnvironmentProbeResult;
  audit: EnvironmentSourceContractAudit;
} {
  const manifest = getEnvironmentSourceManifest(result.source_id, {
    sourceAdmission: options.sourceAdmission,
  });
  assertHelixRoomSourceNamespaceAdmission(
    {
      source_id: result.source_id,
      room_id: result.room_id,
      domain_adapter: manifest?.domain_adapter ?? null,
    },
    options.sourceAdmission,
  );
  const policy = policyForEnvironmentSensorScope(result.sensor_scope);
  const normalized: HelixEnvironmentProbeResult = {
    ...result,
    requires_caveat: result.requires_caveat || policy.requires_caveat,
    side_effects_performed: result.side_effects_performed,
    commands_executed: result.commands_executed,
    world_mutation_performed: result.world_mutation_performed,
  };
  const audit = auditEnvironmentProbeContract({ subject: normalized, now: normalized.created_at });
  if (audit.ok) {
    resultsByRequest.set(normalized.probe_request_id, normalized);
    const pending = pendingBySource.get(normalized.source_id) ?? [];
    pendingBySource.set(
      normalized.source_id,
      pending.filter((request) => request.probe_request_id !== normalized.probe_request_id),
    );
  }
  return { result: normalized, audit };
}

export function expireEnvironmentProbeRequests(input: {
  sourceId?: string | null;
  now?: string;
  sourceAdmission?: HelixRoomSourceAdmission | null;
}): HelixEnvironmentProbeResult[] {
  const nowMs = Date.parse(input.now ?? new Date().toISOString());
  const expired: HelixEnvironmentProbeResult[] = [];
  for (const [sourceId, pending] of pendingBySource.entries()) {
    if (input.sourceId && sourceId !== input.sourceId) continue;
    if (
      isHelixRoomSourceIngressSourceId(sourceId) &&
      !pending.every((request) =>
        matchesHelixRoomSourceAdmission(
          {
            source_id: request.source_id,
            room_id: request.room_id,
            domain_adapter: request.domain_adapter ?? undefined,
          },
          input.sourceAdmission,
        ),
      )
    ) {
      continue;
    }
    const stillPending: HelixEnvironmentProbeRequest[] = [];
    for (const request of pending) {
      if (Date.parse(request.expires_at) <= nowMs) {
        const result: HelixEnvironmentProbeResult = {
          schema: HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA,
          probe_result_id: `environment_probe_result:${hashShort([request.probe_request_id, "expired"])}`,
          probe_request_id: request.probe_request_id,
          source_id: request.source_id,
          room_id: request.room_id,
          domain: request.domain,
          probe_type: request.probe_type,
          status: "expired",
          result_summary: "Probe request expired before the source returned a result.",
          result: {},
          sensor_scope: "unknown",
          requires_caveat: true,
          side_effects_performed: false,
          commands_executed: [],
          world_mutation_performed: false,
          evidence_refs: request.evidence_refs,
          deterministic: true,
          model_invoked: false,
          assistant_answer: false,
          raw_content_included: false,
          context_policy: "compact_context_pack_only",
          created_at: input.now ?? new Date().toISOString(),
        };
        resultsByRequest.set(request.probe_request_id, result);
        expired.push(result);
      } else {
        stillPending.push(request);
      }
    }
    pendingBySource.set(sourceId, stillPending);
  }
  return expired;
}

export function getEnvironmentProbeResult(
  requestId: string,
  options: {
    sourceAdmission?: HelixRoomSourceAdmission | null;
  } = {},
): HelixEnvironmentProbeResult | null {
  const result = resultsByRequest.get(requestId) ?? null;
  if (
    result &&
    isHelixRoomSourceIngressSourceId(result.source_id) &&
    !matchesHelixRoomSourceAdmission(
      {
        source_id: result.source_id,
        room_id: result.room_id,
      },
      options.sourceAdmission,
    )
  ) {
    return null;
  }
  return result;
}

export function removeEnvironmentProbeState(input: {
  sourceId?: string | null;
  roomId?: string | null;
}): { pending: number; results: number } {
  let pendingRemoved = 0;
  let resultsRemoved = 0;
  for (const [sourceId, pending] of pendingBySource.entries()) {
    if (input.sourceId && sourceId !== input.sourceId) continue;
    if (
      input.roomId &&
      !pending.some((request) => request.room_id === input.roomId)
    ) {
      continue;
    }
    pendingRemoved += pending.length;
    pendingBySource.delete(sourceId);
  }
  for (const [requestId, result] of resultsByRequest.entries()) {
    if (input.sourceId && result.source_id !== input.sourceId) continue;
    if (input.roomId && result.room_id !== input.roomId) continue;
    resultsByRequest.delete(requestId);
    resultsRemoved += 1;
  }
  return { pending: pendingRemoved, results: resultsRemoved };
}

export function resetEnvironmentProbeBrokerForTest(): void {
  pendingBySource.clear();
  resultsByRequest.clear();
}
