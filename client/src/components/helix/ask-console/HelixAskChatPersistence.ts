export type HelixAskConsoleChatRole = "user" | "assistant";

export type HelixAskConsoleChatMessagePayload = {
  role: HelixAskConsoleChatRole;
  content: string;
  traceId?: string;
};

export function buildHelixAskConsoleChatMessagePayload(args: {
  role: HelixAskConsoleChatRole;
  content: string | null | undefined;
  traceId?: string | null;
}): HelixAskConsoleChatMessagePayload | null {
  const content = typeof args.content === "string" ? args.content : "";
  if (!content) return null;
  const traceId = typeof args.traceId === "string" ? args.traceId.trim() : "";
  return {
    role: args.role,
    content,
    ...(traceId ? { traceId } : {}),
  };
}

export function buildHelixAskConsoleChatTurnPayloads(args: {
  userContent?: string | null;
  assistantContent?: string | null;
  traceId?: string | null;
}): HelixAskConsoleChatMessagePayload[] {
  return [
    buildHelixAskConsoleChatMessagePayload({
      role: "user",
      content: args.userContent,
      traceId: args.traceId,
    }),
    buildHelixAskConsoleChatMessagePayload({
      role: "assistant",
      content: args.assistantContent,
      traceId: args.traceId,
    }),
  ].filter((message): message is HelixAskConsoleChatMessagePayload => message !== null);
}
