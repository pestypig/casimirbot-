import { describe, expect, it } from "vitest";

import {
  REASONING_THEATER_ARCHETYPE_LABEL,
  REASONING_THEATER_CERTAINTY_LABEL,
  REASONING_THEATER_MEDAL_ASSET,
  REASONING_THEATER_MEDAL_LABEL,
  REASONING_THEATER_PHASE_LABEL,
  REASONING_THEATER_STANCE_META,
  REASONING_THEATER_SUPPRESSION_LABEL,
} from "@/lib/helix/ask-reasoning-theater-display";

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
});
