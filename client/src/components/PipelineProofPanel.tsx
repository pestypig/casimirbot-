import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FrontProofsLedger } from "./FrontProofsLedger";
import { openDocPanel } from "@/lib/docs/openDocPanel";

type PipelineStatus = {
  ok?: boolean;
  natarioConstraint?: boolean;
  dutyEffective_FR?: number;
  thetaScaleExpected?: number;
  thetaScale?: number;
  warp?: unknown;
  natario?: unknown;
  warpUniforms?: Record<string, number>;
  capturedAt?: string;
};

type GroundingSource = {
  kind?: string;
  id?: string;
  path?: string;
  extra?: unknown;
};

type ResonancePatchRef = {
  id: string;
  path: string;
  kind?: string;
  score?: number;
};

type PlanDebugPayload = {
  ok?: boolean;
  traceId?: string;
  goal?: string;
  personaId?: string;
  planDsl?: string;
  resonancePatchId?: string | null;
  resonancePatches?: ResonancePatchRef[];
  groundingSources?: GroundingSource[];
  createdAt?: string;
};

const PIPELINE_STATUS_URL = "/api/agi/pipeline/status";
const PLAN_DEBUG_URL = "/api/agi/pipeline/last-plan-debug";

export default function PipelineProofPanel() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [planDebug, setPlanDebug] = useState<PlanDebugPayload | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    fetchPipelineStatus();
    fetchPlanDebug();
  };

  const fetchJson = async <T,>(url: string): Promise<T> => {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`status ${response.status}${text ? `: ${text.slice(0, 160)}` : ""}`);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`unexpected response (not JSON): ${text.slice(0, 160)}`);
    }
  };

  const fetchPipelineStatus = async () => {
    setStatusError(null);
    try {
      const payload = await fetchJson<PipelineStatus>(PIPELINE_STATUS_URL);
      setStatus(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(null);
      setStatusError(message);
    }
  };

  const fetchPlanDebug = async () => {
    setPlanError(null);
    try {
      const payload = await fetchJson<PlanDebugPayload>(PLAN_DEBUG_URL);
      setPlanDebug(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPlanDebug(null);
      setPlanError(message);
    }
  };

  const groundingSources = useMemo(() => planDebug?.groundingSources ?? [], [planDebug]);
  const resonancePatches = useMemo(() => planDebug?.resonancePatches ?? [], [planDebug]);

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Proof surface</p>
          <h1 className="text-xl font-semibold text-white">Pipeline Proof</h1>
          <p className="text-xs text-slate-400">Live pipeline truth + the evidence the planner used.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-md border border-cyan-400/60 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-5">
        <div className="mb-4">
          <FrontProofsLedger />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <InfoCard title="Pipeline Status" subtitle={status?.capturedAt ? `Captured ${status.capturedAt}` : undefined}>
            {statusError ? (
              <ErrorText message={statusError} />
            ) : status ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <StatusBadge label="Natario constraint" value={status.natarioConstraint} />
                  <Metric label="DutyEffective_FR" value={status.dutyEffective_FR} />
                  <Metric label="thetaScaleExpected" value={status.thetaScaleExpected} />
                  <Metric label="thetaScale" value={status.thetaScale} />
                </div>
                <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900/80 p-3 text-xs text-slate-200">
                  {JSON.stringify(status, null, 2)}
                </pre>
              </div>
            ) : (
              <Placeholder text="Loading pipeline status…" />
            )}
          </InfoCard>

          <InfoCard
            title="Grounding Sources"
            subtitle={planDebug?.goal ? `Last goal: ${planDebug.goal}` : undefined}
          >
            {planError ? (
              <ErrorText message={planError} />
            ) : groundingSources.length ? (
              <ul className="space-y-2 text-sm">
                {groundingSources.map((source, idx) => (
                  <li key={`${source.kind ?? "src"}-${source.id ?? idx}-${source.path ?? idx}`}>
                    <GroundingRow source={source} />
                  </li>
                ))}
              </ul>
            ) : (
              <Placeholder text="No grounding data yet (debugSources off?)." />
            )}
          </InfoCard>
        </div>

        <InfoCard
          title="Last Plan & Resonance"
          subtitle={
            planDebug?.traceId
              ? `Trace ${planDebug.traceId}${planDebug.resonancePatchId ? ` · patch ${planDebug.resonancePatchId}` : ""}`
              : undefined
          }
        >
          {planError ? (
            <ErrorText message={planError} />
          ) : planDebug ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Plan DSL</h3>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900/80 p-3 text-xs text-slate-200">
                  {planDebug.planDsl ?? "n/a"}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Resonance Patch Nodes</h3>
                {resonancePatches.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {resonancePatches.map((patch) => (
                      <li
                    key={`${patch.id}-${patch.path}`}
                    className="flex items-center justify-between rounded-md border border-white/5 bg-slate-900/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-slate-100">{patch.path}</p>
                      <p className="text-[11px] text-slate-400">
                        {patch.id} {patch.kind ? `· ${patch.kind}` : ""}{" "}
                        {typeof patch.score === "number" ? `· score ${patch.score.toFixed(3)}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
                  </ul>
                ) : (
                  <Placeholder text="No resonance nodes captured for the last plan." />
                )}
              </div>
            </div>
          ) : (
            <Placeholder text="Waiting for the next plan run…" />
          )}
        </InfoCard>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/70 p-4 shadow-lg shadow-cyan-900/20">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">{subtitle}</p>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ label, value }: { label: string; value: unknown }) {
  const truthy = value === true;
  const falsy = value === false;
  const color = truthy ? "text-emerald-300 bg-emerald-500/10 ring-emerald-500/50" : falsy ? "text-amber-300 bg-amber-500/10 ring-amber-500/40" : "text-slate-200 bg-white/5 ring-white/15";
  const text = truthy ? "true" : falsy ? "false" : "n/a";
  return (
    <div className="rounded-lg border border-white/5 bg-white/5 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <span className={`mt-1 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold ring-1 ${color}`}>
        {text}
      </span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string | null | undefined }) {
  const display =
    typeof value === "number" ? value.toFixed(4) : typeof value === "string" ? value : value ?? "n/a";
  return (
    <div className="rounded-lg border border-white/5 bg-white/5 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-50">{display}</p>
    </div>
  );
}

function ErrorText({ message }: { message: string }) {
  return <div className="rounded-md border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">Error: {message}</div>;
}

function Placeholder({ text }: { text: string }) {
  return <div className="rounded-md border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-400">{text}</div>;
}

function GroundingRow({ source }: { source: GroundingSource }) {
  const { path, kind, id } = source;
  const label = path ?? id ?? "(unknown)";
  const actionable = Boolean(path);
  const actionLabel = kind === "doc" ? "Open" : "Copy";

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
      <div>
        <p className="text-sm text-slate-100">{label}</p>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          {kind ?? "unknown"} {id && !label.includes(id) ? `· ${id}` : ""}
        </p>
      </div>
      {actionable && (
        <button
          type="button"
          onClick={() => openGroundingSource(source)}
          className="rounded-md border border-cyan-400/60 bg-cyan-500/10 px-2 py-1 text-[12px] text-cyan-100 transition hover:bg-cyan-500/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function openGroundingSource(source: GroundingSource) {
  if (!source.path) return;
  if (source.kind === "doc") {
    openDocPanel(source.path);
    return;
  }
  // Fallback: copy the path for non-doc sources and open http(s) targets if present.
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(source.path);
  }
  if (typeof window !== "undefined" && /^https?:\/\//i.test(source.path)) {
    window.open(source.path, "_blank", "noopener");
  }
}
