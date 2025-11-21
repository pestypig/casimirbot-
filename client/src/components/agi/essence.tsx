import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRightSquare, History, Plus, Send, Trash2, Wallet } from "lucide-react";
import {
  CHAT_CONTEXT_BUDGET,
  useAgiChatStore,
  type ChatMessage,
  type ChatSession,
} from "@/store/useAgiChatStore";
import {
  execute,
  listPersonas,
  memorySearch,
  plan,
  connectDebateStream,
  subscribeToolLogs,
  syncKnowledgeProjects,
  getPanelSnapshots,
  getBadgeTelemetry,
  type PersonaSummary,
  type MemorySearchResponse,
  type PanelSnapshotResponse,
  type BadgeTelemetryResponse,
  type DebateStreamEvent,
  type ToolLogEvent,
} from "@/lib/agi/api";
import { isFlagEnabled } from "@/lib/envFlags";
import TraceDrawer from "./TraceDrawer";
import MemoryDrawer from "./MemoryDrawer";
import EvalPanel from "./EvalPanel";
import DebateView from "./DebateView";
import { JobsBudgetModal } from "./JobsBudgetModal";
import { RationaleOverlay } from "./RationaleOverlay";
import type { TMemorySearchHit } from "@shared/essence-persona";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import { useKnowledgeProjectsStore } from "@/store/useKnowledgeProjectsStore";
import { isFlagEnabled as flag } from "@/lib/envFlags";

const DEFAULT_PERSONA: PersonaSummary = { id: "default", display_name: "Default" };
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const KNOWLEDGE_ATTACHMENTS_ENABLED = isFlagEnabled("ENABLE_KNOWLEDGE_PROJECTS", true);

type TaskStatus = {
  text: string;
  tone: "info" | "success" | "error";
  startedAt: number;
};

type ActivitySource = "status" | "plan" | "tool" | "result" | "hint";

type ActivityEntry = {
  id: string;
  text: string;
  tone: TaskStatus["tone"];
  ts: number;
  source: ActivitySource;
};

