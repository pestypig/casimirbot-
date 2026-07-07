import type { EssenceProposal } from "@shared/proposals";
import type { ProposalKind } from "@shared/proposals";
import { isPublicPostulateStatus } from "@shared/proposals";

type ProposalAccessView = Pick<EssenceProposal, "kind" | "ownerId" | "status">;

export function canReadProposalForAccount(
  proposal: ProposalAccessView,
  ownerId: string | null,
  accountType: "developer" | "user",
): boolean {
  if (proposal.kind === "postulate") {
    if (accountType === "developer") return true;
    if (isPublicPostulateStatus(proposal.status)) return true;
    return Boolean(proposal.ownerId && proposal.ownerId === ownerId);
  }
  return !proposal.ownerId || proposal.ownerId === ownerId;
}

export function shouldListAllProposalOwnersForAccount(
  accountType: "developer" | "user",
  kind?: ProposalKind | null,
): boolean {
  return accountType === "developer" || kind === "postulate";
}
