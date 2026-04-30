import { useCallback } from "react";
import { WorkstationStage } from "@/components/workstation/WorkstationStage";
import { HelixAskDock } from "@/components/workstation/HelixAskDock";
import { WorkstationResizeRail } from "@/components/workstation/WorkstationResizeRail";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import type { PanelDefinition } from "@/lib/desktop/panelRegistry";

const ESSENCE_CONSOLE_PANEL_ID = "agi-essence-console";

export function HelixWorkstationShell({
  onOpenPanel,
  layoutVariant = "desktop",
}: {
  onOpenPanel: (panelId: PanelDefinition["id"]) => void;
  layoutVariant?: "desktop" | "mobile";
}) {
  const chatDock = useWorkstationLayoutStore((state) => state.chatDock);
  const setChatDockWidth = useWorkstationLayoutStore((state) => state.setChatDockWidth);

  const handleOpenConversation = useCallback(
    (_sessionId: string) => {
      onOpenPanel(ESSENCE_CONSOLE_PANEL_ID);
    },
    [onOpenPanel],
  );

  const visibleWidth = chatDock.collapsed ? 56 : chatDock.widthPx;

  if (layoutVariant === "mobile") {
    return (
      <div
        className="relative z-10 grid h-full min-h-0 w-full"
        style={{
          gridTemplateRows: chatDock.collapsed
            ? "minmax(0, 1fr) 56px"
            : "minmax(0, 1fr) minmax(300px, 46dvh)",
        }}
      >
        <WorkstationStage layoutVariant="mobile" />
        <HelixAskDock
          widthPx="100%"
          collapsed={chatDock.collapsed}
          placement="bottom"
          onOpenPanel={onOpenPanel}
          onOpenConversation={handleOpenConversation}
        />
      </div>
    );
  }

  return (
    <div
      className="relative z-10 grid h-full min-h-0 w-full"
      style={{
        gridTemplateColumns: `minmax(0, 1fr) 0.375rem ${visibleWidth}px`,
      }}
    >
      <WorkstationStage />
      <WorkstationResizeRail
        onResize={(deltaX) => {
          if (chatDock.collapsed) return;
          setChatDockWidth(chatDock.widthPx + deltaX);
        }}
      />
      <HelixAskDock
        widthPx={visibleWidth}
        collapsed={chatDock.collapsed}
        onOpenPanel={onOpenPanel}
        onOpenConversation={handleOpenConversation}
      />
    </div>
  );
}
