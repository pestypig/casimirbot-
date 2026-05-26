import React from "react";
import type {
  StarSimStellarEvolutionStage,
  StarSimStellarEvolutionStageId,
} from "@shared/theory/starsim-stellar-evolution-map";
import type { TheoryBadgeGraphV1 } from "@shared/contracts/theory-badge-graph.v1";

function phaseLabel(phase: StarSimStellarEvolutionStage["phase"]) {
  return phase.replace(/_/g, " ");
}

function stageColorClass(color: StarSimStellarEvolutionStage["colorClass"], selected: boolean) {
  const selectedRing = selected ? " ring-2 ring-cyan-200" : "";
  switch (color) {
    case "cyan":
      return `border-cyan-300 bg-cyan-900/55 text-cyan-50${selectedRing}`;
    case "amber":
      return `border-amber-300 bg-amber-900/55 text-amber-50${selectedRing}`;
    case "rose":
      return `border-rose-300 bg-rose-900/55 text-rose-50${selectedRing}`;
    case "violet":
      return `border-violet-300 bg-violet-900/55 text-violet-50${selectedRing}`;
    case "emerald":
      return `border-emerald-300 bg-emerald-900/55 text-emerald-50${selectedRing}`;
    default:
      return `border-slate-300 bg-slate-900/65 text-slate-50${selectedRing}`;
  }
}

function uniquePhases(stages: StarSimStellarEvolutionStage[]) {
  return stages.reduce<StarSimStellarEvolutionStage["phase"][]>((acc, stage) => {
    if (!acc.includes(stage.phase)) acc.push(stage.phase);
    return acc;
  }, []);
}

export default function StellarEvolutionLens({
  graph,
  stages,
  selectedStageId,
  onSelectStage,
  onLoadPayload,
}: {
  graph: TheoryBadgeGraphV1;
  stages: StarSimStellarEvolutionStage[];
  selectedStageId: StarSimStellarEvolutionStageId | null;
  onSelectStage: (stage: StarSimStellarEvolutionStage) => void;
  onLoadPayload: (badgeId: string, payloadId: string) => void;
}) {
  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? null;
  const badgesById = new Map(graph.badges.map((badge) => [badge.id, badge]));
  const phases = uniquePhases(stages);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-950 bg-zinc-950/95 text-zinc-100">
      <div className="border-b border-zinc-800 px-3 py-2">
        <div className="text-xs font-bold uppercase tracking-wide text-cyan-200">StarSim</div>
        <div className="text-sm font-semibold">Stellar Evolution</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {phases.map((phase) => (
          <section key={phase} className="mb-3">
            <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              {phaseLabel(phase)}
            </div>
            <div className="space-y-1">
              {stages
                .filter((stage) => stage.phase === phase)
                .map((stage) => {
                  const selected = selectedStageId === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      aria-label={`Select ${stage.title}`}
                      onClick={() => onSelectStage(stage)}
                      className={`w-full border px-2 py-1.5 text-left text-xs shadow ${stageColorClass(
                        stage.colorClass,
                        selected,
                      )}`}
                    >
                      <span className="block font-semibold">{stage.title}</span>
                      <span className="mt-0.5 block text-[10px] opacity-75">{stage.objectClass}</span>
                    </button>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
      <div className="border-t border-zinc-800 p-2">
        {selectedStage ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-100">{selectedStage.title}</div>
            <div className="text-[11px] text-zinc-400">
              {selectedStage.theoryBadgeIds.length} mapped badges / {selectedStage.calculatorPayloadRefs.length} scalar loadouts
            </div>
            <div className="space-y-1">
              {selectedStage.calculatorPayloadRefs.slice(0, 4).map((ref) => {
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
            {selectedStage.calculatorPayloadRefs.length === 0 ? (
              <div className="border border-zinc-800 bg-zinc-900 px-2 py-2 text-[11px] text-zinc-500">
                Runtime/reference stage. No scalar calculator payload.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-[11px] text-zinc-500">Pick a lifecycle stage to light the matching theory badges.</div>
        )}
      </div>
    </aside>
  );
}
