import React, { type ReactNode } from "react";
import { renderToString as renderKatexToString } from "katex";
import "katex/dist/katex.min.css";

import { parseHelixAskFinalAnswerBulletLine } from "@/lib/helix/ask-answer-rendering";
import type {
  ReadAloudRegionTrafficRegion,
  ReadAloudRegionTrafficState,
} from "@/lib/helix/ask-read-aloud-display";

import { HelixAskMathHtmlSurface } from "./HelixAskMathHtmlSurface";

export type HelixAskFinalAnswerTextSegment = {
  key: string;
  text: string;
};

export type HelixAskFinalAnswerBlock =
  | {
      kind: "blank";
      key: string;
    }
  | {
      kind: "code";
      key: string;
      language: string | null;
      text: string;
    }
  | {
      kind: "bullet";
      key: string;
      text: string;
      segments: HelixAskFinalAnswerTextSegment[];
    }
  | {
      kind: "line";
      key: string;
      text: string;
      segments: HelixAskFinalAnswerTextSegment[];
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

function buildHelixAskFinalAnswerTextSegments(keyPrefix: string, text: string): HelixAskFinalAnswerTextSegment[] {
  const normalized = text.trim();
  if (!normalized) return [];
  // Keep punctuation that is not followed by whitespace (for example decimal
  // points in `alpha = 0.7`) inside the sentence. The prior negated-character
  // matcher could restart after each decimal point and silently discard every
  // preceding character from the rendered answer.
  const sentenceMatches = normalized.match(/.+?(?:[.!?]+(?=\s|$)|$)/g) ?? [normalized];
  const segments = sentenceMatches
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment, index) => ({
      key: `${keyPrefix}-segment-${index}`,
      text: segment,
    }));
  return segments.length > 0 ? segments : [{ key: `${keyPrefix}-segment-0`, text: normalized }];
}

