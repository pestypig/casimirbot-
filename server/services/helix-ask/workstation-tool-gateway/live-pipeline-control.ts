import type { HelixVisualProducerCadenceStatus } from
  "@shared/helix-visual-producer-cadence";
import {
  listLiveSourceProducers,
} from "../../situation-room/live-source-chunk-buffer";
import {
  getLiveSourceProducerBinding,
  setVisualProducerCadence,
} from "../../situation-room/live-source-producer-binding";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const LIVE_PIPELINE_SET_RATE_CAPABILITY =
  "situation-room.live-source.set_rate" as const;

export const livePipelineControlManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: LIVE_PIPELINE_SET_RATE_CAPABILITY,
  label: "Set visual live-source cadence",
  description:
    "Sets the cadence of one visual producer already bound to the authenticated conversation. Source selection is validated server-side and the result is a non-terminal mutation receipt.",
  panel_id: "situation-room-pipelines",
  action_id: "live-source.set_rate",
  mode: "act",
  mutating: true,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["cadence_ms", "capture_mode"],
    properties: {
      source_id: { type: "string" },
      cadence_ms: { type: "number", minimum: 5_000, maximum: 120_000 },
      capture_mode: {
        type: "string",
        enum: ["manual", "interval", "salience_triggered"],
      },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: "helix.visual_producer_cadence_receipt.v1",
  observation_schema: "helix.visual_producer_cadence_receipt.v1",
  safety_tags: [
    "mutating",
    "affirmative_operator_command_required",
    "conversation_scoped_source",
    "server_derived_identity",
    "receipt_only",
    "non_terminal",
    "no_shell",
    "no_code_mutation",
  ],
  assistant_answer: false,
  raw_content_included: false,
};

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const failure = (code: string, summary: string, retryable = false) => ({
  ok: false as const,
  status: "blocked" as const,
  summary,
  error: code,
  observation: {
    schema: "helix.visual_producer_cadence_failure.v1",
    status: "blocked",
    failure_code: code,
    summary,
    retryable,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
});

export const executeLivePipelineControlGatewayCapability = (input: {
  args: Record<string, unknown>;
  conversationThreadId?: string | null;
}) => {
  const threadId = readString(input.conversationThreadId);
  if (!threadId) {
    return failure(
      "conversation_thread_missing",
      "The live-pipeline control requires an authenticated conversation thread.",
    );
  }
  const cadenceMs =
    typeof input.args.cadence_ms === "number" &&
    Number.isFinite(input.args.cadence_ms)
      ? Math.round(input.args.cadence_ms)
      : null;
  if (cadenceMs === null || cadenceMs < 5_000 || cadenceMs > 120_000) {
    return failure(
      "cadence_out_of_range",
      "Visual capture cadence must be between 5 and 120 seconds.",
    );
  }
  const captureMode = readString(input.args.capture_mode);
  if (
    captureMode !== "manual" &&
    captureMode !== "interval" &&
    captureMode !== "salience_triggered"
  ) {
    return failure(
      "capture_mode_invalid",
      "Visual capture mode must be manual, interval, or salience_triggered.",
    );
  }
  const candidates = listLiveSourceProducers({ threadId }).filter(
    (producer) => producer.modality === "visual_frame",
  );
  const requestedSourceId = readString(input.args.source_id);
  const producer = requestedSourceId
    ? candidates.find((entry) => entry.source_id === requestedSourceId) ?? null
    : candidates.length === 1
      ? candidates[0]
      : null;
  if (!producer) {
    if (requestedSourceId) {
      return failure(
        "wrong_conversation_source",
        "The requested visual source is not bound to this conversation.",
      );
    }
    if (candidates.length > 1) {
      return failure(
        "ambiguous_visual_source",
        "More than one visual source is bound; select the intended source before changing cadence.",
      );
    }
    return failure(
      "visual_source_unavailable",
      "No visual source is currently bound to this conversation.",
      true,
    );
  }
  const binding = getLiveSourceProducerBinding(producer.source_id);
  const currentStatus = producer.status as HelixVisualProducerCadenceStatus;
  const result = setVisualProducerCadence({
    threadId,
    sourceId: producer.source_id,
    environmentId: binding?.environment_id ?? null,
    pipelineId: binding?.pipeline_id ?? null,
    cadenceMs,
    captureMode,
    clientStreamConfirmed: producer.status === "active",
    status: currentStatus,
  });
  return {
    ok: true as const,
    status: "completed" as const,
    summary: result.receipt.summary,
    observation: result.receipt,
  };
};
