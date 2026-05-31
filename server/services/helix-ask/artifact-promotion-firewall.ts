import {
  HELIX_ARTIFACT_PROMOTION_AUDIT_SCHEMA,
  type HelixArtifactPromotionAudit,
  type HelixAskIntentFamily,
} from "@shared/helix-artifact-promotion-audit";
import { isExplicitVisualInputRequest } from "./model-only-concept-source-guard";

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const VISUAL_DESCRIPTION_RE =
  /\b(?:describe|what\s+(?:do\s+you\s+)?see|what\s+is\s+(?:in|on)|what(?:'s|\s+is)\s+happening|explain\s+(?:this|the)\s+(?:image|screenshot|frame|visual|scene))\b/i;

const VISUAL_REFERENCE_RE =
  /\b(?:attached|upload(?:ed)?|image|picture|photo|screenshot|visual|frame|screen\s*share|screen|tab|window|minecraft\s+tab)\b/i;

const LIVE_SETUP_RE =
  /\b(?:set\s*up|setup|start|create|configure|prepare|enable|turn\s+on|use|watch|monitor)\b[\s\S]{0,160}\b(?:live\s+answer|live\s+(?:answer\s+)?(?:environment|source|interpretation|monitor|readout|card)|minecraft\s+cortana|cortana\s+mode|visual\s+(?:source|capture)|screen\s*share|browser\s+tab|minecraft\s+tab|line\s+checks?|source\s+fidelity)\b/i;

const LIVE_SETUP_REVERSE_RE =
  /\b(?:live\s+answer|live\s+(?:answer\s+)?(?:environment|source|interpretation|monitor|readout|card)|minecraft\s+cortana|cortana\s+mode)\b[\s\S]{0,160}\b(?:set\s*up|setup|start|create|configure|prepare|enable|use|watch|monitor|visual|source|fidelity|line\s+checks?|describe)\b/i;

const SOURCE_DIAGNOSTIC_RE =
  /\b(?:source\s+health|source\s+status|visual\s+source|vision\s+provider|configured_missing|analysis_failed|waiting\s+for\s+image\s+recognition|provider\s+(?:missing|failed|unavailable)|capture\s+(?:status|health))\b/i;

const NON_VISUAL_SUMMARY_RE =
  /\b(?:visual\s+frame\s+was\s+recorded|no\s+configured\s+vision\s+provider|did\s+not\s+return\s+an?\s+image\s+description|did\s+not\s+produce\s+usable\s+visual\s+evidence|waiting\s+for\s+image\s+recognition|vision_provider_unavailable|provider\s+(?:missing|failed|unavailable)|analysis_failed|configure\s+(?:the\s+)?vision\s+provider|capture\s+(?:a\s+)?fresh\s+frame)\b/i;

export function classifyHelixAskTurnIntentFamily(prompt: string): HelixAskIntentFamily {
  const text = normalize(prompt);
  if (!text) return "normal_ask";
  if (LIVE_SETUP_RE.test(text) || LIVE_SETUP_REVERSE_RE.test(text)) {
    return "live_environment_setup";
  }
  if (SOURCE_DIAGNOSTIC_RE.test(text) && !VISUAL_DESCRIPTION_RE.test(text)) {
    return "source_diagnostic";
  }
  const explicitVisualInputRequest = isExplicitVisualInputRequest(text);
  if (VISUAL_DESCRIPTION_RE.test(text) && VISUAL_REFERENCE_RE.test(text) && explicitVisualInputRequest) {
    return "visual_description";
  }
  if (VISUAL_REFERENCE_RE.test(text) && explicitVisualInputRequest) return "visual_question";
  return "normal_ask";
}

export function isUsableVisualAnswerSummary(summary: unknown): boolean {
  const text = normalize(summary);
  if (!text) return false;
  if (NON_VISUAL_SUMMARY_RE.test(text)) return false;
  return true;
}

export function buildHelixArtifactPromotionAudit(input: {
  intentFamily: HelixAskIntentFamily;
  candidateArtifactKind?: string | null;
  candidateAllowed?: boolean;
  blockedReason?: string | null;
}): HelixArtifactPromotionAudit {
  const blocked =
    input.candidateArtifactKind && input.candidateAllowed === false
      ? [
          {
            artifact_kind: input.candidateArtifactKind,
            reason: input.blockedReason ?? "artifact_not_allowed_for_intent",
          },
        ]
      : [];
  return {
    schema: HELIX_ARTIFACT_PROMOTION_AUDIT_SCHEMA,
    ok: true,
    intent_family: input.intentFamily,
    blocked_artifact_promotions: blocked,
    source_status_promoted_to_answer: false,
    worker_output_promoted_to_answer: false,
    deterministic_artifact_answer_blocked: blocked.length > 0,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function evaluateAttachedVisualPromotion(input: {
  prompt: string;
  summary: string | null;
  artifactKind?: string | null;
}): {
  intent_family: HelixAskIntentFamily;
  allowed: boolean;
  reason: string | null;
  audit: HelixArtifactPromotionAudit;
} {
  const intentFamily = classifyHelixAskTurnIntentFamily(input.prompt);
  const artifactKind = input.artifactKind ?? "visual_frame_evidence";
  const visualIntentAllowed =
    intentFamily === "visual_description" || intentFamily === "visual_question";
  const summaryUsable = isUsableVisualAnswerSummary(input.summary);
  const allowed = visualIntentAllowed && summaryUsable;
  const reason = allowed
    ? null
    : !visualIntentAllowed
      ? `intent_${intentFamily}_cannot_promote_visual_artifact`
      : "visual_summary_is_provider_or_source_diagnostic";
  return {
    intent_family: intentFamily,
    allowed,
    reason,
    audit: buildHelixArtifactPromotionAudit({
      intentFamily,
      candidateArtifactKind: artifactKind,
      candidateAllowed: allowed,
      blockedReason: reason,
    }),
  };
}
