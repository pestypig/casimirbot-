import type { EvolutionConfig } from "@shared/evolution-schema";

export type EvolutionHardFailId =
  | "CASIMIR_VERIFY_REQUIRED_MISSING"
  | "CASIMIR_VERIFY_FAIL"
  | "CONTRACT_DRIFT_VOICE"
  | "CONTRACT_DRIFT_GO_BOARD"
  | "TRACE_SCHEMA_BREAK"
  | "API_BREAK_DETECTED";

export type GateInput = {
  reportOnly?: boolean;
  casimirVerdict?: "PASS" | "FAIL";
  contractDriftVoice?: boolean;
  contractDriftGoBoard?: boolean;
  traceSchemaBreak?: boolean;
  apiBreakDetected?: boolean;
  indicators: { I: number; A: number; P: number; E: number; debt: number };
  config: EvolutionConfig;
};

const HARD_ORDER: readonly EvolutionHardFailId[] = [
  "CASIMIR_VERIFY_REQUIRED_MISSING",
  "CASIMIR_VERIFY_FAIL",
  "CONTRACT_DRIFT_VOICE",
  "CONTRACT_DRIFT_GO_BOARD",
  "TRACE_SCHEMA_BREAK",
  "API_BREAK_DETECTED",
] as const;

const buildFirstFail = (id: EvolutionHardFailId) => ({
  id,
  severity: "HARD" as const,
  status: "fail" as const,
  value: 1,
  limit: "0",
  note: "class=congruence",
});

export function runCongruenceGate(input: GateInput) {
  const reportOnly = input.reportOnly !== false;
  const missingCasimirVerdict = !reportOnly && !input.casimirVerdict;

  const failMap: Record<EvolutionHardFailId, boolean> = {
    CASIMIR_VERIFY_REQUIRED_MISSING: missingCasimirVerdict,
    CASIMIR_VERIFY_FAIL: input.casimirVerdict === "FAIL",
    CONTRACT_DRIFT_VOICE: !!input.contractDriftVoice,
    CONTRACT_DRIFT_GO_BOARD: !!input.contractDriftGoBoard,
    TRACE_SCHEMA_BREAK: !!input.traceSchemaBreak,
    API_BREAK_DETECTED: !!input.apiBreakDetected,
  };

  const firstHard = HARD_ORDER.find((id) => failMap[id]);
  const score =
    100 *
    (input.config.weights.wI * input.indicators.I +
      input.config.weights.wA * input.indicators.A +
      input.config.weights.wP * input.indicators.P +
      input.config.weights.wE * input.indicators.E +
      input.config.weights.wD * (1 - input.indicators.debt));

  const verdict = firstHard
    ? "FAIL"
    : score >= input.config.thresholds.passMin
      ? "PASS"
      : "WARN";

  return {
    verdict,
    firstFail: firstHard ? buildFirstFail(firstHard) : null,
    deltas: [
      {
        id: "congruence_score",
        before: 0,
        after: Number(score.toFixed(4)),
        delta: Number(score.toFixed(4)),
      },
    ],
    artifacts: [
      { kind: "evolution-gate-mode", ref: reportOnly ? "report-only" : "enforce" },
    ],
    reportOnly,
  };
}
