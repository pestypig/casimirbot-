import type { LiveScenarioSafetyEnvelope } from "./helix-live-scenario-evidence.ts";

export const HELIX_WORKSTATION_PROCESS_EVIDENCE_SCHEMA =
  "helix.workstation_process_evidence.v1" as const;

export type WorkstationProcessEvidence = LiveScenarioSafetyEnvelope & {
  schema: typeof HELIX_WORKSTATION_PROCESS_EVIDENCE_SCHEMA;
  process_evidence_id: string;
  scenario_kind: "workstation_operator_monitor";
  evidence_layer: "process_graph";
  evidence_trust: "process_observation";
  process_kind:
    | "terminal_command"
    | "test_run"
    | "typecheck"
    | "server_log"
    | "git_status"
    | "editor_change";
  compact_summary: string;
  status: "success" | "failed" | "warning" | "running" | "unknown";
  files_touched?: string[];
  command_hash?: string | null;
  confidence: number;
  evidence_refs: string[];
  ts: string;
};

export function createWorkstationProcessEvidence(
  input: Omit<WorkstationProcessEvidence, "schema" | keyof LiveScenarioSafetyEnvelope>,
): WorkstationProcessEvidence {
  return {
    schema: HELIX_WORKSTATION_PROCESS_EVIDENCE_SCHEMA,
    ...liveToolSafety(),
    ...input,
  };
}

function liveToolSafety(): LiveScenarioSafetyEnvelope {
  return {
    scenario_kind: "workstation_operator_monitor",
    evidence_layer: "process_graph",
    evidence_trust: "process_observation",
    instruction_authority: "none",
    ask_instruction_authority: "none",
    ask_context_policy: "evidence_only",
    context_role: "tool_evidence",
    creates_ask_turn: false,
    turn_triggered: false,
    raw_user_text_included: false,
    raw_transcript_included: false,
    raw_image_included: false,
    raw_audio_included: false,
    raw_logs_included: false,
    raw_content_included: false,
    model_invoked: false,
  };
}
