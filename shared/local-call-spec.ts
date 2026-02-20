import { z } from "zod";

export type LocalCallAction = "answer_locally" | "call_remote";

export type LocalResourceType = "repo_file" | "doc" | "web_page" | "service" | "telemetry";

export type LocalIntentTag =
  | "warp_physics"
  | "implementation"
  | "status"
  | "docs_explainer"
  | "generic"
  | string;

export type LocalAnswerDetail = "low" | "medium" | "high";

export interface LocalResourceHint {
  type: LocalResourceType;
  path?: string;
  url?: string;
  id?: string;
  reason?: string;
}

export interface LocalAnswerStyle {
  detail?: LocalAnswerDetail;
  bullets?: boolean;
  codeHeavy?: boolean;
}

export interface LocalCallSpec {
  action: LocalCallAction;
  intent: LocalIntentTag[];
  personaId?: string;
  resourceHints?: LocalResourceHint[];
  answerStyle?: LocalAnswerStyle;
  premise?: string;
}

export const zLocalResourceHint = z.object({
  type: z.enum(["repo_file", "doc", "web_page", "service", "telemetry"]),
  path: z.string().optional(),
  url: z.string().optional(),
  id: z.string().optional(),
  reason: z.string().optional(),
});

export const zLocalAnswerStyle = z.object({
  detail: z.enum(["low", "medium", "high"]).optional(),
  bullets: z.boolean().optional(),
  codeHeavy: z.boolean().optional(),
});

export const zLocalCallSpec = z.object({
  action: z.enum(["answer_locally", "call_remote"]),
  intent: z.array(z.string()).default([]),
  personaId: z.string().optional(),
  resourceHints: z.array(zLocalResourceHint).optional(),
  answerStyle: zLocalAnswerStyle.optional(),
  premise: z.string().optional(),
});

export type ZLocalCallSpec = z.infer<typeof zLocalCallSpec>;


export type MissionBridgeCommand = "navigate" | "manipulate" | "diagnose" | "calibrate";

export interface MissionBridgeEnvelope {
  contract_version: "agibot.x1.runtime.bridge.v1";
  trace_id: string;
  run_id?: string;
  channel?: "aimrt" | "ros2" | "protobuf";
  command: {
    name: MissionBridgeCommand;
    args: Record<string, unknown>;
    constraints?: {
      max_duration_ms?: number;
      workspace_scope?: string;
      safety_profile?: string;
    };
  };
  policy?: {
    forbid_actuator_path?: boolean;
    fail_closed?: boolean;
  };
}

export const zMissionBridgeEnvelope = z.object({
  contract_version: z.literal("agibot.x1.runtime.bridge.v1"),
  trace_id: z.string().min(1),
  run_id: z.string().optional(),
  channel: z.enum(["aimrt", "ros2", "protobuf"]).optional(),
  command: z.object({
    name: z.enum(["navigate", "manipulate", "diagnose", "calibrate"]),
    args: z.record(z.unknown()),
    constraints: z.object({
      max_duration_ms: z.number().int().positive().optional(),
      workspace_scope: z.string().optional(),
      safety_profile: z.string().optional(),
    }).optional(),
  }),
  policy: z.object({
    forbid_actuator_path: z.boolean().optional(),
    fail_closed: z.boolean().optional(),
  }).optional(),
});

export type ZMissionBridgeEnvelope = z.infer<typeof zMissionBridgeEnvelope>;
