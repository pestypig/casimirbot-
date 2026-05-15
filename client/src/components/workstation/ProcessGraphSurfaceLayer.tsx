import * as React from "react";
import type { LumaMood } from "@/lib/luma-moods";
import { renderWorkstationProcessGraphSvg } from "@/lib/workstation/processGraph/renderProcessGraphSvg";
import { useWorkstationProcessGraphStore } from "@/store/useWorkstationProcessGraphStore";

export function ProcessGraphSurfaceLayer({
  mood,
  orientation,
  mode = "ambient",
}: {
  mood: LumaMood;
  orientation: "desktop" | "mobile";
  mode?: "ambient";
}) {
  const graph = useWorkstationProcessGraphStore((state) => state.graph);
  const svg = React.useMemo(
    () =>
      renderWorkstationProcessGraphSvg({
        graph,
        width: orientation === "mobile" ? 900 : 1600,
        height: orientation === "mobile" ? 1600 : 900,
        mood,
        density: mode,
        labels: "minimal",
        maxNodes: orientation === "mobile" ? 14 : 18,
        maxEdges: orientation === "mobile" ? 20 : 28,
      }),
    [graph.revision, graph, mode, mood, orientation],
  );

  return (
    <div
      className="process-graph-surface-layer"
      aria-hidden="true"
      data-motion="wander"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
