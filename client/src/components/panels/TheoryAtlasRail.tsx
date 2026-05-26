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
}: {
  activeLensId: TheoryAtlasLensId | null;
  onSelectLens: (lensId: TheoryAtlasLensId) => void;
}) {
  return (
    <div
      aria-label="Theory atlas lenses"
      className="flex w-9 shrink-0 flex-col items-center gap-2 border-r border-zinc-950 bg-zinc-950 px-1.5 py-2"
    >
      {PHYSICS_ATLAS_BLOCKS.map((block: PhysicsAtlasBlockV1) => {
        const active = activeLensId === block.id;
        const planned = block.status === "planned";
        const seed = block.status === "seed";
        return (
          <button
            key={block.id}
            type="button"
            aria-label={`${block.title} atlas lens`}
            title={`${block.title}${planned ? " (planned)" : ""}`}
            onClick={() => onSelectLens(block.id)}
            className={`flex h-6 w-6 items-center justify-center border-2 text-[11px] font-black text-white shadow ${
              active
                ? "border-cyan-100 ring-2 ring-cyan-300"
                : "border-zinc-800 hover:border-cyan-200"
            } ${blockColors[block.id]} ${planned && !active ? "opacity-50 grayscale" : ""} ${seed && !active ? "opacity-80" : ""}`}
          >
            {block.glyph}
          </button>
        );
      })}
    </div>
  );
}
