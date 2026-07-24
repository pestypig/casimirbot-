import { z } from "zod";

export const RealtimeStagePlayRouteMetadataSchema = z
  .object({
    schema: z.literal("helix.ask.route_metadata.v1"),
    source: z.literal("realtime_stage_play"),
    invocationKind: z.literal("stage_play_realtime_transcript_handoff"),
    sourceTarget: z.string().min(1),
    mailboxThreadId: z.string().min(1),
    handoffId: z.string().min(1),
    realtimeSessionId: z.string().min(1),
    stagePlayEventRef: z.string().min(1),
    contextPackId: z.string().min(1),
    contextHash: z.string().min(1),
    currentTranscriptTextHash: z.string().min(1),
    currentTranscriptTextCharCount: z.number().int().nonnegative(),
    source_target_intent: z.record(z.unknown()),
  })
  .passthrough();

export type RealtimeStagePlayRouteMetadata = z.infer<
  typeof RealtimeStagePlayRouteMetadataSchema
>;

export const readRealtimeStagePlayRouteMetadata = (
  value: unknown,
): RealtimeStagePlayRouteMetadata | null => {
  const parsed = RealtimeStagePlayRouteMetadataSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};
