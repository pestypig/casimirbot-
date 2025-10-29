import React, { useMemo } from "react";
import type { FractionalCoherenceState } from "@/hooks/useFractionalCoherence";
import useFractionalCoherence from "@/hooks/useFractionalCoherence";

export interface FractionalCoherenceRailProps {
  state: FractionalCoherenceState;
  compact?: boolean;
  className?: string;
}

export interface FractionalCoherenceRailLiveProps
  extends Omit<FractionalCoherenceRailProps, "state"> {}

const tanhScale = (value: number, scale = 1) => {
  if (!Number.isFinite(value)) return 0;
  return Math.tanh(value / Math.max(1, scale));
};

export const FractionalCoherenceRail: React.FC<FractionalCoherenceRailProps> = ({
  state,
  compact,
  className,
}) => {
  const cp = state.EMA.CP ?? state.CP ?? 0;
  const ifc = state.EMA.IFC ?? state.IFC ?? 0;
  const ss = state.EMA.SS ?? state.SS ?? 0;

  const status = useMemo(() => {
    if (!Number.isFinite(cp) || cp <= 0) return "IDLE";
    if (cp > 1_000) return "GOOD";
    if (cp > 200) return "FAIR";
    return "WARN";
  }, [cp]);

  const layoutClass = compact
    ? "grid-cols-3"
    : "grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]";

  return (
    <div
      className={`grid ${layoutClass} gap-2 items-center text-xs text-muted-foreground ${className ?? ""}`}
    >
      <span className="font-medium text-foreground">Coherence</span>
      <meter
        min={0}
        max={1}
        value={tanhScale(cp, 500)}
        title={`Coherence Power: ${cp.toFixed(1)}`}
        className="h-1.5"
      />
      <span title="Integer/Fractional Contrast (lower is better)">IFC</span>
      <meter
        min={0}
        max={1}
        value={tanhScale(ifc > 0 ? 1 / (1 + ifc) : 0)}
        title={`Integer/Fractional Contrast: ${ifc.toFixed(3)}`}
        className="h-1.5"
      />
      <span title="Sideband Symmetry (~1 is best)">SS</span>
      <meter
        min={0}
        max={1}
        value={Math.max(0, Math.min(1, ss))}
        title={`Sideband Symmetry: ${ss.toFixed(3)}`}
        className="h-1.5"
      />
      <div className="col-span-full text-[11px] opacity-80">
        {status} · CP {cp.toFixed(1)} · IFC {ifc.toFixed(3)} · SS {ss.toFixed(3)}
      </div>
    </div>
  );
};

export const FractionalCoherenceRailLive: React.FC<FractionalCoherenceRailLiveProps> = (
  props,
) => {
  const state = useFractionalCoherence();
  return <FractionalCoherenceRail {...props} state={state} />;
};

export default FractionalCoherenceRailLive;
