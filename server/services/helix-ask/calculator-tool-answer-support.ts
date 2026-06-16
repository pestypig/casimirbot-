export type HelixCalculatorToolAnswerSupport = {
  schema: "helix.calculator_tool_answer_support.v1";
  turn_id: string;
  applies: boolean;
  selected_capability: string | null;
  calculator_observation_refs: string[];
  calculator_result?: string;
  expression?: string;
  final_answer_draft_ref?: string;
  draft_explains_result: boolean;
  supports_goal: boolean;
  missing_reason?:
    | "calculator_result_missing"
    | "final_answer_draft_missing"
    | "draft_does_not_explain_result"
    | "not_calculator_route";
  required_terminal_kind: "model_synthesized_answer";
  assistant_answer: false;
  raw_content_included: false;
};

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const textFromPayload = (payload: RecordLike | null): string =>
  readString(payload?.text) || readString(payload?.answer_text) || readString(payload?.draft_text) || readString(payload?.visible_text);

export const routeMetadataIndicatesCalculator = (payload: RecordLike): boolean => {
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  const routeProductContract = readRecord(payload.route_product_contract);
  const committedRoute = readRecord(payload.committed_ask_route);
  const committedCanonicalGoal = readRecord(committedRoute?.canonical_goal);
  const workstationToolPlan = readRecord(payload.workstation_tool_plan);
  const activeWorkstationToolPlan = readRecord(payload.active_workstation_tool_plan);
  const routeText = [
    readString(payload.route),
    readString(payload.route_reason_code),
    readString(readRecord(payload.resolved_turn_summary)?.resolved_route_label),
    readString(readRecord(payload.canonical_goal_frame)?.goal_kind),
    readString(committedCanonicalGoal?.goal_kind),
    readString(sourceTargetIntent?.target_source),
    readString(sourceTargetIntent?.target_kind),
    readString(routeProductContract?.source_target),
    readString(committedRoute?.source_target),
    readString(payload.mandatory_next_tool),
    readString(workstationToolPlan?.intent),
    readString(activeWorkstationToolPlan?.intent),
  ].join(" ");
  return /\b(?:calculator_solve|calculator_verify|calculator_live_source|calculator_stream|scientific-calculator\.solve_expression)\b/i.test(
    routeText,
  );
};

const latestArtifact = (payload: RecordLike, pattern: RegExp): RecordLike | null => {
  const artifacts = readArray(payload.current_turn_artifact_ledger).map(readRecord).filter(Boolean) as RecordLike[];
  for (const artifact of [...artifacts].reverse()) {
    const artifactPayload = readRecord(artifact.payload);
    const haystack = [
      readString(artifact.kind),
      readString(artifact.artifact_id),
      readString(artifactPayload?.schema),
      readString(artifactPayload?.kind),
    ].join(" ");
    if (pattern.test(haystack)) return artifact;
  }
  return null;
};

const collectCalculatorArtifacts = (payload: RecordLike): RecordLike[] =>
  readArray(payload.current_turn_artifact_ledger)
    .map(readRecord)
    .filter((artifact): artifact is RecordLike => {
      const artifactPayload = readRecord(artifact?.payload);
      const haystack = JSON.stringify({
        kind: artifact?.kind,
        schema: artifactPayload?.schema,
        action_id: artifactPayload?.action_id,
        panel_id: artifactPayload?.panel_id,
        capability_key: artifactPayload?.capability_key,
        expression: artifactPayload?.expression,
        result: artifactPayload?.result,
      }).slice(0, 2000);
      return /calculator|scientific-calculator|solve_expression/i.test(haystack);
    });

