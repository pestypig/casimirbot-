import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import { WorkstationSplitNode } from "@/components/workstation/WorkstationSplitNode";

export function WorkstationStage({
  layoutVariant = "desktop",
}: {
  layoutVariant?: "desktop" | "mobile";
}) {
  const root = useWorkstationLayoutStore((state) => state.root);
  const stagePadding =
    layoutVariant === "mobile" ? "p-2 pb-0" : "p-3 pb-14";

  return (
    <main className={`min-h-0 min-w-0 overflow-hidden ${stagePadding}`}>
      <WorkstationSplitNode node={root} />
    </main>
  );
}
