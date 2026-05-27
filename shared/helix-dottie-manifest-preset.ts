export const HELIX_DOTTIE_MANIFEST_PRESET_SCHEMA = "helix.dottie_manifest_preset.v1" as const;
export const HELIX_DOTTIE_MANIFEST_PRESET_RECEIPT_SCHEMA = "helix.dottie_manifest_preset_receipt.v1" as const;

export type HelixDottieManifestMode = "observer" | "auntie_dottie" | "operator_witness";
export type HelixDottieManifestVoiceMode = "off" | "propose_only" | "on_confirm";
export type HelixDottieManifestCommentaryCadence = "milestones_only" | "salience_only" | "manual";

export type HelixDottieManifestPreset = {
  schema: typeof HELIX_DOTTIE_MANIFEST_PRESET_SCHEMA;
  preset_id: "auntie_dottie";
  thread_id: string;
  room_id: string;
  mode: HelixDottieManifestMode;
  creates_live_answer_environment: true;
  creates_commentary_policy: true;
  creates_observer_subscription: true;
  creates_voice_policy: true;
  creates_field_worker_policy: true;
  live_environment: {
    environment_id?: string | null;
    preset: "environment_run_monitor" | "minecraft_run_monitor" | "custom";
    objective: string;
    mode: "text_only" | "voice_on_confirm" | "critical_voice" | "direct_address_only";
    source_ids: string[];
    line_keys: string[];
  };
  commentary_policy: {
    status: "enabled" | "paused";
    cadence: HelixDottieManifestCommentaryCadence;
    voice_mode: HelixDottieManifestVoiceMode;
  };
  observer: {
    observer_profile: "auntie_dottie";
    target_run_id: string | null;
    event_filter: string[];
    max_chars: number;
    witness_only: true;
  };
  field_workers: Array<{
    worker_kind: "route_watch" | "visual_watch" | "source_health_watch" | "commentary_watch";
    max_runs: number;
    allowed_tools: string[];
    may_surface_user_text: false;
  }>;
  safety: {
    assistant_answer: false;
    raw_content_included: false;
    instruction_authority: "none";
    ask_context_policy: "evidence_only";
  };
};

export type HelixDottieManifestPresetReceipt = {
  schema: typeof HELIX_DOTTIE_MANIFEST_PRESET_RECEIPT_SCHEMA;
  kind: "dottie_manifest_preset_receipt";
  ok: true;
  preset_id: "auntie_dottie";
  room_id: string;
  thread_id: string;
  mode: HelixDottieManifestMode;
  child_artifact_refs: string[];
  receipts: Array<Record<string, unknown>>;
  context_policy: "compact_context_pack_only";
  command_lane_enabled: false;
  assistant_answer: false;
  raw_content_included: false;
  context_role: "tool_evidence";
};

export type BuildDottieManifestPresetInput = {
  threadId?: string | null;
  roomId?: string | null;
  sourceIds?: string[] | null;
  mode?: HelixDottieManifestMode | null;
  voiceMode?: HelixDottieManifestVoiceMode | null;
  commentaryCadence?: HelixDottieManifestCommentaryCadence | null;
  targetRunId?: string | null;
  objective?: string | null;
  maxChars?: number | null;
  environmentId?: string | null;
};

const cleanId = (value: string | null | undefined, fallback: string): string => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || fallback;
};

const uniqueStrings = (values: unknown): string[] => {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean),
    ),
  );
};

const boundedMaxChars = (value: number | null | undefined): number => {
  if (!Number.isFinite(value ?? NaN)) return 220;
  return Math.max(48, Math.min(500, Math.floor(value as number)));
};

export function buildDottieManifestPreset(input: BuildDottieManifestPresetInput = {}): HelixDottieManifestPreset {
  const threadId = cleanId(input.threadId, "helix-ask:desktop");
  const roomId = cleanId(input.roomId, "situation-room:active");
  const sourceIds = uniqueStrings(input.sourceIds);
  const mode = input.mode ?? "auntie_dottie";
  const voiceMode = input.voiceMode ?? "propose_only";
  const commentaryCadence = input.commentaryCadence ?? "milestones_only";
  const objective = cleanId(input.objective, "Attach Auntie Dottie as a witness-only Situation Room observer.");

  return {
    schema: HELIX_DOTTIE_MANIFEST_PRESET_SCHEMA,
    preset_id: "auntie_dottie",
    thread_id: threadId,
    room_id: roomId,
    mode,
    creates_live_answer_environment: true,
    creates_commentary_policy: true,
    creates_observer_subscription: true,
    creates_voice_policy: true,
    creates_field_worker_policy: true,
    live_environment: {
      environment_id: cleanId(input.environmentId, "") || null,
      preset: "environment_run_monitor",
      objective,
      mode: voiceMode === "off" ? "text_only" : "voice_on_confirm",
      source_ids: sourceIds,
      line_keys: ["agent_commentary", "route_evidence", "perturbation", "terminal_ready"],
    },
    commentary_policy: {
      status: "enabled",
      cadence: commentaryCadence,
      voice_mode: voiceMode,
    },
    observer: {
      observer_profile: "auntie_dottie",
      target_run_id: cleanId(input.targetRunId, "") || null,
      event_filter: ["agent_commentary", "route_evidence", "perturbation", "terminal_ready"],
      max_chars: boundedMaxChars(input.maxChars),
      witness_only: true,
    },
    field_workers: [
      {
        worker_kind: "route_watch",
        max_runs: 1,
        allowed_tools: ["live_env.query_navigation_state", "route_evidence.query"],
        may_surface_user_text: false,
      },
      {
        worker_kind: "source_health_watch",
        max_runs: 1,
        allowed_tools: ["live_env.query_source_health", "live_env.query_constructs"],
        may_surface_user_text: false,
      },
    ],
    safety: {
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      ask_context_policy: "evidence_only",
    },
  };
}

export function buildDottieManifestPresetReceipts(
  preset: HelixDottieManifestPreset,
): HelixDottieManifestPresetReceipt {
  const baseRef = `dottie_manifest:${preset.thread_id}:${preset.room_id}`;
  const receipts = [
    {
      artifact_ref: `${baseRef}:live_answer_environment`,
      kind: "live_answer_environment_receipt",
      request: preset.live_environment,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    },
    {
      artifact_ref: `${baseRef}:live_commentary_policy`,
      kind: "live_commentary_policy_receipt",
      policy: preset.commentary_policy,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    },
    {
      artifact_ref: `${baseRef}:observer_subscription`,
      kind: "dottie_observer_subscription_receipt",
      observer: preset.observer,
      authority: "witness_only",
      can_execute_tools: false,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    },
    {
      artifact_ref: `${baseRef}:voice_policy`,
      kind: "voice_policy_receipt",
      voice_mode: preset.commentary_policy.voice_mode,
      authority: "proposal_only",
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    },
    {
      artifact_ref: `${baseRef}:field_worker_policy`,
      kind: "field_worker_policy_receipt",
      field_workers: preset.field_workers,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
    },
  ];

  return {
    schema: HELIX_DOTTIE_MANIFEST_PRESET_RECEIPT_SCHEMA,
    kind: "dottie_manifest_preset_receipt",
    ok: true,
    preset_id: "auntie_dottie",
    room_id: preset.room_id,
    thread_id: preset.thread_id,
    mode: preset.mode,
    child_artifact_refs: receipts.map((receipt) => receipt.artifact_ref),
    receipts,
    context_policy: "compact_context_pack_only",
    command_lane_enabled: false,
    assistant_answer: false,
    raw_content_included: false,
    context_role: "tool_evidence",
  };
}
