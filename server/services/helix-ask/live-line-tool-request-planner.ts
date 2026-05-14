import crypto from "node:crypto";
import type { LiveAnswerLineState } from "@shared/helix-live-answer-environment";
import {
  HELIX_LIVE_LINE_TOOL_REQUEST_SCHEMA,
  type HelixLiveLineExpectedEvidenceKind,
  type HelixLiveLineRequestedTool,
  type HelixLiveLineToolRequest,
  type HelixLiveLineToolRequestPriority,
} from "@shared/helix-live-line-tool-request";
import type { GameUtilityHypothesis } from "@shared/helix-game-utility-hypothesis";
import { recordLiveLineToolRequest } from "../situation-room/live-line-tool-request-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const priorityForLine = (line?: Pick<LiveAnswerLineState, "key" | "label"> | null): HelixLiveLineToolRequestPriority => {
  const key = lower(line?.key);
  const label = lower(line?.label);
  if (/\b(?:risk|danger|hazard|hostile|lava|fire|creeper)\b/.test(`${key} ${label}`)) return "warn";
  if (/\b(?:next_check|unknown|missing)\b/.test(`${key} ${label}`)) return "info";
  return "info";
};

const chooseTool = (input: {
  line: Pick<LiveAnswerLineState, "key" | "label" | "value" | "evidence_refs">;
  hypothesis?: GameUtilityHypothesis | null;
}): {
  requested_tool: HelixLiveLineRequestedTool;
  expected_evidence_kind: HelixLiveLineExpectedEvidenceKind;
  reason: string;
} | null => {
  const text = lower(`${input.line.key} ${input.line.label} ${input.line.value} ${input.hypothesis?.utility_label ?? ""} ${(input.hypothesis?.missing_evidence ?? []).join(" ")}`);
  if (/\b(?:equation|calculate|calculator|solve|numeric|residual|function)\b/.test(text)) {
    return {
      requested_tool: "scientific-calculator.solve_with_steps",
      expected_evidence_kind: "calculation",
      reason: "Verify the numeric or equation claim before raising line confidence.",
    };
  }
  if (/\b(?:transcript|large text|store|note|archive|preserve)\b/.test(text)) {
    return {
      requested_tool: "workstation-notes.append_to_note",
      expected_evidence_kind: "storage",
      reason: "Store large context as note references instead of injecting raw text.",
    };
  }
  if (/\b(?:chicken|cow|zombie|entity|farm|egg|mob|semantic|affordance)\b/.test(text)) {
    return {
      requested_tool: "minecraft.lookup_semantics",
      expected_evidence_kind: "semantic_reference",
      reason: "Use Minecraft semantic references to interpret neutral entity/resource evidence.",
    };
  }
  if (
    /\b(?:minecraft|minehut|world|source events?|event window|situation room debug|raw logs?|bucket|lava|water|fluid|block|stair|trench|mine|structure|missing evidence|next check)\b/.test(text)
  ) {
    return {
      requested_tool: "minecraft.query_event_window",
      expected_evidence_kind: "missing_evidence",
      reason: "Query the event window for source evidence required by this line.",
    };
  }
  if (/\b(?:docs?|paper|reference|citation)\b/.test(text)) {
    return {
      requested_tool: "docs-viewer.lookup_reference",
      expected_evidence_kind: "verification",
      reason: "Ground the line against a document/reference before increasing confidence.",
    };
  }
  if (/\b(?:review|ambiguous|uncertain|hypothesis)\b/.test(text)) {
    return {
      requested_tool: "situation-room.run_agentic_review",
      expected_evidence_kind: "review",
      reason: "Run an agentic review because the line is ambiguous.",
    };
  }
  return null;
};

export function planLiveLineToolRequest(input: {
  threadId: string;
  environmentId?: string | null;
  artifactId?: string | null;
  line: Pick<LiveAnswerLineState, "key" | "label" | "value" | "evidence_refs">;
  hypothesis?: GameUtilityHypothesis | null;
  subgoalId?: string | null;
  now?: string;
  autoRecord?: boolean;
}): HelixLiveLineToolRequest | null {
  const tool = chooseTool({ line: input.line, hypothesis: input.hypothesis ?? null });
  if (!tool) return null;
  const now = input.now ?? new Date().toISOString();
  const request: HelixLiveLineToolRequest = {
    schema: HELIX_LIVE_LINE_TOOL_REQUEST_SCHEMA,
    request_id: `live_line_tool_request:${hashShort([
      input.threadId,
      input.environmentId ?? null,
      input.artifactId ?? null,
      input.line.key,
      input.line.value,
      input.hypothesis?.hypothesis_id ?? null,
      tool.requested_tool,
    ])}`,
    thread_id: input.threadId,
    environment_id: input.environmentId ?? null,
    artifact_id: input.artifactId ?? null,
    line_key: input.line.key,
    line_label: input.line.label,
    hypothesis_id: input.hypothesis?.hypothesis_id ?? null,
    subgoal_id: input.subgoalId ?? null,
    requested_tool: tool.requested_tool,
    reason: tool.reason,
    expected_evidence_kind: tool.expected_evidence_kind,
    priority: priorityForLine(input.line),
    status: "proposed",
    evidence_refs: Array.from(new Set([
      ...(input.line.evidence_refs ?? []),
      ...(input.hypothesis?.supporting_evidence_refs ?? []),
    ])),
    deterministic_content_role: "evidence_not_assistant_answer",
    raw_content_included: false,
    assistant_answer: false,
    created_at: now,
  };
  return input.autoRecord === false ? request : recordLiveLineToolRequest(request);
}

export function planLiveLineToolRequests(input: {
  threadId: string;
  environmentId?: string | null;
  artifactId?: string | null;
  lines: Array<Pick<LiveAnswerLineState, "key" | "label" | "value" | "evidence_refs">>;
  hypotheses?: GameUtilityHypothesis[];
  now?: string;
  autoRecord?: boolean;
}): HelixLiveLineToolRequest[] {
  const latestHypothesis = input.hypotheses?.at(-1) ?? null;
  const planned = input.lines
    .map((line) => planLiveLineToolRequest({
      threadId: input.threadId,
      environmentId: input.environmentId,
      artifactId: input.artifactId,
      line,
      hypothesis: latestHypothesis,
      now: input.now,
      autoRecord: input.autoRecord,
    }))
    .filter((entry): entry is HelixLiveLineToolRequest => Boolean(entry));
  const byKey = new Map<string, HelixLiveLineToolRequest>();
  for (const request of planned) byKey.set(`${request.line_key}:${request.requested_tool}`, request);
  return Array.from(byKey.values());
}
