type RecordLike = Record<string, unknown>;

export type HelixAuthoritativeLivePipelineRoute = {
  sourceTarget: "live_pipeline";
  targetKind: "live_pipeline";
  goalKind: string;
  requiredTerminalKind: "live_pipeline_receipt" | "live_environment_binding_diagnosis";
  reason: "canonical_live_pipeline_route_product_contract";
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const metadataBelongsToTurn = (currentTurnId: string, metadata: RecordLike | null): boolean => {
  const metadataTurnId = readString(metadata?.turn_id);
  return !currentTurnId || !metadataTurnId || metadataTurnId === currentTurnId;
};

export const resolveAuthoritativeLivePipelineRoute = (input: {
  turnId: string;
  canonicalGoalFrame?: RecordLike | null;
  routeProductContract?: RecordLike | null;
}): HelixAuthoritativeLivePipelineRoute | null => {
  const canonicalGoalFrame = readRecord(input.canonicalGoalFrame);
  const routeProductContract = readRecord(input.routeProductContract);
  if (
    !metadataBelongsToTurn(input.turnId, canonicalGoalFrame) ||
    !metadataBelongsToTurn(input.turnId, routeProductContract)
  ) {
    return null;
  }

  const goalKind = readString(canonicalGoalFrame?.goal_kind);
  const requiredTerminalKind = readString(canonicalGoalFrame?.required_terminal_kind);
  const allowedTerminalKinds = readStringArray(routeProductContract?.allowed_terminal_artifact_kinds);
  const forbiddenTerminalKinds = readStringArray(routeProductContract?.forbidden_terminal_artifact_kinds);
  const terminalKindAllowedByLivePipeline =
    requiredTerminalKind === "live_pipeline_receipt" ||
    requiredTerminalKind === "live_environment_binding_diagnosis";
  if (
    !goalKind ||
    readString(routeProductContract?.source_target) !== "live_pipeline" ||
    !terminalKindAllowedByLivePipeline ||
    !allowedTerminalKinds.includes(requiredTerminalKind) ||
    forbiddenTerminalKinds.includes(requiredTerminalKind)
  ) {
    return null;
  }

  return {
    sourceTarget: "live_pipeline",
    targetKind: "live_pipeline",
    goalKind,
    requiredTerminalKind,
    reason: "canonical_live_pipeline_route_product_contract",
  };
};
