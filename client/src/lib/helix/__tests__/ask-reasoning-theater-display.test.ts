import { describe, expect, it } from "vitest";

import {
  REASONING_THEATER_ARCHETYPE_LABEL,
  REASONING_THEATER_CERTAINTY_LABEL,
  REASONING_THEATER_MEDAL_ASSET,
  REASONING_THEATER_MEDAL_LABEL,
  REASONING_THEATER_PHASE_LABEL,
  REASONING_THEATER_STANCE_META,
  REASONING_THEATER_SUPPRESSION_LABEL,
  buildReasoningTheaterParticlesFromMirekArtifact,
  buildReasoningTheaterFrontierParticles,
  mirekCellGridClassName,
  mirekCellParticleClassName,
} from "@/lib/helix/ask-reasoning-theater-display";
import type { MirekReasoningArtifactV1 } from "@shared/helix-reasoning-mirek";

describe("ask reasoning theater display", () => {
  it("formats stance labels and meter classes", () => {
    expect(REASONING_THEATER_STANCE_META.winning).toEqual({
      badge: "text-emerald-200",
      bar: "bg-emerald-300/80",
      label: "Winning",
    });
    expect(REASONING_THEATER_STANCE_META.fail_closed).toEqual({
      badge: "text-rose-200",
      bar: "bg-rose-300/80",
      label: "Fail-closed",
    });
  });

  it("formats reasoning theater state labels", () => {
    expect(REASONING_THEATER_ARCHETYPE_LABEL.missing_evidence).toBe("missing evidence");
    expect(REASONING_THEATER_PHASE_LABEL.synthesize).toBe("synthesize");
    expect(REASONING_THEATER_CERTAINTY_LABEL.hypothesis).toBe("hypothesis");
    expect(REASONING_THEATER_SUPPRESSION_LABEL.agi_overload_admission_control).toBe(
      "agi overload admission control",
    );
  });

  it("formats medal labels and asset paths", () => {
    expect(REASONING_THEATER_MEDAL_LABEL.scout).toBe("Scout");
    expect(REASONING_THEATER_MEDAL_LABEL.crown).toBe("Crown");
    expect(REASONING_THEATER_MEDAL_ASSET.scout).toBe("/reasoning-theater/medals/scout.svg");
    expect(REASONING_THEATER_MEDAL_ASSET.crown).toBe("/reasoning-theater/medals/crown.svg");
  });

  it("formats Mirek cell visual classes", () => {
    expect(mirekCellParticleClassName("proof")).toContain("bg-violet-200/90");
    expect(mirekCellParticleClassName("blocked")).toContain("bg-rose-300/90");
    expect(mirekCellParticleClassName("empty")).toContain("bg-sky-200/65");
    expect(mirekCellGridClassName("proof")).toContain("bg-white");
    expect(mirekCellGridClassName("gap")).toContain("bg-amber-100/80");
    expect(mirekCellGridClassName("context")).toContain("bg-white/55");
  });

  it("builds deterministic frontier particle nodes", () => {
    expect(buildReasoningTheaterFrontierParticles(42, 3)).toEqual([
      {
        id: "frontier-particle-0",
        phaseOffsetMs: 586,
        baseRadiusPx: 3.6122241225093603,
      },
      {
        id: "frontier-particle-1",
        phaseOffsetMs: 153,
        baseRadiusPx: 3.5469013242051,
      },
      {
        id: "frontier-particle-2",
        phaseOffsetMs: 591,
        baseRadiusPx: 3.1482825789600613,
      },
    ]);
  });

  it("projects Mirek artifact cells into deterministic theater particles", () => {
    const artifact = {
      finalFrameHash: "frame-123",
      grid: {
        width: 4,
        height: 2,
        cells: [
          { id: "objective:1", x: 0, y: 0, kind: "objective", opacity: 1.4 },
          { id: "evidence:1", x: 3, y: 1, kind: "evidence", opacity: -0.2 },
          { id: "support:1", x: 1, y: 1, kind: "support", opacity: 0.5 },
        ],
      },
    } as MirekReasoningArtifactV1;

    expect(buildReasoningTheaterParticlesFromMirekArtifact(artifact)).toEqual([
      {
        id: "objective:1",
        leftPct: 12.5,
        topPct: 25,
        sizePx: 5,
        opacity: 1,
        delayS: 0.656,
        durationS: 2.7409999999999997,
        kind: "objective",
      },
      {
        id: "evidence:1",
        leftPct: 87.5,
        topPct: 75,
        sizePx: 3.9,
        opacity: 0,
        delayS: 0.716,
        durationS: 1.9209999999999998,
        kind: "evidence",
      },
      {
        id: "support:1",
        leftPct: 37.5,
        topPct: 75,
        sizePx: 3,
        opacity: 0.5,
        delayS: 0.408,
        durationS: 2.093,
        kind: "support",
      },
    ]);
  });
});
