import { describe, expect, it } from "vitest";

import {
  isTheoryMasterProblemV1,
  validateTheoryMasterProblemV1,
  type TheoryMasterProblemRequestV1,
} from "../../contracts/theory-master-problem.v1";
import {
  buildTheoryBadgeGraphV1,
  validateTheoryBadgeGraphV1,
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
  observable?: {
    canonicalObservableId: string;
    quantity?: string;
    unit?: string;
    coordinateFrame?: string | null;
    responseModelRef?: string | null;
  };
}): TheoryBadgeV1 {
  const outputSymbol = args.outputSymbols?.[0] ?? args.inputSymbols?.[0] ?? "x";
  const sourcePath = `tests/${args.id}.spec.ts`;
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
    sourceRefs: [{ kind: "test", path: sourcePath }],
    ...(args.observable ? {
      observables: [{
        id: `${args.id}.observable`,
        canonicalObservableId: args.observable.canonicalObservableId,
        symbol: outputSymbol,
        quantity: args.observable.quantity ?? outputSymbol,
        mathematicalType: "scalar",
        unit: args.observable.unit ?? "arb",
        dimensionSignature: args.dimensionSignature ?? "Q",
        coordinateFrame: args.observable.coordinateFrame ?? "laboratory",
        operationalDefinitionRef: sourcePath,
        responseModelRef: args.observable.responseModelRef ?? null,
      }],
    } : {}),
    scaleEnvelope: {
      characteristicLog10M: 0,
      minLog10M: -1,
      maxLog10M: 1,
      basis: "derived",
      sourceRefs: [{ kind: "test", path: sourcePath }],
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

  it("admits comparison only when source-backed bindings share canonical observable identity", () => {
    const left = badge({
      id: "left-model",
      outputSymbols: ["y_left"],
      observable: { canonicalObservableId: "observable.shared_y", quantity: "shared_y" },
    });
    const right = badge({
      id: "right-model",
      outputSymbols: ["y_right"],
      observable: { canonicalObservableId: "observable.shared_y", quantity: "shared_y" },
    });
    const comparisonGraph = graph([left, right]);
    const result = compileTheoryMasterProblem({
      graph: comparisonGraph,
      badgeIds: [left.id, right.id],
      comparisonBadgeIds: [left.id, right.id],
      request: {
        ...request,
        operation: "compare",
        target: "compare the two model predictions",
        targetObservable: null,
      },
    });

    expect(validateTheoryBadgeGraphV1(comparisonGraph)).toEqual([]);
    expect(result.observableResolution).toMatchObject({
      targetObservableId: "observable.shared_y",
      status: "resolved",
      participantBadgeIds: [left.id, right.id],
      pairChecks: [{ status: "same_canonical_observable" }],
    });
    expect(result.request.targetObservable).toBe("observable.shared_y");
    expect(result.compile.status).toBe("executable");
  });

  it("does not treat shared symbols or units as canonical observable identity", () => {
    const left = badge({ id: "left-unbound", outputSymbols: ["pressure"] });
    const right = badge({ id: "right-unbound", outputSymbols: ["pressure"] });
    const result = compileTheoryMasterProblem({
      graph: graph([left, right]),
      badgeIds: [left.id, right.id],
      comparisonBadgeIds: [left.id, right.id],
      request: {
        ...request,
        operation: "compare",
        target: "compare pressure",
        targetObservable: "pressure",
      },
    });

    expect(result.observableResolution.status).toBe("blocked");
    expect(result.observableResolution.unresolvedReasons).toContain("target observable is not registered: pressure");
    expect(result.compile.status).toBe("unidentifiable");
    expect(result.compile.runtimeAdmission).toBe("blocked");
  });

  it("returns missing_bridge_relation when canonical observable identities differ", () => {
    const left = badge({
      id: "sphere-plane",
      outputSymbols: ["force_gradient"],
      observable: { canonicalObservableId: "casimir.sphere_plane.force_gradient" },
    });
    const right = badge({
      id: "parallel-plate",
      outputSymbols: ["pressure"],
      observable: { canonicalObservableId: "casimir.parallel_plate.pressure" },
    });
    const result = compileTheoryMasterProblem({
      graph: graph([left, right]),
      badgeIds: [left.id, right.id],
      comparisonBadgeIds: [left.id, right.id],
      request: {
        ...request,
        operation: "compare",
        target: "compare Casimir observables",
        targetObservable: null,
      },
    });

    expect(result.observableResolution.pairChecks[0]).toMatchObject({
      status: "observable_identity_mismatch",
      bridgeEdgeId: null,
    });
    expect(result.compile.status).toBe("missing_bridge_relation");
    expect(result.compile.allowedResultKinds).toEqual(["unresolved"]);
  });

  it("admits a different-observable comparison through a registered bounded bridge", () => {
    const model = badge({
      id: "force-model",
      outputSymbols: ["force"],
      observable: { canonicalObservableId: "model.force", quantity: "force", unit: "N" },
    });
    const detector = badge({
      id: "detector-model",
      inputSymbols: ["force"],
      outputSymbols: ["counts"],
      observable: {
        canonicalObservableId: "instrument.count_rate",
        quantity: "detector_count_rate",
        unit: "count/s",
        responseModelRef: "tests/detector-model.spec.ts",
      },
    });
    const bridge: TheoryBadgeEdgeV1 = {
      ...derives(model.id, detector.id),
      observableBridge: {
        fromObservableId: "model.force",
        toObservableId: "instrument.count_rate",
        kind: "calibrated_response",
        authority: "registered",
        reversible: false,
        assumptions: ["calibration:v1 applies"],
        sourceRefs: ["tests/detector-model.spec.ts"],
        validityDomain: {
          scaleLog10M: { min: -3, max: 1 },
          coordinateFrames: ["laboratory"],
          conditions: ["detector response is unsaturated"],
        },
        errorContract: { kind: "bounded", expression: "abs(delta_counts) <= 2" },
      },
    };
    const comparisonGraph = graph([model, detector], [bridge]);
    const result = compileTheoryMasterProblem({
      graph: comparisonGraph,
      badgeIds: [model.id, detector.id],
      comparisonBadgeIds: [model.id, detector.id],
      request: {
        ...request,
        operation: "compare",
        target: "compare model force with detector counts",
        targetObservable: "instrument.count_rate",
        coordinateFrame: "laboratory",
        scaleLog10M: { min: -2, max: 0 },
      },
    });

    expect(validateTheoryBadgeGraphV1(comparisonGraph)).toEqual([]);
    expect(result.observableResolution.pairChecks[0]).toMatchObject({
      status: "approved_bridge",
      bridgeEdgeId: bridge.id,
      bridgeKind: "calibrated_response",
      errorKind: "bounded",
      errorExpression: "abs(delta_counts) <= 2",
    });
    expect(result.compile.status).toBe("executable");
  });

  it("fails a registered bridge closed outside its frame domain", () => {
    const model = badge({
      id: "frame-model",
      outputSymbols: ["x"],
      observable: { canonicalObservableId: "observable.frame_x" },
    });
    const detector = badge({
      id: "frame-detector",
      inputSymbols: ["x"],
      outputSymbols: ["x_observed"],
      observable: { canonicalObservableId: "observable.frame_x_observed" },
    });
    const bridge: TheoryBadgeEdgeV1 = {
      ...derives(model.id, detector.id),
      observableBridge: {
        fromObservableId: "observable.frame_x",
        toObservableId: "observable.frame_x_observed",
        kind: "calibrated_response",
        authority: "registered",
        reversible: false,
        assumptions: [],
        sourceRefs: ["tests/frame-detector.spec.ts"],
        validityDomain: {
          scaleLog10M: null,
          coordinateFrames: ["laboratory"],
          conditions: [],
        },
        errorContract: { kind: "statistical", expression: "sigma_x <= 0.1" },
      },
    };
    const result = compileTheoryMasterProblem({
      graph: graph([model, detector], [bridge]),
      badgeIds: [model.id, detector.id],
      comparisonBadgeIds: [model.id, detector.id],
      request: {
        ...request,
        operation: "compare",
        target: "compare outside the calibration frame",
        targetObservable: "observable.frame_x_observed",
        coordinateFrame: "cosmological",
      },
    });

    expect(result.observableResolution.pairChecks[0].status).toBe("bridge_domain_mismatch");
    expect(result.compile.status).toBe("domain_mismatch");
    expect(result.compile.runtimeAdmission).toBe("blocked");
  });

  it("rejects approximation bridges without an explicit error contract", () => {
    const source = badge({
      id: "approx-source",
      outputSymbols: ["fine"],
      observable: { canonicalObservableId: "observable.fine" },
    });
    const target = badge({
      id: "approx-target",
      inputSymbols: ["fine"],
      outputSymbols: ["coarse"],
      observable: { canonicalObservableId: "observable.coarse" },
    });
    const invalidGraph = graph([source, target], [{
      ...derives(source.id, target.id),
      observableBridge: {
        fromObservableId: "observable.fine",
        toObservableId: "observable.coarse",
        kind: "approximation",
        authority: "registered",
        reversible: false,
        assumptions: [],
        sourceRefs: ["tests/approx-target.spec.ts"],
        validityDomain: { scaleLog10M: null, coordinateFrames: [], conditions: [] },
        errorContract: { kind: "exact", expression: null },
      },
    }]);

    expect(validateTheoryBadgeGraphV1(invalidGraph)).toContain(
      "edges[0].observableBridge.approximation requires a bounded/statistical error expression",
    );
  });
});
