import type { ReactNode } from "react";
import { parseHelixAskFinalAnswerBulletLine } from "@/lib/helix/ask-answer-rendering";

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

export function HelixAskFinalAnswer({ text, meta, renderContent }: HelixAskFinalAnswerProps) {
  const blocks = buildHelixAskFinalAnswerBlocks(text);
  const renderText = renderContent ?? ((value: string) => value);
  return (
    <section className="space-y-2" data-testid="helix-ask-console-final-answer">
      <div className="mt-2 space-y-1.5 break-words leading-relaxed text-sm text-slate-100">
        {blocks.map((block) => {
          if (block.kind === "blank") {
            return <div key={block.key} className="h-2" aria-hidden="true" />;
          }
          if (block.kind === "bullet") {
            return (
              <div key={block.key} className="flex gap-2 pl-2">
                <span className="mt-[0.15rem] text-cyan-300/80" aria-hidden="true">
                  -
                </span>
                <span className="min-w-0 flex-1">{renderText(block.text)}</span>
              </div>
            );
          }
          return (
            <div
              key={block.key}
              className={block.isSectionHeader ? "pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100" : ""}
            >
              {renderText(block.text)}
            </div>
          );
        })}
      </div>
      {meta ? (
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{meta}</p>
      ) : null}
    </section>
  );
}
