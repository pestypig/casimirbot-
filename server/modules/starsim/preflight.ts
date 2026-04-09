import { canonicalizeStarSimRequest } from "./canonicalize";
import { evaluateStarSimSupportedDomain } from "./domain";
import type {
  StarSimBenchmarkTargetMatchMode,
  RequestedLane,
  StarSimPreconditionPolicy,
  StarSimPreflight,
  StarSimPreflightLane,
  StarSimRequest,
} from "./contract";

const requestedLaneOrder: RequestedLane[] = [
  "classification",
  "structure_1d",
  "structure_mesa",
  "oscillation_gyre",
  "activity",
  "barycenter",
];

const orderedUniqueLanes = (lanes: RequestedLane[]): RequestedLane[] =>
  Array.from(new Set(lanes)).sort((left, right) => requestedLaneOrder.indexOf(left) - requestedLaneOrder.indexOf(right));

const reasonList = (reasons: Iterable<string>): string[] => Array.from(new Set(reasons)).sort((left, right) => left.localeCompare(right));

const buildLane = (args: {
  requestedLane: RequestedLane;
  ready: boolean;
  willRun: boolean;
  blockedReasons: string[];
  dependsOn?: RequestedLane[];
  request: ReturnType<typeof canonicalizeStarSimRequest>;
}): StarSimPreflightLane => ({
  requested_lane: args.requestedLane,
  ready: args.ready,
  will_run: args.willRun,
  blocked_reasons: reasonList(args.blockedReasons),
  supported_domain:
    args.requestedLane === "structure_mesa" || args.requestedLane === "oscillation_gyre"
      ? evaluateStarSimSupportedDomain(args.request, args.requestedLane)
      : null,
  depends_on: args.dependsOn ?? [],
});

export const evaluateStarSimPreflight = (args: {
  request: StarSimRequest;
  sourceReasons?: string[];
  policy?: StarSimPreconditionPolicy;
  benchmarkTargetId?: string;
  benchmarkTargetMatchMode?: StarSimBenchmarkTargetMatchMode;
  benchmarkTargetConflictReason?: string;
  benchmarkTargetQualityOk?: boolean;
  fallbackUsed?: boolean;
  qualityRejections?: Array<{ reason: string }>;
}): StarSimPreflight => {
  const policy = args.policy ?? args.request.precondition_policy ?? "strict_requested_lanes";
  const canonical = canonicalizeStarSimRequest(args.request);
  const requestedLanes = orderedUniqueLanes(canonical.requested_lanes);
  const sourceReasons = new Set(args.sourceReasons ?? []);
  const byLane: Partial<Record<RequestedLane, StarSimPreflightLane>> = {};

  const structureDomain = requestedLanes.includes("structure_mesa")
    ? evaluateStarSimSupportedDomain(canonical, "structure_mesa")
    : null;
  const structureBlockedReasons = structureDomain
    ? reasonList([
        ...structureDomain.reasons,
        ...(sourceReasons.has("spectroscopy_unresolved") ? ["spectroscopy_unresolved"] : []),
      ])
    : [];
  const structureReady = structureDomain ? structureBlockedReasons.length === 0 : false;

  const oscillationDomain = requestedLanes.includes("oscillation_gyre")
    ? evaluateStarSimSupportedDomain(canonical, "oscillation_gyre")
    : null;
  const oscillationBlockedReasons = oscillationDomain
    ? reasonList([
        ...oscillationDomain.reasons,
        ...(sourceReasons.has("seismology_unresolved") ? ["seismology_unresolved"] : []),
        ...(structureReady ? [] : ["structure_required_first"]),
      ])
    : [];
  const oscillationReady = oscillationDomain ? oscillationBlockedReasons.length === 0 : false;

  let prefixBlocked = false;
  const runnableLanes: RequestedLane[] = [];
  const blockedLanes: RequestedLane[] = [];

  for (const lane of requestedLanes) {
    let ready = true;
    let blockedReasons: string[] = [];
    let dependsOn: RequestedLane[] = [];

    if (lane === "structure_mesa") {
      ready = structureReady;
      blockedReasons = structureBlockedReasons;
    } else if (lane === "oscillation_gyre") {
      ready = oscillationReady;
      blockedReasons = oscillationBlockedReasons;
      dependsOn = ["structure_mesa"];
    }

    const willRun =
      policy === "strict_requested_lanes"
        ? ready
        : !prefixBlocked && ready;

    if (policy === "run_available_prefix" && !ready) {
      prefixBlocked = true;
    }

    if (willRun) {
      runnableLanes.push(lane);
    } else {
      blockedLanes.push(lane);
    }

    byLane[lane] = buildLane({
      requestedLane: lane,
      ready,
      willRun,
      blockedReasons,
      dependsOn,
      request: canonical,
    });
  }

  const blockedReasons = reasonList(
    blockedLanes.flatMap((lane) => byLane[lane]?.blocked_reasons ?? []),
  );
  const enqueueAllowed =
    policy === "strict_requested_lanes"
      ? blockedLanes.length === 0
      : runnableLanes.length > 0;

  return {
    policy,
    requested_lanes: requestedLanes,
    runnable_lanes: runnableLanes,
    blocked_lanes: blockedLanes,
    blocked_reasons: blockedReasons,
    passed: blockedLanes.length === 0,
    enqueue_allowed: enqueueAllowed,
    by_lane: byLane,
    benchmark_target_id: args.benchmarkTargetId,
    benchmark_backed: Boolean(args.benchmarkTargetId),
    benchmark_target_match_mode: args.benchmarkTargetMatchMode,
    benchmark_target_conflict_reason: args.benchmarkTargetConflictReason,
    benchmark_target_quality_ok: args.benchmarkTargetQualityOk,
    source_resolution_quality_ok: (args.qualityRejections ?? []).length === 0,
    fallback_used: args.fallbackUsed ?? false,
  };
};
