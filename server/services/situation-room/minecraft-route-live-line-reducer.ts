import type { MinecraftRouteDriftEvent } from "../../../shared/helix-minecraft-route-drift.ts";
import type { MinecraftRouteRehearsal } from "./minecraft-end-return-route-builder.ts";

export type LiveAnswerLine = {
  key: string;
  value: string;
  natural_language_scope: "ui_summary_only";
  ask_admissible: false;
};

export type LiveAnswerEnvironmentSnapshot = {
  lines_by_key: Record<string, LiveAnswerLine>;
};

export function reduceRouteLiveLines(input: {
  rehearsal?: MinecraftRouteRehearsal | null;
  drift?: MinecraftRouteDriftEvent | null;
}): LiveAnswerEnvironmentSnapshot {
  const rehearsal = input.rehearsal;
  const drift = input.drift;

  return {
    lines_by_key: {
      rehearsal: uiLine(
        "rehearsal",
        rehearsal
          ? `Return-home route candidate has ${rehearsal.stages.length} staged checks.`
          : "No rehearsal result yet.",
      ),
      possibilities: uiLine(
        "possibilities",
        rehearsal
          ? "Candidate next check: confirm gateway evidence or follow observed route overlay."
          : "Awaiting route objective.",
      ),
      unknowns: uiLine(
        "unknowns",
        rehearsal
          ? missingEvidenceSummary(rehearsal)
          : "Route objective and gateway evidence not established.",
      ),
      next_check: uiLine(
        "next_check",
        drift?.salience_candidate
          ? "Policy gate should evaluate route-drift salience."
          : "Watch location samples and gateway/resource evidence.",
      ),
      route_drift: uiLine(
        "route_drift",
        drift
          ? `Route drift status: ${drift.drift_status}; expected ${drift.expected_direction ?? "unknown"}, observed ${drift.observed_direction ?? "unknown"}.`
          : "No route drift result yet.",
      ),
      recommendation: uiLine("recommendation", "Awaiting companion policy gate."),
    },
  };
}

function uiLine(key: string, value: string): LiveAnswerLine {
  return {
    key,
    value,
    natural_language_scope: "ui_summary_only",
    ask_admissible: false,
  };
}

function missingEvidenceSummary(rehearsal: MinecraftRouteRehearsal): string {
  const codes = new Set(
    rehearsal.stages.flatMap((stage) => stage.missing_evidence_codes),
  );
  if (codes.size === 0) {
    return "No missing route evidence currently known.";
  }
  return `Missing evidence codes: ${[...codes].join(", ")}.`;
}
