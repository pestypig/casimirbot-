import {
  buildDottieManifestPreset,
  buildDottieManifestPresetReceipts,
  type BuildDottieManifestPresetInput,
  type HelixDottieManifestPreset,
  type HelixDottieManifestPresetReceipt,
} from "@shared/helix-dottie-manifest-preset";
import {
  makeDottieManifestRunId,
  recordDottieManifestRun,
} from "./dottie-manifest-run-store";
import { recordLiveEnvironmentCommentary } from "./live-environment-commentary-store";

export function buildSituationRoomDottieManifestPreset(
  input: BuildDottieManifestPresetInput = {},
): HelixDottieManifestPreset {
  return buildDottieManifestPreset(input);
}

export function applySituationRoomDottieManifestPreset(
  preset: HelixDottieManifestPreset,
): HelixDottieManifestPresetReceipt {
  if (preset.safety.assistant_answer !== false) {
    throw new Error("dottie manifest preset cannot be an assistant answer");
  }
  if (preset.safety.raw_content_included !== false) {
    throw new Error("dottie manifest preset cannot include raw content");
  }
  if (preset.safety.instruction_authority !== "none") {
    throw new Error("dottie manifest preset cannot carry instruction authority");
  }
  const receipt = buildDottieManifestPresetReceipts(preset);
  const createdAt = new Date().toISOString();
  const presetRef = `dottie_manifest_preset:${preset.thread_id}:${preset.room_id}:${preset.preset_id}`;
  const receiptRefFor = (kind: string): string | null => {
    const match = receipt.receipts.find((entry) => entry.kind === kind);
    return typeof match?.artifact_ref === "string" ? match.artifact_ref : null;
  };
  const runId = makeDottieManifestRunId({
    threadId: preset.thread_id,
    roomId: preset.room_id,
    presetRef,
    receiptRefs: receipt.child_artifact_refs,
    createdAt,
  });
  const commentary = recordLiveEnvironmentCommentary({
    thread_id: preset.thread_id,
    room_id: preset.room_id,
    subject: "dottie_observer",
    kind: "tool_trace",
    status: "observed",
    compact_summary: "Dottie manifest applied as evidence-only Situation Room receipts.",
    evidence_refs: receipt.child_artifact_refs,
    related_artifact_ids: [runId, ...receipt.child_artifact_refs],
    confidence: 1,
    model_invoked: false,
    derived_by_deterministic_reducer: true,
    created_at: createdAt,
  });
  recordDottieManifestRun({
    run_id: runId,
    thread_id: preset.thread_id,
    room_id: preset.room_id,
    status: "applied_as_receipts",
    preset_ref: presetRef,
    receipt_refs: receipt.child_artifact_refs,
    commentary_refs: [commentary.commentary_id],
    created_at: createdAt,
    updated_at: createdAt,
    applied_steps: [
      {
        step: "live_answer_environment",
        status: "receipt_only",
        artifact_ref: receiptRefFor("live_answer_environment_receipt"),
      },
      {
        step: "commentary_policy",
        status: "receipt_only",
        artifact_ref: receiptRefFor("live_commentary_policy_receipt"),
      },
      {
        step: "observer_subscription",
        status: "receipt_only",
        artifact_ref: receiptRefFor("dottie_observer_subscription_receipt"),
      },
      {
        step: "voice_policy",
        status: "receipt_only",
        artifact_ref: receiptRefFor("voice_policy_receipt"),
      },
      {
        step: "field_worker_policy",
        status: "receipt_only",
        artifact_ref: receiptRefFor("field_worker_policy_receipt"),
      },
    ],
  });
  return receipt;
}
