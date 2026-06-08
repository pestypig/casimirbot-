import crypto from "node:crypto";
import {
  LIVE_SOURCE_CAUSAL_TRACE_SCHEMA,
  type LiveSourceCausalTraceV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const firstValue = (values: Array<string | null | undefined>): string | null =>
  values.map((value) => String(value ?? "").trim()).find(Boolean) ?? null;

export function buildLiveSourceCausalTraceV1(input: {
  traceId?: string | null;
  cycleId?: string | null;
  parentRefs?: string[];
  causedBy?: string[];
  producedRefs?: string[];
  sourceIds?: string[];
  jobId?: string | null;
  policyId?: string | null;
  profileId?: string | null;
  askTurnId?: string | null;
  evidenceRefs?: string[];
}): LiveSourceCausalTraceV1 {
  const parentRefs = uniqueStrings(input.parentRefs ?? []);
  const causedBy = uniqueStrings(input.causedBy ?? []);
  const producedRefs = uniqueStrings(input.producedRefs ?? []);
  const sourceIds = uniqueStrings(input.sourceIds ?? []);
  const evidenceRefs = uniqueStrings([
    ...parentRefs,
    ...causedBy,
    ...producedRefs,
    ...sourceIds,
    input.jobId,
    input.policyId,
    input.profileId,
    input.askTurnId,
    ...(input.evidenceRefs ?? []),
  ]);
  const traceSeed = uniqueStrings([
    ...parentRefs,
    ...causedBy,
    ...sourceIds,
    input.jobId,
    input.policyId,
    input.profileId,
  ]);
  return {
    schemaVersion: LIVE_SOURCE_CAUSAL_TRACE_SCHEMA,
    traceId: input.traceId?.trim() || `live_source_trace:${hashShort(traceSeed.length > 0 ? traceSeed : evidenceRefs)}`,
    cycleId: input.cycleId?.trim() || `live_source_cycle:${hashShort([
      input.traceId ?? null,
      ...parentRefs,
      ...causedBy,
      ...producedRefs,
    ])}`,
    parentRefs,
    causedBy,
    producedRefs,
    sourceIds,
    jobId: input.jobId ?? null,
    policyId: input.policyId ?? null,
    profileId: input.profileId ?? null,
    askTurnId: input.askTurnId ?? null,
    evidenceRefs,
  };
}

export function mergeLiveSourceCausalTraces(
  traces: Array<LiveSourceCausalTraceV1 | null | undefined>,
  patch: {
    traceId?: string | null;
    cycleId?: string | null;
    parentRefs?: string[];
    causedBy?: string[];
    producedRefs?: string[];
    sourceIds?: string[];
    jobId?: string | null;
    policyId?: string | null;
    profileId?: string | null;
    askTurnId?: string | null;
    evidenceRefs?: string[];
  } = {},
): LiveSourceCausalTraceV1 {
  const existing = traces.filter((trace): trace is LiveSourceCausalTraceV1 => Boolean(trace));
  return buildLiveSourceCausalTraceV1({
    traceId: patch.traceId ?? firstValue(existing.map((trace) => trace.traceId)),
    cycleId: patch.cycleId ?? firstValue(existing.map((trace) => trace.cycleId)),
    parentRefs: uniqueStrings([
      ...existing.flatMap((trace) => trace.parentRefs),
      ...existing.flatMap((trace) => trace.producedRefs),
      ...(patch.parentRefs ?? []),
    ]),
    causedBy: uniqueStrings([
      ...existing.flatMap((trace) => trace.causedBy),
      ...(patch.causedBy ?? []),
    ]),
    producedRefs: uniqueStrings([
      ...existing.flatMap((trace) => trace.producedRefs),
      ...(patch.producedRefs ?? []),
    ]),
    sourceIds: uniqueStrings([
      ...existing.flatMap((trace) => trace.sourceIds),
      ...(patch.sourceIds ?? []),
    ]),
    jobId: patch.jobId ?? firstValue(existing.map((trace) => trace.jobId)),
    policyId: patch.policyId ?? firstValue(existing.map((trace) => trace.policyId)),
    profileId: patch.profileId ?? firstValue(existing.map((trace) => trace.profileId)),
    askTurnId: patch.askTurnId ?? firstValue(existing.map((trace) => trace.askTurnId)),
    evidenceRefs: uniqueStrings([
      ...existing.flatMap((trace) => trace.evidenceRefs),
      ...(patch.evidenceRefs ?? []),
    ]),
  });
}
