import type { ReactNode } from "react";
import type { ContextCapsuleSummary } from "@shared/helix-context-capsule";

import { HelixAskReplyContextCapsuleCard } from "./HelixAskContextCapsulePreview";
import { HelixAskReplyStatusFooter } from "./HelixAskFinalExtras";

export type HelixAskReplyCardProps = {
  turnTestId?: string;
  isLatestReply: boolean;
  tintClassName: string;
  contextCapsule?: ContextCapsuleSummary | null;
  promptIngested?: boolean;
  children: ReactNode;
};

export function HelixAskReplyCard({
  turnTestId,
  isLatestReply,
  tintClassName,
  contextCapsule,
  promptIngested,
  children,
}: HelixAskReplyCardProps) {
  return (
    <div
      className={`relative px-1 py-1 text-sm text-slate-100 ${isLatestReply ? "helix-ask-turn-enter" : ""}`}
      data-testid={turnTestId}
    >
      <div
        className={`pointer-events-none absolute inset-0 opacity-0 ${tintClassName}`}
        aria-hidden
      />
      <div className="relative">
        <HelixAskReplyContextCapsuleCard capsule={contextCapsule} />
        <div className="space-y-3">{children}</div>
        <HelixAskReplyStatusFooter visible={isLatestReply} promptIngested={promptIngested} />
      </div>
    </div>
  );
}
