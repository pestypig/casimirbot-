import crypto from "node:crypto";
import type { HelixDerivedEquation } from "@shared/helix-derived-equation";
import type { HelixMultimodalSubgoalPlan } from "@shared/helix-multimodal-subgoal-plan";
import type { HelixMultimodalTurnContext } from "@shared/helix-multimodal-turn-context";
import type { HelixPoisonAuditResult, HelixTerminalAuthority } from "@shared/helix-turn-poison-guard";
import type { HelixTurnItemLifecycleEvent } from "@shared/helix-turn-item-lifecycle";
import type { HelixVisualExtractionEvidence } from "@shared/helix-visual-extraction-evidence";
import type { HelixWorkstationToolEvaluation } from "@shared/helix-workstation-tool-evaluation";
import type { HelixWorkstationToolPlan } from "@shared/helix-workstation-tool-plan";
import {
  HELIX_WORKSTATION_REASONING_TRACE_SCHEMA,
  type HelixWorkstationReasoningTrace,
  type HelixWorkstationReasoningTraceExtractionScope,
  type HelixWorkstationReasoningTraceProofStatus,
  type HelixWorkstationReasoningTraceScopeMatch,
  type HelixWorkstationReasoningTraceStep,
} from "@shared/helix-workstation-reasoning-trace";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const compact = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim() ? value.trim().replace(/\s+/g, " ") : fallback;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => compact(value)).filter(Boolean)));

export function inferRequestedExtractionScope(userGoal: string): HelixWorkstationReasoningTraceExtractionScope {
  const normalized = userGoal.toLowerCase();
  if (/\b(?:chest|barrel|shulker)\b/.test(normalized)) return "chest";
  if (/\bcontainer\b/.test(normalized)) return "container";
  if (/\bhot\s*bar|hotbar\b/.test(normalized)) return "hotbar";
  if (/\binventory\b/.test(normalized)) return "inventory";
  if (/\btext|read\s+the\s+words|ocr\b/.test(normalized)) return "text";
  if (/\bscene|place|area|room|landscape\b/.test(normalized)) return "scene";
  if (/\bitem|items|object|objects|count|counts|visible\b/.test(normalized)) return "visible_items";
  return "unknown";
}

export function inferActualExtractionScope(
  extraction?: HelixVisualExtractionEvidence | null,
): HelixWorkstationReasoningTraceExtractionScope {
  if (!extraction) return "unknown";
  if (extraction.extraction_goal === "hotbar_item_counts") return "hotbar";
  if (extraction.extraction_goal === "inventory_counts") return "inventory";
  if (extraction.extraction_goal === "text_in_image") return "text";
  if (extraction.extraction_goal === "scene_relations") return "scene";
  if (extraction.extraction_goal === "visible_objects") return "visible_items";
  return "custom";
}

export function compareExtractionScopes(input: {
  requested: HelixWorkstationReasoningTraceExtractionScope;
  actual: HelixWorkstationReasoningTraceExtractionScope;
}): HelixWorkstationReasoningTraceScopeMatch {
  if (input.requested === "unknown" || input.actual === "unknown") return "unknown";
  if (input.requested === input.actual) return "exact";
  if (input.requested === "inventory" && input.actual === "hotbar") return "partial";
  if (input.requested === "visible_items" && ["hotbar", "inventory", "chest", "container"].includes(input.actual)) {
    return "partial";
  }
  if (input.requested === "container" && input.actual === "chest") return "partial";
  return "mismatch";
}

const readCounts = (extraction?: HelixVisualExtractionEvidence | null): number[] => {
  const counts = extraction?.structured_result?.counts;
  return Array.isArray(counts)
    ? counts.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry))
    : [];
};

const buildInputItemRefs = (context?: HelixMultimodalTurnContext | null): string[] =>
  (context?.turn_input_items ?? []).map((item, index) => {
    if (item.type === "evidence_ref") return item.evidence_id;
    if (item.type === "image") return item.evidence_id ?? item.image_ref ?? `input:image:${index}`;
    return `input:text:${index}`;
  });

