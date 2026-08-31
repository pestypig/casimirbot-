import {
  REALTIME_TEXTURE_PACK_VISUAL_CUE_FAMILIES,
  REALTIME_TEXTURE_PACK_VISUAL_TARGET_CLASSES,
  realtimeTexturePackSourceBindingSchema,
  realtimeTexturePackVisualDirectionSupportSchema,
  type RealtimeTexturePackSourceBindingV1,
  type RealtimeTexturePackVisualCuesV1,
  type RealtimeTexturePackVisualDirectionSupportV1,
  type RealtimeTexturePackVisualTreatmentRevisionV1,
} from "@shared/realtime-texture-pack-visual-direction";
import type { RealtimeTexturePackPresetId } from "@shared/realtime-texture-pack";
import type { HelixEnvironmentSituationDigest } from "@shared/helix-environment-event-stream";
import {
  subscribeEnvironmentSituationDigestRecorded,
  type EnvironmentSituationDigestRecordedEvent,
} from "../../environment-connectors/events/event-stream-store";
import { projectMinecraftSituationDigestToVisualCues } from "./minecraft-situation-cue-projector";
import {
  compileRealtimeTexturePackVisualTreatment,
  type RealtimeTexturePackCompiledTargetPayloadV1,
  type RealtimeTexturePackDeterministicTreatmentCompilationV1,
} from "./deterministic-treatment-compiler";

export const REALTIME_TEXTURE_PACK_TARGET_REQUEST_SCHEMA =
  "helix.realtime_texture_pack_target_request.v1" as const;

type CueFamily = (typeof REALTIME_TEXTURE_PACK_VISUAL_CUE_FAMILIES)[number];
type VisualTargetClass =
  (typeof REALTIME_TEXTURE_PACK_VISUAL_TARGET_CLASSES)[number];

export type RealtimeTexturePackVisualDirectionControllerConfigV1 = {
  preset_id: RealtimeTexturePackPresetId;
  custom_direction: string;
  enabled_cue_families: CueFamily[];
  targets: VisualTargetClass[];
  treatment_ttl_ms?: number;
};

export type RealtimeTexturePackTargetRequestStatus =
  | "pending"
  | "dispatched"
  | "completed"
  | "canceled";

export type RealtimeTexturePackTargetRequestV1 = {
  schema: typeof REALTIME_TEXTURE_PACK_TARGET_REQUEST_SCHEMA;
  request_id: string;
  controller_session_id: string;
  source_binding_id: string;
  source_binding_revision: number;
  capture_session_id: string;
  source_frame_id: string;
  cue_packet_id: string | null;
  visual_treatment_revision_id: string;
  visual_treatment_revision: number;
  treatment_hash: string;
  prompt_revision_id: string | null;
  target_class: VisualTargetClass;
  payload: RealtimeTexturePackCompiledTargetPayloadV1;
  created_at: string;
  expires_at: string;
  status: RealtimeTexturePackTargetRequestStatus;
  cancellation_reason:
    | null
    | "superseded_by_newer_treatment"
    | "source_binding_rotated"
    | "controller_stopped";
  presentation_only: true;
  environment_action_authority: false;
  world_mutation_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
};

export type RealtimeTexturePackVisualDirectionControllerStateV1 = {
  controller_session_id: string;
  status: "idle" | "active" | "stopped";
  source_binding_id: string;
  source_binding_revision: number;
  latest_digest_id: string | null;
  latest_observation_revision: number | null;
  latest_cue_packet_id: string | null;
  latest_treatment_revision_id: string | null;
  pending_request_count: number;
  last_failure_reason: string | null;
  stopped_reason: string | null;
  presentation_only: true;
  environment_action_authority: false;
  world_mutation_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
};

type TargetRequestRuntime = {
  request: RealtimeTexturePackTargetRequestV1;
  abortController: AbortController;
};

type DigestSubscriber = (
  subscriber: (event: EnvironmentSituationDigestRecordedEvent) => void,
) => () => void;

export class RealtimeTexturePackVisualDirectionController {
  private binding: RealtimeTexturePackSourceBindingV1;
  private support: RealtimeTexturePackVisualDirectionSupportV1;
  private readonly config: RealtimeTexturePackVisualDirectionControllerConfigV1;
  private readonly now: () => number;
  private readonly subscribeDigest: DigestSubscriber;
  private readonly controllerSessionId: string;
  private unsubscribeDigest: (() => void) | null = null;
  private status: "idle" | "active" | "stopped" = "idle";
  private latestDigest: HelixEnvironmentSituationDigest | null = null;
  private latestCue: RealtimeTexturePackVisualCuesV1 | null = null;
  private latestTreatment: RealtimeTexturePackVisualTreatmentRevisionV1 | null =
    null;
  private treatmentRevision = 0;
  private readonly targetRequests = new Map<string, TargetRequestRuntime>();
  private lastFailureReason: string | null = null;
  private stoppedReason: string | null = null;

