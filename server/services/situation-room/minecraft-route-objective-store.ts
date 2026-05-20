import type {
  MinecraftRouteObjectiveLifecycle,
  MinecraftRouteObjectiveState,
} from "../../../shared/helix-minecraft-route-objective.ts";

export class MinecraftRouteObjectiveStore {
  private readonly objectives = new Map<string, MinecraftRouteObjectiveState>();

  upsert(objective: MinecraftRouteObjectiveState): MinecraftRouteObjectiveState {
    this.objectives.set(objective.objective_id, objective);
    return objective;
  }

  get(objectiveId: string): MinecraftRouteObjectiveState | undefined {
    return this.objectives.get(objectiveId);
  }

  getActiveForRoom(roomId: string): MinecraftRouteObjectiveState | undefined {
    return [...this.objectives.values()].find(
      (objective) =>
        objective.room_id === roomId &&
        (objective.lifecycle === "active" || objective.lifecycle === "pending_identity"),
    );
  }

  transition(
    objectiveId: string,
    lifecycle: MinecraftRouteObjectiveLifecycle,
    updatedAt: string,
  ): MinecraftRouteObjectiveState {
    const existing = this.objectives.get(objectiveId);
    if (!existing) {
      throw new Error(`Unknown route objective: ${objectiveId}`);
    }
    const next = { ...existing, lifecycle, updated_at: updatedAt };
    this.objectives.set(objectiveId, next);
    return next;
  }
}
