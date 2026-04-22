import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import { WorkstationSplitNode } from "@/components/workstation/WorkstationSplitNode";

export function WorkstationStage() {
  const root = useWorkstationLayoutStore((state) => state.root);

  return (
    <main className="min-h-0 min-w-0 overflow-hidden p-3 pb-14">
      <WorkstationSplitNode node={root} />
    </main>
  );
}
