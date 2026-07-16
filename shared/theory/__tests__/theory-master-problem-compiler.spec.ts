import { describe, expect, it } from "vitest";

import {
  isTheoryMasterProblemV1,
  validateTheoryMasterProblemV1,
  type TheoryMasterProblemRequestV1,
} from "../../contracts/theory-master-problem.v1";
import {
  buildTheoryBadgeGraphV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../../contracts/theory-badge-graph.v1";
import { compileTheoryMasterProblem } from "../theory-master-problem-compiler";

const request: TheoryMasterProblemRequestV1 = {
  operation: "derive",
  target: "derive y from x",
  targetObservable: "y",
  scaleLog10M: null,
  coordinateFrame: null,
  initialBoundaryConditions: [],
  formalSystem: null,
  requestedPrecision: null,
  evidenceMaturityCeiling: "diagnostic",
  normalizationStatus: "explicit",
};

function badge(args: {
  id: string;
  inputSymbols?: string[];
  outputSymbols?: string[];
  dimensionSignature?: string;
  noncomputable?: boolean;
}): TheoryBadgeV1 {
  const outputSymbol = args.outputSymbols?.[0] ?? args.inputSymbols?.[0] ?? "x";
  return {
    id: args.id,
    title: args.id,
    plainMeaning: `${args.id} meaning`,
    whyItMatters: `${args.id} relevance`,
    subjects: ["test_observable"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: [],
    equationFamilies: ["test_family"],
    tags: [],
    equations: [{
      id: `${args.id}.equation`,
      role: args.noncomputable ? "noncomputable_reference" : "transform",
      displayLatex: args.noncomputable ? "\\text{reference}" : `${outputSymbol}=f(x)`,
      computableExpression: args.noncomputable ? null : `${outputSymbol}`,
      operatorKind: args.noncomputable ? "noncomputable_reference" : "scalar_expression",
      inputSymbols: args.inputSymbols ?? [],
      outputSymbols: args.outputSymbols ?? [],
    }],
    units: uniqueSymbols([...(args.inputSymbols ?? []), ...(args.outputSymbols ?? [])]).map((symbol) => ({
      symbol,
      unit: "arb",
      dimensionSignature: args.dimensionSignature ?? "Q",
    })),
    assumptions: [],
    calculatorPayloads: [],
    sourceRefs: [{ kind: "test", path: `tests/${args.id}.spec.ts` }],
    scaleEnvelope: {
      characteristicLog10M: 0,
      minLog10M: -1,
      maxLog10M: 1,
      basis: "derived",
      sourceRefs: [{ kind: "test", path: `tests/${args.id}.spec.ts` }],
    },
    hintKeys: {
      subjects: [],
      symbols: uniqueSymbols([...(args.inputSymbols ?? []), ...(args.outputSymbols ?? [])]),
      unitSignatures: [args.dimensionSignature ?? "Q"],
      repoPaths: [],
      equationFamilies: ["test_family"],
      simulationOwners: [],
    },
    claimBoundary: {
      diagnosticOnly: true,
      doesValidateNHM2: false,
      validationClaimAllowed: false,
      physicalMechanismClaimAllowed: false,
      promotionAllowed: false,
    },
  };
}

function uniqueSymbols(values: string[]): string[] {
  return Array.from(new Set(values));
}

function graph(badges: TheoryBadgeV1[], edges: TheoryBadgeEdgeV1[] = []) {
  return buildTheoryBadgeGraphV1({
    graphId: "test-master-problem",
    title: "Test master problem graph",
    description: "Compiler fixture",
    badges,
    edges,
  });
}

function derives(from: string, to: string): TheoryBadgeEdgeV1 {
  return {
    id: `${from}.derives.${to}`,
    from,
    to,
    relation: "derives",
    label: `${from} derives ${to}`,
    claimBoundaryNote: "Graph relation does not validate the theory.",
  };
}

describe("theory master problem compiler", () => {
  it("compiles a registered, dimensionally compatible equation path", () => {
    const source = badge({ id: "source", outputSymbols: ["x"] });
    const target = badge({ id: "target", inputSymbols: ["x"], outputSymbols: ["y"] });
    const result = compileTheoryMasterProblem({
      graph: graph([source, target], [derives(source.id, target.id)]),
      badgeIds: [source.id, target.id],
      request,
      uncertainty: { outOfGraphProbability: 0.05, openWorldEntropyBits: 0.4 },
    });

    expect(validateTheoryMasterProblemV1(result)).toEqual([]);
    expect(isTheoryMasterProblemV1(result)).toBe(true);
    expect(result.compile.status).toBe("executable");
    expect(result.edges[0]).toMatchObject({
      operator: "derives",
      dimensionalStatus: "compatible",
      domainStatus: "compatible",
      symbolMap: [{ fromSymbol: "x", toSymbol: "x", status: "verified" }],
    });
    expect(result.claimBoundary.terminalEligible).toBe(false);
  });

  it("returns missing_bridge_relation instead of inventing an equation", () => {
    const left = badge({ id: "left", outputSymbols: ["x"] });
    const right = badge({ id: "right", inputSymbols: ["x"], outputSymbols: ["y"] });
    const result = compileTheoryMasterProblem({
      graph: graph([left, right]),
      badgeIds: [left.id, right.id],
      request,
    });

    expect(result.compile.status).toBe("missing_bridge_relation");
    expect(result.compile.unresolvedReasons).toContain("missing_bridge_relation");
    expect(result.compile.allowedResultKinds).toEqual(["unresolved"]);
  });

  it("keeps noncomputable references representable but non-executable", () => {
    const reference = badge({ id: "goedel", noncomputable: true });
    const result = compileTheoryMasterProblem({
      graph: graph([reference]),
      badgeIds: [reference.id],
      request: { ...request, operation: "prove", target: "assess formal status", targetObservable: null },
    });

    expect(result.compile.status).toBe("noncomputable");
    expect(result.compile.runtimeAdmission).toBe("not_admitted");
    expect(result.uncertaintyLedger.formalStatus).toBe("noncomputable_reference_present");
  });

  it("fails closed on a dimensionally incompatible registered path", () => {
    const source = badge({ id: "source", outputSymbols: ["x"], dimensionSignature: "L" });
    const target = badge({ id: "target", inputSymbols: ["x"], outputSymbols: ["y"], dimensionSignature: "T" });
    const result = compileTheoryMasterProblem({
      graph: graph([source, target], [derives(source.id, target.id)]),
      badgeIds: [source.id, target.id],
      request,
    });

    expect(result.compile.status).toBe("dimensionally_incompatible");
    expect(result.compile.hardFailures[0]).toContain("dimensional incompatibility");
    expect(result.compile.runtimeAdmission).toBe("blocked");
  });

  it("blocks graph execution when open-world mass says the answer is probably out of graph", () => {
    const source = badge({ id: "source", outputSymbols: ["y"] });
    const result = compileTheoryMasterProblem({
      graph: graph([source]),
      badgeIds: [source.id],
      request,
      uncertainty: { outOfGraphProbability: 0.8 },
    });

    expect(result.compile.status).toBe("insufficient_evidence");
    expect(result.compile.runtimeAdmission).toBe("blocked");
  });
});