export default function EssenceConsole() {
  const {
    sessions,
    activeId,
    newSession,
    setActive,
    addMessage,
    setPersona,
    totals,
    clearSession,
    deleteSession,
  } = useAgiChatStore();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [traceId, setTraceId] = useState<string | undefined>();
  const [showTrace, setShowTrace] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showDebate, setShowDebate] = useState(false);
  const [showJobs, setShowJobs] = useState(false);
  const [showPanels, setShowPanels] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [personas, setPersonas] = useState<PersonaSummary[]>([DEFAULT_PERSONA]);
  const [personaStatus, setPersonaStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [personaError, setPersonaError] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchHits, setSearchHits] = useState<TMemorySearchHit[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [panelSnapshot, setPanelSnapshot] = useState<PanelSnapshotResponse | null>(null);
  const [panelBusy, setPanelBusy] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [badgeSnapshot, setBadgeSnapshot] = useState<BadgeTelemetryResponse | null>(null);
  const [badgeBusy, setBadgeBusy] = useState(false);
  const [badgeError, setBadgeError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [hull, setHull] = useState<{ hull_mode: boolean; llm_policy: string; llm_runtime?: string | null } | null>(
    null,
  );
  const [debateId, setDebateId] = useState<string | null>(null);
  const [planHasDebate, setPlanHasDebate] = useState(false);

  const {
    refresh: refreshKnowledgeProjects,
    activeKnowledgeProjects,
    exportKnowledgeContext,
    warnings: knowledgeWarnings,
    baselineEnabled,
    toggleBaseline,
  } = useKnowledgeProjectsStore((state) => ({
    refresh: state.refresh,
    activeKnowledgeProjects: state.projects.filter((project) => state.activeIds.includes(project.id)),
    exportKnowledgeContext: state.exportActiveContext,
    warnings: state.warnings,
    baselineEnabled: state.baselineEnabled,
    toggleBaseline: state.toggleBaseline,
  }));

  const session: ChatSession | undefined = activeId ? sessions[activeId] : undefined;
  const messages = session?.messages ?? [];
  const personaId = session?.personaId ?? DEFAULT_PERSONA.id;
  const contextTotals = useMemo(() => (session ? totals(session.id) : { tokens: 0, messages: 0 }), [session, totals]);
  const contextPct = clamp01(contextTotals.tokens / CHAT_CONTEXT_BUDGET);

  const stageRef = useRef<"idle" | "planning" | "executing">("idle");
  const hintTimers = useRef<number[]>([]);
  const activeTraceRef = useRef<string | undefined>(undefined);
  const seenLogSeq = useRef<Set<number>>(new Set());
  const seenDebateSeq = useRef<Set<number>>(new Set());

  const clearHintTimers = useCallback(() => {
    if (typeof window === "undefined") return;
    hintTimers.current.forEach((id) => window.clearTimeout(id));
    hintTimers.current = [];
  }, []);

  const pushActivity = useCallback(
    (text: string, tone: TaskStatus["tone"] = "info", source: ActivitySource = "status") => {
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const entry: ActivityEntry = { id, text, tone, ts: Date.now(), source };
      setActivity((prev) => {
        const next = [...prev, entry];
        return next.length > 80 ? next.slice(next.length - 80) : next;
      });
    },
    [],
  );

  const updateStatus = useCallback(
    (text: string, tone: TaskStatus["tone"] = "info", source: ActivitySource = "status") => {
      setStatus({ text, tone, startedAt: Date.now() });
      pushActivity(text, tone, source);
    },
    [pushActivity],
  );

  const scheduleHint = useCallback(
    (text: string, delayMs: number, tone: TaskStatus["tone"] = "info") => {
      if (typeof window === "undefined") return;
      const id = window.setTimeout(() => {
        if (busy) {
          updateStatus(text, tone, "hint");
        }
      }, delayMs);
      hintTimers.current.push(id);
    },
    [busy, updateStatus],
  );

  useEffect(() => {
    activeTraceRef.current = traceId;
    seenLogSeq.current = new Set();
    setDebateId(null);
    seenDebateSeq.current = new Set();
    setPlanHasDebate(false);
  }, [traceId]);

  useEffect(() => {
    seenDebateSeq.current = new Set();
  }, [debateId]);

  useEffect(() => {
    if (!traceId) {
      return;
    }
    const stop = subscribeToolLogs((event: ToolLogEvent) => {
      if (!event || event.traceId !== activeTraceRef.current) {
        return;
      }
      const seq = typeof event.seq === "number" ? event.seq : null;
      if (seq !== null && seenLogSeq.current.has(seq)) {
        return;
      }
      if (seq !== null) {
        seenLogSeq.current.add(seq);
      }
      if (event.debateId && typeof event.debateId === "string") {
        setDebateId(event.debateId);
      }
      const label =
        typeof event.text === "string" && event.text.trim()
          ? event.text.trim()
          : `${event.tool ?? "tool"} ${event.ok === false ? "failed" : "finished"}`;
      pushActivity(label, event.ok === false ? "error" : "info", "tool");
    });
    return stop;
  }, [traceId, pushActivity, setDebateId]);

  useEffect(() => {
    if (!debateId) {
      return;
    }
    const teardown = connectDebateStream(debateId, {
      onEvent: (event: DebateStreamEvent) => {
        if (typeof event.seq === "number") {
          if (seenDebateSeq.current.has(event.seq)) {
            return;
          }
          seenDebateSeq.current.add(event.seq);
        }
        let tone: TaskStatus["tone"] = "info";
        let label = "Debate event";
        if (event.type === "turn") {
          const snippet = (event.turn.text ?? "").replace(/\s+/g, " ").trim();
          const preview = snippet.length > 160 ? `${snippet.slice(0, 160)}...` : snippet || "(no text)";
          label = `Debate ${event.turn.role}: ${preview}`;
        } else if (event.type === "status") {
          label = `Debate status: ${event.status}`;
          if (event.status === "timeout" || event.status === "aborted") {
            tone = "error";
          }
        } else if (event.type === "outcome") {
          const pct = (event.outcome.confidence * 100).toFixed(1);
          label = `Debate outcome: ${event.outcome.verdict} (${pct}%)`;
          tone = "success";
        }
        pushActivity(label, tone, "plan");
      },
      onError: () => {
        pushActivity("Debate stream disconnected.", "error", "status");
      },
    });
    return teardown;
  }, [debateId, planHasDebate, pushActivity]);

  useEffect(() => {
    if (!activeId) {
      const newId = newSession("Ask to do anything");
      setActive(newId);
    }
  }, [activeId, newSession, setActive]);

  useEffect(() => {
    if (!KNOWLEDGE_ATTACHMENTS_ENABLED) {
      return;
    }
    void refreshKnowledgeProjects();
  }, [refreshKnowledgeProjects]);

  useEffect(() => {
    let canceled = false;
    if (!flag("ENABLE_AGI", true)) return;
    fetch("/api/hull/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (canceled || !data) return;
        setHull({
          hull_mode: !!data.hull_mode,
          llm_policy: String(data.llm_policy ?? ""),
          llm_runtime: data.llm_runtime ?? null,
        });
      })
      .catch(() => undefined);
    const t = setInterval(() => {
      fetch("/api/hull/status")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          setHull({
            hull_mode: !!data.hull_mode,
            llm_policy: String(data.llm_policy ?? ""),
            llm_runtime: data.llm_runtime ?? null,
          });
        })
        .catch(() => undefined);
    }, 20000);
    return () => {
      canceled = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    if (!isFlagEnabled("ENABLE_PERSONA_UI")) {
      setPersonas([DEFAULT_PERSONA]);
      setPersonaStatus("idle");
      setPersonaError(null);
      return;
    }
    setPersonaStatus("loading");
    listPersonas()
      .then((items) => {
        if (canceled) return;
        const next = Array.isArray(items) && items.length > 0 ? items : [DEFAULT_PERSONA];
        if (!next.some((item) => item.id === DEFAULT_PERSONA.id)) {
          next.unshift(DEFAULT_PERSONA);
        }
        setPersonas(next);
        setPersonaStatus("ready");
      })
      .catch((err) => {
        if (canceled) return;
        const message = err instanceof Error ? err.message : String(err);
        setPersonaError(message || "Unable to load personas");
        setPersonaStatus("error");
      });
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!transcriptRef.current) return;
    transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [messages.length]);

  async function handleSend() {
    if (!session) return;
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setTraceId(undefined);
    setDebateId(null);
    setPlanHasDebate(false);
    seenDebateSeq.current = new Set();
    stageRef.current = "planning";
    clearHintTimers();
    setActivity([]);
    pushActivity(`You: ${text}`, "info", "status");
    addMessage(session.id, { role: "user", content: text });
    try {
      const knowledgeProjectIds = activeKnowledgeProjects.map((project) => project.id);
      let knowledgeContext: KnowledgeProjectExport[] | undefined;
      if (KNOWLEDGE_ATTACHMENTS_ENABLED && exportKnowledgeContext) {
        updateStatus("Preparing knowledge attachments...");
        knowledgeContext = await exportKnowledgeContext();
      }
      updateStatus("Planning (request sent to Essence)...");
      scheduleHint("Still planning... waiting for planner response.", 6000);
      scheduleHint(
        "Planning is taking longer than expected. If this persists, check server logs for /api/agi/plan.",
        12000,
      );
      let inlineKnowledge = knowledgeContext && knowledgeContext.length > 0 ? knowledgeContext : undefined;
      let syncedProjectIds: string[] | undefined;
      if (inlineKnowledge && inlineKnowledge.length > 0) {
        try {
          updateStatus("Syncing knowledge corpus...");
          const syncResult = await syncKnowledgeProjects(inlineKnowledge);
          if (syncResult.synced > 0) {
            inlineKnowledge = undefined;
            syncedProjectIds = syncResult.projectIds;
          } else {
            updateStatus("Knowledge sync unavailable, sending inline context.", "error");
          }
        } catch (syncError) {
          console.warn("[knowledge] sync failed", syncError);
          updateStatus("Knowledge sync failed, sending inline context.", "error");
        } finally {
          updateStatus("Planning (request sent to Essence)...");
        }
      }
      const projectIdsForPlan =
        inlineKnowledge && inlineKnowledge.length > 0
          ? undefined
          : syncedProjectIds && syncedProjectIds.length > 0
            ? syncedProjectIds
            : knowledgeProjectIds;
      const planned = await plan(
        text,
        personaId,
        inlineKnowledge && inlineKnowledge.length > 0 ? inlineKnowledge : undefined,
        projectIdsForPlan,
      );
      const planLatticeVersion = planned.lattice_version ?? null;
      clearHintTimers();
      stageRef.current = "executing";
      scheduleHint("Still executing plan... waiting for tool calls to finish.", 8000);
      setTraceId(planned.traceId);
      const debatePlanned =
        Array.isArray(planned.executor_steps) &&
        planned.executor_steps.some(
          (s: any) => s?.kind === "debate.run" || (s?.kind === "tool.call" && s?.tool === "debate.run"),
        );
      const debateIdFromPlan = planned.debate_id ?? null;
      setPlanHasDebate(debatePlanned || Boolean(debateIdFromPlan));
      setDebateId(debateIdFromPlan);
      if (debatePlanned) {
        pushActivity("Debate planned; listening for live turns.", "info", "plan");
      }
      if (planLatticeVersion) {
        pushActivity(`Lattice snapshot (plan): ${planLatticeVersion}`, "info", "plan");
      }
      updateStatus("Plan received; executing...", "info", "plan");
      if (Array.isArray(planned.executor_steps) && planned.executor_steps.length > 0) {
        const chain = planned.executor_steps.map((s: any) => s.kind || s.id).join(" -> ");
        pushActivity(`Plan ready: ${chain}`, "info", "plan");
      }
      addMessage(session.id, {
        role: "assistant",
        content: `Plan DSL: ${planned.plan_dsl ?? "(n/a)"}\nExecutor steps: ${
          Array.isArray(planned.executor_steps)
            ? planned.executor_steps.map((s: any) => s.kind || s.id).join(" -> ")
            : "unknown"
        }`,
        traceId: planned.traceId,
      });
      const exec = await execute(planned.traceId);
      clearHintTimers();
      stageRef.current = "idle";
      const execDebateId =
        exec.debate_id ??
        (Array.isArray(exec.steps)
          ? (exec.steps.find((step: any) => step?.kind === "debate.run" && step?.output?.debateId)?.output?.debateId ??
            exec.steps.find((step: any) => step?.tool === "debate.run" && step?.output?.debateId)?.output?.debateId)
          : null);
      if (execDebateId) {
        setDebateId(execDebateId);
        setPlanHasDebate(true);
      }
      const execLatticeVersion = exec.lattice_version ?? null;
      if (planLatticeVersion && execLatticeVersion && execLatticeVersion !== planLatticeVersion) {
        pushActivity(`Lattice mismatch: plan ${planLatticeVersion} -> exec ${execLatticeVersion}`, "error", "status");
      } else if (execLatticeVersion) {
        pushActivity(`Lattice snapshot (exec): ${execLatticeVersion}`, "info", "status");
      }
      const summary = summarizeExecution(exec);
      addMessage(session.id, {
        role: "assistant",
        content: summary,
        traceId: planned.traceId,
        whyBelongs: exec.why_belongs,
      });
      pushActivity(summary, exec.ok === false ? "error" : "success", "result");
      updateStatus("Task complete.", "success");
      setShowTrace(true);
    } catch (error) {
      clearHintTimers();
      stageRef.current = "idle";
      const message = error instanceof Error ? error.message : String(error);
      addMessage(session.id, {
        role: "assistant",
        content: `Task failed: ${message}`,
      });
      updateStatus(message, "error");
    } finally {
      setBusy(false);
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchHits([]);
      setSearchError(null);
      return;
    }
    setSearchBusy(true);
    setSearchError(null);
    try {
      const payload: MemorySearchResponse = await memorySearch({
        q: query,
        personaId,
      });
      setSearchHits(payload.items ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSearchError(message || "Search failed");
      setSearchHits([]);
    } finally {
      setSearchBusy(false);
    }
  };

  const handleToggleProject = (projectId: string) => {
    window.dispatchEvent(new CustomEvent("open-knowledge-project", { detail: { projectId } }));
  };

  const loadPanelSnapshots = useCallback(async () => {
    setPanelBusy(true);
    setPanelError(null);
    try {
      const snapshot = await getPanelSnapshots();
      setPanelSnapshot(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPanelError(message || "Unable to load panel telemetry.");
      setPanelSnapshot(null);
    } finally {
      setPanelBusy(false);
    }
  }, []);

  const loadBadgeTelemetry = useCallback(async () => {
    setBadgeBusy(true);
    setBadgeError(null);
    try {
      const snapshot = await getBadgeTelemetry();
      setBadgeSnapshot(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBadgeError(message || "Unable to load badge telemetry.");
      setBadgeSnapshot(null);
    } finally {
      setBadgeBusy(false);
    }
  }, []);

  useEffect(() => {
    if (showPanels) {
      void loadPanelSnapshots();
    }
  }, [showPanels, loadPanelSnapshots]);

  useEffect(() => {
    if (showBadges) {
      void loadBadgeTelemetry();
    }
  }, [showBadges, loadBadgeTelemetry]);

  return (
    <div className="flex h-full min-h-screen bg-[#050915] text-slate-100">
      <aside className="w-64 border-r border-white/5 bg-black/30">
        <SessionList
          sessions={sessions}
          activeId={activeId}
          onNew={() => setActive(newSession("Ask to do anything"))}
          onSelect={setActive}
          onDelete={deleteSession}
        />
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-white/5 px-6 py-3">
          <div className="flex items-center gap-3">
            <PersonaSelect
              personas={personas}
              value={personaId}
              onChange={(next) => session && setPersona(session.id, next)}
              status={personaStatus}
              error={personaError}
            />
            <button
              className="text-xs uppercase tracking-wide text-slate-400 hover:text-white"
              onClick={() => session && clearSession(session.id)}
              disabled={!session || !session.messages.length}
            >
              Clear chat
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-2">
        <button className="underline" onClick={() => setShowTrace((value) => !value)}>
          Trace
        </button>
        <button className="underline" onClick={() => setShowMemory((value) => !value)}>
          Memory
        </button>
        <button className="underline" onClick={() => setShowDebate(true)}>
          Debate
        </button>
        <button className="underline" onClick={() => setShowPanels((value) => !value)}>
          Panels
        </button>
        <button className="underline" onClick={() => setShowBadges((value) => !value)}>
          Badges
        </button>
      </div>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-100 hover:bg-white/10"
              onClick={() => setShowJobs(true)}
              title="Open budget & daily jobs"
            >
              <Wallet size={14} /> Budget
            </button>
            <ContextMeter pct={contextPct} tokens={contextTotals.tokens} />
            {hull && (
              <span className="ml-2 rounded px-2 py-0.5 text-[11px] border border-white/15 opacity-80">
                Hull:{hull.hull_mode ? "ON" : "OFF"} | {hull.llm_policy}
                {hull.llm_runtime ? `/${hull.llm_runtime}` : ""}
              </span>
            )}
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <section className="flex-1 flex flex-col min-w-0">
            <div ref={transcriptRef} className="flex-1 overflow-auto px-8 py-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-sm text-slate-400">
                  Start a conversation. Active knowledge projects will be attached automatically.
                </div>
              )}
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
            <div className="border-t border-white/10 px-6 py-4 space-y-3">
              {KNOWLEDGE_ATTACHMENTS_ENABLED && (
                <KnowledgeTray
                  projects={activeKnowledgeProjects}
                  warnings={knowledgeWarnings}
                  onLaunch={handleToggleProject}
                  baselineEnabled={baselineEnabled}
                  onToggleBaseline={toggleBaseline}
                />
              )}
              <TaskStatusIndicator status={status} busy={busy} />
              <TaskActivityLog entries={activity} traceId={traceId} stage={stageRef.current} />
              <div className="flex items-end gap-3">
                <textarea
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm focus:outline-none focus:border-sky-500"
                  placeholder="Ask to do anything..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  disabled={busy}
                  rows={3}
                />
                <button
                  className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
                  onClick={() => void handleSend()}
                  disabled={busy || !input.trim()}
                >
                  <Send size={16} /> Send
                </button>
              </div>
            </div>
          </section>
          <aside className="w-80 border-l border-white/5 bg-black/20 px-5 py-5 flex flex-col gap-6">
            <EvalPanel />
            <MemorySearchPanel
              query={searchQ}
              onQueryChange={setSearchQ}
              onSearch={() => void handleSearch(searchQ)}
              hits={searchHits}
              busy={searchBusy}
              error={searchError}
            />
          </aside>
        </div>
      </main>
      <TraceDrawer traceId={traceId} open={showTrace} onClose={() => setShowTrace(false)} variant="window" />
      <MemoryDrawer traceId={traceId} open={showMemory} onClose={() => setShowMemory(false)} variant="window" />
      <DebateView
        traceId={traceId}
        debateId={debateId ?? undefined}
        open={showDebate}
        onClose={() => setShowDebate(false)}
      />
      <PanelSnapshotDrawer
        open={showPanels}
        onClose={() => setShowPanels(false)}
        snapshot={panelSnapshot}
        busy={panelBusy}
        error={panelError}
        onRefresh={() => void loadPanelSnapshots()}
      />
      <BadgeTelemetryDrawer
        open={showBadges}
        onClose={() => setShowBadges(false)}
        snapshot={badgeSnapshot}
        busy={badgeBusy}
        error={badgeError}
        onRefresh={() => void loadBadgeTelemetry()}
      />
      <JobsBudgetModal open={showJobs} onClose={() => setShowJobs(false)} onInsertPrompt={(text) => setInput(text)} />
    </div>
  );
}

