import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { openDocPanel } from "@/lib/docs/openDocPanel";

const LRL_DOCS_HREF =
  "/docs/alcubierre-alignment.md#maupertuis-duality-and-the-laplace-runge-lenz-invariant";

type LRLDocsTooltipProps = {
  className?: string;
};

/**
 * Tiny reusable "?" affordance that links directly to the Maupertuis /
 * Laplace–Runge–Lenz section of the Alcubierre alignment notes.
 */
export function LRLDocsTooltip({ className }: LRLDocsTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => openDocPanel(LRL_DOCS_HREF)}
          aria-label="Open LRL alignment notes"
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-600/80 text-[11px] font-semibold text-slate-300 transition-colors hover:border-cyan-400 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70",
            className,
          )}
        >
          ?
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed text-slate-200">
        <p className="font-semibold text-cyan-200">LRL invariant briefing</p>
        <p>
          Opens the Maupertuis / Laplace–Runge–Lenz alignment note so the warning lights clarify
          which least-action dial the pipeline is protecting.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export default LRLDocsTooltip;
