import { useEffect, useState } from "react";
import type {
  EssenceProposal,
  ProposalListResponse,
  ProposalSafetyStatus,
  ProposalStatus,
  ProposalKind,
  ProposalPromptPreset,
} from "@shared/proposals";

type FetchParams = {
  status?: ProposalStatus;
  safetyStatus?: ProposalSafetyStatus;
  kind?: ProposalKind;
  day?: string;
};

export async function fetchProposals(params: FetchParams = {}): Promise<EssenceProposal[]> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.safetyStatus) search.set("safety", params.safetyStatus);
  if (params.kind) search.set("kind", params.kind);
  if (params.day) search.set("day", params.day);
  const qs = search.toString();
  const res = await fetch(`/api/proposals${qs ? `?${qs}` : ""}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`proposals_list_failed:${res.status}`);
  }
  const body = (await res.json()) as ProposalListResponse;
  return Array.isArray(body.proposals) ? body.proposals : [];
}

export async function actOnProposal(
  id: string,
  action: "approve" | "deny",
  note?: string,
): Promise<EssenceProposal> {
  const res = await fetch(`/api/proposals/${encodeURIComponent(id)}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, note }),
  });
  if (!res.ok) {
    throw new Error(`proposal_action_failed:${res.status}`);
  }
  const payload = (await res.json()) as { proposal: EssenceProposal };
  if (!payload?.proposal) {
    throw new Error("proposal_action_missing_payload");
  }
  return payload.proposal;
}

export type ProposalProgressEvent = {
  type: "proposal-progress";
  proposalId: string;
  jobId?: string | null;
  status: ProposalStatus;
  safetyStatus: ProposalSafetyStatus;
  safetyScore?: number;
  progress?: number;
  phase?: string;
};

export type ProposalChatEvent = {
  type: "proposal-chat";
  proposalId: string;
  jobId?: string | null;
  role: "builder" | "user";
  message: string;
  ts: string;
};

const MAX_CHAT_EVENTS = 50;

export function useProposalEvents(proposalId?: string | null): {
  progress: ProposalProgressEvent | null;
  chats: ProposalChatEvent[];
} {
  const [progress, setProgress] = useState<ProposalProgressEvent | null>(null);
  const [chats, setChats] = useState<ProposalChatEvent[]>([]);

  useEffect(() => {
    if (!proposalId || typeof window === "undefined" || typeof EventSource === "undefined") {
      setProgress(null);
      setChats([]);
      return;
    }
    const source = new EventSource("/api/essence/events");
    const handleMessage = (event: MessageEvent<string>) => {
      if (!event.data) return;
      let payload: ProposalProgressEvent | ProposalChatEvent | null = null;
      try {
        payload = JSON.parse(event.data) as ProposalProgressEvent | ProposalChatEvent;
      } catch {
        return;
      }
      if (!payload || payload.proposalId !== proposalId) {
        return;
      }
      if (payload.type === "proposal-progress") {
        setProgress(payload);
      } else if (payload.type === "proposal-chat") {
        setChats((current) => {
          const next = [...current, payload as ProposalChatEvent];
          if (next.length > MAX_CHAT_EVENTS) {
            return next.slice(next.length - MAX_CHAT_EVENTS);
          }
          return next;
        });
      }
    };
    source.addEventListener("message", handleMessage as EventListener);
    source.onerror = () => {
      // swallow errors; UI will retry when refetched
    };
    return () => {
      source.removeEventListener("message", handleMessage as EventListener);
      source.close();
      setProgress(null);
      setChats([]);
    };
  }, [proposalId]);

  return { progress, chats };
}

export async function createIdentityMix(label?: string): Promise<{ mixId: string; summary: string }> {
  const res = await fetch("/api/essence/mix/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "proposal-identity", label }),
  });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `mix_failed_${res.status}`);
  }
  const payload = (await res.json()) as { mixId: string; summary: string };
  return payload;
}

export async function synthesizeNightlyProposals(params?: {
  hours?: number;
  minScore?: number;
  limit?: number;
  dryRun?: boolean;
}): Promise<EssenceProposal[]> {
  const res = await fetch("/api/essence/proposals/synth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params ?? {}),
  });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `proposal_synth_failed:${res.status}`);
  }
  const payload = (await res.json()) as {
    proposals?: EssenceProposal[];
  };
  return Array.isArray(payload?.proposals) ? payload.proposals.filter(Boolean) : [];
}

export async function fetchProposalPrompts(id: string): Promise<ProposalPromptPreset[]> {
  const res = await fetch(`/api/proposals/${encodeURIComponent(id)}/prompts`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `proposal_prompts_failed:${res.status}`);
  }
  const payload = (await res.json()) as {
    presets?: ProposalPromptPreset[];
    ideologyPressureContext?: { activePressures?: string[] } | null;
  };
  return Array.isArray(payload?.presets) ? payload.presets : [];
}
