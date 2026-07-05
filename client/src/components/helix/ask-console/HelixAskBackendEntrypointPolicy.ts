import type { HelixAskRouteMetadata } from "@/lib/agi/api";

export const HELIX_ASK_BACKEND_ENTRYPOINT_REQUIRED_ERROR_CODE = "backend_ask_entry_required";
export const HELIX_ASK_BACKEND_ENTRYPOINT_REQUIRED_TEXT =
  "This prompt requires the backend Ask solver path before a final answer can be shown.";
export const HELIX_ASK_ENTRYPOINT_GUARD_VERSION = "E79";

type HelixAskBackendEntrypointFamily =
  | "calculator"
  | "docs_viewer"
  | "narrator"
  | "repo_code"
  | "workspace_diagnostic"
  | "internet_search"
  | "scholarly_research"
  | "live_pipeline"
  | "helix_ask"
  | "visual_capture"
  | "image_lens"
  | "scientific_image";

type HelixAskBackendEntrypointFamilyResolution = {
  family: HelixAskBackendEntrypointFamily;
  sourceTarget: string;
  targetKind: string;
  requiredToolFamily: string;
  selectedCapability: string | null;
  explicitCue: string;
  requestedOutputs: string[];
};

const HELIX_EVIDENCE_GATE_HARD_CLAIM_RE =
  /\b(?:verify|verification|prove|proof|audit|compare|contrast|difference|tradeoff|synthesi[sz]e|explain|why|how|pass\/?fail|integrity|evidence|claim)\b/i;

const HELIX_EVIDENCE_GATE_TRANSFORM_TASK_RE =
  /^\s*(?:please\s+)?(?:translate|rewrite|rephrase|paraphrase|convert|render)\b/i;

const HELIX_ASK_COMPARE_TRIGGER_RE = /\b(?:compare|contrast|difference|diff|what changed|changed since)\b/i;

const HELIX_ASK_BACKEND_ENTRYPOINT_REQUIRED_PROMPT_RE =
  /\b(?:scientific-calculator\.[a-z0-9_.-]+|scientific\s+calculator|calculator_receipt|calculator\s+tool|docs-viewer\.[a-z0-9_.-]+|docs\s+viewer|narrator\.[a-z0-9_.-]+|panel[_\s-]?id\s*(?:=|:)\s*narrator|repo-code\.[a-z0-9_.-]+|repo_code\.[a-z0-9_.-]+|workspace-directory\.[a-z0-9_.-]+|workspace_directory\.[a-z0-9_.-]+|workspace_os\.status|internet_search\.[a-z0-9_.-]+|internet\s+search\s+tool|scholarly-research\.[a-z0-9_.-]+|scholarly_research\.[a-z0-9_.-]+|scholarly\s+research\s+tool|lookup_papers|fetch_full_text|extract_numeric_parameters|live_env\.[a-z0-9_.-]+|helix_ask\.[a-z0-9_.-]+|image[_\s-]?lens|visual_analysis\.inspect_image_region|visual_capture|scientific\s+(?:document|image|page)|document\s+image|attached\s+image.*(?:equation|latex|theory\s+graph))\b/i;

const HELIX_ASK_SCIENTIFIC_IMAGE_PROMPT_RE =
  /\b(?:attached\s+image|image|screenshot|document\s+image|scientific\s+(?:document|image|page|paper))\b[\s\S]{0,180}\b(?:equations?|latex|symbols?|scientific\s+text|theory\s+(?:badge\s+)?graph|compare|congruence|reflection)\b/i;

const HELIX_ASK_SCIENTIFIC_IMAGE_REFLECTION_PROMPT_RE =
  /\b(?:compare|congruence|reflect|reflection|theory\s+(?:badge\s+)?graph|badge\s+graph|calculator(?:\s+payload|\s+handoff)?|payload\s+filter|branch\s+admission|admit\s+(?:a\s+)?branch)\b/i;

const stripQuotedPayloadsForBackendEntrypointPolicy = (text: string): string =>
  text
    .replace(/"[\s\S]*?"/g, " quoted payload ")
    .replace(/'[\s\S]*?'/g, " quoted payload ");

const isQuotedTransformOnlyForBackendEntrypointPolicy = (question: string): boolean => {
  if (!HELIX_EVIDENCE_GATE_TRANSFORM_TASK_RE.test(question)) return false;
  if (!/"[\s\S]+"/.test(question) && !/'[\s\S]+'/.test(question)) return false;
  const instructionText = stripQuotedPayloadsForBackendEntrypointPolicy(question);
  return (
    !HELIX_EVIDENCE_GATE_HARD_CLAIM_RE.test(instructionText) &&
    !HELIX_ASK_COMPARE_TRIGGER_RE.test(instructionText)
  );
};

