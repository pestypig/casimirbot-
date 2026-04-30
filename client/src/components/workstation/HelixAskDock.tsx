import { HelixAskPill } from "@/components/helix/HelixAskPill";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import type { PanelDefinition } from "@/lib/desktop/panelRegistry";

export function HelixAskDock({
  widthPx,
  collapsed,
  placement = "side",
  onOpenPanel,
  onOpenConversation,
}: {
  widthPx: number | string;
  collapsed: boolean;
  placement?: "side" | "bottom";
  onOpenPanel: (panelId: PanelDefinition["id"]) => void;
  onOpenConversation: (sessionId: string) => void;
}) {
  const toggleChatDock = useWorkstationLayoutStore((state) => state.toggleChatDock);
  const isBottomPlacement = placement === "bottom";

  return (
    <aside
      className={`relative z-20 min-h-0 bg-slate-950/80 backdrop-blur ${
        isBottomPlacement
          ? "h-full w-full border-t border-white/10"
          : "h-full border-l border-white/10"
      }`}
      style={{ width: widthPx }}
    >
      <div
        className={`flex h-full min-h-0 flex-col px-2 ${
          isBottomPlacement ? "pb-2 pt-1" : "py-2"
        }`}
      >
        <div className={`${isBottomPlacement ? "mb-1" : "mb-2"} flex items-center justify-between`}>
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Helix Ask</span>
          <button
            type="button"
            onClick={toggleChatDock}
            className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300 hover:bg-white/10"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
        {!collapsed ? (
          <HelixAskPill
            className="flex h-full min-h-0 w-full flex-col"
            contextId={HELIX_ASK_CONTEXT_ID.desktop}
            maxWidthClassName="max-w-none"
            layoutVariant="dock"
            onOpenPanel={onOpenPanel}
            onOpenConversation={onOpenConversation}
            placeholder="Ask Helix about this workspace"
          />
        ) : null}
      </div>
    </aside>
  );
}