  constructor(input: {
    controllerSessionId: string;
    binding: RealtimeTexturePackSourceBindingV1;
    support: RealtimeTexturePackVisualDirectionSupportV1;
    config: RealtimeTexturePackVisualDirectionControllerConfigV1;
    now?: () => number;
    subscribeDigest?: DigestSubscriber;
  }) {
    if (!input.controllerSessionId.trim()) {
      throw new Error("realtime_texture_pack_controller_session_id_required");
    }
    this.controllerSessionId = input.controllerSessionId.trim();
    this.binding = realtimeTexturePackSourceBindingSchema.parse(input.binding);
    this.support = realtimeTexturePackVisualDirectionSupportSchema.parse(
      input.support,
    );
    this.config = {
      ...input.config,
      custom_direction: input.config.custom_direction ?? "",
      enabled_cue_families: [...input.config.enabled_cue_families],
      targets: [...input.config.targets],
    };
    this.now = input.now ?? Date.now;
    this.subscribeDigest =
      input.subscribeDigest ?? subscribeEnvironmentSituationDigestRecorded;
  }

  start(): void {
    if (this.status === "stopped") {
      throw new Error("realtime_texture_pack_controller_stopped");
    }
    if (this.status === "active") return;
    this.status = "active";
    this.unsubscribeDigest = this.subscribeDigest((event) => {
      this.ingestDigestEvent(event);
    });
  }

  ingestDigestEvent(
    event: EnvironmentSituationDigestRecordedEvent,
  ):
    | "accepted"
    | "coalesced"
    | "ignored_unrelated"
    | "rejected_out_of_order"
    | "rejected" {
    if (this.status !== "active") return "ignored_unrelated";
    const context = this.binding.environment_context;
    if (
      !context ||
      this.binding.mode !== "environment_reactive" ||
      event.environment_binding_id !== context.environment_id
    ) {
      return "ignored_unrelated";
    }
    if (this.latestCue) {
      if (
        event.digest.latest_event_sequence < this.latestCue.observation_revision
      ) {
        this.lastFailureReason =
          "realtime_texture_pack_digest_revision_out_of_order";
        return "rejected_out_of_order";
      }
      if (
        event.digest.latest_event_sequence ===
          this.latestCue.observation_revision &&
        event.digest.digest_id === this.latestCue.digest_id &&
        event.digest.digest_hash === this.latestCue.digest_hash
      ) {
        return "coalesced";
      }
    }
    try {
      const cue = projectMinecraftSituationDigestToVisualCues({
        binding: this.binding,
        support: this.support,
        digest: event.digest,
        now: new Date(this.now()).toISOString(),
        previousCue: this.latestCue,
      });
      this.latestDigest = event.digest;
      this.latestCue = cue;
      this.lastFailureReason = null;
      return "accepted";
    } catch (error) {
      this.lastFailureReason =
        error instanceof Error
          ? error.message
          : "realtime_texture_pack_digest_rejected";
      return "rejected";
    }
  }

  compileForFrame(input: {
    sourceFrameId: string;
  }): {
    compilation: RealtimeTexturePackDeterministicTreatmentCompilationV1;
    target_requests: RealtimeTexturePackTargetRequestV1[];
  } {
    if (this.status !== "active") {
      throw new Error("realtime_texture_pack_controller_not_active");
    }
    const nextRevision = this.treatmentRevision + 1;
    const compiledAt = new Date(this.now()).toISOString();
    const compilation = compileRealtimeTexturePackVisualTreatment({
      binding: this.binding,
      sourceFrameId: input.sourceFrameId,
      treatmentRevision: nextRevision,
      presetId: this.config.preset_id,
      customDirection: this.config.custom_direction,
      enabledCueFamilies: this.config.enabled_cue_families,
      targets: this.config.targets,
      cue: this.latestCue,
      previousTreatment: this.latestTreatment,
      compiledAt,
      ttlMs: this.config.treatment_ttl_ms,
    });

    this.cancelOutstanding("superseded_by_newer_treatment");
    this.treatmentRevision = nextRevision;
    this.latestTreatment = compilation.treatment;
    const requests = compilation.target_payloads.map((payload) => {
      const request: RealtimeTexturePackTargetRequestV1 = {
        schema: REALTIME_TEXTURE_PACK_TARGET_REQUEST_SCHEMA,
        request_id: `rtp_target_request:${this.controllerSessionId}:${compilation.treatment.visual_treatment_revision_id}:${payload.target_class}`,
        controller_session_id: this.controllerSessionId,
        source_binding_id: this.binding.binding_id,
        source_binding_revision: this.binding.binding_revision,
        capture_session_id: this.binding.capture_session_id,
        source_frame_id: input.sourceFrameId.trim(),
        cue_packet_id: compilation.treatment.cue_packet_id,
        visual_treatment_revision_id:
          compilation.treatment.visual_treatment_revision_id,
        visual_treatment_revision: nextRevision,
        treatment_hash: compilation.treatment.treatment_hash,
        prompt_revision_id: compilation.treatment.prompt_revision_id,
        target_class: payload.target_class,
        payload,
        created_at: compiledAt,
        expires_at: compilation.treatment.expires_at,
        status: "pending",
        cancellation_reason: null,
        presentation_only: true,
        environment_action_authority: false,
        world_mutation_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      };
      this.targetRequests.set(request.request_id, {
        request,
        abortController: new AbortController(),
      });
      return request;
    });
    return { compilation, target_requests: requests };
  }

