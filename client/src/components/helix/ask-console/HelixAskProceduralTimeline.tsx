import { readProceduralStatusClass } from "@/lib/helix/ask-status-classnames";

export type HelixAskProceduralTimelineRow = {
  key: string;
  label: string;
  detail: string;
  status: string;
};

export type HelixAskProceduralTimelineProps = {
  rows: HelixAskProceduralTimelineRow[];
  truthMatchesVisible: boolean;
  route: string;
  toolLabel?: string | null;
  runtimeStopReason?: string | null;
};

export function HelixAskProceduralTimeline({
  rows,
  truthMatchesVisible,
  route,
  toolLabel,
  runtimeStopReason,
}: HelixAskProceduralTimelineProps) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-950/15 px-3 py-2 text-xs text-cyan-50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200">Procedural workspace timeline</p>
        <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/70">
          Truth: {truthMatchesVisible ? "backend terminal == visible answer" : "backend terminal != visible answer"}
        </p>
      </div>
      <p className="mt-1 text-[11px] text-cyan-100/80">
        Route: {route}
        {toolLabel ? ` | Tool: ${toolLabel}` : ""}
        {runtimeStopReason ? ` | Runtime: ${runtimeStopReason}` : ""}
      </p>
      <div className="mt-2 space-y-1.5">
        {rows.slice(0, 18).map((row, index) => (
          <div key={row.key} className={`rounded-lg border px-2 py-1.5 ${readProceduralStatusClass(row.status)}`}>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] tabular-nums">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{row.label}</p>
                <p className="mt-0.5 break-words text-[11px] opacity-80">
                  {row.detail} [{row.status}]
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
