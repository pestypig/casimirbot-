export const HELIX_PROCEDURE_EPOCH_SOURCE_SET_SCHEMA =
  "helix.procedure_epoch_source_set.v1" as const;

export type HelixProcedureEpochSourceSet = {
  schema: typeof HELIX_PROCEDURE_EPOCH_SOURCE_SET_SCHEMA;
  visual_observation_refs: string[];
  world_event_refs: string[];
  audio_transcript_refs: string[];
  calculator_tick_refs: string[];
  document_context_refs: string[];
  note_context_refs: string[];
  replayed_observation_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
};

export const emptyProcedureEpochSourceSet = (): HelixProcedureEpochSourceSet => ({
  schema: HELIX_PROCEDURE_EPOCH_SOURCE_SET_SCHEMA,
  visual_observation_refs: [],
  world_event_refs: [],
  audio_transcript_refs: [],
  calculator_tick_refs: [],
  document_context_refs: [],
  note_context_refs: [],
  replayed_observation_refs: [],
  assistant_answer: false,
  raw_content_included: false,
});