export function buildWorkstationReasoningTrace(input: {
  threadId: string;
  turnId: string;
  userGoal: string;
  routeReasonCode: string;
  multimodalTurnContext?: HelixMultimodalTurnContext | null;
  multimodalSubgoalPlan?: HelixMultimodalSubgoalPlan | null;
  visualExtractionEvidence?: HelixVisualExtractionEvidence | null;
  derivedEquation?: HelixDerivedEquation | null;
  workstationToolPlan?: HelixWorkstationToolPlan | null;
  workstationToolEvaluation?: HelixWorkstationToolEvaluation | null;
  toolReceiptIds?: string[];
  lifecycleEvents?: HelixTurnItemLifecycleEvent[];
  terminalAuthority?: HelixTerminalAuthority | null;
  poisonAudit?: HelixPoisonAuditResult | null;
  selectedEvidencePack?: Record<string, unknown> | null;
  finalAnswerSnapshot: string;
  createdAt?: string;
}): HelixWorkstationReasoningTrace {
  const requestedScope = inferRequestedExtractionScope(input.userGoal);
  const actualScope = inferActualExtractionScope(input.visualExtractionEvidence);
  const scopeMatch = compareExtractionScopes({ requested: requestedScope, actual: actualScope });
  const caveats: string[] = [];
  if (scopeMatch === "partial") {
    caveats.push(`User asked for ${requestedScope} counts; extraction scope was ${actualScope}.`);
  } else if (scopeMatch === "mismatch") {
    caveats.push(`User asked for ${requestedScope}; extraction scope was ${actualScope}.`);
  }
  if (input.visualExtractionEvidence?.uncertainty?.length) {
    caveats.push(...input.visualExtractionEvidence.uncertainty.slice(0, 3));
  }
  const counts = readCounts(input.visualExtractionEvidence);
  const compactSteps: HelixWorkstationReasoningTraceStep[] = [
    input.visualExtractionEvidence
      ? {
          label: "Visual extraction",
          summary: counts.length
            ? `Read visible ${actualScope} counts ${counts.join(", ")}.`
            : `Attempted visual extraction for ${actualScope}; no reliable numeric counts were produced.`,
          artifact_ref: input.visualExtractionEvidence.extraction_id,
          status: counts.length ? "completed" : "partial",
        }
      : {
          label: "Visual extraction",
          summary: "No visual extraction evidence was available.",
          artifact_ref: null,
          status: "skipped",
        },
    input.derivedEquation
      ? {
          label: "Equation builder",
          summary: `Derived ${input.derivedEquation.expression}.`,
          artifact_ref: input.derivedEquation.equation_id,
          status: "completed",
        }
      : {
          label: "Equation builder",
          summary: "No reliable equation was derived.",
          artifact_ref: null,
          status: "skipped",
        },
    input.workstationToolEvaluation
      ? {
          label: "Workstation tool evaluation",
          summary: compact(input.workstationToolEvaluation.summary, "Evaluated workstation tool result."),
          artifact_ref: input.workstationToolEvaluation.evaluation_id,
          status: input.workstationToolEvaluation.supports_goal === true ? "completed" : "partial",
        }
      : {
          label: "Workstation tool evaluation",
          summary: "No workstation tool evaluation was recorded.",
          artifact_ref: null,
          status: "skipped",
        },
    {
      label: "Final synthesis",
      summary: compact(input.finalAnswerSnapshot).slice(0, 280),
      artifact_ref: input.terminalAuthority?.terminal_text_hash ?? null,
      status: input.workstationToolEvaluation ? "completed" : "partial",
    },
  ];
  const proofStatus: HelixWorkstationReasoningTraceProofStatus =
    !input.workstationToolEvaluation || compactSteps.some((step) => step.status === "failed")
      ? "failed"
      : caveats.length > 0 || scopeMatch === "partial" || scopeMatch === "mismatch"
        ? "partial"
        : "complete";
  const selectedValidationRefs = Array.isArray(input.selectedEvidencePack?.["selected_validation_refs"])
    ? (input.selectedEvidencePack?.["selected_validation_refs"] as unknown[])
    : [];
  const selectedVisualRefs = Array.isArray(input.selectedEvidencePack?.["visual_evidence_refs"])
    ? (input.selectedEvidencePack?.["visual_evidence_refs"] as unknown[])
    : [];
  const evidenceRefs = uniqueStrings([
    ...(selectedVisualRefs.map(String)),
    ...(selectedValidationRefs.map(String)),
    ...(input.workstationToolEvaluation?.evidence_refs ?? []),
    ...(input.visualExtractionEvidence?.source_evidence_refs ?? []),
    input.visualExtractionEvidence?.extraction_id,
    input.derivedEquation?.equation_id,
    input.workstationToolEvaluation?.evaluation_id,
  ]);
  const toolReceiptIds = uniqueStrings([...(input.toolReceiptIds ?? []), ...(input.workstationToolEvaluation?.tool_receipt_ids ?? [])]);
  const traceId = `workstation_trace:${hashShort([
    input.threadId,
    input.turnId,
    input.routeReasonCode,
    input.workstationToolEvaluation?.evaluation_id ?? input.finalAnswerSnapshot,
  ], 20)}`;
  return {
    schema: HELIX_WORKSTATION_REASONING_TRACE_SCHEMA,
    trace_id: traceId,
    thread_id: input.threadId,
    turn_id: input.turnId,
    source_family: input.multimodalSubgoalPlan ? "multimodal" : "custom",
    user_goal: compact(input.userGoal),
    route_reason_code: compact(input.routeReasonCode, "unknown"),
    input_item_refs: uniqueStrings(buildInputItemRefs(input.multimodalTurnContext)),
    evidence_refs: evidenceRefs,
    tool_receipt_ids: toolReceiptIds,
    lifecycle_event_refs: uniqueStrings((input.lifecycleEvents ?? []).map((event) => event.item_id)),
    artifacts: {
      multimodal_subgoal_plan_id: input.multimodalSubgoalPlan?.plan_id ?? null,
      visual_extraction_id: input.visualExtractionEvidence?.extraction_id ?? null,
      derived_equation_id: input.derivedEquation?.equation_id ?? null,
      workstation_tool_plan_id: input.workstationToolPlan?.plan_id ?? null,
      workstation_tool_evaluation_id: input.workstationToolEvaluation?.evaluation_id ?? null,
      terminal_authority_hash: input.terminalAuthority?.terminal_text_hash ?? null,
      poison_audit_id: input.poisonAudit?.audit_id ?? null,
    },
    requested_extraction_scope: requestedScope,
    actual_extraction_scope: actualScope,
    scope_match: scopeMatch,
    proof_status: proofStatus,
    compact_steps: compactSteps,
    caveats: uniqueStrings(caveats),
    final_answer_snapshot: compact(input.finalAnswerSnapshot).slice(0, 1200),
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: input.createdAt ?? new Date().toISOString(),
  };
}
