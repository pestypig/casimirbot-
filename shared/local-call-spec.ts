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
