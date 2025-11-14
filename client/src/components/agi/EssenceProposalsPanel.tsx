import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { EssenceProposal, ProposalStatus } from "@shared/proposals";
import { actOnProposal, createIdentityMix, fetchProposals, useProposalEvents } from "@/lib/agi/proposals";
import { useAgiChatStore } from "@/store/useAgiChatStore";
import { shallow } from "zustand/shallow";

const STATUS_FILTERS: Array<{ label: string; value: ProposalStatus | "all" }> = [
  { label: "New", value: "new" },
  { label: "Building", value: "building" },
  { label: "Applied", value: "applied" },
  { label: "Denied", value: "denied" },
  { label: "All", value: "all" },
];

const formatScore = (score?: number) => {
  if (!Number.isFinite(score)) return "—";
  return `${(Number(score) * 100).toFixed(1)}%`;
};

export function EssenceProposalsPanel() {
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">("new");
  const [proposals, setProposals] = useState<EssenceProposal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [mixing, setMixing] = useState(false);
  const [mixStatus, setMixStatus] = useState<string | null>(null);
  const { ensureContextSession, addContextMessage } = useAgiChatStore(
    useCallback(
      (state) => ({
        ensureContextSession: state.ensureContextSession,
        addContextMessage: state.addContextMessage,
      }),
      []
    ),
    shallow,
  );

  const contextId = selectedId ? `proposal:${selectedId}` : null;
  const builderThread = useAgiChatStore(
    useCallback(
      (state) => (contextId ? state.getThreadForContext(contextId) : undefined),
      [contextId],
    ),
  );

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload =
        statusFilter === "all" ? await fetchProposals() : await fetchProposals({ status: statusFilter });
      setProposals(payload);
      setLastLoadedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    if (!proposals.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !proposals.some((p) => p.id === selectedId)) {
      setSelectedId(proposals[0].id);
    }
  }, [proposals, selectedId]);

  const selected = useMemo(
    () => proposals.find((p) => p.id === selectedId) ?? (proposals.length ? proposals[0] : null),
    [proposals, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    ensureContextSession(`proposal:${selected.id}`, selected.title);
  }, [selected, ensureContextSession]);

  const { progress, chats } = useProposalEvents(selected?.id ?? null);
  const lastChatKeyRef = useRef<string | null>(null);

  useEffect(() => {
    lastChatKeyRef.current = null;
  }, [selected?.id]);

  useEffect(() => {
    if (!selected || !chats.length) return;
    const latest = chats[chats.length - 1];
    const cacheKey = `${latest.ts}:${latest.role}:${latest.message.length}`;
    if (lastChatKeyRef.current === cacheKey) {
      return;
    }
    lastChatKeyRef.current = cacheKey;
    addContextMessage(
      `proposal:${selected.id}`,
      {
        role: latest.role === "builder" ? "assistant" : "user",
        content: latest.message,
        traceId: latest.jobId ?? undefined,
      },
      selected.title,
    );
  }, [chats, selected, addContextMessage]);

  const actionable = selected?.status === "new";

  const handleAction = useCallback(
    async (id: string, action: "approve" | "deny") => {
      setBusyId(id);
      setError(null);
      try {
        const updated = await actOnProposal(id, action);
        setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  const handleIdentityMix = useCallback(async () => {
    setMixStatus("Creating identity mix...");
    setMixing(true);
    try {
      const payload = await createIdentityMix();
      setMixStatus(`Mix created: ${payload.mixId}`);
    } catch (err) {
      setMixStatus(err instanceof Error ? err.message : "Unable to create mix.");
    } finally {
      setMixing(false);
    }
  }, []);

  return (
    <div className="flex h-full bg-[#05060c] text-white">
      <aside className="w-72 border-r border-white/5 bg-black/30">
        <header className="border-b border-white/10 px-4 py-3">
          <div className="text-sm font-semibold">Essence proposals</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {lastLoadedAt ? `Updated ${new Date(lastLoadedAt).toLocaleTimeString()}` : "Waiting for data"}
          </div>
        </header>
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              className={clsx(
                "rounded-full px-3 py-1 text-[11px]",
                statusFilter === filter.value
                  ? "bg-sky-500/80 text-white"
                  : "bg-white/10 text-slate-200 hover:bg-white/20",
              )}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="px-4 pb-3 space-y-2">
          <button
            onClick={() => loadProposals()}
            className="w-full rounded border border-white/15 px-3 py-1 text-[11px] text-slate-100 hover:border-white/40"
          >
            Refresh
          </button>
          <button
            onClick={() => void handleIdentityMix()}
            disabled={mixing}
            className={clsx(
              "w-full rounded border px-3 py-1 text-[11px]",
              mixing ? "border-slate-500 bg-slate-700/40 text-slate-400" : "border-white/15 text-slate-100 hover:border-white/40",
            )}
          >
            {mixing ? "Mixing..." : "Create identity mix"}
          </button>
          {mixStatus && <div className="text-[11px] text-slate-400">{mixStatus}</div>}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading && <div className="px-2 py-2 text-[12px] text-slate-300">Loading proposals...</div>}
          {error && <div className="px-2 py-2 text-[12px] text-rose-300">{error}</div>}
          {!loading && !error && proposals.length === 0 && (
            <div className="px-2 py-2 text-[12px] text-slate-400">No proposals match this filter.</div>
          )}
          {proposals.map((proposal) => (
            <button
              key={proposal.id}
              className={clsx(
                "mb-2 w-full rounded-lg border px-3 py-2 text-left text-[12px]",
                proposal.id === selected?.id
                  ? "border-sky-400/60 bg-sky-400/10"
                  : "border-white/10 bg-white/5 hover:border-white/30",
              )}
              onClick={() => setSelectedId(proposal.id)}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-white">{proposal.title}</div>
                <StatusPill status={proposal.status} />
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] text-slate-300">{proposal.summary}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-400">
                <span className="rounded bg-black/40 px-2 py-0.5">{proposal.kind}</span>
                <span className="rounded bg-black/40 px-2 py-0.5">{proposal.target.type}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>
      <section className="flex flex-1 flex-col">
        {selected ? (
          <>
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-4">
              <div>
                <div className="text-[12px] uppercase tracking-wide text-slate-400">Proposal</div>
                <h2 className="text-xl font-semibold">{selected.title}</h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-200 whitespace-pre-line">{selected.summary}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded border border-white/20 px-4 py-1 text-sm text-slate-200 hover:border-white/50 disabled:opacity-40"
                  disabled={!actionable || busyId === selected.id}
                  onClick={() => handleAction(selected.id, "deny")}
                >
                  Deny
                </button>
                <button
                  className="rounded bg-sky-500 px-4 py-1 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-40"
                  disabled={!actionable || busyId === selected.id}
                  onClick={() => handleAction(selected.id, "approve")}
                >
                  Approve
                </button>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-4 p-6">
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-slate-200">Status</div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <StatusPill status={selected.status} />
                    <SafetyPill status={selected.safetyStatus} score={selected.safetyScore} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
                    <div>
                      <div className="text-[11px] uppercase text-slate-500">Safety score</div>
                      <div className="mt-1 text-base text-white">{formatScore(selected.safetyScore)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase text-slate-500">Eval gate</div>
                      <div className="mt-1 text-base text-white">≥ 99%</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase text-slate-500">Job</div>
                      <div className="mt-1 font-mono text-xs text-slate-200">{selected.jobId ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase text-slate-500">Phase</div>
                      <div className="mt-1 text-white">
                        {progress?.phase ?? selected.status}
                        {typeof progress?.progress === "number" && (
                          <span className="ml-2 text-slate-300">{Math.round(progress.progress * 100)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {selected.safetyReport && (
                    <div className="mt-3 rounded border border-rose-400/20 bg-rose-500/5 p-3 text-xs text-rose-100">
                      {selected.safetyReport}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-slate-200">Target</div>
                  <TargetDetails proposal={selected} />
                </div>
              </div>
              <div className="flex flex-col rounded-xl border border-white/10 bg-white/5">
                <div className="border-b border-white/10 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-200">Builder updates</div>
                  <div className="text-[11px] text-slate-400">
                    Streaming from {selected.jobId ? `job ${selected.jobId}` : "Essence runtime"}
                  </div>
                </div>
                <div className="flex flex-1 flex-col px-4 py-3">
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {builderThread && builderThread.messages.length > 0 ? (
                      builderThread.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={clsx(
                            "rounded-lg px-3 py-2 text-xs",
                            msg.role === "assistant"
                              ? "bg-sky-500/20 text-sky-50"
                              : "bg-white/10 text-slate-50",
                          )}
                        >
                          <div className="text-[10px] uppercase tracking-wide text-slate-400">
                            {msg.role === "assistant" ? "Builder" : "You"}
                          </div>
                          <div className="mt-1 whitespace-pre-line text-[12px]">{msg.content}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[12px] text-slate-400">No builder thoughts yet.</div>
                    )}
                  </div>
                  <div className="mt-3 rounded border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-slate-400">
                    Chat is read-only for now. Approvals stream AGI plan, diff, and eval notes into this thread.
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            No proposals available.
          </div>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: ProposalStatus }) {
  const palette: Record<ProposalStatus, string> = {
    new: "bg-slate-500/30 text-slate-100",
    approved: "bg-blue-500/30 text-blue-100",
    denied: "bg-rose-500/30 text-rose-100",
    building: "bg-amber-500/30 text-amber-100",
    applied: "bg-emerald-500/30 text-emerald-100",
    error: "bg-rose-700/30 text-rose-100",
  };
  return (
    <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold uppercase", palette[status])}>
      {status}
    </span>
  );
}

function SafetyPill({ status, score }: { status: EssenceProposal["safetyStatus"]; score?: number }) {
  const palette: Record<EssenceProposal["safetyStatus"], string> = {
    unknown: "bg-slate-500/20 text-slate-200",
    pending: "bg-amber-500/20 text-amber-100",
    "running-evals": "bg-sky-500/20 text-sky-100",
    passed: "bg-emerald-500/30 text-emerald-100",
    failed: "bg-rose-600/30 text-rose-100",
  };
  return (
    <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold uppercase", palette[status])}>
      {status} {typeof score === "number" ? `· ${formatScore(score)}` : null}
    </span>
  );
}

function TargetDetails({ proposal }: { proposal: EssenceProposal }) {
  if (proposal.target.type === "panel-seed") {
    return (
      <div className="text-sm text-slate-200">
        <div className="text-[11px] uppercase text-slate-500">Component</div>
        <div className="mt-1 font-mono text-xs text-white">{proposal.target.componentPath}</div>
        {Array.isArray(proposal.metadata?.dataSources) && proposal.metadata?.dataSources?.length > 0 && (
          <div className="mt-3">
            <div className="text-[11px] uppercase text-slate-500">Data sources</div>
            <ul className="mt-1 list-outside list-disc pl-4 text-xs text-slate-300">
              {(proposal.metadata?.dataSources as string[]).map((src) => (
                <li key={src}>{src}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  if (proposal.target.type === "backend-file") {
    return (
      <div>
        <div className="text-[11px] uppercase text-slate-500">File</div>
        <div className="mt-1 font-mono text-xs text-white">{proposal.target.path}</div>
      </div>
    );
  }
  if (proposal.target.type === "backend-multi") {
    return (
      <div>
        <div className="text-[11px] uppercase text-slate-500">Files</div>
        <ul className="mt-1 list-outside list-disc pl-4 text-xs text-slate-300">
          {proposal.target.paths.map((path) => (
            <li key={path}>{path}</li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div>
      <div className="text-[11px] uppercase text-slate-500">Target</div>
      <div className="mt-1 text-sm text-slate-200">{proposal.target.type}</div>
    </div>
  );
}
