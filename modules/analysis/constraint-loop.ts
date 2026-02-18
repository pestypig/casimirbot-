export type ConstraintLoopGateStatus = "pass" | "fail" | "unknown";

export type ConstraintLoopGate = {
  status: ConstraintLoopGateStatus;
  residuals: Record<string, number>;
  note?: string;
  fail_reason?: string;
};

export type ConstraintLoopProvenanceClass = "measured" | "proxy" | "inferred";
export type ConstraintLoopClaimTier = "diagnostic" | "reduced-order" | "certified";

export type ConstraintLoopProvenance = {
  provenance_class: ConstraintLoopProvenanceClass;
  claim_tier: ConstraintLoopClaimTier;
  certifying: boolean;
};

export type ConstraintLoopAttempt<S, D, C> = {
  iteration: number;
  state: S;
  derivatives: D;
  constraints: C;
  gate: ConstraintLoopGate;
  accepted: boolean;
};

export type ConstraintLoopResult<S, D, C> = {
  accepted: boolean;
  acceptedIteration?: number;
  attempts: Array<ConstraintLoopAttempt<S, D, C>>;
  finalState: S;
  provenance?: ConstraintLoopProvenance;
};

export type ConstraintLoopContext = {
  iteration: number;
  maxIterations: number;
};

export type ConstraintLoopCapture<S, D, C> = (input: {
  state: S;
  derivatives: D;
  constraints: C;
}) => {
  state: S;
  derivatives: D;
  constraints: C;
};

export type ConstraintLoopHandlers<S, D, C> = {
  derive: (state: S, ctx: ConstraintLoopContext) => D;
  constrain: (state: S, derivatives: D, ctx: ConstraintLoopContext) => C;
  gate: (constraints: C, ctx: ConstraintLoopContext) => ConstraintLoopGate;
  step: (state: S, derivatives: D, constraints: C, ctx: ConstraintLoopContext) => S;
  cloneState?: (state: S) => S;
  capture?: ConstraintLoopCapture<S, D, C>;
};

type ConstraintLoopInput<S, D, C> = {
  initialState: S;
  maxIterations?: number;
  handlers: ConstraintLoopHandlers<S, D, C>;
  provenance?: ConstraintLoopProvenance;
  strictProvenance?: boolean;
};

export const CONSTRAINT_LOOP_FAIL_REASON_PROVENANCE_MISSING =
  "ANALYSIS_LOOP_PROVENANCE_MISSING" as const;

const cloneValue = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value) as T;
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

export function runConstraintLoop<S, D, C>(
  input: ConstraintLoopInput<S, D, C>,
): ConstraintLoopResult<S, D, C> {
  const maxIterations = Math.max(1, input.maxIterations ?? 4);
  const attempts: Array<ConstraintLoopAttempt<S, D, C>> = [];
  const { handlers } = input;
  const capture = handlers.capture ?? ((snapshot) => ({
    state: handlers.cloneState ? handlers.cloneState(snapshot.state) : cloneValue(snapshot.state),
    derivatives: cloneValue(snapshot.derivatives),
    constraints: cloneValue(snapshot.constraints),
  }));

  let state = handlers.cloneState
    ? handlers.cloneState(input.initialState)
    : input.initialState;
  let acceptedIteration: number | undefined;
  const strictProvenanceFail = input.strictProvenance === true && !input.provenance;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const ctx: ConstraintLoopContext = { iteration, maxIterations };
    const derivatives = handlers.derive(state, ctx);
    const constraints = handlers.constrain(state, derivatives, ctx);
    const gate = handlers.gate(constraints, ctx);
    const gateWithProvenance = strictProvenanceFail
      ? {
          ...gate,
          status: "fail" as const,
          fail_reason: CONSTRAINT_LOOP_FAIL_REASON_PROVENANCE_MISSING,
          note: [gate.note, CONSTRAINT_LOOP_FAIL_REASON_PROVENANCE_MISSING]
            .filter(Boolean)
            .join(";"),
        }
      : gate;
    const accepted = gateWithProvenance.status === "pass";
    const snapshot = capture({ state, derivatives, constraints });

    attempts.push({
      iteration,
      state: snapshot.state,
      derivatives: snapshot.derivatives,
      constraints: snapshot.constraints,
      gate: gateWithProvenance,
      accepted,
    });

    if (accepted) {
      acceptedIteration = iteration;
      break;
    }

    if (iteration < maxIterations - 1) {
      state = handlers.step(state, derivatives, constraints, ctx);
    }
  }

  return {
    accepted: acceptedIteration !== undefined,
    acceptedIteration,
    attempts,
    finalState: state,
    provenance: input.provenance,
  };
}
