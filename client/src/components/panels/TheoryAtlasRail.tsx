import React from "react";
import type { PhysicsAtlasBlockId, PhysicsAtlasBlockV1 } from "@shared/contracts/physics-atlas.v1";
import { PHYSICS_ATLAS_BLOCKS } from "@shared/theory/physics-atlas-blocks";

export type TheoryAtlasLensId = PhysicsAtlasBlockId;

const blockColors: Record<PhysicsAtlasBlockId, string> = {
  stellar_evolution: "bg-fuchsia-700",
  cosmic_distance_ladder: "bg-amber-600",
  solar_surface_spectrum: "bg-yellow-500",
  casimir_cavity_modes: "bg-cyan-500",
  warp_gr_nhm2: "bg-violet-600",
  qei_stress_energy: "bg-slate-500",
  tokamak_plasma: "bg-orange-500",
  galactic_dynamics: "bg-sky-500",
  curvature_collapse: "bg-emerald-600",
};

export default function TheoryAtlasRail({
  activeLensId,
  onSelectLens,
  onLoadExamples,
}: {
  activeLensId: TheoryAtlasLensId | null;
  onSelectLens: (lensId: TheoryAtlasLensId) => void;
  onLoadExamples: (lensId: TheoryAtlasLensId) => void;
}) {
  return (
    <div
      aria-label="Theory atlas lenses"
      className="flex w-24 shrink-0 flex-col gap-1.5 border-r border-zinc-950 bg-zinc-950 px-1.5 py-2"
    >
      {PHYSICS_ATLAS_BLOCKS.map((block: PhysicsAtlasBlockV1) => {
        const active = activeLensId === block.id;
        const planned = block.status === "planned";
        const seed = block.status === "seed";
        return (
          <div key={block.id} className="group relative">
            <button
              type="button"
              aria-label={`${block.title} atlas lens`}
              title={`${block.title}${planned ? " (planned)" : ""}`}
              onClick={() => onSelectLens(block.id)}
              onDoubleClick={() => onLoadExamples(block.id)}
              className={`grid h-7 w-full grid-cols-[24px_1fr] items-center gap-1 border-2 pr-1 text-left shadow transition ${
                active
                  ? "border-cyan-100 bg-zinc-100 text-zinc-950 ring-2 ring-cyan-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-cyan-200"
              } ${planned && !active ? "opacity-50 grayscale" : ""} ${seed && !active ? "opacity-80" : ""}`}
            >
              <span className={`flex h-full items-center justify-center text-[11px] font-black text-white ${blockColors[block.id]}`}>
                {block.glyph}
              </span>
              <span className="truncate text-[10px] font-bold leading-none">{block.shortTitle}</span>
            </button>
            {active ? (
              <button
                type="button"
                className="mt-1 h-5 w-full border border-cyan-900 bg-cyan-950/70 px-1 text-[9px] font-semibold uppercase text-cyan-100 hover:bg-cyan-900"
                onClick={() => onLoadExamples(block.id)}
              >
                Load Examples
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
