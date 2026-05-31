import { buildMinecraftRouteAssistReferral, type DotOperatorReferral } from "../../../shared/helix-operator-referral.ts";
import type { MinecraftRouteDriftEvent } from "../../../shared/helix-minecraft-route-drift.ts";
import type { MinecraftRouteObjectiveState } from "../../../shared/helix-minecraft-route-objective.ts";
import type { MinecraftRouteRehearsal } from "./minecraft-end-return-route-builder.ts";
import type { MinecraftRouteLifecycleReceipt } from "./minecraft-route-lifecycle-reducer.ts";
import { makeId } from "../../../shared/helix-minecraft-evidence.ts";

export function buildRouteAssistOperatorReferral(input: {
  thread_id: string;
  objective: MinecraftRouteObjectiveState;
  rehearsal?: MinecraftRouteRehearsal | null;
  drift?: MinecraftRouteDriftEvent | null;
  lifecycle_receipts?: MinecraftRouteLifecycleReceipt[];
  salience_decision_id?: string | null;
  identity_binding_missing?: boolean;
}): DotOperatorReferral | null {
  if (input.identity_binding_missing) {
    return buildMinecraftRouteAssistReferral({
      referral_id: makeId("operator_referral", `${input.objective.objective_id}_identity`),
      reason_code: "identity_binding_missing",
      room_id: input.objective.room_id,
      thread_id: input.thread_id,
      source_ids: [input.objective.world_id, input.objective.actor_id ?? ""].filter(Boolean),
      related_objective_id: input.objective.objective_id,
      related_rehearsal_id: input.rehearsal?.route_rehearsal_id ?? null,
      related_anomaly_id: input.drift?.drift_event_id ?? null,
      related_policy_receipt_id: input.salience_decision_id ?? null,
      operator_action: "request_missing_evidence",
      evidence_refs: input.objective.evidence_refs,
    });
  }

  const latestLifecycle = input.lifecycle_receipts?.at(-1) ?? null;
  if (latestLifecycle?.reason === "player_death") {
    return routeReferral({
      input,
      reason_code: "player_death_route_invalidated",
      suffix: latestLifecycle.receipt_id,
      operator_action: "review_or_surface_guidance",
      evidence_refs: [input.objective.objective_id, latestLifecycle.receipt_id, ...latestLifecycle.evidence_refs],
    });
  }

  if (
    latestLifecycle?.next_lifecycle === "stale" ||
    input.objective.lifecycle === "stale" ||
    input.objective.lifecycle === "cancelled" ||
    input.drift?.drift_status === "stale_route"
  ) {
    return routeReferral({
      input,
      reason_code: "stale_route_objective",
      suffix: latestLifecycle?.receipt_id ?? input.drift?.drift_event_id ?? input.objective.objective_id,
      operator_action: "request_missing_evidence",
      evidence_refs: [
        input.objective.objective_id,
        ...(latestLifecycle ? [latestLifecycle.receipt_id, ...latestLifecycle.evidence_refs] : []),
        ...(input.drift ? [input.drift.drift_event_id, ...input.drift.evidence_refs] : []),
      ],
    });
  }

  if (input.rehearsal?.missing_evidence_codes.includes("no_gateway_candidate")) {
    return routeReferral({
      input,
      reason_code: "return_route_unknown_gateway",
      suffix: `${input.rehearsal.route_rehearsal_id}_gateway`,
      operator_action: "request_missing_evidence",
      evidence_refs: [
        input.objective.objective_id,
        input.rehearsal.route_rehearsal_id,
        ...input.rehearsal.evidence_refs,
      ],
    });
  }

  if (input.rehearsal?.missing_evidence_codes.includes("home_binding_unknown")) {
    return routeReferral({
      input,
      reason_code: "home_binding_missing",
      suffix: `${input.rehearsal.route_rehearsal_id}_home`,
      operator_action: "request_missing_evidence",
      evidence_refs: [
        input.objective.objective_id,
        input.rehearsal.route_rehearsal_id,
        ...input.rehearsal.evidence_refs,
      ],
    });
  }

  if (input.rehearsal?.missing_evidence_codes.includes("route_includes_void_adjacent_bridge")) {
    return routeReferral({
      input,
      reason_code: "void_risk_on_route",
      suffix: `${input.rehearsal.route_rehearsal_id}_void`,
      operator_action: "review_or_surface_guidance",
      evidence_refs: [
        input.objective.objective_id,
        input.rehearsal.route_rehearsal_id,
        ...input.rehearsal.evidence_refs,
      ],
    });
  }

  if (input.rehearsal && input.rehearsal.route_confidence < 0.55) {
    return routeReferral({
      input,
      reason_code: "route_confidence_low",
      suffix: `${input.rehearsal.route_rehearsal_id}_low_confidence`,
      operator_action: "request_missing_evidence",
      evidence_refs: [
        input.objective.objective_id,
        input.rehearsal.route_rehearsal_id,
        ...input.rehearsal.evidence_refs,
      ],
    });
  }

  if (!input.drift?.salience_candidate) {
    return null;
  }

  return routeReferral({
    input,
    reason_code: "wrong_direction_from_end_return_route",
    suffix: input.drift.drift_event_id,
    operator_action: "review_or_surface_guidance",
    evidence_refs: [
      input.objective.objective_id,
      ...(input.rehearsal ? [input.rehearsal.route_rehearsal_id] : []),
      input.drift.drift_event_id,
    ],
  });
}

function routeReferral(input: {
  input: {
    thread_id: string;
    objective: MinecraftRouteObjectiveState;
    rehearsal?: MinecraftRouteRehearsal | null;
    drift?: MinecraftRouteDriftEvent | null;
    salience_decision_id?: string | null;
  };
  reason_code:
    | "wrong_direction_from_end_return_route"
    | "return_route_unknown_gateway"
    | "void_risk_on_route"
    | "home_binding_missing"
    | "stale_route_objective"
    | "player_death_route_invalidated"
    | "route_confidence_low";
  suffix: string;
  operator_action: "review_or_surface_guidance" | "request_missing_evidence";
  evidence_refs: string[];
}): DotOperatorReferral {
  return buildMinecraftRouteAssistReferral({
    referral_id: makeId("operator_referral", input.suffix),
    reason_code: input.reason_code,
    room_id: input.input.objective.room_id,
    thread_id: input.input.thread_id,
    source_ids: [input.input.objective.world_id, input.input.objective.actor_id ?? ""].filter(Boolean),
    related_objective_id: input.input.objective.objective_id,
    related_rehearsal_id: input.input.rehearsal?.route_rehearsal_id ?? null,
    related_anomaly_id: input.input.drift?.drift_event_id ?? null,
    related_policy_receipt_id: input.input.salience_decision_id ?? null,
    operator_action: input.operator_action,
    evidence_refs: Array.from(new Set(input.evidence_refs)).slice(-48),
  });
}
