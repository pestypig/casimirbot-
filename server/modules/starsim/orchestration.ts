import { hashStableJson } from "../../utils/information-boundary";
import type {
  RequestedLane,
  StarSimArtifactRef,
  StarSimJobRecord,
  StarSimLanePlan,
  StarSimPreconditionPolicy,
  StarSimResolveBeforeRunResponse,
  StarSimRequest,
  StarSimSourceContext,
  StarSimSourceSelectionOrigin,
} from "./contract";
import { evaluateStarSimPreflight } from "./preflight";
import { resolveStarSimSources } from "./sources/registry";

const artifactRefByKind = (artifactRefs: StarSimArtifactRef[], kind: string): string | null =>
  artifactRefs.find((artifact) => artifact.kind === kind)?.path ?? null;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))));

const buildSelectedFieldOrigins = (
  fields: Record<string, { selected_from: StarSimSourceSelectionOrigin }>,
): Record<string, StarSimSourceSelectionOrigin> =>
  Object.fromEntries(
    Object.entries(fields)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([fieldPath, field]) => [fieldPath, field.selected_from]),
  );

const buildLanePlan = (args: {
  policy: StarSimPreconditionPolicy;
  requestedLanes: RequestedLane[];
  runnableLanes: RequestedLane[];
  blockedLanes: RequestedLane[];
  byLane: Partial<Record<RequestedLane, { blocked_reasons: string[] }>>;
}): StarSimLanePlan => ({
  policy: args.policy,
  requested_lanes: args.requestedLanes,
  runnable_lanes: args.runnableLanes,
  blocked_lanes: args.blockedLanes,
  blocked_reasons_by_lane: Object.fromEntries(
    args.blockedLanes.map((lane) => [lane, args.byLane[lane]?.blocked_reasons ?? []]),
  ) as Partial<Record<RequestedLane, string[]>>,
});

const buildFrozenDraft = (args: {
  originalRequest: StarSimRequest;
  resolvedDraft: StarSimRequest;
  sourceContext: StarSimSourceContext;
  runnableLanes: RequestedLane[];
  sourceArtifactRefs: StarSimArtifactRef[];
}): StarSimRequest => ({
  ...args.resolvedDraft,
  identifiers: args.resolvedDraft.identifiers ?? args.originalRequest.identifiers,
  source_hints: args.originalRequest.source_hints,
  source_policy: args.originalRequest.source_policy,
  requested_lanes: args.runnableLanes,
  resolve_before_run: false,
  precondition_policy: args.originalRequest.precondition_policy ?? "strict_requested_lanes",
  evidence_refs: uniqueStrings([
    ...(args.resolvedDraft.evidence_refs ?? []),
    ...(args.originalRequest.evidence_refs ?? []),
    ...args.sourceArtifactRefs.map((artifact) => artifact.path),
  ]),
  source_context: args.sourceContext,
});

export type StarSimResolveBeforeRunSubmission =
  | {
      status: "blocked";
      response: StarSimResolveBeforeRunResponse;
    }
  | {
      status: "enqueued";
      response: StarSimResolveBeforeRunResponse;
      frozen_request: StarSimRequest;
      job_meta: {
        resolved_draft_hash: string;
        resolved_draft_ref: string | null;
        source_resolution_ref: string | null;
        source_cache_key: string;
        lane_plan: StarSimLanePlan;
        precondition_policy: StarSimPreconditionPolicy;
      };
    };

export const prepareStarSimResolveBeforeRun = async (
  request: StarSimRequest,
): Promise<StarSimResolveBeforeRunSubmission> => {
  const resolved = await resolveStarSimSources(request);
  const policy = request.precondition_policy ?? "strict_requested_lanes";
  const sourceResolutionRef = artifactRefByKind(resolved.source_resolution.artifact_refs, "resolve_response");
  const resolvedDraftRef = artifactRefByKind(resolved.source_resolution.artifact_refs, "canonical_request");
  const selectionManifestRef = artifactRefByKind(resolved.source_resolution.artifact_refs, "selection_manifest");
  const resolvedDraftHash = resolved.canonical_request_draft ? hashStableJson(resolved.canonical_request_draft) : null;
  const preflight = evaluateStarSimPreflight({
    request: resolved.canonical_request_draft ?? request,
    sourceReasons: resolved.source_resolution.reasons,
    policy,
  });
  const lanePlan = buildLanePlan({
    policy,
    requestedLanes: preflight.requested_lanes,
    runnableLanes: preflight.runnable_lanes,
    blockedLanes: preflight.blocked_lanes,
    byLane: preflight.by_lane,
  });

  const baseResponse: StarSimResolveBeforeRunResponse = {
    schema_version: "star-sim-resolve-run-v1",
    resolution_stage: preflight.enqueue_allowed ? "job_enqueued" : "preflight_blocked",
    job_enqueued: false,
    job_id: null,
    result_url: null,
    policy_used: policy,
    target: resolved.target,
    identifiers_resolved: resolved.identifiers_resolved,
    source_resolution_ref: sourceResolutionRef,
    resolved_draft_ref: resolvedDraftRef,
    resolved_draft_hash: resolvedDraftHash,
    source_cache_key: resolved.source_resolution.cache_key,
    source_artifact_refs: resolved.source_resolution.artifact_refs,
    preflight,
    lane_plan: lanePlan,
    blocked_reasons: preflight.blocked_reasons,
  };

  if (!resolved.canonical_request_draft || !preflight.enqueue_allowed || !resolvedDraftHash) {
    return {
      status: "blocked",
      response: baseResponse,
    };
  }

  const frozenRequest: StarSimRequest = buildFrozenDraft({
    originalRequest: request,
    resolvedDraft: resolved.canonical_request_draft,
    sourceContext: {
      source_cache_key: resolved.source_resolution.cache_key,
      source_resolution_ref: sourceResolutionRef ?? undefined,
      source_selection_manifest_ref: selectionManifestRef ?? undefined,
      resolved_draft_ref: resolvedDraftRef ?? undefined,
      resolved_draft_hash: resolvedDraftHash,
      identifiers_resolved: resolved.identifiers_resolved,
      fetch_modes_by_catalog: resolved.source_resolution.fetch_modes_by_catalog,
      selected_field_origins: buildSelectedFieldOrigins(resolved.source_resolution.selection_manifest.fields),
    },
    runnableLanes: preflight.runnable_lanes,
    sourceArtifactRefs: resolved.source_resolution.artifact_refs,
  });

  return {
    status: "enqueued",
    response: baseResponse,
    frozen_request: frozenRequest,
    job_meta: {
      resolved_draft_hash: resolvedDraftHash,
      resolved_draft_ref: resolvedDraftRef,
      source_resolution_ref: sourceResolutionRef,
      source_cache_key: resolved.source_resolution.cache_key,
      lane_plan: lanePlan,
      precondition_policy: policy,
    },
  };
};

export const buildResolveBeforeRunEnqueuedResponse = (args: {
  base: StarSimResolveBeforeRunResponse;
  job: StarSimJobRecord;
}): StarSimResolveBeforeRunResponse & StarSimJobRecord & {
  job_id: string;
  result_url: string;
} => ({
  ...args.base,
  ...args.job,
  resolution_stage: "job_enqueued",
  job_enqueued: true,
  job_id: args.job.job_id,
  result_url: `/api/star-sim/v1/jobs/${args.job.job_id}/result`,
});
