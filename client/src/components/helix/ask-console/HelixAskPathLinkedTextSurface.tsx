import type { ReactNode } from "react";

import { splitHelixAskTextPathSegments } from "@/lib/helix/ask-answer-rendering";

export type HelixAskPathLinkedTextSurfaceProps = {
  text: string;
  keyPrefix: string;
  resolvePanelId: (pathText: string) => string | null;
  onOpenPanel: (panelId: string) => void;
};

export function HelixAskPathLinkedTextSurface({
  text,
  keyPrefix,
  resolvePanelId,
  onOpenPanel,
}: HelixAskPathLinkedTextSurfaceProps) {
  const parts: ReactNode[] = [];
  for (const segment of splitHelixAskTextPathSegments(text)) {
    if (segment.kind === "text") {
      parts.push(segment.text);
      continue;
    }
    const panelId = resolvePanelId(segment.text);
    if (!panelId) {
      parts.push(segment.text);
      continue;
    }
    parts.push(
      <button
        key={`${keyPrefix}-${segment.text}-${segment.start}`}
        className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
        onClick={() => onOpenPanel(panelId)}
        type="button"
      >
        {segment.text}
      </button>,
    );
  }
  return <>{parts.length ? parts : text}</>;
}
