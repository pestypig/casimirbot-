type RecordLike = Record<string, unknown>;

export type HelixModelTurnPacket = {
  schema: "helix.model_turn_packet.v1";
  turn_id: string;
  prompt_text: string;
  route_reason_code?: string;
  canonical_goal_frame?: RecordLike;
  source_target_intent?: RecordLike;
  route_product_contract?: RecordLike;
  compound_prompt_contract?: RecordLike;
  capability_itinerary?: RecordLike;
  available_capabilities: unknown[];
  artifact_refs: string[];
  model_visible_artifacts: Array<{
    artifact_id: string;
    kind: string;
    summary?: string;
    text?: string;
  }>;
  output_budget?: RecordLike;
  loop_policy: {
    max_model_steps: number;
    allow_tools: boolean;
    require_model_authored_terminal: boolean;
    deterministic_fallback_terminal_allowed: boolean;
  };
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | undefined =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : undefined;

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const readBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const clip = (value: string | undefined, max = 1200): string | undefined => {
  if (!value) return undefined;
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

const capabilityAllowsToolUse = (capability: unknown): boolean => {
  const record = readRecord(capability);
  if (!record) return false;
  if (readBoolean(record.requires_action) !== true) return false;
  if (readString(record.goal_fit) === "forbidden") return false;
  if (readString(record.availability) === "not_available") return false;
  return true;
};

export function buildHelixModelTurnPacket(input: {
  turnId: string;
  promptText: string;
  payload: RecordLike;
  artifactLedger: Array<RecordLike>;
  availableCapabilities?: unknown[];
  outputBudget?: RecordLike;
}): HelixModelTurnPacket {
  const trace = readRecord(input.payload.ask_turn_solver_trace);
  const compoundPromptContract =
    readRecord(input.payload.compound_prompt_contract) ??
    readRecord(readRecord(input.payload.prompt_interpretation)?.compound_contract) ??
    readRecord(trace?.compound_prompt_contract);
  const modelVisibleArtifacts = input.artifactLedger
    .map((artifact) => {
      const payload = readRecord(artifact.payload);
      const artifactId = readString(artifact.artifact_id) ?? readString(payload?.artifact_id);
      const kind = readString(artifact.kind) ?? readString(payload?.kind);
      if (!artifactId || !kind) return null;
      return {
        artifact_id: artifactId,
        kind,
        summary: clip(readString(payload?.summary) ?? readString(payload?.reason) ?? readString(payload?.message), 600),
        text: clip(
          readString(payload?.text) ??
            readString(payload?.answer_text) ??
            readString(payload?.visible_text) ??
            readString(payload?.fallback_text),
          1200,
        ),
      };
    })
    .filter((entry): entry is HelixModelTurnPacket["model_visible_artifacts"][number] => Boolean(entry))
    .slice(-16);
  const artifactRefs = modelVisibleArtifacts.map((artifact) => artifact.artifact_id);
  const sourceTargetIntent = readRecord(input.payload.source_target_intent);
  const sourceTargetAllowsToolUse =
    sourceTargetIntent?.must_enter_backend_ask === true ||
    sourceTargetIntent?.allow_no_tool_direct === false ||
    (readString(sourceTargetIntent?.target_source) !== undefined &&
      readString(sourceTargetIntent?.target_source) !== "model_only");
  const hasAvailableToolCapability = (input.availableCapabilities ?? []).some(capabilityAllowsToolUse);
  return {
    schema: "helix.model_turn_packet.v1",
    turn_id: input.turnId,
    prompt_text: input.promptText,
    route_reason_code: readString(input.payload.route_reason_code) ?? readString(input.payload.route),
    canonical_goal_frame: readRecord(input.payload.canonical_goal_frame),
    source_target_intent: sourceTargetIntent,
    route_product_contract: readRecord(input.payload.route_product_contract),
    compound_prompt_contract: compoundPromptContract,
    capability_itinerary: readRecord(input.payload.capability_itinerary),
    available_capabilities: input.availableCapabilities ?? [],
    artifact_refs: artifactRefs,
    model_visible_artifacts: modelVisibleArtifacts,
    output_budget: input.outputBudget,
    loop_policy: {
      max_model_steps: 2,
      allow_tools: hasAvailableToolCapability || sourceTargetAllowsToolUse,
      require_model_authored_terminal: true,
      deterministic_fallback_terminal_allowed: false,
    },
    assistant_answer: false,
    raw_content_included: false,
  };
}
