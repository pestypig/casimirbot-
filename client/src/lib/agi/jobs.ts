import type { DesktopPanelProposal, DesktopPanelProposalsResponse } from "@shared/jobs";

export type JobsListItem = {
  id: string;
  title: string;
  description?: string;
  kind: "code" | "research" | "agi" | "ops";
  priority: "low" | "medium" | "high";
  source: string;
  rewardTokens: number;
  paths: string[];
  tags: string[];
};

export type JobsListResponse = { jobs: JobsListItem[]; generatedAt: number };

export async function listJobs(): Promise<JobsListResponse> {
  const res = await fetch("/api/jobs/list");
  if (!res.ok) throw new Error(`jobs_list_failed: ${res.status}`);
  return (await res.json()) as JobsListResponse;
}

export type TokenLedgerEntry = { id: string; at: number; delta: number; reason: string; jobId?: string };
export type TokenBalance = { userId: string; balance: number; dailyBase: number; nextResetAt: number; ledger?: TokenLedgerEntry[] };

export async function getBudget(): Promise<TokenBalance> {
  const res = await fetch("/api/jobs/budget");
  if (!res.ok) throw new Error(`budget_failed: ${res.status}`);
  return (await res.json()) as TokenBalance;
}

export async function completeJob(jobId: string, evidence?: string): Promise<{ ok: boolean; award: number; balance: TokenBalance }>
{
  const res = await fetch("/api/jobs/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, evidence }),
  });
  if (!res.ok) throw new Error(`complete_failed: ${res.status}`);
  return (await res.json()) as any;
}

export type JobProposal = {
  title: string;
  description: string;
  kind?: "code" | "research" | "agi" | "ops";
  priority?: "low" | "medium" | "high";
  paths?: string[];
  tags?: string[];
  traceId?: string;
  rewardTokens?: number;
};

export async function proposeJob(payload: JobProposal): Promise<{ ok: boolean; agreed: boolean; job?: JobsListItem; message?: string }>{
  const res = await fetch("/api/jobs/propose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`propose_failed: ${res.status}`);
  return (await res.json()) as any;
}

export async function listPanelProposals(): Promise<DesktopPanelProposalsResponse> {
  const res = await fetch("/api/jobs/proposals");
  if (!res.ok) throw new Error(`proposals_failed: ${res.status}`);
  const body = (await res.json()) as DesktopPanelProposalsResponse;
  return body;
}
