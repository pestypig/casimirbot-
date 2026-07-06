import React from "react";
import type {
  CosmicDistanceLadderRung,
  CosmicDistanceLadderRungId,
} from "@shared/theory/cosmic-distance-ladder-map";
import type { TheoryBadgeGraphV1 } from "@shared/contracts/theory-badge-graph.v1";

function bandLabel(band: CosmicDistanceLadderRung["band"]) {
  return band.replace(/_/g, " ");
}

function bandClass(band: CosmicDistanceLadderRung["band"], selected: boolean) {
  const ring = selected ? " ring-2 ring-cyan-200" : "";
  switch (band) {
    case "local":
      return `border-emerald-300 bg-emerald-950/70 text-emerald-50${ring}`;
    case "spectrum":
      return `border-cyan-300 bg-cyan-950/70 text-cyan-50${ring}`;
    case "standard_candle":
      return `border-amber-300 bg-amber-950/70 text-amber-50${ring}`;
    case "cosmology":
      return `border-violet-300 bg-violet-950/70 text-violet-50${ring}`;
    default:
      return `border-slate-300 bg-slate-900/75 text-slate-50${ring}`;
  }
}

function uniqueBands(rungs: CosmicDistanceLadderRung[]) {
  return rungs.reduce<CosmicDistanceLadderRung["band"][]>((acc, rung) => {
    if (!acc.includes(rung.band)) acc.push(rung.band);
    return acc;
  }, []);
}

export default function CosmicDistanceLadderLens({
  graph,
  rungs,
  selectedRungId,
  selectedObjectBindingId,
  translateText,
  onSelectRung,
  onSelectObjectBinding,
  onClearObjectBinding,
  onLoadPayload,
}: {
  graph: TheoryBadgeGraphV1;
  rungs: CosmicDistanceLadderRung[];
  selectedRungId: CosmicDistanceLadderRungId | null;
  selectedObjectBindingId: string | null;
  translateText?: (text: string) => string;
  onSelectRung: (rung: CosmicDistanceLadderRung) => void;
  onSelectObjectBinding: (rung: CosmicDistanceLadderRung, bindingId: string) => void;
  onClearObjectBinding: () => void;
  onLoadPayload: (badgeId: string, payloadId: string) => void;
}) {
  const tx = translateText ?? ((text: string) => text);
  const selectedRung = rungs.find((rung) => rung.id === selectedRungId) ?? null;
  const selectedBinding = selectedRung?.objectBindings.find((binding) => binding.id === selectedObjectBindingId) ?? null;
  const badgesById = new Map(graph.badges.map((badge) => [badge.id, badge]));
  const bands = uniqueBands(rungs);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-950 bg-zinc-950/95 text-zinc-100">
      <div className="border-b border-zinc-800 px-3 py-2">
        <div className="text-xs font-bold uppercase tracking-wide text-cyan-200">Cosmic</div>
        <div className="text-sm font-semibold">Distance Ladder</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {bands.map((band) => (
          <section key={band} className="mb-3">
            <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              {bandLabel(band)}
            </div>
            <div className="space-y-1">
              {rungs
                .filter((rung) => rung.band === band)
                .map((rung) => {
                  const selected = selectedRungId === rung.id;
                  return (
                    <button
                      key={rung.id}
                      type="button"
                      aria-label={`Select ${tx(rung.title)}`}
                      onClick={() => onSelectRung(rung)}
                      className={`w-full border px-2 py-1.5 text-left text-xs shadow ${bandClass(
                        rung.band,
                        selected,
                      )}`}
                    >
                      <span className="block font-semibold">{tx(rung.title)}</span>
                      <span className="mt-0.5 block text-[10px] opacity-75">{tx(rung.description)}</span>
                    </button>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
      <div className="border-t border-zinc-800 p-2">
        {selectedRung ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-100">{tx(selectedRung.title)}</div>
            <div className="text-[11px] text-zinc-400">
              {selectedRung.theoryBadgeIds.length} mapped badges / {selectedRung.calculatorPayloadRefs.length} scalar loadouts
            </div>
            {selectedRung.objectBindings.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Object Binding</div>
                  {selectedBinding ? (
                    <button
                      type="button"
                      onClick={onClearObjectBinding}
                      className="border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:border-zinc-400"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                {selectedRung.objectBindings.map((binding) => {
                  const selected = selectedObjectBindingId === binding.id;
                  return (
                    <button
                      key={binding.id}
                      type="button"
                      aria-label={`Use ${tx(binding.label)} object binding`}
                      onClick={() => onSelectObjectBinding(selectedRung, binding.id)}
                      className={`w-full border px-2 py-1.5 text-left text-[11px] ${
                        selected
                          ? "border-cyan-300 bg-cyan-950 text-cyan-50"
                          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-cyan-700"
                      }`}
                    >
                      <span className="block font-semibold">{tx(binding.label)}</span>
                      <span className="mt-0.5 block text-[10px] opacity-75">{tx(binding.description)}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div className="space-y-1">
              {selectedRung.calculatorPayloadRefs.slice(0, 4).map((ref) => {
                const badge = badgesById.get(ref.badgeId);
                const payload = badge?.calculatorPayloads.find((candidate) => candidate.id === ref.payloadId);
                if (!badge || !payload) return null;
                return (
                  <button
                    key={`${ref.badgeId}-${ref.payloadId}`}
                    type="button"
                    onClick={() => onLoadPayload(ref.badgeId, ref.payloadId)}
                    className="w-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-left font-mono text-[10px] text-cyan-100 hover:border-cyan-300"
                  >
                    {payload.expression}
                  </button>
                );
              })}
            </div>
            {selectedRung.calculatorPayloadRefs.length === 0 ? (
              <div className="border border-zinc-800 bg-zinc-900 px-2 py-2 text-[11px] text-zinc-500">
                {tx("Runtime/reference rung. No scalar calculator payload.")}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-[11px] text-zinc-500">{tx("Pick a ladder rung to light the matching theory badges.")}</div>
        )}
      </div>
    </aside>
  );
}
