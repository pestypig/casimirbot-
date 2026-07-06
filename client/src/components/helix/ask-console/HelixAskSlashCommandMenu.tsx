import React from "react";
import { Search } from "lucide-react";

import type { HelixAskSlashCommandMenuItem } from "./HelixAskSlashCommandCatalog";
import type { HelixAskSlashCommandMenuState } from "./HelixAskSlashCommandMenuState";

export type HelixAskSlashCommandMenuProps = {
  state: HelixAskSlashCommandMenuState;
  onSelect: (item: HelixAskSlashCommandMenuItem) => void;
  onHoverIndex?: (index: number) => void;
};

export function HelixAskSlashCommandMenu({
  state,
  onSelect,
  onHoverIndex,
}: HelixAskSlashCommandMenuProps) {
  if (!state.open) return null;
  return (
    <div
      className="pointer-events-auto absolute left-0 right-0 top-full z-[120] mt-2 max-h-72 overflow-hidden rounded-lg border border-white/12 bg-slate-950 shadow-2xl shadow-black/60 ring-1 ring-cyan-300/20"
      data-testid="helix-ask-slash-command-menu"
      role="listbox"
      aria-label="Ask slash commands"
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs text-slate-400">
        <Search className="h-3.5 w-3.5 text-cyan-200/80" />
        <span className="truncate">
          {state.query ? `Commands matching /${state.query}` : "Choose a tool prompt scaffold"}
        </span>
      </div>
      <div className="max-h-60 overflow-y-auto py-1">
        {state.items.length > 0 ? (
          state.items.map((item, index) => {
            const selected = index === state.selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={selected}
                data-testid={`helix-ask-slash-command-${item.id}`}
                className={[
                  "flex w-full min-w-0 items-start gap-3 px-3 py-2 text-left transition",
                  selected ? "bg-cyan-400/14 text-cyan-50" : "text-slate-200 hover:bg-white/7",
                ].join(" ")}
                onMouseEnter={() => onHoverIndex?.(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect(item);
                }}
              >
                <span className="mt-0.5 shrink-0 rounded border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 font-mono text-xs text-cyan-100">
                  {item.command}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium">{item.label}</span>
                    {item.runtimeLabel ? (
                      <span className="truncate text-[10px] uppercase tracking-[0.14em] text-slate-500">
                        {item.runtimeLabel}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-400">
                    {item.description}
                  </span>
                  <span className="mt-1 block truncate font-mono text-[10px] text-slate-500">
                    {item.capabilityId}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-4 text-sm text-slate-400" data-testid="helix-ask-slash-command-empty">
            No matching commands for this account.
          </div>
        )}
      </div>
    </div>
  );
}
