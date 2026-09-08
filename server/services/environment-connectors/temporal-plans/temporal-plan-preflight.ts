import { evaluateHelixEnvironmentPlanCurrentness, helixEnvironmentTemporalPlanSchema } from "@shared/helix-environment-time";
import type { HelixReasoningTaskBindingStore } from "../../local-supervisor/reasoning-task-binding-store";
import { resolveTemporalPerceptionContext } from "./temporal-perception-context";
import { EnvironmentTemporalFrontierStore } from "./temporal-frontier-store";
import { TemporalPlanError } from "./temporal-plan-error";
import { readBoundSessionEvidence } from "../session/bound-session-evidence";
import { compileEnvironmentTimePlanToMinecraftFluidSequenceArtifact as serial,
  compileEnvironmentTimePlanToMinecraftReactiveProgramArtifact as reactive } from "./minecraft-environment-time-compiler";

/** Internal preflight. No ledger admission, database write, tool registration or dispatch. */
export const preflightTemporalPlan = async (input: {
  context: Parameters<typeof resolveTemporalPerceptionContext>[0];
  binding: Parameters<HelixReasoningTaskBindingStore["verifyTaskAssociation"]>[0];
  plan: unknown; frontierId: string;
  compilation: { target: "serial"; options: Omit<Parameters<typeof serial>[0], "plan"> } |
    { target: "reactive"; options: Omit<Parameters<typeof reactive>[0], "plan"> };
}, bindingStore: Pick<HelixReasoningTaskBindingStore, "verifyTaskAssociation">) => {
  if (input.context.profileId !== input.binding.profileRef || input.context.runId !== input.binding.runId) {
    throw new TemporalPlanError("temporal_plan_task_context_mismatch");
  }
  const plan = helixEnvironmentTemporalPlanSchema.parse(input.plan);
  const { context } = await readBoundSessionEvidence(input, bindingStore);
  const frontier = await new EnvironmentTemporalFrontierStore().read({
    frontierId: input.frontierId, profileId: input.context.profileId, participantId: input.context.participantId,
    expectedEvidenceRef: context.evidence.observation.evidence_ref,
    expectedObservationProducerEpoch: context.observation_producer_epoch_ref,
  });
  if (!frontier) throw new TemporalPlanError("temporal_plan_frontier_unavailable");
  const identity = context.goal.identity;
  const currentIdentity = { environment_id: identity.environment_binding_id, source_id: identity.source_id,
    subject_id: identity.subject_binding_id, producer_epoch: context.action_producer_epoch_ref,
    authority_id: identity.action_authority_id, authority_revision: identity.authority_policy_version,
    goal_id: context.goal.goal_id, goal_revision: context.goal.goal_revision,
    observation_revision: Number(context.evidence.observation.result.observation_revision),
    affordance_revision: frontier.identity.affordance_revision };
  if (Object.entries(currentIdentity).some(([key, value]) => frontier.identity[key as keyof typeof currentIdentity] !== value)) {
    throw new TemporalPlanError("temporal_plan_frontier_identity_mismatch");
  }
  const graphKind = input.compilation.target === "serial" ? "execute_sequence" : "execute_reactive_program";
  if (!context.catalog.capabilities.some(capability => capability.action_kind === graphKind &&
      capability.policy_listed && capability.native_fabric_available && capability.start_deadline_supported)) {
    throw new TemporalPlanError("temporal_plan_executor_unavailable");
  }
  for (const node of plan.nodes) {
    if (node.kind !== "action") continue;
    const entry = frontier.entries.find(candidate => candidate.capability_id === node.capability_id &&
      candidate.capability_version === node.capability_version && candidate.subject_id === currentIdentity.subject_id);
    if (!entry || entry.state === "blocked") throw new TemporalPlanError("temporal_plan_affordance_unavailable");
  }
  const resident = context.catalog.resident_clock_observation;
  if (!resident || !resident.clock.monotonic || resident.clock.clock_kind !== "minecraft_game_tick" ||
      resident.producer_epoch_ref !== currentIdentity.producer_epoch ||
      resident.clock.monotonic.origin_id !== plan.clocks.monotonic.origin_id ||
      plan.clocks.environment.kind !== "tick" || plan.clocks.environment.resolution_unit !== "minecraft_tick" ||
      plan.clocks.environment.sequence > resident.clock.tick_index ||
      plan.clocks.monotonic.elapsed_ms > resident.clock.monotonic.elapsed_ms) {
    throw new TemporalPlanError("temporal_plan_resident_clock_mismatch");
  }
  if (!evaluateHelixEnvironmentPlanCurrentness({ plan, current_identity: currentIdentity,
    monotonic_elapsed_ms: resident.clock.monotonic.elapsed_ms }).current) throw new TemporalPlanError("temporal_plan_not_current");
  // Frontier expiration uses its own observed world clock, never the client tick.
  if (frontier.clocks.environment.resolution_unit !== "minecraft_world_tick" ||
      resident.clock.world_tick_index == null || resident.clock.world_tick_index < frontier.clocks.environment.sequence ||
      resident.clock.world_tick_index >= frontier.expires_at_environment_sequence) throw new TemporalPlanError("temporal_plan_frontier_expired_or_unmapped");
  const compilation = input.compilation.target === "serial"
    ? serial({ ...input.compilation.options, plan }) : reactive({ ...input.compilation.options, plan });
  const binding = bindingStore.verifyTaskAssociation(input.binding);
  return { plan, compilation, binding, frontier, resident_clock_observation: resident,
    preflight_only: true as const, execution_authority: false as const, answer_authority: false as const,
    terminal_eligible: false as const };
};
