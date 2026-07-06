import React, { type ReactNode } from "react";
import { parseHelixAskFinalAnswerBulletLine } from "@/lib/helix/ask-answer-rendering";
import type { ReadAloudRegionTrafficState } from "@/lib/helix/ask-read-aloud-display";

export type HelixAskFinalAnswerBlock =
  | {
      kind: "blank";
      key: string;
    }
  | {
      kind: "bullet";
      key: string;
      text: string;
    }
  | {
      kind: "line";
      key: string;
      text: string;
      isSectionHeader: boolean;
    };

export type HelixAskFinalAnswerProps = {
  text: string;
  meta?: string | null;
  renderContent?: (text: string) => ReactNode;
  readAloudTraffic?: ReadAloudRegionTrafficState | null;
};

function coerceText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return String(value);
  } catch {
    return "";
  }
}

export function buildHelixAskFinalAnswerBlocks(content: unknown): HelixAskFinalAnswerBlock[] {
  const text = coerceText(content);
  if (!text) return [];
  return text.replace(/\r\n/g, "\n").split("\n").map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return {
        kind: "blank",
        key: `final-answer-blank-${index}`,
      };
    }
    const bulletText = parseHelixAskFinalAnswerBulletLine(trimmed);
    if (bulletText) {
      return {
        kind: "bullet",
        key: `final-answer-bullet-${index}`,
        text: bulletText,
      };
    }
    return {
      kind: "line",
      key: `final-answer-line-${index}`,
      text: trimmed,
      isSectionHeader: /:$/.test(trimmed) && trimmed.length <= 80,
    };
  });
}

function normalizeReadAloudMatchText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function resolveHelixAskFinalAnswerReadAloudBlockKey(
  blocks: readonly HelixAskFinalAnswerBlock[],
  state?: ReadAloudRegionTrafficState | null,
): string | null {
  if (!state?.active) return null;
  const chunkText = normalizeReadAloudMatchText(state.chunkText ?? "");
  const textBlocks = blocks.filter(
    (block): block is Extract<HelixAskFinalAnswerBlock, { text: string }> =>
      block.kind === "line" || block.kind === "bullet",
  );
  if (chunkText) {
    const textMatch = textBlocks.find((block) => {
      const blockText = normalizeReadAloudMatchText(block.text);
      return Boolean(blockText) && (chunkText.includes(blockText) || blockText.includes(chunkText));
    });
    if (textMatch) return textMatch.key;
  }
  if (typeof state.chunkIndex === "number" && state.chunkIndex >= 0) {
    return textBlocks[state.chunkIndex]?.key ?? null;
  }
  return null;
}

function HelixAskReadAloudBlockReticle({
  state,
  children,
}: {
  state: ReadAloudRegionTrafficState;
  children: ReactNode;
}) {
  const toneClass =
    state.phase === "loading" || state.phase === "resuming"
      ? "border-sky-200/90 bg-sky-300/[0.04] text-sky-100 shadow-[0_0_0_1px_rgba(14,165,233,0.22),0_0_22px_rgba(56,189,248,0.14)]"
      : state.phase === "paused"
        ? "border-amber-200/85 bg-amber-300/[0.035] text-amber-100 shadow-[0_0_0_1px_rgba(245,158,11,0.18),0_0_20px_rgba(251,191,36,0.12)]"
        : "border-cyan-200/90 bg-cyan-300/[0.04] text-cyan-100 shadow-[0_0_0_1px_rgba(8,145,178,0.25),0_0_24px_rgba(34,211,238,0.18)]";
  return (
    <div
      className={`relative rounded-[6px] border-2 border-dotted px-2.5 py-2 ${toneClass}`}
      data-testid="helix-ask-read-aloud-region-reticle"
      data-helix-read-aloud-region-state={state.phase}
      data-helix-read-aloud-chunk-index={state.chunkIndex ?? undefined}
      data-helix-read-aloud-chunk-count={state.chunkCount ?? undefined}
      aria-label={state.detail ? `${state.label}, ${state.detail}` : state.label}
    >
      <div className="pointer-events-none absolute right-2 top-1 flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]">
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        <span>{state.detail ?? state.label}</span>
      </div>
      <div className="pt-3">{children}</div>
    </div>
  );
}

export function HelixAskFinalAnswer({ text, meta, renderContent, readAloudTraffic }: HelixAskFinalAnswerProps) {
  const blocks = buildHelixAskFinalAnswerBlocks(text);
  const renderText = renderContent ?? ((value: string) => value);
  const reticleBlockKey = resolveHelixAskFinalAnswerReadAloudBlockKey(blocks, readAloudTraffic);
  const renderBlockWithReticle = (key: string, node: ReactNode) =>
    readAloudTraffic?.active && reticleBlockKey === key
      ? (
          <HelixAskReadAloudBlockReticle key={key} state={readAloudTraffic}>
            {node}
          </HelixAskReadAloudBlockReticle>
        )
      : node;
  return (
    <section className="space-y-2" data-testid="helix-ask-console-final-answer">
      <div className="mt-2 space-y-1.5 whitespace-normal break-words [overflow-wrap:anywhere] leading-relaxed text-sm text-slate-100">
        {blocks.map((block) => {
          if (block.kind === "blank") {
            return <div key={block.key} className="h-2" aria-hidden="true" />;
          }
          if (block.kind === "bullet") {
            return renderBlockWithReticle(block.key, (
              <div key={block.key} className="flex gap-2 pl-2">
                <span className="mt-[0.15rem] text-cyan-300/80" aria-hidden="true">
                  -
                </span>
                <span
                  className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]"
                  data-narrator-source-id={`helix-${block.key}`}
                >
                  {renderText(block.text)}
                </span>
              </div>
            ));
          }
          return renderBlockWithReticle(block.key, (
            <div
              key={block.key}
              className={
                block.isSectionHeader
                  ? "break-words pt-1 [overflow-wrap:anywhere] text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100"
                  : "break-words [overflow-wrap:anywhere]"
              }
              data-narrator-source-id={`helix-${block.key}`}
            >
              {renderText(block.text)}
            </div>
          ));
        })}
      </div>
      {meta ? (
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{meta}</p>
      ) : null}
    </section>
  );
}
