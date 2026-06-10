export const STAGE_PLAY_VISUAL_OBSERVER_PROFILE_SCHEMA =
  "stage_play_visual_observer_profile/v1" as const;

export const STAGE_PLAY_VISUAL_OBSERVER_PROFILE_CONFIG_RESULT_SCHEMA =
  "stage_play_visual_observer_profile_config_result/v1" as const;

export const STAGE_PLAY_VISUAL_OBSERVER_PROFILE_TEST_RESULT_SCHEMA =
  "stage_play_visual_observer_profile_test_result/v1" as const;

export type StagePlayVisualObserverProfileDomainV1 =
  | "minecraft_gameplay"
  | "science"
  | "browser_workflow"
  | "video_scene"
  | "desktop_app"
  | "document"
  | "custom";

export type StagePlayVisualObserverProfileOutputModeV1 =
  | "prose"
  | "semi_structured_json"
  | "json_schema";

export type StagePlayVisualObserverProfileStatusV1 =
  | "active"
  | "paused"
  | "archived";

export type StagePlayVisualObserverProfileV1 = {
  artifactId: "stage_play_visual_observer_profile";
  schemaVersion: typeof STAGE_PLAY_VISUAL_OBSERVER_PROFILE_SCHEMA;
  profileId: string;
  title: string;
  domain: StagePlayVisualObserverProfileDomainV1;
  subjectCategory?: string | null;
  subject?: string | null;
  sourceIds: string[];
  prompt: string;
  outputMode: StagePlayVisualObserverProfileOutputModeV1;
  expectedSchema?: {
    fields: string[];
    requiredFields: string[];
  } | null;
  cadenceHintMs?: number | null;
  status: StagePlayVisualObserverProfileStatusV1;
  linkedInterpreterProfileId?: string | null;
  linkedWatchJobPolicyId?: string | null;
  linkedNoteId?: string | null;
  promptHash: string;
  createdAt: string;
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_policy";
};

export type StagePlayVisualObserverProfileConfigResultV1 = {
  schema: typeof STAGE_PLAY_VISUAL_OBSERVER_PROFILE_CONFIG_RESULT_SCHEMA;
  profile: StagePlayVisualObserverProfileV1;
  profileCount: number;
  activeForSourceIds: string[];
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayVisualObserverProfileTestResultV1 = {
  schema: typeof STAGE_PLAY_VISUAL_OBSERVER_PROFILE_TEST_RESULT_SCHEMA;
  profile: StagePlayVisualObserverProfileV1;
  sourceId?: string | null;
  genericSummary?: string | null;
  profileSummary?: string | null;
  parsedProfileOutput?: Record<string, unknown> | null;
  parseOk: boolean;
  enqueuedAsMail: false;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};
