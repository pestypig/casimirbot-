import { describe, expect, it } from "vitest";

import {
  isTheoryDerivationProgramV1,
  validateTheoryDerivationProgramV1,
} from "../../contracts/theory-derivation-program.v1";
import {
  buildTheoryMasterProblemV1,
  type TheoryMasterProblemV1,
} from "../../contracts/theory-master-problem.v1";
import { compileTheoryDerivationProgram } from "../theory-derivation-program-compiler";

function baseMasterProblem(): TheoryMasterProblemV1 {
  return buildTheoryMasterProblemV1({
    generatedAt: "2026-07-16T00:00:00.000Z",
    planId: "master:test",
    graphId: "graph:test",
    request: {
      operation: "derive",
      target: "derive y",
      targetObservable: "observable.y",
      scaleLog10M: null,
      coordinateFrame: null,
      initialBoundaryConditions: [],
      formalSystem: null,
      requestedPrecision: null,
      evidenceMaturityCeiling: "diagnostic",
      normalizationStatus: "explicit",
    },
    selectedBadgeIds: ["badge:y"],
    nodes: [{
      id: "node:y",
      badgeId: "badge:y",
      equationId: "equation:y",
      kind: "equation",
      title: "Y relation",
      displayLatex: "y=2",
      expression: "2",
      inputSymbols: [],
      outputSymbols: ["y"],
      units: [{ symbol: "y", unit: "arb", dimensionSignature: "Q" }],
      assumptions: [],
      sourceRefs: ["tests/y-source"],
      derivationClass: "retrieved",
      computabilityStatus: "closed_form",
      claimBoundaryNotes: ["diagnostic_only"],
    }],
    edges: [],
    observableResolution: {
      targetObservableId: "observable.y",
      status: "not_required",
      participantBadgeIds: [],
      bindings: [],
      pairChecks: [],
      unresolvedReasons: [],
    },
    compile: {
      status: "executable",
      allowedResultKinds: ["scalar_value"],
      missingBindings: [],
      unresolvedReasons: [],
      hardFailures: [],
      runtimeAdmission: "eligible_for_completed_solver_path",
    },
    uncertaintyLedger: {
      placementEntropyBits: 0.2,
      openWorldEntropyBits: 0.3,
      outOfGraphProbability: 0.05,
      modelUncertainty: "unquantified",
      parameterUncertainty: "not_applicable",
      processStochasticity: "deterministic",
      numericalUncertainty: "not_run",
      formalStatus: "not_assessed",
    },
    claimBoundary: {
      validatesTheory: false,
      solvesPhysicalMechanism: false,
      promotionAllowed: false,
      assistantAnswer: false,
      terminalEligible: false,
      completedSolverPathRequired: true,
    },
  });
}

