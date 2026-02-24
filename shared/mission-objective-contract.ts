export type MissionObjectiveStatus = "open" | "in_progress" | "blocked" | "resolved";
export type MissionGapSeverity = "low" | "medium" | "high" | "critical";

export type MissionObjective = {
  objectiveId: string;
  missionId: string;
  title: string;
  status: MissionObjectiveStatus;
  updatedAt: string;
};

export type MissionGap = {
  gapId: string;
  missionId: string;
  objectiveId: string;
  summary: string;
  severity: MissionGapSeverity;
  openedAt: string;
  resolvedAt?: string;
};

export const OBJECTIVE_STATUS_TRANSITIONS: Record<MissionObjectiveStatus, MissionObjectiveStatus[]> = {
  open: ["in_progress", "blocked", "resolved"],
  in_progress: ["blocked", "resolved"],
  blocked: ["in_progress", "resolved"],
  resolved: [],
};

export const canTransitionObjectiveStatus = (
  current: MissionObjectiveStatus,
  next: MissionObjectiveStatus,
): boolean => {
  if (current === next) return true;
  return OBJECTIVE_STATUS_TRANSITIONS[current].includes(next);
};

export const resolveGapState = (gap: MissionGap, resolutionTs?: string): MissionGap => {
  if (gap.resolvedAt) return gap;
  return {
    ...gap,
    resolvedAt: resolutionTs && Number.isFinite(Date.parse(resolutionTs)) ? new Date(resolutionTs).toISOString() : new Date().toISOString(),
  };
};
