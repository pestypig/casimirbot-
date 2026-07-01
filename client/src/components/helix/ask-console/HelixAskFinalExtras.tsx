import React from "react";

type RecordLike = Record<string, unknown>;

export type HelixAskProofTraceDetailsProps = {
  trace?: unknown;
  clipText: (text: string, limit: number) => string;
};

export type HelixAskJobReadyLinkStripProps = {
  links: RecordLike[];
  onRun: (link: RecordLike) => void;
};

export type HelixAskReplyStatusFooterProps = {
  visible: boolean;
  promptIngested?: boolean;
};

export type HelixAskLiveBridgePill = {
  label: string;
  tone: "cyan" | "amber" | "emerald" | "slate";
};

export type HelixAskLiveBridgePillStripProps = {
  rowKey: string;
  pills?: HelixAskLiveBridgePill[];
  isLatestReply: boolean;
  status?: string | null;
  readPillClassName: (tone: HelixAskLiveBridgePill["tone"]) => string;
};

export type HelixAskStagePlayActionButtonsProps = {
  actions?: Array<"Run" | "Skip" | "Pause job">;
  rowKey: string;
  isLatestReply: boolean;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

export function HelixAskProofTraceDetails({ trace, clipText }: HelixAskProofTraceDetailsProps) {
  const record = readRecord(trace);
  if (!record) return null;

  const steps = Array.isArray(record.compact_steps) ? record.compact_steps : [];
  const caveats = Array.isArray(record.caveats) ? record.caveats : [];

  return (
    <details className="mt-3 rounded-lg border border-amber-300/25 bg-amber-950/15 px-3 py-2 text-xs text-amber-50">
      <summary className="cursor-pointer select-none text-[10px] uppercase tracking-[0.2em] text-amber-200">
        Proof trace
        {typeof record.proof_status === "string" ? (
          <span className="ml-2 rounded border border-amber-300/30 bg-black/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em]">
            {record.proof_status}
          </span>
        ) : null}
      </summary>
      <div className="mt-2 space-y-1.5">
        {steps.slice(0, 6).map((step, stepIndex) => {
          const stepRecord = readRecord(step);
          return (
            <p key={`${String(stepRecord?.label ?? "step")}-${stepIndex}`} className="leading-relaxed">
              <span className="text-amber-200/80">{String(stepRecord?.label ?? `Step ${stepIndex + 1}`)}: </span>
              {clipText(String(stepRecord?.summary ?? ""), 260)}
            </p>
          );
        })}
        {typeof record.scope_match === "string" ? (
          <p className="text-[10px] uppercase tracking-[0.14em] text-amber-100/70">
            Scope: {String(record.requested_extraction_scope ?? "unknown")}{" -> "}
            {String(record.actual_extraction_scope ?? "unknown")} ({record.scope_match})
          </p>
        ) : null}
        {caveats.length > 0 ? (
          <p className="text-amber-100/80">Caveats: {caveats.slice(0, 3).map(String).join(" | ")}</p>
        ) : null}
      </div>
    </details>
  );
}

export function HelixAskJobReadyLinkStrip({ links, onRun }: HelixAskJobReadyLinkStripProps) {
  if (links.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.slice(0, 6).map((link, linkIndex) => {
        const label =
          typeof link.label === "string" && link.label.trim()
            ? link.label.trim()
            : `${String(link.panel_id)}.${String(link.action_id)}`;
        const source =
          typeof link.source_artifact_kind === "string" && link.source_artifact_kind.trim()
            ? link.source_artifact_kind.trim()
            : typeof link.source === "string"
              ? link.source
              : "artifact";
        return (
          <button
            key={`${String(link.type ?? "link")}-${String(link.panel_id)}-${String(link.action_id)}-${linkIndex}`}
            type="button"
            className="rounded-full border border-cyan-300/35 bg-cyan-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-100 hover:border-cyan-200/60 hover:bg-cyan-300/15"
            onClick={() => onRun(link)}
            title={`From ${source}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function HelixAskReplyStatusFooter({ visible, promptIngested = false }: HelixAskReplyStatusFooterProps) {
  if (!visible) return null;

  return (
    <div className="mt-2 text-[10px] uppercase tracking-[0.14em] text-slate-500">
      <span>
        In Helix Console
        {promptIngested ? " | Prompt ingested" : ""}
      </span>
    </div>
  );
}

export function HelixAskLiveBridgePillStrip({
  rowKey,
  pills,
  isLatestReply,
  status,
  readPillClassName,
}: HelixAskLiveBridgePillStripProps) {
  if (!pills?.length) return null;

  return (
    <div
      className="mt-2 flex max-w-full flex-wrap gap-1"
      data-testid={isLatestReply ? "helix-ask-latest-live-turn-bridge" : undefined}
      data-live-turn-bridge-status={status ?? undefined}
    >
      {pills.map((pill) => (
        <span
          key={`${rowKey}-${pill.label}`}
          className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] ${readPillClassName(pill.tone)}`}
        >
          {pill.label}
        </span>
      ))}
    </div>
  );
}

export function HelixAskStagePlayActionButtons({
  actions,
  rowKey,
  isLatestReply,
}: HelixAskStagePlayActionButtonsProps) {
  if (!actions?.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {actions.map((action) => (
        <button
          key={`${rowKey}-${action}`}
          type="button"
          disabled
          title="Use the Stage Play graph checkpoint controls for this v1 action."
          className="rounded border border-amber-300/30 bg-black/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100/70 disabled:cursor-not-allowed disabled:opacity-70"
          data-testid={
            isLatestReply
              ? `helix-ask-latest-stage-play-${action.toLowerCase().replace(/\s+/g, "-")}`
              : undefined
          }
        >
          {action}
        </button>
      ))}
    </div>
  );
}