describe("theory derivation program compiler", () => {
  it("emits a ready, ordered, non-executing algebraic program", () => {
    const program = compileTheoryDerivationProgram({ masterProblem: baseMasterProblem() });

    expect(validateTheoryDerivationProgramV1(program)).toEqual([]);
    expect(isTheoryDerivationProgramV1(program)).toBe(true);
    expect(program).toMatchObject({
      status: "ready",
      solverRoute: {
        family: "symbolic_algebra",
        admission: "admitted",
        executorOwner: "agent_runtime",
        postToolModelStepRequired: true,
      },
      claimBoundary: {
        temporaryProgram: true,
        executesTools: false,
        assistantAnswer: false,
        terminalEligible: false,
      },
    });
    expect(program.steps.map((step) => step.kind)).toEqual([
      "evaluate_relation",
      "assemble_solver_input",
    ]);
    expect(program.steps[1].dependsOnStepIds).toEqual([program.steps[0].id]);
    expect(program.steps.every((step) => step.executionStatus === "not_started")).toBe(true);
  });

  it("keeps an unbound input conditional and emits a retryable typed receipt", () => {
    const master = baseMasterProblem();
    master.nodes[0].inputSymbols = ["x"];
    master.compile = {
      ...master.compile,
      status: "partially_executable",
      missingBindings: ["x"],
      unresolvedReasons: ["unbound input symbol: x"],
    };

    const program = compileTheoryDerivationProgram({ masterProblem: master });

    expect(program.status).toBe("conditional");
    expect(program.solverRoute.admission).toBe("conditional");
    expect(program.obligations).toContainEqual(expect.objectContaining({
      kind: "input_binding",
      phase: "preflight",
      status: "required",
      relatedIds: ["x"],
    }));
    expect(program.failureReceipts).toContainEqual(expect.objectContaining({
      code: "input_binding_missing",
      retryable: true,
      assistantAnswer: false,
      terminalEligible: false,
    }));
  });

  it("builds the smallest upstream cut instead of compiling unrelated context badges", () => {
    const master = baseMasterProblem();
    const targetNode = { ...master.nodes[0], id: "node:target", badgeId: "badge:target", inputSymbols: ["x"] };
    master.selectedBadgeIds = ["badge:source", "badge:target", "badge:ambient"];
    master.nodes = [
      { ...master.nodes[0], id: "node:source", badgeId: "badge:source", outputSymbols: ["x"] },
      targetNode,
      {
        ...master.nodes[0],
        id: "node:ambient",
        badgeId: "badge:ambient",
        title: "Unrelated ambient relation",
        inputSymbols: ["ambient_input"],
        outputSymbols: ["ambient_output"],
      },
    ];
    master.request = { ...master.request, targetObservable: "y" };
    master.edges = [{
      id: "master-edge:source-target",
      sourceEdgeId: "edge:source-target",
      fromNodeId: "node:source",
      toNodeId: "node:target",
      operator: "derives",
      derivationClass: "retrieved",
      symbolMap: [{ fromSymbol: "x", toSymbol: "x", status: "verified" }],
      dimensionalStatus: "compatible",
      domainStatus: "compatible",
      verificationRequirements: [],
      claimBoundaryNote: "diagnostic",
    }];
    master.compile = {
      ...master.compile,
      status: "partially_executable",
      missingBindings: ["ambient_input"],
      unresolvedReasons: ["unbound input symbol: ambient_input"],
    };

    const program = compileTheoryDerivationProgram({ masterProblem: master });

    expect(program.status).toBe("ready");
    expect(program.steps.flatMap((step) => step.sourceNodeIds)).not.toContain("node:ambient");
    expect(program.obligations.flatMap((obligation) => obligation.relatedIds)).not.toContain("ambient_input");
    expect(program.failureReceipts).toEqual([]);
  });

  it("turns an approved calibrated bridge into transform, uncertainty, and comparison steps", () => {
    const master = baseMasterProblem();
    master.request = {
      ...master.request,
      operation: "compare",
      target: "compare force with detector counts",
      targetObservable: "instrument.count_rate",
    };
    master.selectedBadgeIds = ["badge:force", "badge:detector"];
    master.nodes = [
      {
        ...master.nodes[0],
        id: "node:force",
        badgeId: "badge:force",
        title: "Force model",
        outputSymbols: ["force"],
        sourceRefs: ["tests/force-source"],
      },
      {
        ...master.nodes[0],
        id: "node:detector",
        badgeId: "badge:detector",
        title: "Detector response",
        inputSymbols: ["force"],
        outputSymbols: ["counts"],
        sourceRefs: ["tests/detector-source"],
      },
    ];
    master.observableResolution = {
      targetObservableId: "instrument.count_rate",
      status: "resolved",
      participantBadgeIds: ["badge:force", "badge:detector"],
      bindings: [
        {
          badgeId: "badge:force",
          observableId: "force.observable",
          canonicalObservableId: "model.force",
          symbol: "force",
          quantity: "force",
          mathematicalType: "scalar",
          unit: "N",
          dimensionSignature: "M L T^-2",
          coordinateFrame: "laboratory",
          operationalDefinitionRef: "tests/force-source",
          responseModelRef: null,
        },
        {
          badgeId: "badge:detector",
          observableId: "detector.observable",
          canonicalObservableId: "instrument.count_rate",
          symbol: "counts",
          quantity: "count rate",
          mathematicalType: "scalar",
          unit: "count/s",
          dimensionSignature: "T^-1",
          coordinateFrame: "laboratory",
          operationalDefinitionRef: "tests/detector-source",
          responseModelRef: "tests/detector-response",
        },
      ],
      pairChecks: [{
        fromBadgeId: "badge:force",
        toBadgeId: "badge:detector",
        fromObservableId: "force.observable",
        toObservableId: "detector.observable",
        fromCanonicalObservableId: "model.force",
        toCanonicalObservableId: "instrument.count_rate",
        status: "approved_bridge",
        bridgeEdgeId: "edge:calibration",
        bridgeKind: "calibrated_response",
        errorKind: "bounded",
        errorExpression: "abs(delta_counts) <= 2",
        sourceRefs: ["tests/detector-response"],
        reason: "registered detector calibration",
      }],
      unresolvedReasons: [],
    };

    const program = compileTheoryDerivationProgram({ masterProblem: master });
    const kinds = program.steps.map((step) => step.kind);

    expect(program.status).toBe("ready");
    expect(program.solverRoute.family).toBe("observational_comparison");
    expect(kinds).toContain("apply_registered_bridge");
    expect(kinds).toContain("propagate_uncertainty");
    expect(kinds).toContain("compare_observables");
    expect(program.uncertaintyPlan).toMatchObject({
      bridgeErrorExpressions: ["abs(delta_counts) <= 2"],
      propagationRequired: true,
      interpretation: "routing_and_derivation_telemetry_not_truth_probability",
    });
    const byId = new Map(program.steps.map((step) => [step.id, step.ordinal]));
    for (const step of program.steps) {
      expect(step.dependsOnStepIds.every((dependency) => (byId.get(dependency) ?? Infinity) < step.ordinal)).toBe(true);
    }
  });

  it("compiles a missing observable bridge into a blocked failure program", () => {
    const master = baseMasterProblem();
    master.request = { ...master.request, operation: "compare" };
    master.compile = {
      ...master.compile,
      status: "missing_bridge_relation",
      allowedResultKinds: ["unresolved"],
      unresolvedReasons: ["canonical observable identities differ"],
      runtimeAdmission: "blocked",
    };
    master.observableResolution = {
      targetObservableId: "observable.y",
      status: "blocked",
      participantBadgeIds: ["badge:left", "badge:right"],
      bindings: [],
      pairChecks: [{
        fromBadgeId: "badge:left",
        toBadgeId: "badge:right",
        fromObservableId: "left.observable",
        toObservableId: "right.observable",
        fromCanonicalObservableId: "observable.left",
        toCanonicalObservableId: "observable.right",
        status: "observable_identity_mismatch",
        bridgeEdgeId: null,
        bridgeKind: null,
        errorKind: null,
        errorExpression: null,
        sourceRefs: [],
        reason: "canonical observable identities differ and no registered bridge connects them",
      }],
      unresolvedReasons: ["canonical observable identities differ"],
    };

    const program = compileTheoryDerivationProgram({ masterProblem: master });

    expect(program.status).toBe("blocked");
    expect(program.solverRoute).toMatchObject({ family: "none", admission: "blocked" });
    expect(program.failureReceipts).toHaveLength(1);
    expect(program.failureReceipts[0].code).toBe("missing_bridge_relation");
    expect(program.steps.every((step) => step.kind === "report_typed_failure")).toBe(true);
    expect(program.steps.every((step) => step.admission === "blocked")).toBe(true);
  });

  it("preserves noncomputable material as a reference-only program", () => {
    const master = baseMasterProblem();
    master.request = { ...master.request, operation: "prove", formalSystem: "ZFC" };
    master.nodes[0] = {
      ...master.nodes[0],
      kind: "reference",
      computabilityStatus: "noncomputable_reference",
      expression: null,
    };
    master.compile = {
      ...master.compile,
      status: "noncomputable",
      allowedResultKinds: ["symbolic_relation", "unresolved"],
      runtimeAdmission: "not_admitted",
    };
    master.uncertaintyLedger.formalStatus = "noncomputable_reference_present";

    const program = compileTheoryDerivationProgram({ masterProblem: master });

    expect(program.status).toBe("reference_only");
    expect(program.solverRoute).toMatchObject({
      family: "symbolic_reference",
      admission: "not_admitted",
    });
    expect(program.steps).toContainEqual(expect.objectContaining({
      kind: "preserve_symbolic_reference",
      admission: "reference_only",
    }));
    expect(program.failureReceipts[0].code).toBe("noncomputable_reference");
  });

  it("fails a cyclic relation cut closed instead of pretending it is a DAG", () => {
    const master = baseMasterProblem();
    master.selectedBadgeIds = ["badge:a", "badge:b"];
    master.nodes = [
      { ...master.nodes[0], id: "node:a", badgeId: "badge:a", outputSymbols: ["a"] },
      { ...master.nodes[0], id: "node:b", badgeId: "badge:b", outputSymbols: ["b"] },
    ];
    master.edges = [
      {
        id: "master-edge:a-b",
        sourceEdgeId: "edge:a-b",
        fromNodeId: "node:a",
        toNodeId: "node:b",
        operator: "derives",
        derivationClass: "retrieved",
        symbolMap: [{ fromSymbol: "a", toSymbol: "a", status: "verified" }],
        dimensionalStatus: "compatible",
        domainStatus: "compatible",
        verificationRequirements: [],
        claimBoundaryNote: "diagnostic",
      },
      {
        id: "master-edge:b-a",
        sourceEdgeId: "edge:b-a",
        fromNodeId: "node:b",
        toNodeId: "node:a",
        operator: "derives",
        derivationClass: "retrieved",
        symbolMap: [{ fromSymbol: "b", toSymbol: "b", status: "verified" }],
        dimensionalStatus: "compatible",
        domainStatus: "compatible",
        verificationRequirements: [],
        claimBoundaryNote: "diagnostic",
      },
    ];

    const program = compileTheoryDerivationProgram({ masterProblem: master });

    expect(program.status).toBe("blocked");
    expect(program.failureReceipts).toContainEqual(expect.objectContaining({
      code: "cyclic_dependency",
      stage: "dependency_analysis",
      retryable: false,
    }));
    expect(program.steps).toHaveLength(1);
    expect(program.steps[0].kind).toBe("report_typed_failure");
  });

  it("rejects any projection that grants the temporary program execution or answer authority", () => {
    const program = compileTheoryDerivationProgram({ masterProblem: baseMasterProblem() });
    const invalid = {
      ...program,
      solverRoute: { ...program.solverRoute, executorOwner: "helix_ask" },
      claimBoundary: { ...program.claimBoundary, executesTools: true, terminalEligible: true },
    };

    expect(validateTheoryDerivationProgramV1(invalid)).toEqual(expect.arrayContaining([
      "solverRoute.executorOwner must be agent_runtime",
      "claimBoundary.executesTools must be false",
      "claimBoundary.terminalEligible must be false",
    ]));
  });
});
