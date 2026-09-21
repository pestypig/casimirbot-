import { setTimeout as delay } from "node:timers/promises";
import { readTemporalPublicationClock } from "./temporal-publication-clock";
import { HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY } from "@shared/helix-environment-connector";
import type { HelixEnvironmentAffordanceEntry } from "@shared/helix-environment-time";
import { resolveTemporalPerceptionContext } from "./temporal-perception-context";
import { EnvironmentTemporalFrontierStore } from "./temporal-frontier-store";
import { MINECRAFT_TEMPORAL_FRONTIER_WINDOW_TICKS } from "./temporal-observation-window";
import { TemporalPlanError } from "./temporal-plan-error";
import { readTemporalSuccessorContext } from "./temporal-successor-context";

const store = new EnvironmentTemporalFrontierStore();
const RESIDENT_CLOCK_CATCHUP_ATTEMPTS = 6;
const RESIDENT_CLOCK_CATCHUP_DELAY_MS = 200;

export const publishTemporalPerceptionFrontier = async (
  input: Parameters<typeof resolveTemporalPerceptionContext>[0],
  frontierStore: Pick<EnvironmentTemporalFrontierStore, "publish"> = store,
) => {
  const requestReceived = readTemporalPublicationClock();
  // A same-player perception can outrun the one-second Fabric heartbeat while
  // a plan is moving. Wait only for a *measured* matching heartbeat; each read
  // revalidates the goal, authority, producer epoch and five-second evidence
  // window. Never extrapolate a resident tick or admit a stale observation.
  let context = await resolveTemporalPerceptionContext(input);
  for (let attempt = 0; attempt < RESIDENT_CLOCK_CATCHUP_ATTEMPTS; attempt++) {
    const observedTick = context.evidence.observation.result.game_tick;
    const observedRevision = context.evidence.observation.result.observation_revision;
    if (!Number.isSafeInteger(observedTick) || Number(observedTick) < 0 ||
        !Number.isSafeInteger(observedRevision) || Number(observedRevision) < 0 ||
        Number(observedTick) > Number.MAX_SAFE_INTEGER - MINECRAFT_TEMPORAL_FRONTIER_WINDOW_TICKS) {
      throw new TemporalPlanError("temporal_frontier_observation_clock_invalid");
    }
    const resident = context.catalog.resident_clock_observation;
    const residentTick = resident?.clock.world_tick_index;
    if (!resident || (resident.producer_epoch_ref === context.action_producer_epoch_ref &&
        resident.clock.clock_kind === "minecraft_game_tick" &&
        Number.isSafeInteger(residentTick) && Number(residentTick) >= Number(observedTick))) break;
    if (resident.producer_epoch_ref !== context.action_producer_epoch_ref ||
        resident.clock.clock_kind !== "minecraft_game_tick" ||
        !Number.isSafeInteger(residentTick) || attempt === RESIDENT_CLOCK_CATCHUP_ATTEMPTS - 1) {
      throw new TemporalPlanError("temporal_frontier_resident_clock_unmapped");
    }
    await delay(RESIDENT_CLOCK_CATCHUP_DELAY_MS);
    context = await resolveTemporalPerceptionContext(input);
  }
  const identity = context.goal.identity;
  const snapshot = context.evidence.observation.result;
  const tick = snapshot.game_tick;
  const revision = snapshot.observation_revision;
  if (!Number.isSafeInteger(tick) || Number(tick) < 0 ||
      !Number.isSafeInteger(revision) || Number(revision) < 0 || Number(tick) > Number.MAX_SAFE_INTEGER - MINECRAFT_TEMPORAL_FRONTIER_WINDOW_TICKS) {
    throw new TemporalPlanError("temporal_frontier_observation_clock_invalid");
  }
  const resident = context.catalog.resident_clock_observation;
  const residentTick = resident?.clock.world_tick_index;
  if (resident && (resident.producer_epoch_ref !== context.action_producer_epoch_ref ||
      resident.clock.clock_kind !== "minecraft_game_tick" ||
      !Number.isSafeInteger(residentTick) || Number(residentTick) < Number(tick))) {
    throw new TemporalPlanError("temporal_frontier_resident_clock_unmapped");
  }
  if (resident && Number(residentTick) >= Number(tick) + MINECRAFT_TEMPORAL_FRONTIER_WINDOW_TICKS) {
    throw new TemporalPlanError("temporal_frontier_resident_clock_expired");
  }
  const entries: HelixEnvironmentAffordanceEntry[] = context.catalog.capabilities.map(capability => ({
    capability_id: capability.capability_id, capability_version: String(capability.capability_version),
    subject_id: identity.subject_binding_id,
    state: !capability.policy_listed || !capability.native_fabric_available ? "blocked" : "conditional",
    reason_codes: !capability.policy_listed ? ["authority_capability_not_listed"] :
      !capability.native_fabric_available ? ["native_fabric_unavailable"] : ["requires_action_specific_preconditions"],
    required_authority_ids: [identity.action_authority_id], held_resource_keys: [],
    parameter_bounds: {}, missing_observation_kinds: ["action_specific_preconditions", "resident_resource_ownership"],
    evidence_probe_capability_ids: [HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY],
  }));
  const published = await frontierStore.publish({ profileId: input.profileId, participantId: input.participantId,
    observationEvidenceRef: context.evidence.observation.evidence_ref,
    observationProducerEpochRef: context.observation_producer_epoch_ref,
    retainedUntil: new Date(Date.parse(context.evidence.observation.observed_at) + 60_000).toISOString(),
    draft: {
      identity: { environment_id: identity.environment_binding_id, source_id: identity.source_id,
        subject_id: identity.subject_binding_id, producer_epoch: context.action_producer_epoch_ref,
        authority_id: identity.action_authority_id, authority_revision: identity.authority_policy_version,
        goal_id: context.goal.goal_id, goal_revision: context.goal.goal_revision, observation_revision: Number(revision) },
      clocks: { environment: { kind: "tick", sequence: Number(tick), resolution_unit: "minecraft_world_tick", nominal_units_per_second: 20 },
        // The public three-clock contract uses completed integer milliseconds.
        // This is a server-publication clock, never the resident execution clock.
        monotonic: readTemporalPublicationClock(),
        audit_at: context.evidence.observation.observed_at },
      expires_at_environment_sequence: Number(tick) + MINECRAFT_TEMPORAL_FRONTIER_WINDOW_TICKS, entries,
    },
  });
  const successorContext = await readTemporalSuccessorContext(context);
  // Response-ready is not provider receipt, and must follow both awaited steps.
  // Keep diagnostics outside the hash-bound frontier and admission authority.
  try {
    const responseReady = readTemporalPublicationClock();
    console.info("[temporal-frontier-response-timing]", {
      frontier_id: published.frontier.frontier_id,
      run_id: identity.run_id ?? null,
      goal_id: context.goal.goal_id,
      goal_revision: context.goal.goal_revision,
      producer_epoch_ref: context.action_producer_epoch_ref,
      observation_evidence_ref: context.evidence.observation.evidence_ref,
      checkpoint_id: successorContext.available ? successorContext.checkpoint.checkpoint_id : null,
      predecessor_plan_id: successorContext.available ? successorContext.previous_plan_id : null,
      clock_origin: responseReady.origin_id,
      request_received_ms: requestReceived.elapsed_ms,
      response_ready_ms: responseReady.elapsed_ms,
      provider_receipt_proven: false,
      execution_authority: false,
      live_acceptance: false,
    });
  } catch {
    // A diagnostic sink failure must not turn a published response into a retry.
  }
  return { ...published, monotonic_clock_basis: "server_publication_not_resident_execution" as const,
    // Deliberately do not spread catalog.context: it is an internal authority
    // record. These observed locators permit caller-authored plans; preflight
    // still independently resolves current authority, identity and clocks.
    planning_context: {
      successor_context: successorContext,
      catalog_snapshot_id: context.catalog.context.catalogSnapshotId,
      resident_clock_observation: context.catalog.resident_clock_observation,
      observation_producer_epoch_ref: context.observation_producer_epoch_ref,
      action_producer_epoch_ref: context.action_producer_epoch_ref,
      clock_extrapolated: false as const,
      execution_authority: false as const,
      answer_authority: false as const,
      terminal_eligible: false as const,
    },
    resident_clock_alignment_proven: false as const, execution_authority: false as const };
};
