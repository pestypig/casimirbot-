import crypto from "node:crypto";
import {
  HELIX_LIVE_SOURCE_IDENTITY_SCHEMA,
  liveSourceIdentityRefFor,
  type HelixLiveSourceBindingStatus,
  type HelixLiveSourceConsentState,
  type HelixLiveSourceIdentity,
  type HelixLiveSourceOrigin,
  type HelixLiveSourceSurface,
} from "@shared/helix-live-source-identity";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";

const identitiesByRef = new Map<string, HelixLiveSourceIdentity>();
const latestRefBySource = new Map<string, string>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const sourceKey = (input: { thread_id: string; source_id: string }): string =>
  `${input.thread_id}::${input.source_id}`;

export const liveSourceBindingIdFor = (input: {
  thread_id: string;
  environment_id?: string | null;
  source_id: string;
  modality: string;
}): string => `source_binding:${hashShort([
  input.thread_id,
  input.environment_id ?? null,
  input.source_id,
  input.modality,
])}`;

export function upsertLiveSourceIdentityFromChunk(input: {
  chunk: HelixLiveSourceChunk;
  sourceBindingId?: string | null;
  sourceSurface?: HelixLiveSourceSurface;
  sourceOrigin?: HelixLiveSourceOrigin;
  consentState?: HelixLiveSourceConsentState;
  bindingStatus?: HelixLiveSourceBindingStatus;
  latestObservationId?: string | null;
  latestEvidenceRefs?: string[];
  freshnessMs?: number | null;
}): HelixLiveSourceIdentity {
  const epoch = Math.max(1, Math.trunc(input.chunk.source_epoch ?? input.chunk.sequence_index ?? 1));
  const ref = `live_source_identity:${hashShort([
    input.chunk.thread_id,
    input.chunk.source_id,
    input.chunk.environment_id ?? null,
    input.chunk.modality,
    epoch,
  ])}`;
  const priorRef = latestRefBySource.get(sourceKey(input.chunk));
  const prior = priorRef ? identitiesByRef.get(priorRef) : null;
  const identity: HelixLiveSourceIdentity = {
    schema: HELIX_LIVE_SOURCE_IDENTITY_SCHEMA,
    source_id: input.chunk.source_id,
    thread_id: input.chunk.thread_id,
    environment_id: input.chunk.environment_id ?? null,
    source_binding_id: input.sourceBindingId ?? input.chunk.source_binding_id ?? prior?.source_binding_id ?? null,
    producer_id: prior?.producer_id ?? null,
    modality: input.chunk.modality,
    source_surface: input.sourceSurface ?? prior?.source_surface ?? "screen",
    source_origin: input.sourceOrigin ?? prior?.source_origin ?? "browser_getDisplayMedia",
    consent_state: input.consentState ?? input.chunk.consent_state ?? prior?.consent_state ?? "granted",
    binding_status: input.bindingStatus ?? (input.sourceBindingId || input.chunk.source_binding_id ? "bound" : "observed_unbound"),
    capture_session_id: prior?.capture_session_id ?? null,
    surface_fingerprint: prior?.surface_fingerprint ?? null,
    latest_epoch: epoch,
    latest_observation_id: input.latestObservationId ?? prior?.latest_observation_id ?? null,
    latest_evidence_refs: Array.from(new Set([
      ...(input.latestEvidenceRefs ?? []),
      ...input.chunk.evidence_refs,
    ])),
    freshness_ms: input.freshnessMs ?? input.chunk.freshness_ms ?? prior?.freshness_ms ?? null,
    assistant_answer: false,
    raw_content_included: false,
  };
  identitiesByRef.set(ref, identity);
  identitiesByRef.set(liveSourceIdentityRefFor(identity), identity);
  latestRefBySource.set(sourceKey(input.chunk), ref);
  return identity;
}

export function getLiveSourceIdentity(ref: string): HelixLiveSourceIdentity | null {
  return identitiesByRef.get(ref) ?? null;
}

export function getLatestLiveSourceIdentity(input: {
  threadId: string;
  sourceId: string;
}): HelixLiveSourceIdentity | null {
  const ref = latestRefBySource.get(`${input.threadId}::${input.sourceId}`);
  return ref ? identitiesByRef.get(ref) ?? null : null;
}

export function resetLiveSourceIdentitiesForTest(): void {
  identitiesByRef.clear();
  latestRefBySource.clear();
}
