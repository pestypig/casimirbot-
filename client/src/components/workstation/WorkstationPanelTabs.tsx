import { useCallback, useMemo, useState } from "react";
import { panelRegistry } from "@/lib/desktop/panelRegistry";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";

export function WorkstationPanelTabs({ groupId }: { groupId: string }) {
  const group = useWorkstationLayoutStore((state) => state.groups[groupId]);
  const activeGroupId = useWorkstationLayoutStore((state) => state.activeGroupId);
  const setActivePanel = useWorkstationLayoutStore((state) => state.setActivePanel);
  const closePanelFromGroup = useWorkstationLayoutStore((state) => state.closePanelFromGroup);
  const splitActiveGroup = useWorkstationLayoutStore((state) => state.splitActiveGroup);
  const openPanelInGroup = useWorkstationLayoutStore((state) => state.openPanelInGroup);
  const focusGroup = useWorkstationLayoutStore((state) => state.focusGroup);
  const [pickerOpen, setPickerOpen] = useState(false);
  const openSettings = useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("open-helix-settings", {
        detail: { tab: "preferences" },
      }),
    );
    setPickerOpen(false);
  }, []);

  const availablePanels = useMemo(
    () =>
      panelRegistry
        .filter((panel) => !panel.startHidden)
        .sort((a, b) => {
          const aReady = a.workstationCapabilities?.v1_job_ready ? 1 : 0;
          const bReady = b.workstationCapabilities?.v1_job_ready ? 1 : 0;
          if (aReady !== bReady) return bReady - aReady;
          return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
        }),
    [],
  );

  if (!group) return null;

  return (
    <div
      className={`flex items-center gap-2 border-b px-2 py-2 ${
        activeGroupId === groupId ? "border-white/20 bg-slate-900/60" : "border-white/10 bg-slate-900/35"
      }`}
      onMouseDown={() => focusGroup(groupId)}
      onFocusCapture={() => focusGroup(groupId)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {group.panelIds.map((panelId) => {
            const panelDef = panelRegistry.find((panel) => panel.id === panelId);
            const isActive = panelId === group.activePanelId;
            return (
              <button
                key={panelId}
                type="button"
                onClick={() => setActivePanel(groupId, panelId)}
                className={`group inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs whitespace-nowrap ${
                  isActive
                    ? "border-sky-300/50 bg-sky-500/20 text-sky-100"
                    : "border-white/10 bg-black/20 text-slate-300 hover:bg-white/10"
                }`}
              >
                <span>{panelDef?.title ?? panelId}</span>
                <span
                  className="rounded px-1 text-[10px] text-slate-400 hover:bg-white/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    closePanelFromGroup(groupId, panelId);
                  }}
                >
                  x
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="rounded border border-white/15 bg-black/25 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
          onClick={() => setPickerOpen((current) => !current)}
          aria-expanded={pickerOpen}
          aria-label="Open panel picker"
        >
          +
        </button>
        {pickerOpen ? (
          <div className="absolute right-0 top-8 z-30 w-72 rounded-lg border border-white/20 bg-slate-950/95 p-2 shadow-xl">
            <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">Launch panel</div>
            <button
              type="button"
              onClick={openSettings}
              className="mb-2 block w-full rounded border border-sky-300/30 bg-sky-500/10 px-2 py-1 text-left text-xs text-sky-100 hover:bg-sky-500/20"
            >
              Helix Start Settings
            </button>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {availablePanels.map((panel) => (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() => {
                    openPanelInGroup(groupId, panel.id);
                    focusGroup(groupId);
                    setPickerOpen(false);
                  }}
                  className="block w-full rounded px-2 py-1 text-left text-xs text-slate-200 hover:bg-white/10"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>{panel.title}</span>
                    {panel.workstationCapabilities?.v1_job_ready ? (
                      <span className="rounded border border-emerald-300/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-emerald-200">
                        Job-ready
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          className="rounded border border-white/15 bg-black/25 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
          onClick={() => splitActiveGroup("row")}
          aria-label="Split right"
        >
          split
        </button>
      </div>
    </div>
  );
}
