import { HelixAskPill } from "@/components/helix/HelixAskPill";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import type { PanelDefinition } from "@/lib/desktop/panelRegistry";

export function HelixAskDock({
  widthPx,
  collapsed,
  onOpenPanel,
  onOpenConversation,
}: {
  widthPx: number;
  collapsed: boolean;
  onOpenPanel: (panelId: PanelDefinition["id"]) => void;
  onOpenConversation: (sessionId: string) => void;
}) {
  const toggleChatDock = useWorkstationLayoutStore((state) => state.toggleChatDock);

  return (
    <aside
      className="relative z-20 h-full min-h-0 border-l border-white/10 bg-slate-950/80 backdrop-blur"
      style={{ width: widthPx }}
    >
      <div className="flex h-full min-h-0 flex-col px-2 py-2">
        <div className="mb-2 flex items-center justify-between">
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
