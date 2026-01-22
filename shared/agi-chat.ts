import { z } from "zod";
import { whyBelongsSchema } from "./rationale";

export const chatRoleSchema = z.enum(["user", "assistant", "tool", "system"]);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  role: chatRoleSchema,
  content: z.string(),
  at: z.string(),
  tokens: z.number().int().nonnegative().optional(),
  traceId: z.string().optional(),
  tool: z.string().optional(),
  whyBelongs: whyBelongsSchema.optional(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  personaId: z.string(),
  contextId: z.string().optional(),
  messages: z.array(chatMessageSchema).default([]),
  messageCount: z.number().int().nonnegative().optional(),
  messagesHash: z.string().optional(),
});
export type ChatSession = z.infer<typeof chatSessionSchema>;

export const chatSessionSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  personaId: z.string(),
  contextId: z.string().optional(),
  messageCount: z.number().int().nonnegative(),
  messagesHash: z.string(),
});
export type ChatSessionSummary = z.infer<typeof chatSessionSummarySchema>;