  takeTargetRequest(requestId: string): {
    request: RealtimeTexturePackTargetRequestV1;
    signal: AbortSignal;
  } {
    const runtime = this.targetRequests.get(requestId);
    if (!runtime || runtime.request.status !== "pending") {
      throw new Error("realtime_texture_pack_target_request_not_pending");
    }
    runtime.request.status = "dispatched";
    return { request: runtime.request, signal: runtime.abortController.signal };
  }

  completeTargetRequest(requestId: string): void {
    const runtime = this.targetRequests.get(requestId);
    if (!runtime || runtime.request.status !== "dispatched") {
      throw new Error("realtime_texture_pack_target_request_not_dispatched");
    }
    runtime.request.status = "completed";
    this.targetRequests.delete(requestId);
  }

  rotateBinding(input: {
    binding: RealtimeTexturePackSourceBindingV1;
    support: RealtimeTexturePackVisualDirectionSupportV1;
  }): void {
    if (this.status === "stopped") {
      throw new Error("realtime_texture_pack_controller_stopped");
    }
    const nextBinding = realtimeTexturePackSourceBindingSchema.parse(input.binding);
    const nextSupport = realtimeTexturePackVisualDirectionSupportSchema.parse(
      input.support,
    );
    this.cancelOutstanding("source_binding_rotated");
    this.binding = nextBinding;
    this.support = nextSupport;
    this.latestDigest = null;
    this.latestCue = null;
    this.latestTreatment = null;
    this.treatmentRevision = 0;
    this.lastFailureReason = null;
  }

  stop(reason = "controller_stopped"): void {
    if (this.status === "stopped") return;
    this.unsubscribeDigest?.();
    this.unsubscribeDigest = null;
    this.cancelOutstanding("controller_stopped");
    this.latestDigest = null;
    this.latestCue = null;
    this.latestTreatment = null;
    this.status = "stopped";
    this.stoppedReason = reason;
  }

  inspectState(): RealtimeTexturePackVisualDirectionControllerStateV1 {
    return {
      controller_session_id: this.controllerSessionId,
      status: this.status,
      source_binding_id: this.binding.binding_id,
      source_binding_revision: this.binding.binding_revision,
      latest_digest_id: this.latestDigest?.digest_id ?? null,
      latest_observation_revision:
        this.latestCue?.observation_revision ?? null,
      latest_cue_packet_id: this.latestCue?.cue_packet_id ?? null,
      latest_treatment_revision_id:
        this.latestTreatment?.visual_treatment_revision_id ?? null,
      pending_request_count: [...this.targetRequests.values()].filter((entry) =>
        entry.request.status === "pending" || entry.request.status === "dispatched",
      ).length,
      last_failure_reason: this.lastFailureReason,
      stopped_reason: this.stoppedReason,
      presentation_only: true,
      environment_action_authority: false,
      world_mutation_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    };
  }

  private cancelOutstanding(
    reason: Exclude<RealtimeTexturePackTargetRequestV1["cancellation_reason"], null>,
  ): void {
    for (const [requestId, runtime] of this.targetRequests) {
      if (
        runtime.request.status === "pending" ||
        runtime.request.status === "dispatched"
      ) {
        runtime.request.status = "canceled";
        runtime.request.cancellation_reason = reason;
        runtime.abortController.abort(reason);
      }
      this.targetRequests.delete(requestId);
    }
  }
}