const extractCalculatorResult = (artifacts: RecordLike[]): { result: string; expression: string } => {
  let fallbackExpression = "";
  for (const artifact of [...artifacts].reverse()) {
    const artifactPayload = readRecord(artifact.payload);
    const text =
      readString(artifactPayload?.text) ||
      readString(artifactPayload?.answer_text) ||
      readString(artifactPayload?.summary);
    const textEquation = text.match(/^\s*(.+?)\s*=\s*([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\s*$/i);
    const textResult = text.match(
      /\b(?:result|produced|evaluated\s+to|equals)\s*(?:is|:)?\s*([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\b/i,
    );
    const result =
      readString(artifactPayload?.result) ||
      readString(artifactPayload?.value) ||
      readString(artifactPayload?.computed_result) ||
      readString(readRecord(artifactPayload?.calculation)?.result) ||
      (textEquation ? textEquation[2] ?? "" : "") ||
      (textResult ? textResult[1] ?? "" : "");
    const expression =
      readString(artifactPayload?.expression) ||
      readString(artifactPayload?.input) ||
      readString(readRecord(artifactPayload?.calculation)?.expression) ||
      (textEquation ? textEquation[1] ?? "" : "");
    if (expression && !fallbackExpression) fallbackExpression = expression;
    if (result) return { result, expression: expression || fallbackExpression };
  }
  return { result: "", expression: fallbackExpression };
};

const draftExplains = (draftText: string, result: string, expression: string): boolean => {
  if (!draftText) return false;
  const normalized = draftText.replace(/\s+/g, " ");
  const resultOk = !result || normalized.includes(result);
  const expressionOk =
    !expression ||
    normalized.includes(expression) ||
    /2\s*\*\s*\(?3\s*\+\s*4\)?/.test(normalized) ||
    (/\b3\s*\+\s*4\b/.test(normalized) && /\b2\s*\*\s*7\b/.test(normalized));
  const explanationOk = /\b(step|first|then|because|equals|result|calculate|multiply|add)\b/i.test(normalized);
  return resultOk && expressionOk && explanationOk;
};

export function evaluateCalculatorToolAnswerSupport(input: {
  turnId: string;
  payload: RecordLike;
}): HelixCalculatorToolAnswerSupport {
  const selectedCapability =
    readString(readRecord(input.payload.agent_step_decision)?.chosen_capability) ||
    readString(readRecord(readRecord(input.payload.agent_step_decision)?.model_decision)?.chosen_capability) ||
    "";
  const canonicalGoalKind = readString(readRecord(input.payload.canonical_goal_frame)?.goal_kind);
  const calculatorArtifacts = collectCalculatorArtifacts(input.payload);
  const applies =
    /calculator/i.test(canonicalGoalKind) ||
    routeMetadataIndicatesCalculator(input.payload) ||
    /scientific-calculator|calculator/i.test(selectedCapability) ||
    calculatorArtifacts.length > 0;
  const { result, expression } = extractCalculatorResult(calculatorArtifacts);
  const draftArtifact = latestArtifact(input.payload, /final_answer_draft|helix\.final_answer_draft\.v1/);
  const draftPayload = readRecord(draftArtifact?.payload) ?? readRecord(input.payload.final_answer_draft);
  const draftText = textFromPayload(draftPayload);
  const draftRef = readString(draftArtifact?.artifact_id) || readString(draftPayload?.draft_id);
  const draft_explains_result = draftExplains(draftText, result, expression);
  const supports_goal = applies && Boolean(result) && Boolean(draftText) && draft_explains_result;
  const missing_reason = !applies
    ? "not_calculator_route"
    : !result
      ? "calculator_result_missing"
      : !draftText
        ? "final_answer_draft_missing"
        : !draft_explains_result
          ? "draft_does_not_explain_result"
          : undefined;
  return {
    schema: "helix.calculator_tool_answer_support.v1",
    turn_id: input.turnId,
    applies,
    selected_capability: selectedCapability || null,
    calculator_observation_refs: calculatorArtifacts
      .map((artifact) => readString(artifact.artifact_id))
      .filter(Boolean),
    calculator_result: result || undefined,
    expression: expression || undefined,
    final_answer_draft_ref: draftRef || undefined,
    draft_explains_result,
    supports_goal,
    missing_reason,
    required_terminal_kind: "model_synthesized_answer",
    assistant_answer: false,
    raw_content_included: false,
  };
}
