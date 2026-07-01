export type ExternalPromptClaimInput = {
  promptId?: string | null;
  createdAt?: number | null;
};

export function resolveExternalPromptClaimId(
  pending: ExternalPromptClaimInput | null | undefined,
  question: string,
): string {
  const promptId = pending?.promptId?.trim();
  if (promptId) return promptId;
  const createdAt = typeof pending?.createdAt === "number" ? pending.createdAt : 0;
  return `${createdAt}:${question.trim().toLowerCase()}`;
}