function summarizeExecution(payload: Awaited<ReturnType<typeof execute>>): string {
  if (!payload) return "Plan completed.";
  const badgeStep: any = Array.isArray(payload.steps)
    ? payload.steps.find((step: any) => step?.tool === "telemetry.badges.read" || step?.kind === "telemetry.badges.read")
    : null;
  const badgeSummary = badgeStep && badgeStep.output ? formatBadgeTelemetryOutput(badgeStep.output) : null;
  if (payload.result_summary) {
    if (badgeSummary) {
      // Prefer the richer badge summary when available; otherwise, append for extra context.
      if (badgeSummary.length > payload.result_summary.length) {
        return badgeSummary;
      }
      if (!payload.result_summary.includes(badgeSummary)) {
        return `${payload.result_summary}\n${badgeSummary}`;
      }
    }
    return payload.result_summary;
  }
  if (badgeStep && badgeStep.output) {
    const summary = formatBadgeTelemetryOutput(badgeStep.output);
    if (summary) return summary;
  }
  const steps = Array.isArray(payload.steps) ? payload.steps : [];
  if (!steps.length) {
    return "Plan executed with no reported steps.";
  }
  return steps
    .map((step: any, idx: number) => {
      const status = step.ok === false ? "failed" : "ok";
      const label = step.tool ?? step.kind ?? `step${idx + 1}`;
      return `${idx + 1}. ${label} - ${status}`;
    })
    .join("\n");
}

