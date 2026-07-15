import { asksForScientificImageTextEvidenceComparison } from "@shared/helix-scientific-image-intent";
import type { HardToolBackendEntrypointRouteMetadata } from "./hard-tool-route-metadata";

export const isAskTurnScientificImageTextComparisonPrompt = (prompt: string): boolean =>
  asksForScientificImageTextEvidenceComparison(prompt);

export const buildAskTurnScientificImageComparisonRouteMetadata = (args: {
  turnId: string;
  threadId?: string | null;
}): {
  metadata: HardToolBackendEntrypointRouteMetadata;
  sourceTargetIntent: Record<string, unknown>;
} => {
  const sourceTargetIntent: Record<string, unknown> = {
    schema: "helix.ask_source_target_intent.v1",
    turn_id: args.turnId,
    thread_id: args.threadId || "helix-ask:desktop",
    target_source: "scientific_image_evidence",
    target_kind: "scientific_image_evidence_sidecar",
    targetSource: "scientific_image_evidence",
    targetKind: "scientific_image_evidence_sidecar",
    strength: "hard",
    explicit_cues: ["affirmative_scientific_image_text_comparison"],
    reasons: ["prompt_requests_retained_machine_text_visual_comparison"],
    requested_outputs: [
      "scientific_evidence_sidecar",
      "machine_text_visual_comparison",
      "model_authored_synthesis",
      "typed_failure",
    ],
    suppressed_routes: [
      "conversation:simple",
      "client_projection",
      "evidence_finalization_fallback",
      "model_only_concept",
      "no_tool_direct",
      "fresh_image_lens_crop",
      "fresh_image_lens_capture",
    ],
    precedence_reason: "request_level_scientific_image_comparison_route_metadata",
    must_enter_backend_ask: true,
    allow_client_shortcut: false,
    allow_no_tool_direct: false,
    reuse_retained_scientific_image_sidecar: true,
    confidence: 0.98,
    assistant_answer: false,
    raw_content_included: false,
  };
  const metadata = {
    schema: "helix.ask.route_metadata.v1",
    source: "hard_tool_backend_entrypoint",
    sourceTarget: "scientific_image_evidence",
    source_target: "scientific_image_evidence",
    source_target_intent: sourceTargetIntent,
    route_reason: "request_level_scientific_image_comparison_route_metadata",
    assistant_answer: false,
    raw_content_included: false,
  } satisfies HardToolBackendEntrypointRouteMetadata;
  return { metadata, sourceTargetIntent };
};
