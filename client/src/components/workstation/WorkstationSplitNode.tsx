import type { WorkstationLayoutNode } from "@/store/useWorkstationLayoutStore";
import { WorkstationPanelGroupBox } from "@/components/workstation/WorkstationPanelGroupBox";

export function WorkstationSplitNode({ node }: { node: WorkstationLayoutNode }) {
  if (node.type === "group") {
    return <WorkstationPanelGroupBox groupId={node.groupId} />;
  }

  const [left, right] = node.children;
  const ratio = Number.isFinite(node.ratio) ? Math.max(0.2, Math.min(0.8, node.ratio)) : 0.5;
  const isRow = node.direction === "row";

  return (
    <div
      className="grid h-full min-h-0 min-w-0 gap-3"
      style={
        isRow
          ? { gridTemplateColumns: `minmax(0, ${ratio}fr) minmax(0, ${1 - ratio}fr)` }
          : { gridTemplateRows: `minmax(0, ${ratio}fr) minmax(0, ${1 - ratio}fr)` }
      }
    >
      <div className="min-h-0 min-w-0 overflow-hidden">
        <WorkstationSplitNode node={left} />
      </div>
      <div className="min-h-0 min-w-0 overflow-hidden">
        <WorkstationSplitNode node={right} />
      </div>
    </div>
  );
}
