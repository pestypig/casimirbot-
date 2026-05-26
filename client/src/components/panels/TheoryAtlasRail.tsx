import React from "react";

export type TheoryAtlasLensId = "starsim-stellar-evolution" | "cosmic-distance-ladder";

const placeholderColors = [
  "bg-cyan-500",
  "bg-violet-600",
  "bg-slate-500",
  "bg-orange-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-teal-600",
];

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
      <button
        type="button"
        aria-label="StarSim stellar evolution lens"
        title="StarSim stellar evolution"
        onClick={() => onSelectLens("starsim-stellar-evolution")}
        className={`flex h-6 w-6 items-center justify-center border-2 text-[11px] font-black text-white shadow ${
          activeLensId === "starsim-stellar-evolution"
            ? "border-cyan-100 bg-fuchsia-600 ring-2 ring-cyan-300"
            : "border-zinc-800 bg-fuchsia-700 hover:border-cyan-200"
        }`}
      >
        *
      </button>
      <button
        type="button"
        aria-label="Cosmic distance ladder lens"
        title="Cosmic distance ladder"
        onClick={() => onSelectLens("cosmic-distance-ladder")}
        className={`flex h-6 w-6 items-center justify-center border-2 text-[11px] font-black text-white shadow ${
          activeLensId === "cosmic-distance-ladder"
            ? "border-cyan-100 bg-amber-500 ring-2 ring-cyan-300"
            : "border-zinc-800 bg-amber-600 hover:border-cyan-200"
        }`}
      >
        z
      </button>
      {placeholderColors.map((color, index) => (
        <div
          key={`${color}-${index}`}
          aria-hidden="true"
          className={`h-6 w-6 border-2 border-zinc-800 ${color} opacity-55`}
          title="Future atlas lens"
        />
      ))}
    </div>
  );
}