function formatBadgeTelemetryOutput(output: any): string | null {
  if (!output || typeof output !== "object") return null;
  const entries = Array.isArray((output as any).entries) ? (output as any).entries : [];
  if (entries.length === 0) return null;
  const capturedAt = typeof (output as any).capturedAt === "string" ? (output as any).capturedAt : null;
  const headerParts = [
    "Live badge telemetry",
    `panels ${entries.length}`,
    capturedAt ? `captured ${capturedAt}` : null,
  ].filter(Boolean);

  const lines: string[] = [];
  const top = entries.slice(0, 3);
  for (const entry of top) {
    const metrics = entry?.metrics ?? {};
    const occ = typeof metrics.occupancy === "number" ? metrics.occupancy : undefined;
    const coh = typeof metrics.coherence === "number" ? metrics.coherence : undefined;
    const q = typeof metrics.avgQFactor === "number" ? metrics.avgQFactor : undefined;
    const label = [entry?.title, entry?.panelId].filter(Boolean).join(" · ") || "panel";
    const status = entry?.status ? String(entry.status).toUpperCase() : "UNK";
    const detail: string[] = [];
    if (occ !== undefined) detail.push(`occ ${(occ * 100).toFixed(1)}%`);
    if (coh !== undefined) detail.push(`coh ${coh.toFixed(3)}`);
    if (q !== undefined) detail.push(`Q ${q.toFixed(3)}`);
    if (entry?.solutions && entry.solutions.length > 0) {
      detail.push(`next: ${entry.solutions.map((s: any) => s.action).join(" | ")}`);
    }
    lines.push(`${status} · ${label}${detail.length ? " · " + detail.join(" · ") : ""}`);
  }

  const relationNotes: string[] = Array.isArray((output as any).relationNotes) ? (output as any).relationNotes : [];
  const relationText = relationNotes.length ? `Relation: ${relationNotes.join(" ")}` : "";
  return [headerParts.join(" · "), ...lines, relationText].filter(Boolean).join("\n");
}