const normalizeCapability = (value: string): string => value.replace(/^scholarly_research\./i, "scholarly-research.");

export function resolveHelixAskBackendEntrypointFamily(
  value: string,
): HelixAskBackendEntrypointFamilyResolution | null {
  const normalized = value.trim();
  if (!normalized) return null;
  if (isQuotedTransformOnlyForBackendEntrypointPolicy(normalized)) return null;
  if (/\b(?:scientific-calculator\.solve_expression|scientific-calculator\.solve_with_steps|scientific\s+calculator|calculator_receipt|calculator\s+tool)\b/i.test(normalized)) {
    return {
      family: "calculator",
      sourceTarget: "calculator_stream",
      targetKind: "calculator_stream",
      requiredToolFamily: "calculator",
      selectedCapability: /\bscientific-calculator\.solve_with_steps\b/i.test(normalized)
        ? "scientific-calculator.solve_with_steps"
        : "scientific-calculator.solve_expression",
      explicitCue: "scientific_calculator_solve",
      requestedOutputs: ["tool_call_eligibility", "calculator_receipt", "typed_failure"],
    };
  }
  if (/\b(?:docs-viewer\.[a-z0-9_.-]+|docs\s+viewer)\b/i.test(normalized)) {
    const capability = normalized.match(/\bdocs-viewer\.[a-z0-9_.-]+\b/i)?.[0] ?? null;
    return {
      family: "docs_viewer",
      sourceTarget: "docs_viewer",
      targetKind: "docs_viewer",
      requiredToolFamily: "docs_viewer",
      selectedCapability: capability,
      explicitCue: "docs_viewer_tool_family",
      requestedOutputs: ["tool_call_eligibility", "doc_evidence", "typed_failure"],
    };
  }
  if (/\b(?:narrator\.[a-z0-9_.-]+|panel[_\s-]?id\s*(?:=|:)\s*narrator)\b/i.test(normalized)) {
    const explicitAction = normalized.match(/\baction[_\s-]?id\s*(?:=|:)\s*(narrator\.[a-z0-9_.-]+)\b/i)?.[1] ?? null;
    const capability = explicitAction ?? normalized.match(/\bnarrator\.[a-z0-9_.-]+\b/i)?.[0] ?? null;
    return {
      family: "narrator",
      sourceTarget: "workstation_panel",
      targetKind: "workstation_state",
      requiredToolFamily: "narrator",
      selectedCapability: capability,
      explicitCue: "narrator_tool_family",
      requestedOutputs: ["tool_call_eligibility", "workspace_action_receipt", "voice_debug_receipt", "typed_failure"],
    };
  }
  if (/\b(?:repo-code\.[a-z0-9_.-]+|repo_code\.[a-z0-9_.-]+)\b/i.test(normalized)) {
    const capability = normalized.match(/\b(?:repo-code|repo_code)\.[a-z0-9_.-]+\b/i)?.[0]?.replace(/^repo_code\./i, "repo-code.") ?? null;
    return {
      family: "repo_code",
      sourceTarget: "repo_code",
      targetKind: "repo_code",
      requiredToolFamily: "repo_code",
      selectedCapability: capability,
      explicitCue: "repo_code_tool_family",
      requestedOutputs: ["tool_call_eligibility", "repo_code", "line_backed_source", "typed_failure"],
    };
  }
  if (/\b(?:workspace-directory\.[a-z0-9_.-]+|workspace_directory\.[a-z0-9_.-]+|workspace_os\.status)\b/i.test(normalized)) {
    const rawCapability = normalized.match(/\b(?:workspace-directory|workspace_directory|workspace_os)\.[a-z0-9_.-]+\b/i)?.[0] ?? null;
    return {
      family: "workspace_diagnostic",
      sourceTarget: "workspace_diagnostic",
      targetKind: "workspace_diagnostic",
      requiredToolFamily: rawCapability?.startsWith("workspace_os.") ? "workspace_os" : "workspace_directory",
      selectedCapability: rawCapability?.replace(/^workspace_directory\./i, "workspace-directory.") ?? null,
      explicitCue: "workspace_diagnostic_tool_family",
      requestedOutputs: ["tool_call_eligibility", "workspace_observation", "typed_failure"],
    };
  }
  if (/\b(?:internet_search\.[a-z0-9_.-]+|internet\s+search\s+tool)\b/i.test(normalized)) {
    const capability = normalized.match(/\binternet_search\.[a-z0-9_.-]+\b/i)?.[0] ?? "internet_search.web_research";
    return {
      family: "internet_search",
      sourceTarget: "internet_search",
      targetKind: "internet_search",
      requiredToolFamily: "internet_search",
      selectedCapability: capability,
      explicitCue: "internet_search_tool_family",
      requestedOutputs: ["tool_call_eligibility", "web_research_observation", "typed_failure"],
    };
  }
  if (/\b(?:scholarly-research\.[a-z0-9_.-]+|scholarly_research\.[a-z0-9_.-]+|scholarly\s+research\s+tool|lookup_papers|fetch_full_text|extract_numeric_parameters)\b/i.test(normalized)) {
    const rawCapability =
      normalized.match(/\b(?:scholarly-research|scholarly_research)\.[a-z0-9_.-]+\b/i)?.[0] ??
      (/\bextract_numeric_parameters\b/i.test(normalized)
        ? "scholarly-research.extract_numeric_parameters"
        : /\bfetch_full_text\b/i.test(normalized)
          ? "scholarly-research.fetch_full_text"
          : "scholarly-research.lookup_papers");
    return {
      family: "scholarly_research",
      sourceTarget: "scholarly_research",
      targetKind: "scholarly_research",
      requiredToolFamily: "scholarly_research",
      selectedCapability: normalizeCapability(rawCapability),
      explicitCue: "scholarly_research_tool_family",
      requestedOutputs: ["tool_call_eligibility", "scholarly_paper_evidence", "full_text_observation", "numeric_parameter_observation", "typed_failure"],
    };
  }
  if (/\blive_env\.[a-z0-9_.-]+\b/i.test(normalized)) {
    const capability = normalized.match(/\blive_env\.[a-z0-9_.-]+\b/i)?.[0] ?? null;
    return {
      family: "live_pipeline",
      sourceTarget: "live_pipeline",
      targetKind: "live_pipeline",
      requiredToolFamily: "live_env",
      selectedCapability: capability,
      explicitCue: "live_env_tool_family",
      requestedOutputs: ["tool_call_eligibility", "live_source_observation", "typed_failure"],
    };
  }
  if (/\bhelix_ask\.[a-z0-9_.-]+\b/i.test(normalized)) {
    const capability = normalized.match(/\bhelix_ask\.[a-z0-9_.-]+\b/i)?.[0] ?? null;
    return {
      family: "helix_ask",
      sourceTarget: "procedure_memory",
      targetKind: "procedure_memory",
      requiredToolFamily: "helix_ask",
      selectedCapability: capability,
      explicitCue: "helix_ask_tool_family",
      requestedOutputs: ["tool_call_eligibility", "procedure_observation", "typed_failure"],
    };
  }
  if (HELIX_ASK_SCIENTIFIC_IMAGE_PROMPT_RE.test(normalized)) {
    const requestedOutputs = [
      "tool_call_eligibility",
      "image_lens_crop_observation",
      "scientific_evidence_packet",
      "scientific_evidence_sidecar",
      ...(HELIX_ASK_SCIENTIFIC_IMAGE_REFLECTION_PROMPT_RE.test(normalized)
        ? ["theory_reflection", "calculator_payload_filter"]
        : []),
      "typed_failure",
    ];
    return {
      family: "scientific_image",
      sourceTarget: "scientific_image_evidence",
      targetKind: "scientific_image_evidence_sidecar",
      requiredToolFamily: "visual_analysis",
      selectedCapability: "visual_analysis.inspect_image_region",
      explicitCue: "scientific_image_evidence_sidecar",
      requestedOutputs,
    };
  }
  if (/\b(?:image[_\s-]?lens|visual_analysis\.inspect_image_region)\b/i.test(normalized)) {
    return {
      family: "image_lens",
      sourceTarget: "image_lens",
      targetKind: "visual_region_evidence",
      requiredToolFamily: "visual_analysis",
      selectedCapability: "visual_analysis.inspect_image_region",
      explicitCue: "image_lens_region_inspection",
      requestedOutputs: ["tool_call_eligibility", "image_lens_crop_observation", "scientific_evidence_packet", "typed_failure"],
    };
  }
  if (/\bvisual_capture\b/i.test(normalized)) {
    return {
      family: "visual_capture",
      sourceTarget: "visual_capture",
      targetKind: "visual_capture",
      requiredToolFamily: "visual_capture",
      selectedCapability: "visual_capture.inspect",
      explicitCue: "visual_capture_tool_family",
      requestedOutputs: ["tool_call_eligibility", "visual_frame_evidence", "typed_failure"],
    };
  }
  return null;
}

