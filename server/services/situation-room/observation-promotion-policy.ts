import type {
  HelixLiveSourceChunk,
  HelixLiveSourceChunkModality,
} from "@shared/helix-live-source-chunk";
import type { HelixObservationJournalRole } from "@shared/helix-observation-journal";

export type ObservationPromotionPolicyInput = {
  chunk: HelixLiveSourceChunk;
  status: "completed" | "failed" | "suppressed";
  modelInvoked?: boolean;
};

export function observationRoleForAnalysis(input: ObservationPromotionPolicyInput): HelixObservationJournalRole {
  if (input.chunk.modality === "visual_frame" && input.status === "completed") {
    return "model_perception_observation";
  }
  if (input.chunk.modality === "audio_transcript" || input.chunk.modality === "text_chat") {
    return "transcript_observation";
  }
  if (input.chunk.modality === "world_event") {
    return "raw_source_event";
  }
  if (input.chunk.modality === "document_context" || input.chunk.modality === "note_context") {
    return "reference_observation";
  }
  return "tool_observation";
}

export function observationSourceLabelForModality(modality: HelixLiveSourceChunkModality): string {
  if (modality === "visual_frame") return "visual_capture";
  if (modality === "audio_transcript") return "audio_transcript";
  if (modality === "text_chat") return "text_chat";
  if (modality === "world_event") return "minecraft_world_event";
  if (modality === "calculator_stream") return "calculator_stream";
  if (modality === "simulation_stream") return "simulation_stream";
  if (modality === "document_context") return "document_context";
  if (modality === "note_context") return "note_context";
  return "live_source";
}