function SessionList({
  sessions,
  activeId,
  onNew,
  onSelect,
  onDelete,
}: {
  sessions: Record<string, ChatSession>;
  activeId?: string;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const list = Object.values(sessions).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="uppercase text-xs tracking-wide text-slate-400">Sessions</span>
        <button
          className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-white hover:border-sky-400"
          onClick={onNew}
        >
          <Plus size={12} /> New
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {list.length === 0 && <div className="px-4 py-6 text-sm text-slate-400">No sessions yet.</div>}
        {list.map((session) => (
          <div
            key={session.id}
            className={`px-4 py-3 border-b border-white/5 text-sm ${
              session.id === activeId ? "bg-white/10" : "hover:bg-white/5"
            }`}
          >
            <button className="text-left w-full" onClick={() => onSelect(session.id)}>
              <div className="font-semibold text-white truncate">{session.title || "Untitled chat"}</div>
              <div className="text-[11px] text-slate-400">{new Date(session.createdAt).toLocaleString()}</div>
            </button>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>{session.messages.length} messages</span>
              <button className="flex items-center gap-1 text-rose-200 hover:text-rose-100" onClick={() => onDelete(session.id)}>
                <Trash2 size={12} /> delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const roleLabel = isUser ? "You" : isAssistant ? "essence" : message.role;
  return (
    <div
      className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
      data-chat-message="true"
      data-role={message.role}
      data-trace-id={message.traceId ?? undefined}
    >
      <div className="text-xs uppercase tracking-wide text-slate-400">{roleLabel}</div>
      <div
        className={`max-w-3xl whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? "bg-sky-500/80 text-white" : "bg-white/5 text-slate-100"
        }`}
        data-message-content="true"
      >
        {message.content}
      </div>
      {message.whyBelongs && !isUser && (
        <div className="mt-2 w-full">
          <RationaleOverlay why={message.whyBelongs} />
        </div>
      )}
      {message.traceId && (
        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <History size={12} /> trace {message.traceId.slice(0, 8)}
        </div>
      )}
    </div>
  );
}

function KnowledgeTray({
  projects,
  warnings,
  onLaunch,
  baselineEnabled,
  onToggleBaseline,
}: {
  projects: Array<{ id: string; name: string }>;
  warnings: string[];
  onLaunch: (projectId: string) => void;
  baselineEnabled: boolean;
  onToggleBaseline: () => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="text-xs text-slate-400">
        No active knowledge projects. Open Helix Settings then AGI Knowledge to attach files.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs border ${
            baselineEnabled ? "bg-emerald-500/20 text-emerald-100 border-emerald-400/30" : "bg-white/5 text-slate-200 border-white/10"
          }`}
          onClick={onToggleBaseline}
          title="Toggle Core Knowledge bundle"
        >
          Core Knowledge
        </button>
        {projects.map((project) => (
          <button
            key={project.id}
            className="flex items-center gap-1 rounded-full bg-sky-500/20 px-3 py-1 text-xs text-sky-100 border border-sky-400/30"
            onClick={() => onLaunch(project.id)}
          >
            {project.name} <ArrowUpRightSquare size={12} />
          </button>
        ))}
      </div>
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100 space-y-1">
          {warnings.map((warning, index) => (
            <div key={`${warning}-${index}`}>{warning}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskStatusIndicator({ status, busy }: { status: TaskStatus | null; busy: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!busy || !status) {
      setElapsed(0);
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    setElapsed(Date.now() - status.startedAt);
    const timer = window.setInterval(() => {
      setElapsed(Date.now() - status.startedAt);
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [busy, status?.startedAt]);

  const tone = status?.tone ?? "info";
  const indicatorColor =
    tone === "error" ? "bg-rose-400" : tone === "success" ? "bg-emerald-400" : "bg-sky-400";
  const textColor =
    tone === "error" ? "text-rose-200" : tone === "success" ? "text-emerald-200" : "text-slate-400";
  const dotColor = status ? indicatorColor : "bg-slate-600";

  return (
    <div className={`flex items-center gap-2 text-xs ${textColor}`} role="status" aria-live="polite">
      <span className={`h-2 w-2 rounded-full ${busy ? "animate-pulse" : ""} ${dotColor}`} aria-hidden="true" />
      <span>{status?.text ?? "Idle"}</span>
      {busy && status ? (
        <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500">{formatElapsed(elapsed)}</span>
      ) : null}
    </div>
  );
}

function TaskActivityLog({
  entries,
  traceId,
  stage,
}: {
  entries: ActivityEntry[];
  traceId?: string;
  stage: "idle" | "planning" | "executing";
}) {
  if (entries.length === 0) return null;
  const visible = entries.slice(-12);
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
        <span>Live task feed</span>
        <span className="text-slate-500">
          {stage !== "idle" ? stage : traceId ? `trace ${traceId.slice(0, 8)}` : "idle"}
        </span>
      </div>
      <div className="space-y-1 max-h-36 overflow-auto">
        {visible.map((entry) => {
          const dot =
            entry.tone === "error" ? "bg-rose-400" : entry.tone === "success" ? "bg-emerald-400" : "bg-sky-400";
          const textColor =
            entry.tone === "error" ? "text-rose-100" : entry.tone === "success" ? "text-emerald-100" : "text-slate-200";
          return (
            <div key={entry.id} className={`flex items-start gap-2 text-[11px] ${textColor}`}>
              <span className={`mt-1 h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
              <span className="flex-1 whitespace-pre-wrap">{entry.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0s";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

function PersonaSelect({
  personas,
  value,
  onChange,
  status,
  error,
}: {
  personas: PersonaSummary[];
  value: string;
  onChange: (id: string) => void;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
}) {
  return (
    <div className="flex flex-col text-xs">
      <label className="uppercase tracking-wide text-slate-400">Persona</label>
      <select
        className="mt-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-sm text-white focus:border-sky-500 focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={status === "loading"}
      >
        {personas.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.display_name}
          </option>
        ))}
      </select>
      {error && <span className="text-rose-300">{error}</span>}
    </div>
  );
}

function ContextMeter({ pct, tokens }: { pct: number; tokens: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <div className="w-32 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-sky-400" style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
      <span>
        {tokens}/{CHAT_CONTEXT_BUDGET} tok
      </span>
    </div>
  );
}

function MemorySearchPanel({
  query,
  onQueryChange,
  onSearch,
  hits,
  busy,
  error,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  hits: TMemorySearchHit[];
  busy: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="uppercase text-xs tracking-wide text-slate-400">Memory search</span>
        <button className="text-xs underline" onClick={onSearch} disabled={busy}>
          {busy ? "Searching..." : "Search"}
        </button>
      </div>
      <input
        type="text"
        className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-sm focus:outline-none focus:border-sky-500"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Keywords..."
      />
      {error && <div className="text-xs text-rose-300">{error}</div>}
      <div className="space-y-3 max-h-64 overflow-auto">
        {hits.length === 0 && !busy && <div className="text-xs text-slate-500">No hits yet.</div>}
        {hits.map((hit) => (
          <div key={hit.id} className="rounded-lg border border-white/10 bg-black/30 p-2 text-xs space-y-1">
            <div className="font-semibold text-white">{hit.kind}</div>
            <div className="text-[11px] text-slate-400">{new Date(hit.created_at).toLocaleString()}</div>
            <div className="text-slate-100 whitespace-pre-wrap">{hit.snippet}</div>
            <div className="flex flex-wrap gap-1">
              {hit.keys.map((key) => (
                <span key={`${hit.id}-${key}`} className="rounded bg-white/10 px-1 py-0.5">
                  {key}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelSnapshotDrawer({
  open,
  onClose,
  snapshot,
  busy,
  error,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  snapshot: PanelSnapshotResponse | null;
  busy: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  if (!open) return null;
  const panels = snapshot?.panels ?? [];
  const summarizeKV = (record?: Record<string, unknown>, limit = 6) => {
    if (!record) return "—";
    const entries = Object.entries(record).slice(0, limit);
    if (entries.length === 0) return "—";
    return entries
      .map(([key, value]) => `${key}:${typeof value === "number" ? Number(value).toFixed(3) : String(value)}`)
      .join(" · ");
  };
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-black/50">
      <div className="h-full w-[520px] bg-[#0b0f1c] border-l border-white/10 shadow-xl overflow-auto">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-white">Panel Snapshots</div>
            <div className="text-[11px] text-slate-400">
              {snapshot?.capturedAt ? `Captured ${new Date(snapshot.capturedAt).toLocaleString()}` : "Awaiting data"}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              className="underline disabled:opacity-40"
              onClick={() => onRefresh()}
              disabled={busy}
              title="Refresh live panel telemetry"
            >
              {busy ? "Refreshing..." : "Refresh"}
            </button>
            <button className="underline" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        {error && <div className="px-4 py-2 text-xs text-rose-300 border-b border-rose-400/30">{error}</div>}
        {snapshot?.relatedPanels && snapshot.relatedPanels.length > 0 && (
          <div className="px-4 py-2 text-[11px] text-slate-300 border-b border-white/10 space-y-1">
            <div className="font-semibold text-white/90">Related panels</div>
            <div className="flex flex-wrap gap-1">
              {snapshot.relatedPanels.map((panel) => (
                <span key={panel.id} className="rounded bg-white/10 px-2 py-0.5 text-[11px]">
                  {panel.title ?? panel.id}
                </span>
              ))}
            </div>
            {snapshot.relationNotes?.map((note: string, idx: number) => (
              <div key={idx} className="text-slate-400">
                {note}
              </div>
            ))}
          </div>
        )}
        {busy && !panels.length && <div className="px-4 py-3 text-xs text-slate-400">Loading panel telemetry...</div>}
        {!busy && panels.length === 0 && !error && (
          <div className="px-4 py-3 text-xs text-slate-400">No panel telemetry available.</div>
        )}
        <div className="divide-y divide-white/5">
          {panels.map((panel) => (
            <div key={`${panel.panelId}-${panel.instanceId}`} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{panel.title}</div>
                  <div className="text-[11px] text-slate-400">
                    {panel.panelId} · {panel.instanceId}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">{new Date(panel.lastUpdated).toLocaleString()}</div>
              </div>
              <div className="text-xs text-slate-200">
                <div>Metrics: {summarizeKV(panel.metrics)}</div>
                <div>Flags: {summarizeKV(panel.flags)}</div>
                <div>Notes: {panel.notes || "—"}</div>
                <div>
                  Bands:{" "}
                  {Array.isArray(panel.bands) && panel.bands.length > 0
                    ? panel.bands.map((band) => band.name).join(", ")
                    : "—"}
                </div>
                {panel.tile_sample && (
                  <div>
                    Tiles: {panel.tile_sample.active ?? 0}/{panel.tile_sample.total ?? 0}
                    {panel.tile_sample.hot && panel.tile_sample.hot.length > 0 ? ` hot:${panel.tile_sample.hot.length}` : ""}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BadgeTelemetryDrawer({
  open,
  onClose,
  snapshot,
  busy,
  error,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  snapshot: BadgeTelemetryResponse | null;
  busy: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  if (!open) return null;
  const entries = snapshot?.entries ?? [];
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-black/50">
      <div className="h-full w-[520px] bg-[#0b0f1c] border-l border-white/10 shadow-xl overflow-auto">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-white">Badge Telemetry</div>
            <div className="text-[11px] text-slate-400">
              {snapshot?.capturedAt ? `Captured ${new Date(snapshot.capturedAt).toLocaleString()}` : "Awaiting data"}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button className="underline disabled:opacity-40" onClick={() => onRefresh()} disabled={busy}>
              {busy ? "Refreshing..." : "Refresh"}
            </button>
            <button className="underline" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        {error && <div className="px-4 py-2 text-xs text-rose-300 border-b border-rose-400/30">{error}</div>}
        {snapshot?.relationNotes && snapshot.relationNotes.length > 0 && (
          <div className="px-4 py-2 text-[11px] text-slate-300 border-b border-white/10 space-y-1">
            {snapshot.relationNotes.map((note, idx) => (
              <div key={idx}>{note}</div>
            ))}
          </div>
        )}
        {busy && !entries.length && <div className="px-4 py-3 text-xs text-slate-400">Loading badge telemetry...</div>}
        {!busy && entries.length === 0 && !error && (
          <div className="px-4 py-3 text-xs text-slate-400">No badge telemetry available.</div>
        )}
        <div className="divide-y divide-white/5">
          {entries.map((entry) => (
            <div key={`${entry.panelId}-${entry.instanceId}`} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{entry.title}</div>
                  <div className="text-[11px] text-slate-400">
                    {entry.panelId} · {entry.instanceId} · {entry.status.toUpperCase()}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">{new Date(entry.lastUpdated).toLocaleString()}</div>
              </div>
              <div className="text-xs text-slate-200 whitespace-pre-wrap">{entry.summary}</div>
              <div className="text-[11px] text-slate-300">
                Proofs:{" "}
                {entry.proofs.length
                  ? entry.proofs.map((p) => `${p.label}=${p.value}`).join(" · ")
                  : "—"}
              </div>
              <div className="text-[11px] text-slate-300">
                Next steps:{" "}
                {entry.solutions.length
                  ? entry.solutions.map((s) => s.action).join(" · ")
                  : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
