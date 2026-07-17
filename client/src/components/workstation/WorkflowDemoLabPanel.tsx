import React, { useEffect, useMemo, useState } from "react";
import { Check, Circle, FlaskConical, Link2, Pause, Play, RotateCcw } from "lucide-react";
import { HelixAskWorkflowSuggestionRuntime } from "@/components/helix/ask-console/HelixAskWorkflowSuggestionRuntime";
import {
  RESEARCH_PAPER_TO_PROPOSAL_DEMO,
  projectResearchPaperToProposalSession,
  type ResearchPaperToProposalProjection,
} from "@/lib/helix/workflow-demos/research-paper-to-proposal";
import { useHelixWorkflowDemoStore, type HelixWorkflowDemoState } from "@/store/useHelixWorkflowDemoStore";
import { useAgiChatStore } from "@/store/useAgiChatStore";
import { recordWorkstationTimelineEntry } from "@/store/useWorkstationWorkflowTimelineStore";
import {
  createHelixWorkflowDemoCurrentChatBinding,
  createHelixWorkflowDemoCustomBinding,
  selectHelixWorkflowDemoContextCandidate,
} from "@/lib/helix/workflow-demos/workflow-demo-context";

type ContextMode = "current_chat" | "custom" | "blank";

export default function WorkflowDemoLabPanel() {
  const session = useHelixWorkflowDemoStore((state: HelixWorkflowDemoState) => state.session);
  const startDemo = useHelixWorkflowDemoStore((state: HelixWorkflowDemoState) => state.startResearchPaperToProposalDemo);
  const pauseDemo = useHelixWorkflowDemoStore((state: HelixWorkflowDemoState) => state.pauseDemo);
  const resumeDemo = useHelixWorkflowDemoStore((state: HelixWorkflowDemoState) => state.resumeDemo);
  const resetDemo = useHelixWorkflowDemoStore((state: HelixWorkflowDemoState) => state.resetDemo);
  const bindContext = useHelixWorkflowDemoStore((state: HelixWorkflowDemoState) => state.bindContext);
  const pinDemoToChat = useHelixWorkflowDemoStore((state: HelixWorkflowDemoState) => state.pinDemoToChat);
  const restoreSuggestion = useHelixWorkflowDemoStore((state: HelixWorkflowDemoState) => state.restoreSuggestion);
  const chatSessions = useAgiChatStore((state) => state.sessions);
  const activeChatId = useAgiChatStore((state) => state.activeId);
  const projection = useMemo(() => projectResearchPaperToProposalSession(session), [session]);
  const runOriginSessionId = session?.originSessionId ?? session?.contextBinding?.sourceSessionId ?? null;
  const activeChatMismatch = Boolean(session && activeChatId && runOriginSessionId && activeChatId !== runOriginSessionId);
  const contextCandidate = useMemo(
    () => selectHelixWorkflowDemoContextCandidate({ sessions: chatSessions, activeId: activeChatId }),
    [activeChatId, chatSessions],
  );
  const [contextMode, setContextMode] = useState<ContextMode>("current_chat");
  const [customObjective, setCustomObjective] = useState("");
  const canEnableDemo = contextMode === "blank" ||
    (contextMode === "current_chat" && Boolean(contextCandidate)) ||
    (contextMode === "custom" && Boolean(customObjective.trim()));

  useEffect(() => {
    if (!contextCandidate && contextMode === "current_chat") setContextMode("custom");
  }, [contextCandidate, contextMode]);

  const selectedBinding = () => {
    if (contextMode === "current_chat" && contextCandidate) {
      return createHelixWorkflowDemoCurrentChatBinding(contextCandidate);
    }
    if (contextMode === "custom") return createHelixWorkflowDemoCustomBinding(customObjective);
    return null;
  };

  const handleStart = () => {
    const next = startDemo(selectedBinding(), activeChatId ?? null);
    recordWorkstationTimelineEntry({
      lane: "procedural",
      label: "Workflow demo started: Research paper to proposal",
      panelId: "workflow-demo-lab",
      traceId: next.runId,
      step: "paper_lookup",
    });
  };

  const handleBindSelectedContext = () => {
    const binding = selectedBinding();
    if (!binding) return;
    bindContext(binding);
  };

  const handleRebaseFromCurrentChat = () => {
    if (!contextCandidate) return;
    bindContext(createHelixWorkflowDemoCurrentChatBinding(contextCandidate));
  };

  const handleReset = () => {
    resetDemo();
    recordWorkstationTimelineEntry({
      lane: "procedural",
      label: "Workflow demo reset",
      panelId: "workflow-demo-lab",
    });
  };

  const handleContinueInActiveChat = () => {
    if (!activeChatId) return;
    pinDemoToChat(activeChatId);
  };

  const handleResetForActiveChat = () => {
    if (!activeChatId) return;
    resetDemo();
    const binding = contextCandidate
      ? createHelixWorkflowDemoCurrentChatBinding(contextCandidate)
      : null;
    startDemo(binding, activeChatId);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-slate-100" data-testid="workflow-demo-lab-panel">
      <header className="border-b border-white/10 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-cyan-200" />
              <h1 className="text-sm font-semibold">Workflow Demo Lab</h1>
              <span className="rounded border border-cyan-300/25 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-cyan-100">
                public demo
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
              Procedural demos suggest editable next prompts. Typed evidence advances the workflow; the suggestion lane never decides that a tool ran or an answer is terminal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!session ? (
              <button type="button" onClick={handleStart} disabled={!canEnableDemo} className="inline-flex items-center gap-1.5 rounded border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40">
                <Play className="h-3.5 w-3.5" /> Enable demo
              </button>
            ) : session.status === "paused" ? (
              <button type="button" onClick={resumeDemo} className="inline-flex items-center gap-1.5 rounded border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20">
                <Play className="h-3.5 w-3.5" /> Resume
              </button>
            ) : session.status === "active" ? (
              <button type="button" onClick={pauseDemo} className="inline-flex items-center gap-1.5 rounded border border-amber-300/35 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-400/20">
                <Pause className="h-3.5 w-3.5" /> Pause
              </button>
            ) : null}
            {session ? (
              <button type="button" onClick={handleReset} className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <section className="mb-4 rounded-xl border border-cyan-300/20 bg-cyan-950/15 p-4" data-testid="workflow-demo-context-binding">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-cyan-200" />
                <h2 className="text-sm font-semibold">Workflow objective</h2>
              </div>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
                Bind the run to a visible objective. Chat context chooses the topic; only typed evidence advances the steps.
              </p>
            </div>
            {session?.contextBinding ? (
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-100">
                {session.contextBinding.sourceKind === "current_chat" ? "current chat" : "custom"} · {session.contextBinding.confidence}
              </span>
            ) : (
              <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-1 text-[10px] text-amber-100">
                context required
              </span>
            )}
          </div>

          {session?.contextBinding ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs leading-5 text-slate-100">{session.contextBinding.objective}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                <span>Frozen for this run</span>
                {session.contextBinding.sourceMessageId ? <span className="font-mono">source {session.contextBinding.sourceMessageId}</span> : null}
                {session.contextBinding.sourceTraceId ? <span className="font-mono">turn {session.contextBinding.sourceTraceId}</span> : null}
              </div>
              {contextCandidate && projection.completedStepCount === 0 ? (
                <button type="button" onClick={handleRebaseFromCurrentChat} className="mt-3 rounded border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100 hover:bg-cyan-400/20">
                  Rebase from latest chat
                </button>
              ) : projection.completedStepCount > 0 ? (
                <p className="mt-3 text-[11px] text-amber-200/80">Reset the demo before changing its objective after evidence has advanced a step.</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Workflow context source">
                <button
                  type="button"
                  onClick={() => setContextMode("current_chat")}
                  disabled={!contextCandidate}
                  className={`rounded border px-2.5 py-1 text-xs ${contextMode === "current_chat" ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100" : "border-white/15 bg-white/5 text-slate-300"} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  Current chat
                </button>
                <button
                  type="button"
                  onClick={() => setContextMode("custom")}
                  className={`rounded border px-2.5 py-1 text-xs ${contextMode === "custom" ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100" : "border-white/15 bg-white/5 text-slate-300"}`}
                >
                  Custom topic
                </button>
                <button
                  type="button"
                  onClick={() => setContextMode("blank")}
                  className={`rounded border px-2.5 py-1 text-xs ${contextMode === "blank" ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100" : "border-white/15 bg-white/5 text-slate-300"}`}
                >
                  Blank placeholder
                </button>
              </div>

              {contextMode === "current_chat" && contextCandidate ? (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs leading-5 text-slate-100">{contextCandidate.objective}</p>
                  <p className="mt-2 text-[10px] text-slate-500">{contextCandidate.reason} Confidence: {contextCandidate.confidence}.</p>
                </div>
              ) : contextMode === "custom" ? (
                <textarea
                  value={customObjective}
                  onChange={(event) => setCustomObjective(event.currentTarget.value)}
                  rows={4}
                  placeholder="Describe the research objective this demo should pursue."
                  aria-label="Custom workflow objective"
                  className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs leading-5 text-slate-100 outline-none focus:border-cyan-300/50"
                />
              ) : (
                <p className="rounded-lg border border-amber-300/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100/80">
                  The demo can start without a topic, but no QTE will be suggested until you bind a current-chat or custom objective.
                </p>
              )}

              {session ? (
                <button
                  type="button"
                  onClick={handleBindSelectedContext}
                  disabled={contextMode === "blank" || (contextMode === "custom" && !customObjective.trim()) || (contextMode === "current_chat" && !contextCandidate)}
                  className="rounded border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Bind objective
                </button>
              ) : null}
            </div>
          )}
        </section>

        {activeChatMismatch ? (
          <section
            className="mb-4 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4"
            data-testid="workflow-demo-chat-mismatch"
          >
            <h2 className="text-sm font-semibold text-amber-100">This workflow is pinned to another chat</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-amber-100/75">
              Its objective and Step {projection.completedStepCount + 1} progress are preserved, but replies in this chat cannot advance it. Continue explicitly here, or reset and derive a fresh objective from this chat.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={handleContinueInActiveChat} className="rounded border border-amber-200/35 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-50 hover:bg-amber-300/20">
                Continue this run here
              </button>
              <button type="button" onClick={handleResetForActiveChat} className="rounded border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">
                Reset for this chat
              </button>
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">{RESEARCH_PAPER_TO_PROPOSAL_DEMO.title}</h2>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">{RESEARCH_PAPER_TO_PROPOSAL_DEMO.description}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] text-slate-300">
              {projection.completedStepCount}/{projection.steps.length} complete
            </span>
          </div>

          <ol className="mt-4 grid gap-2 lg:grid-cols-2">
            {projection.steps.map((step: ResearchPaperToProposalProjection["steps"][number], index: number) => (
              <li
                key={step.id}
                className={`rounded-lg border p-3 ${
                  step.state === "completed"
                    ? "border-emerald-300/25 bg-emerald-400/5"
                    : step.state === "current"
                      ? "border-cyan-300/35 bg-cyan-400/10"
                      : "border-white/10 bg-black/15 opacity-65"
                }`}
              >
                <div className="flex items-start gap-2">
                  {step.state === "completed" ? (
                    <span className="mt-0.5 rounded-full bg-emerald-400/15 p-1 text-emerald-200"><Check className="h-3 w-3" /></span>
                  ) : (
                    <span className="mt-0.5 rounded-full border border-white/15 p-1 text-slate-400"><Circle className="h-3 w-3" /></span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{index + 1}. {step.shortLabel}</p>
                    <h3 className="mt-0.5 text-xs font-semibold text-slate-100">{step.title}</h3>
                    <p className="mt-1 text-[11px] leading-4 text-slate-400">{step.description}</p>
                    {step.evidenceRefs.length > 0 ? (
                      <p className="mt-2 break-all font-mono text-[9px] text-emerald-200/70">{step.evidenceRefs[0]}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {session?.dismissedStepId ? (
          <button type="button" onClick={restoreSuggestion} className="mt-4 text-xs text-cyan-200 underline decoration-cyan-300/30 underline-offset-4">
            Restore dismissed next-step suggestion
          </button>
        ) : null}
        {session?.status === "active" ? <div className="mt-4"><HelixAskWorkflowSuggestionRuntime variant="panel" /></div> : null}
        {session?.status === "completed" ? (
          <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            Demo complete. A typed postulate submission receipt closed the procedural workflow.
          </div>
        ) : null}
      </div>
    </div>
  );
}
