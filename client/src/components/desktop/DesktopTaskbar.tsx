import React from "react";
import * as Lucide from "lucide-react";
import { TaskbarShelf } from "@/components/desktop/TaskbarPanel";
import { useDesktopStore } from "@/store/useDesktopStore";
import { HELIX_PANELS, type HelixPanelRef } from "@/pages/helix-core.panels";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";

export function DesktopTaskbar() {
  const { open } = useDesktopStore();
  const handleOpenTaskbarPanel = React.useCallback(() => open("taskbar"), [open]);

  return (
    <div className="fixed bottom-0 left-0 right-0 flex h-12 items-center gap-3 border-t border-slate-800/70 bg-slate-950/85 px-3 text-slate-100 backdrop-blur-md">
      <HelixStartLauncher />
      <div className="flex-1 overflow-hidden">
        <TaskbarShelf variant="fixed" onOpenFloatingTaskbar={handleOpenTaskbarPanel} />
      </div>
    </div>
  );
}

function HelixStartLauncher() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { windows, open, focus, restore } = useDesktopStore();

  const helixPanels = React.useMemo(
    () =>
      [...HELIX_PANELS].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      ),
    []
  );

  const keywordFilter = React.useCallback((value: string, search: string) => {
    if (!search.trim()) return 1;
    const normalizedValue = value.toLowerCase();
    const tokens = search
      .toLowerCase()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
    if (!tokens.length) return 1;
    return tokens.every((token) => normalizedValue.includes(token)) ? 1 : 0;
  }, []);

  const handleLaunch = React.useCallback(
    (panelId: string) => {
      const win = windows[panelId];
      if (!win || !win.isOpen) {
        open(panelId);
        focus(panelId);
      } else if (win.isMinimized) {
        restore(panelId);
        focus(panelId);
      } else {
        focus(panelId);
      }
      setMenuOpen(false);
    },
    [focus, open, restore, windows]
  );

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-2 rounded-full border-cyan-400/50 bg-slate-900/70 px-4 text-[13px] font-semibold uppercase tracking-wide text-cyan-100 shadow-[0_0_15px_rgba(14,165,233,0.25)] transition-colors hover:bg-slate-900/90"
          aria-label="Open Helix Core start menu"
        >
          <Lucide.Rocket className="h-4 w-4 text-cyan-300" />
          Start
          <Lucide.ChevronUp className="h-3.5 w-3.5 text-cyan-200" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        className="w-80 border border-slate-800/80 bg-slate-950/95 p-0 text-slate-100 shadow-2xl"
      >
        <div className="border-b border-slate-800/70 px-4 py-3">
          <p className="text-sm font-semibold tracking-wide text-cyan-100">Helix Start</p>
          <p className="text-xs text-slate-400">Launch Helix Core panels onto the desktop.</p>
        </div>
        <Command className="bg-transparent" filter={keywordFilter}>
          <CommandInput placeholder="Search panels..." />
          <CommandList className="max-h-[360px]">
            <CommandEmpty>No Helix panels match that search.</CommandEmpty>
            <CommandGroup heading="Helix Core Panels">
              {helixPanels.map((panel) => {
                const Icon = panel.icon ?? Lucide.AppWindow;
                const win = windows[panel.id];
                const isRunning = Boolean(win?.isOpen);
                const statusLabel = !isRunning
                  ? null
                  : win?.isMinimized
                    ? "Minimized"
                    : "Running";
                const searchValue = buildPanelSearchValue(panel);
                return (
                  <CommandItem
                    key={panel.id}
                    value={searchValue}
                    onSelect={() => handleLaunch(panel.id)}
                    className="items-start gap-3 py-2"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-800/70 bg-slate-900/80">
                      <Icon className="h-4 w-4 text-cyan-300" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{panel.title}</span>
                      <span className="text-[11px] uppercase tracking-wide text-slate-500">
                        {panel.id}
                      </span>
                    </div>
                    {statusLabel && (
                      <span
                        className={`ml-auto text-[11px] uppercase tracking-wide ${
                          statusLabel === "Minimized" ? "text-amber-300" : "text-cyan-300"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function buildPanelSearchValue(panel: HelixPanelRef) {
  const sections = [
    panel.title,
    panel.id,
    panel.keywords?.join(" ") ?? "",
    panel.endpoints?.join(" ") ?? ""
  ];
  return sections
    .map((section) => section.trim())
    .filter((section) => section.length > 0)
    .join(" ");
}
