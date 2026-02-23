export type MomentumInput = {
  deltaLoc: number;
  deltaFiles: number;
  deltaContracts: number;
  subsystemLoc: Record<string, number>;
  couplingMissingEdges: number;
  testsRun: number;
  testsFailed: number;
  testTimeDeltaMs: number;
  policyTouched: boolean;
  contractDocsTouched: boolean;
  schemaTouched: boolean;
};

export type MomentumOutput = {
  scope: number;
  subsystem: Array<{ subsystem: string; share: number }>;
  coupling: number;
  test: number;
  uncertainty: number;
};

const EPS = 1e-9;

export function computeMomentum(input: MomentumInput): MomentumOutput {
  const totalLoc = Object.values(input.subsystemLoc).reduce((a, b) => a + Math.max(0, b), 0);
  const subsystem = Object.entries(input.subsystemLoc)
    .map(([name, loc]) => ({ subsystem: name, share: totalLoc > 0 ? loc / totalLoc : 0 }))
    .sort((a, b) => a.subsystem.localeCompare(b.subsystem));

  const chi = subsystem.reduce((sum, left, i) => {
    for (let j = i + 1; j < subsystem.length; j++) {
      sum += left.share * subsystem[j].share;
    }
    return sum;
  }, 0);

  const scope = Math.log1p(Math.max(0, input.deltaLoc))
    + 0.3 * Math.log1p(Math.max(0, input.deltaFiles))
    + 0.8 * Math.max(0, input.deltaContracts);

  const coupling = chi * (1 + Math.max(0, input.couplingMissingEdges));

  const test = input.testsRun > 0
    ? -2 * (Math.max(0, input.testsFailed) / Math.max(1, input.testsRun)) - 0.2 * Math.log1p(Math.max(0, input.testTimeDeltaMs))
    : -0.5;

  const uncertainty = 1.5 * Number(input.policyTouched)
    + 1.0 * Number(input.contractDocsTouched)
    + 0.8 * Number(input.schemaTouched)
    + 0.3 * chi
    + EPS;

  return { scope, subsystem, coupling, test, uncertainty };
}
