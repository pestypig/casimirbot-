import { canTransitionObjectiveStatus, type MissionGap, type MissionObjective } from "../../../shared/mission-objective-contract";

export const foldObjectiveState = (
  objectives: Map<string, MissionObjective>,
  gaps: Map<string, MissionGap>,
  event: {
    missionId: string;
    ts: string;
    objectiveId?: string;
    objectiveTitle?: string;
    objectiveStatus?: MissionObjective["status"];
    gapId?: string;
    gapSummary?: string;
    gapSeverity?: MissionGap["severity"];
    gapResolvedAt?: string;
  },
): void => {
  if (event.objectiveId) {
    const current = objectives.get(event.objectiveId);
    const nextStatus = event.objectiveStatus ?? current?.status ?? "open";
    if (!current) {
      objectives.set(event.objectiveId, {
        objectiveId: event.objectiveId,
        missionId: event.missionId,
        title: event.objectiveTitle ?? event.objectiveId,
        status: nextStatus,
        updatedAt: event.ts,
      });
    } else if (canTransitionObjectiveStatus(current.status, nextStatus)) {
      objectives.set(event.objectiveId, {
        ...current,
        title: event.objectiveTitle ?? current.title,
        status: nextStatus,
        updatedAt: event.ts,
      });
    }
  }

  if (event.gapId && event.objectiveId) {
    const currentGap = gaps.get(event.gapId);
    gaps.set(event.gapId, {
      gapId: event.gapId,
      missionId: event.missionId,
      objectiveId: event.objectiveId,
      summary: event.gapSummary ?? currentGap?.summary ?? event.gapId,
      severity: event.gapSeverity ?? currentGap?.severity ?? "medium",
      openedAt: currentGap?.openedAt ?? event.ts,
      resolvedAt: event.gapResolvedAt ?? currentGap?.resolvedAt,
    });
  }
};