export function requiresHelixAskBackendEntrypoint(question: string | null | undefined): boolean {
  const normalized = `${question ?? ""}`.trim();
  if (!normalized) return false;
  if (isQuotedTransformOnlyForBackendEntrypointPolicy(normalized)) return false;
  return HELIX_ASK_BACKEND_ENTRYPOINT_REQUIRED_PROMPT_RE.test(normalized) || Boolean(resolveHelixAskBackendEntrypointFamily(normalized));
}

export function shouldUseHelixAskBackendTurnEntrypoint(args: {
  manualCanaryEnabled: boolean;
  hardBackendEntrypointRequired: boolean;
}): boolean {
  return args.manualCanaryEnabled || args.hardBackendEntrypointRequired;
}

export function buildHelixAskPastedTextResumeRecallRouteMetadata(args: {
  base?: HelixAskRouteMetadata;
  turnId: string;
  threadId: string;
}): HelixAskRouteMetadata {
  return {
    ...(args.base ?? {}),
    schema: "helix.ask.route_metadata.v1",
    source: "conversation_memory_recall",
    sourceTarget: "conversation_memory",
    source_target_intent: {
      schema: "helix.ask_source_target_intent.v1",
      turn_id: args.turnId,
      thread_id: args.threadId,
      target_source: "conversation_memory",
      target_kind: "conversation_memory",
      strength: "hard",
      explicit_cues: ["pasted_text_resume_recall"],
      reasons: ["pasted_text_resume_recall_prompt"],
      requested_outputs: ["conversation_memory_answer"],
      suppressed_routes: ["conversation:simple", "model_only_concept", "workspace_diagnostic"],
      precedence_reason: "pasted_text_resume_recall_selected",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      confidence: 0.96,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
}

export function buildHelixAskHardBackendEntrypointRouteMetadata(args: {
  question: string;
  base?: HelixAskRouteMetadata;
  turnId: string;
  threadId: string;
}): HelixAskRouteMetadata | null {
  const family = resolveHelixAskBackendEntrypointFamily(args.question);
  if (!family) return null;
  const sourceTargetIntent = {
    schema: "helix.ask_source_target_intent.v1",
    turn_id: args.turnId,
    thread_id: args.threadId,
    target_source: family.sourceTarget,
    target_kind: family.targetKind,
    strength: "hard",
    explicit_cues: [family.explicitCue],
    reasons: ["hard_tool_family_prompt", `${family.family}_backend_entrypoint_required`],
    requested_outputs: Array.from(new Set(family.requestedOutputs)),
    suppressed_routes: [
      "conversation:simple",
      "durable_chat_session",
      "client_projection",
      "evidence_finalization_fallback",
      "model_only_concept",
      "no_tool_direct",
    ],
    precedence_reason: "hard_tool_family_backend_entrypoint_required",
    must_enter_backend_ask: true,
    allow_client_shortcut: false,
    allow_no_tool_direct: false,
    confidence: 0.97,
    assistant_answer: false,
    raw_content_included: false,
  };
  const mandatoryNextTool = family.selectedCapability
    ? {
        schema: "helix.mandatory_next_tool.v1",
        phase: "tool_observation",
        tool_name: family.selectedCapability,
        required_tool_family: family.requiredToolFamily,
        selected_capability: family.selectedCapability,
        terminal_forbidden: true,
        reason: "hard tool-family prompt requires backend Ask capability observation before terminal authority",
        missing_required_evidence: family.requestedOutputs.includes("scientific_evidence_sidecar")
          ? "scientific_evidence_sidecar"
          : family.requestedOutputs.includes("calculator_receipt")
          ? "calculator_receipt"
          : "tool_observation",
        blocking_reasons: ["backend_ask_entry_required", "tool_observation_required"],
        canonical_goal: family.family,
        assistant_answer: false,
        raw_content_included: false,
      }
    : undefined;
  return {
    ...(args.base ?? {}),
    schema: "helix.ask.route_metadata.v1",
    source: "hard_tool_backend_entrypoint",
    sourceTarget: family.sourceTarget,
    requiredToolFamily: family.requiredToolFamily,
    source_target_intent: {
      ...(args.base?.source_target_intent ?? {}),
      ...sourceTargetIntent,
    },
    ...(mandatoryNextTool ? { mandatory_next_tool: mandatoryNextTool } : {}),
  };
}
