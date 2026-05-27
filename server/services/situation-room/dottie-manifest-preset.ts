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
import {
  linkSituationConstructs,
  makeSituationConstructId,
  upsertSituationConstruct,
} from "./situation-construct-store";

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
    const match = receipt.receipts.find((entry: Record<string, unknown>) => entry.kind === kind);
    return typeof match?.artifact_ref === "string" ? match.artifact_ref : null;
  };
  const liveAnswerEnvironmentRef =
    preset.live_environment.environment_id ?? receiptRefFor("live_answer_environment_receipt");
  const liveAnswerEnvironmentStatus = preset.live_environment.environment_id ? "active" : "planned";
  const liveAnswerConstructStatus = preset.live_environment.environment_id ? "active" : "receipt_only";
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
  const manifestConstructId = makeSituationConstructId({
    threadId: preset.thread_id,
    roomId: preset.room_id,
    type: "dottie_manifest",
    name: "Auntie Dottie manifest",
    seed: runId,
  });
  const liveEnvironmentConstructId = makeSituationConstructId({
    threadId: preset.thread_id,
    roomId: preset.room_id,
    type: "live_environment",
    name: "Dottie live environment",
    seed: runId,
  });
  const liveAnswerOutputConstructId = makeSituationConstructId({
    threadId: preset.thread_id,
    roomId: preset.room_id,
    type: "live_answer_output",
    name: "Dottie live answer output",
    seed: runId,
  });
  const commentaryPolicyConstructId = makeSituationConstructId({
    threadId: preset.thread_id,
    roomId: preset.room_id,
    type: "commentary_policy",
    name: "Dottie commentary policy",
    seed: runId,
  });
  const observerConstructId = makeSituationConstructId({
    threadId: preset.thread_id,
    roomId: preset.room_id,
    type: "observer",
    name: "Auntie Dottie",
    seed: runId,
  });
  const voicePolicyConstructId = makeSituationConstructId({
    threadId: preset.thread_id,
    roomId: preset.room_id,
    type: "voice_policy",
    name: "Dottie voice proposal policy",
    seed: runId,
  });
  const fieldWorkerPolicyConstructId = makeSituationConstructId({
    threadId: preset.thread_id,
    roomId: preset.room_id,
    type: "field_worker_policy",
    name: "Dottie bounded worker policy",
    seed: runId,
  });

  upsertSituationConstruct({
    construct_id: manifestConstructId,
    type: "dottie_manifest",
    name: "Auntie Dottie manifest",
    description: "Witness-only Dottie construct recipe assembled from Situation Room policies and receipts.",
    status: "receipt_only",
    thread_id: preset.thread_id,
    room_id: preset.room_id,
    source_ids: preset.live_environment.source_ids,
    artifact_refs: [runId, presetRef],
    receipt_refs: receipt.child_artifact_refs,
    commentary_refs: [commentary.commentary_id],
    evidence_refs: [runId, commentary.commentary_id, ...receipt.child_artifact_refs],
    output_bindings: [
      {
        output_kind: "typed_commentary",
        artifact_ref: commentary.commentary_id,
        status: "active",
      },
    ],
  });
  upsertSituationConstruct({
    construct_id: liveEnvironmentConstructId,
    type: "live_environment",
    name: "Dottie live environment",
    description: preset.live_environment.objective,
    status: liveAnswerConstructStatus,
    thread_id: preset.thread_id,
    room_id: preset.room_id,
    environment_id: preset.live_environment.environment_id ?? null,
    source_ids: preset.live_environment.source_ids,
    parent_construct_ids: [manifestConstructId],
    artifact_refs: [liveAnswerEnvironmentRef].filter((entry): entry is string => Boolean(entry)),
    receipt_refs: [receiptRefFor("live_answer_environment_receipt")].filter((entry): entry is string => Boolean(entry)),
    commentary_refs: [commentary.commentary_id],
    evidence_refs: [commentary.commentary_id],
    output_bindings: [
      {
        output_kind: "live_answer_environment",
        artifact_ref: liveAnswerEnvironmentRef,
        status: liveAnswerEnvironmentStatus,
      },
    ],
  });
  upsertSituationConstruct({
    construct_id: liveAnswerOutputConstructId,
    type: "live_answer_output",
    name: "Dottie live answer output",
    description: "Optional live answer projection for Dottie construct evidence; not an answer authority.",
    status: liveAnswerConstructStatus,
    thread_id: preset.thread_id,
    room_id: preset.room_id,
    environment_id: preset.live_environment.environment_id ?? null,
    source_ids: preset.live_environment.source_ids,
    parent_construct_ids: [manifestConstructId, liveEnvironmentConstructId],
    artifact_refs: [liveAnswerEnvironmentRef].filter((entry): entry is string => Boolean(entry)),
    receipt_refs: [receiptRefFor("live_answer_environment_receipt")].filter((entry): entry is string => Boolean(entry)),
    commentary_refs: [commentary.commentary_id],
    evidence_refs: [commentary.commentary_id],
    output_bindings: [
      {
        output_kind: "live_answer_environment",
        artifact_ref: liveAnswerEnvironmentRef,
        status: liveAnswerEnvironmentStatus,
      },
      {
        output_kind: "typed_commentary",
        artifact_ref: commentary.commentary_id,
        status: "active",
      },
    ],
  });
  upsertSituationConstruct({
    construct_id: commentaryPolicyConstructId,
    type: "commentary_policy",
    name: "Dottie commentary policy",
    description: `cadence=${preset.commentary_policy.cadence}; voice_mode=${preset.commentary_policy.voice_mode}`,
    status: "receipt_only",
    thread_id: preset.thread_id,
    room_id: preset.room_id,
    parent_construct_ids: [manifestConstructId],
    artifact_refs: [receiptRefFor("live_commentary_policy_receipt")].filter((entry): entry is string => Boolean(entry)),
    receipt_refs: [receiptRefFor("live_commentary_policy_receipt")].filter((entry): entry is string => Boolean(entry)),
    commentary_refs: [commentary.commentary_id],
    evidence_refs: [commentary.commentary_id],
    output_bindings: [
      {
        output_kind: "typed_commentary",
        artifact_ref: commentary.commentary_id,
        status: "active",
      },
    ],
  });
  upsertSituationConstruct({
    construct_id: observerConstructId,
    type: "observer",
    name: "Auntie Dottie",
    description: "Witness-only observer subscription over public Helix Ask and Situation Room events.",
    status: "receipt_only",
    thread_id: preset.thread_id,
    room_id: preset.room_id,
    source_ids: preset.live_environment.source_ids,
    parent_construct_ids: [manifestConstructId],
    artifact_refs: [receiptRefFor("dottie_observer_subscription_receipt")].filter((entry): entry is string => Boolean(entry)),
    receipt_refs: [receiptRefFor("dottie_observer_subscription_receipt")].filter((entry): entry is string => Boolean(entry)),
    commentary_refs: [commentary.commentary_id],
    evidence_refs: [commentary.commentary_id, ...preset.observer.event_filter],
    output_bindings: [
      {
        output_kind: "typed_commentary",
        artifact_ref: commentary.commentary_id,
        status: "active",
      },
    ],
  });
  upsertSituationConstruct({
    construct_id: voicePolicyConstructId,
    type: "voice_policy",
    name: "Dottie voice proposal policy",
    description: `voice_mode=${preset.commentary_policy.voice_mode}; authority=proposal_only`,
    status: "receipt_only",
    thread_id: preset.thread_id,
    room_id: preset.room_id,
    parent_construct_ids: [manifestConstructId],
    artifact_refs: [receiptRefFor("voice_policy_receipt")].filter((entry): entry is string => Boolean(entry)),
    receipt_refs: [receiptRefFor("voice_policy_receipt")].filter((entry): entry is string => Boolean(entry)),
    commentary_refs: [commentary.commentary_id],
    evidence_refs: [commentary.commentary_id],
    output_bindings: [
      {
        output_kind: "voice_proposal",
        artifact_ref: receiptRefFor("voice_policy_receipt"),
        status: preset.commentary_policy.voice_mode === "off" ? "blocked" : "planned",
      },
    ],
    policy: {
      may_speak: false,
      requires_user_confirmation: true,
    },
  });
  upsertSituationConstruct({
    construct_id: fieldWorkerPolicyConstructId,
    type: "field_worker_policy",
    name: "Dottie bounded worker policy",
    description: "Bounded worker policy receipts only; no worker is spawned by manifest creation.",
    status: "receipt_only",
    thread_id: preset.thread_id,
    room_id: preset.room_id,
    parent_construct_ids: [manifestConstructId],
    artifact_refs: [receiptRefFor("field_worker_policy_receipt")].filter((entry): entry is string => Boolean(entry)),
    receipt_refs: [receiptRefFor("field_worker_policy_receipt")].filter((entry): entry is string => Boolean(entry)),
    commentary_refs: [commentary.commentary_id],
    evidence_refs: [commentary.commentary_id],
    policy: {
      may_spawn_workers: false,
      requires_user_confirmation: true,
    },
  });
  for (const childConstructId of [
    liveEnvironmentConstructId,
    liveAnswerOutputConstructId,
    commentaryPolicyConstructId,
    observerConstructId,
    voicePolicyConstructId,
    fieldWorkerPolicyConstructId,
  ]) {
    linkSituationConstructs({
      parentConstructId: manifestConstructId,
      childConstructId,
    });
  }
  linkSituationConstructs({
    parentConstructId: liveEnvironmentConstructId,
    childConstructId: liveAnswerOutputConstructId,
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
        artifact_ref: liveAnswerEnvironmentRef,
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
