import { Link2 } from "lucide-react";
import type { SituationGraphNode, SituationRoomGraph } from "@shared/helix-situation-graph";

export function SituationGraphInspector({
  graph,
  node,
  onAttach,
}: {
  graph: SituationRoomGraph;
  node?: SituationGraphNode;
  onAttach: () => void;
}) {
  const configEntries = Object.entries(node?.config ?? {}).slice(0, 8);
  return (
    <aside className="min-h-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Inspector</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{node?.title ?? graph.title}</p>
        </div>
        <button
          type="button"
          onClick={onAttach}
          className="inline-flex shrink-0 items-center gap-1 rounded border border-cyan-400/35 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100 hover:bg-cyan-500/20"
        >
          <Link2 className="h-3.5 w-3.5" />
          Attach
        </button>
      </div>
      <div className="mt-3 space-y-2 text-[11px] text-slate-300">
        <p>
          <span className="text-slate-500">Graph:</span> {graph.graph_id}
        </p>
        <p>
          <span className="text-slate-500">Room:</span> {graph.room_id}
        </p>
        {node ? (
          <>
            <p>
              <span className="text-slate-500">Node:</span> {node.node_id}
            </p>
            <p>
              <span className="text-slate-500">Type:</span> {node.type}
            </p>
            <p>
              <span className="text-slate-500">Column:</span> {node.column}
            </p>
          </>
        ) : null}
      </div>
      {configEntries.length > 0 ? (
        <div className="mt-3 rounded border border-white/10 bg-slate-950/70 p-2">
          <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">Config</p>
          <div className="space-y-1">
            {configEntries.map(([key, value]) => (
              <p key={key} className="break-all text-[10px] text-slate-400">
                <span className="text-slate-200">{key}</span>: {JSON.stringify(value)}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-3 rounded border border-white/10 bg-slate-950/70 p-2 text-[10px] text-slate-500">
        Context attachment is manual only. Graph inspection does not grant speaker or command authority.
      </div>
    </aside>
  );
}