function parseHelixAskFinalAnswerCodeFence(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("```")) return null;
  const language = trimmed.replace(/^```/, "").trim();
  return language || "";
}

export function buildHelixAskFinalAnswerBlocks(content: unknown): HelixAskFinalAnswerBlock[] {
  const text = coerceText(content);
  if (!text) return [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: HelixAskFinalAnswerBlock[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const codeLanguage = parseHelixAskFinalAnswerCodeFence(line);
    if (codeLanguage !== null) {
      const codeLines: string[] = [];
      let closingIndex = index;
      for (let codeIndex = index + 1; codeIndex < lines.length; codeIndex += 1) {
        const codeLine = lines[codeIndex] ?? "";
        if (parseHelixAskFinalAnswerCodeFence(codeLine) !== null) {
          closingIndex = codeIndex;
          break;
        }
        codeLines.push(codeLine);
        closingIndex = codeIndex;
      }
      blocks.push({
        kind: "code",
        key: `final-answer-code-${index}`,
        language: codeLanguage || null,
        text: codeLines.join("\n"),
      });
      index = closingIndex;
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push({
        kind: "blank",
        key: `final-answer-blank-${index}`,
      });
      continue;
    }
    const bulletText = parseHelixAskFinalAnswerBulletLine(trimmed);
    if (bulletText) {
      const key = `final-answer-bullet-${index}`;
      blocks.push({
        kind: "bullet",
        key,
        text: bulletText,
        segments: buildHelixAskFinalAnswerTextSegments(key, bulletText),
      });
      continue;
    }
    const key = `final-answer-line-${index}`;
    blocks.push({
      kind: "line",
      key,
      text: trimmed,
      segments: buildHelixAskFinalAnswerTextSegments(key, trimmed),
      isSectionHeader: /:$/.test(trimmed) && trimmed.length <= 80,
    });
  }
  return blocks;
}

function normalizeReadAloudMatchText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function collectHelixAskFinalAnswerReadAloudTargets(blocks: readonly HelixAskFinalAnswerBlock[]): Array<{
  key: string;
  text: string;
  normalizedText: string;
  isSegment: boolean;
}> {
  const targets: Array<{
    key: string;
    text: string;
    normalizedText: string;
    isSegment: boolean;
  }> = [];
  for (const block of blocks) {
    if (block.kind !== "line" && block.kind !== "bullet") continue;
    for (const segment of block.segments) {
      const normalizedText = normalizeReadAloudMatchText(segment.text);
      if (normalizedText) {
        targets.push({
          key: segment.key,
          text: segment.text,
          normalizedText,
          isSegment: true,
        });
      }
    }
    const normalizedText = normalizeReadAloudMatchText(block.text);
    if (normalizedText) {
      targets.push({
        key: block.key,
        text: block.text,
        normalizedText,
        isSegment: false,
      });
    }
  }
  return targets;
}

export function resolveHelixAskFinalAnswerReadAloudBlockKey(
  blocks: readonly HelixAskFinalAnswerBlock[],
  state?: ReadAloudRegionTrafficRegion | null,
): string | null {
  return resolveHelixAskFinalAnswerReadAloudBlockKeys(blocks, state)[0] ?? null;
}

export function resolveHelixAskFinalAnswerReadAloudBlockKeys(
  blocks: readonly HelixAskFinalAnswerBlock[],
  state?: ReadAloudRegionTrafficRegion | null,
): string[] {
  if (!state?.active) return [];
  const chunkText = normalizeReadAloudMatchText(state.chunkText ?? "");
  const targets = collectHelixAskFinalAnswerReadAloudTargets(blocks);
  if (chunkText) {
    const exactSegmentMatch = targets.find((target) => target.isSegment && target.normalizedText === chunkText);
    if (exactSegmentMatch) return [exactSegmentMatch.key];
    const segmentTargetsInChunk = targets
      .filter((target) => target.isSegment && chunkText.includes(target.normalizedText))
      .map((target) => target.key);
    if (segmentTargetsInChunk.length > 0) return segmentTargetsInChunk;
    const exactMatch = targets.find((target) => target.normalizedText === chunkText);
    if (exactMatch) return [exactMatch.key];
    const containingMatches = targets
      .filter((target) => target.normalizedText.includes(chunkText))
      .sort((left, right) => {
        if (left.isSegment !== right.isSegment) return left.isSegment ? -1 : 1;
        return left.normalizedText.length - right.normalizedText.length;
      });
    if (containingMatches[0]) return [containingMatches[0].key];
  }
  if (typeof state.chunkIndex === "number" && state.chunkIndex >= 0) {
    const segmentTargets = targets.filter((target) => target.isSegment);
    return segmentTargets[state.chunkIndex]?.key ? [segmentTargets[state.chunkIndex].key] : [];
  }
  if (
    state.phase === "loading" ||
    state.phase === "resuming"
  ) {
    const firstTarget = targets.find((target) => target.isSegment)?.key ?? targets[0]?.key ?? null;
    return firstTarget ? [firstTarget] : [];
  }
  return [];
}

function renderHelixAskInlineMarkdownText(
  text: string,
  renderText: (value: string) => ReactNode,
): ReactNode {
  const parts = text.split(/(`[^`]+`)/g).filter(Boolean);
  if (parts.length === 0) return renderText(text);
  return parts.map((part, index) => {
    if (/^`[^`]+`$/.test(part)) {
      const inlineCode = part.replace(/^`/, "").replace(/`$/, "");
      return (
        <code
          key={`inline-code-${index}`}
          className="rounded border border-cyan-300/20 bg-slate-950/75 px-1 py-0.5 font-mono text-[0.92em] text-cyan-100"
        >
          {inlineCode}
        </code>
      );
    }
    return <React.Fragment key={`inline-text-${index}`}>{renderText(part)}</React.Fragment>;
  });
}

function isHelixAskLatexCodeBlockLanguage(language: string | null): boolean {
  return /^(?:latex|tex|math)$/i.test(language?.trim() ?? "");
}

function renderHelixAskFinalAnswerCodeBlock(block: Extract<HelixAskFinalAnswerBlock, { kind: "code" }>) {
  if (isHelixAskLatexCodeBlockLanguage(block.language)) {
    try {
      const katexHtml = renderKatexToString(block.text, {
        displayMode: true,
        strict: "ignore",
        throwOnError: false,
      });
      return (
        <div
          key={block.key}
          className="rounded-md border border-cyan-300/20 bg-slate-950/80"
          data-testid="helix-ask-final-answer-code-block"
          data-code-language={block.language ?? undefined}
          data-code-renderer="katex"
        >
          <div className="border-b border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-100/80">
            {block.language}
          </div>
          <div className="px-3 py-3">
            <HelixAskMathHtmlSurface html={katexHtml} displayMode />
          </div>
        </div>
      );
    } catch {
      // Fall back to the raw code surface below; the final answer remains readable.
    }
  }
  return (
    <div
      key={block.key}
      className="rounded-md border border-cyan-300/20 bg-slate-950/80"
      data-testid="helix-ask-final-answer-code-block"
      data-code-language={block.language ?? undefined}
      data-code-renderer="raw"
    >
      {block.language ? (
        <div className="border-b border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-100/80">
          {block.language}
        </div>
      ) : null}
      <pre className="whitespace-pre-wrap break-words px-3 py-2 font-mono text-xs leading-relaxed text-slate-100 [overflow-wrap:anywhere]">
        <code>{block.text}</code>
      </pre>
    </div>
  );
}

function HelixAskReadAloudBlockReticle({
  state,
  children,
}: {
  state: ReadAloudRegionTrafficRegion;
  children: ReactNode;
}) {
  const toneClass =
    state.phase === "loading" || state.phase === "resuming"
      ? "border-sky-200/90 bg-sky-300/[0.04] text-sky-100 shadow-[0_0_0_1px_rgba(14,165,233,0.22),0_0_22px_rgba(56,189,248,0.14)]"
      : state.phase === "preloading"
        ? "border-violet-200/85 bg-violet-300/[0.035] text-violet-100 shadow-[0_0_0_1px_rgba(139,92,246,0.2),0_0_20px_rgba(167,139,250,0.13)]"
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

function HelixAskReadAloudInlineReticle({
  state,
  children,
}: {
  state: ReadAloudRegionTrafficRegion;
  children: ReactNode;
}) {
  const toneClass =
    state.phase === "loading" || state.phase === "resuming"
      ? "border-sky-200/90 bg-sky-300/[0.04] text-sky-50 shadow-[0_0_0_1px_rgba(14,165,233,0.18),0_0_18px_rgba(56,189,248,0.1)]"
      : state.phase === "preloading"
        ? "border-violet-200/85 bg-violet-300/[0.035] text-violet-50 shadow-[0_0_0_1px_rgba(139,92,246,0.16),0_0_16px_rgba(167,139,250,0.1)]"
      : state.phase === "paused"
        ? "border-amber-200/85 bg-amber-300/[0.035] text-amber-50 shadow-[0_0_0_1px_rgba(245,158,11,0.16),0_0_16px_rgba(251,191,36,0.1)]"
        : "border-cyan-200/90 bg-cyan-300/[0.04] text-cyan-50 shadow-[0_0_0_1px_rgba(8,145,178,0.18),0_0_18px_rgba(34,211,238,0.12)]";
  return (
    <span
      className={`mx-[-0.08rem] inline rounded-[5px] border-2 border-dotted px-1 py-0.5 ${toneClass}`}
      data-testid="helix-ask-read-aloud-region-reticle"
      data-helix-read-aloud-region-state={state.phase}
      data-helix-read-aloud-chunk-index={state.chunkIndex ?? undefined}
      data-helix-read-aloud-chunk-count={state.chunkCount ?? undefined}
      aria-label={state.detail ? `${state.label}, ${state.detail}` : state.label}
      title={state.detail ? `${state.label}, ${state.detail}` : state.label}
    >
      {children}
    </span>
  );
}

export function HelixAskFinalAnswer({ text, meta, renderContent, readAloudTraffic }: HelixAskFinalAnswerProps) {
  const blocks = buildHelixAskFinalAnswerBlocks(text);
  const renderText = renderContent ?? ((value: string) => value);
  const readAloudRegions = readAloudTraffic?.regions?.length
    ? readAloudTraffic.regions
    : readAloudTraffic?.active
      ? [readAloudTraffic]
      : [];
  const reticleRegions = readAloudRegions
    .flatMap((region) =>
      resolveHelixAskFinalAnswerReadAloudBlockKeys(blocks, region).map((blockKey) => ({
        region,
        blockKey,
      })),
    )
    .filter((entry) => entry.region.active);
  const resolvedReticleRegions = reticleRegions.filter(
    (entry): entry is { region: ReadAloudRegionTrafficRegion; blockKey: string } =>
      Boolean(entry.blockKey),
  );
  const shouldWrapWholeAnswerForUnresolvedReadAloud =
    Boolean(readAloudTraffic?.active) &&
    resolvedReticleRegions.length === 0 &&
    (readAloudTraffic?.phase === "loading" || readAloudTraffic?.phase === "resuming");
  const renderBlockWithReticle = (key: string, node: ReactNode) => {
    const matchingRegions = resolvedReticleRegions.filter((entry) => entry.blockKey === key);
    if (matchingRegions.length === 0) return node;
    return matchingRegions.reduceRight<ReactNode>(
      (child, entry) => (
        <HelixAskReadAloudBlockReticle
          key={`${key}:${entry.region.phase}:${entry.region.chunkIndex ?? "unknown"}`}
          state={entry.region}
        >
          {child}
        </HelixAskReadAloudBlockReticle>
      ),
      node,
    );
  };
  const renderSegmentWithReticle = (key: string, node: ReactNode) => {
    const matchingRegions = resolvedReticleRegions.filter((entry) => entry.blockKey === key);
    if (matchingRegions.length === 0) return node;
    return matchingRegions.reduceRight<ReactNode>(
      (child, entry) => (
        <HelixAskReadAloudInlineReticle
          key={`${key}:${entry.region.phase}:${entry.region.chunkIndex ?? "unknown"}`}
          state={entry.region}
        >
          {child}
        </HelixAskReadAloudInlineReticle>
      ),
      node,
    );
  };
  const renderTextSegments = (segments: readonly HelixAskFinalAnswerTextSegment[]) =>
    segments.map((segment, index) => (
      <React.Fragment key={segment.key}>
        {index > 0 ? " " : null}
        {renderSegmentWithReticle(segment.key, renderHelixAskInlineMarkdownText(segment.text, renderText))}
      </React.Fragment>
    ));
  const answerBody = (
    <div className="mt-2 space-y-1.5 whitespace-normal break-words [overflow-wrap:anywhere] leading-relaxed text-sm text-slate-100">
      {blocks.map((block) => {
        if (block.kind === "blank") {
          return <div key={block.key} className="h-2" aria-hidden="true" />;
        }
        if (block.kind === "code") {
          return renderHelixAskFinalAnswerCodeBlock(block);
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
                {renderTextSegments(block.segments)}
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
            {renderTextSegments(block.segments)}
          </div>
        ));
      })}
    </div>
  );
  return (
    <section className="space-y-2" data-testid="helix-ask-console-final-answer">
      {shouldWrapWholeAnswerForUnresolvedReadAloud && readAloudTraffic ? (
        <HelixAskReadAloudBlockReticle state={readAloudTraffic}>
          {answerBody}
        </HelixAskReadAloudBlockReticle>
      ) : answerBody}
      {meta ? (
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{meta}</p>
      ) : null}
    </section>
  );
}
