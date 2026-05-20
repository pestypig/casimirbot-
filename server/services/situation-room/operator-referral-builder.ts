import { buildMinecraftRouteAssistReferral, type DotOperatorReferral } from "../../../shared/helix-operator-referral.ts";
import type { MinecraftRouteDriftEvent } from "../../../shared/helix-minecraft-route-drift.ts";
import type { MinecraftRouteObjectiveState } from "../../../shared/helix-minecraft-route-objective.ts";
import type { MinecraftRouteRehearsal } from "./minecraft-end-return-route-builder.ts";
import { makeId } from "../../../shared/helix-minecraft-evidence.ts";

export function buildRouteAssistOperatorReferral(input: {
  thread_id: string;
  objective: MinecraftRouteObjectiveState;
  rehearsal?: MinecraftRouteRehearsal | null;
  drift?: MinecraftRouteDriftEvent | null;
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

  if (!input.drift?.salience_candidate) {
    return null;
  }

  return buildMinecraftRouteAssistReferral({
    referral_id: makeId("operator_referral", input.drift.drift_event_id),
    reason_code: "wrong_direction_from_end_return_route",
    room_id: input.objective.room_id,
    thread_id: input.thread_id,
    source_ids: [input.objective.world_id, input.objective.actor_id ?? ""].filter(Boolean),
    related_objective_id: input.objective.objective_id,
    related_rehearsal_id: input.rehearsal?.route_rehearsal_id ?? null,
    related_anomaly_id: input.drift.drift_event_id,
    related_policy_receipt_id: input.salience_decision_id ?? null,
    operator_action: "review_or_surface_guidance",
    evidence_refs: [
      input.objective.objective_id,
      ...(input.rehearsal ? [input.rehearsal.route_rehearsal_id] : []),
      input.drift.drift_event_id,
    ],
  });
}
