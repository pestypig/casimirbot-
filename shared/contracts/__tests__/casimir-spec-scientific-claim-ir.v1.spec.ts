import { describe, expect, it } from "vitest";
import benchmarkPolicy from "../../../configs/casimir-spec-benchmark-policy.v1.json";
import goldenFixture from "./fixtures/casimir-spec/advection-diffusion.open-world.valid.v1.json";
import {
  buildCasimirSpecScientificClaimIrV1,
  isCasimirSpecScientificClaimIrIntegrityValidV1,
  isCasimirSpecScientificClaimIrStructurallyValidV1,
  unsafeSealCasimirSpecScientificClaimIrV1,
  validateCasimirSpecScientificClaimIrIntegrityV1,
  validateCasimirSpecScientificClaimIrV1,
  verifyCasimirSpecScientificClaimIrCommitmentsV1,
  verifyCasimirSpecScientificClaimIrSemanticCommitmentV1,
  type CasimirSpecScientificClaimIrV1,
} from "../casimir-spec-scientific-claim-ir.v1";

const cloneFixture = (): CasimirSpecScientificClaimIrV1 =>
  structuredClone(goldenFixture) as unknown as CasimirSpecScientificClaimIrV1;

const issueCodes = (issues: string[]): string[] =>
  issues.map((entry) => entry.slice(0, entry.indexOf(":")));

describe("casimir_spec_scientific_claim_ir/v1", () => {
  it("accepts the hash-bound open-world advection-diffusion fixture", async () => {
    const fixture = cloneFixture();

    expect(validateCasimirSpecScientificClaimIrV1(fixture)).toEqual([]);
    expect(
      await validateCasimirSpecScientificClaimIrIntegrityV1(fixture),
    ).toEqual([]);
    expect(isCasimirSpecScientificClaimIrStructurallyValidV1(fixture)).toBe(
      true,
    );
    expect(await isCasimirSpecScientificClaimIrIntegrityValidV1(fixture)).toBe(
      true,
    );
    expect(fixture.world.model).toBe("open_world");
    expect(fixture.world.exhaustive).toBe(false);
    expect(fixture.claims[0].axes.logical.resolution).toBe("unassessed");
    expect(fixture.claims[0].axes.computational.status).toBe("reference_only");
    expect(fixture.claims[0].axes.scientific.status).toBe(
      "empirically_unvalidated",
    );
    expect(fixture.claimBoundary.assistantAnswer).toBe(false);
    expect(fixture.claimBoundary.terminalEligible).toBe(false);
  });

  it("rejects unknown root and nested fields", () => {
    const rootEscalation = cloneFixture() as unknown as Record<string, unknown>;
    rootEscalation.authoritative = true;
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(rootEscalation)),
    ).toContain("root_shape_invalid");

    const nestedEscalation = cloneFixture() as unknown as {
      claims: Array<Record<string, unknown>>;
    };
    nestedEscalation.claims[0].proofIsPhysicalTruth = true;
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(nestedEscalation)),
    ).toContain("claim_shape_invalid");

    const missingNestedField = cloneFixture() as unknown as Record<string, any>;
    delete missingNestedField.symbols[0].unitBinding;
    expect(() =>
      validateCasimirSpecScientificClaimIrV1(missingNestedField),
    ).not.toThrow();
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(missingNestedField)),
    ).toContain("symbol_shape_invalid");
  });

  it("fails closed without throwing on deep, wide, or cyclic expression graphs", async () => {
    const deep = cloneFixture() as unknown as Record<string, any>;
    let deepExpression: Record<string, any> = {
      kind: "symbol_ref",
      symbolId: "symbol:concentration",
    };
    for (let index = 0; index < 12_000; index += 1) {
      deepExpression = {
        kind: "binder",
        binder: "forall",
        boundSymbolIds: ["symbol:concentration"],
        body: deepExpression,
      };
    }
    deep.claims[0].proposition = deepExpression;
    expect(() => validateCasimirSpecScientificClaimIrV1(deep)).not.toThrow();
    expect(issueCodes(validateCasimirSpecScientificClaimIrV1(deep))).toContain(
      "expression_depth_exceeded",
    );
    expect(
      issueCodes(await validateCasimirSpecScientificClaimIrIntegrityV1(deep)),
    ).toContain("expression_depth_exceeded");
    expect(
      issueCodes(
        await verifyCasimirSpecScientificClaimIrSemanticCommitmentV1(
          deep,
          goldenFixture.semanticSha256,
        ),
      ),
    ).toContain("expression_depth_exceeded");

    const wide = cloneFixture() as unknown as Record<string, any>;
    wide.claims[0].proposition = {
      kind: "apply",
      operatorId: "casimir.core::and",
      arguments: Array.from({ length: 12_000 }, () => ({
        kind: "rational_literal",
        numerator: "1",
        denominator: "1",
      })),
    };
    expect(() => validateCasimirSpecScientificClaimIrV1(wide)).not.toThrow();
    expect(issueCodes(validateCasimirSpecScientificClaimIrV1(wide))).toContain(
      "expression_node_limit_exceeded",
    );

    const cyclic = cloneFixture() as unknown as Record<string, any>;
    const cyclicExpression: Record<string, any> = {
      kind: "binder",
      binder: "forall",
      boundSymbolIds: ["symbol:concentration"],
    };
    cyclicExpression.body = cyclicExpression;
    cyclic.claims[0].proposition = cyclicExpression;
    expect(() => validateCasimirSpecScientificClaimIrV1(cyclic)).not.toThrow();
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(cyclic)),
    ).toContain("expression_depth_exceeded");
  });

  it("rejects lexical symbol collision and unauthorised semantic identity reuse", () => {
    const lexicalCollision = cloneFixture();
    lexicalCollision.symbols[1].localName =
      lexicalCollision.symbols[0].localName;
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(lexicalCollision)),
    ).toContain("lexical_symbol_collision");

    const identityForgery = cloneFixture();
    identityForgery.symbols[1].identity = {
      kind: "local",
      semanticId: identityForgery.symbols[0].identity.semanticId,
    };
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(identityForgery)),
    ).toContain("semantic_identity_authority_invalid");

    const incompatibleRegisteredReuse = cloneFixture();
    const sharedIdentity = {
      kind: "registered" as const,
      semanticId: "casimir.semantic::forged-shared-quantity",
      bindingId: "binding:forged-shared-quantity",
      bindingSha256: "a".repeat(64),
      provenanceIds: ["provenance:user-proposal"],
    };
    incompatibleRegisteredReuse.symbols[0].identity = sharedIdentity;
    incompatibleRegisteredReuse.symbols[1].identity = sharedIdentity;
    expect(
      issueCodes(
        validateCasimirSpecScientificClaimIrV1(incompatibleRegisteredReuse),
      ),
    ).toContain("semantic_identity_signature_mismatch");
  });

  it("rejects closed-world and source-IR proof promotion", () => {
    const closedWorld = cloneFixture() as unknown as {
      world: { exhaustive: boolean };
    };
    closedWorld.world.exhaustive = true;
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(closedWorld)),
    ).toContain("open_world_exhaustiveness_invalid");

    const proofLaundering = cloneFixture() as unknown as {
      claims: Array<{ axes: { logical: { resolution: string } } }>;
    };
    proofLaundering.claims[0].axes.logical.resolution = "proved";
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(proofLaundering)),
    ).toContain("logical_resolution_external_certificate_required");
  });

  it("requires typed blockers for unknown coverage and reference-only computation", () => {
    const missingCoverageBlocker = cloneFixture();
    missingCoverageBlocker.claims[0].axes.coverage.blockerIds = [];
    expect(
      issueCodes(
        validateCasimirSpecScientificClaimIrV1(missingCoverageBlocker),
      ),
    ).toContain("coverage_blocker_required");

    const missingComputationBlocker = cloneFixture();
    missingComputationBlocker.claims[0].axes.computational.blockerIds = [];
    expect(
      issueCodes(
        validateCasimirSpecScientificClaimIrV1(missingComputationBlocker),
      ),
    ).toContain("computational_blocker_required");
  });

  it("requires exact transitive claim and definition dependency closure", () => {
    const missingClaimDefinition = cloneFixture();
    missingClaimDefinition.claims[0].definitionIds =
      missingClaimDefinition.claims[0].definitionIds.filter(
        (id) => id !== "definition:lab-frame",
      );
    expect(
      issueCodes(
        validateCasimirSpecScientificClaimIrV1(missingClaimDefinition),
      ),
    ).toContain("claim_definition_dependency_undeclared");

    const missingClaimAssumption = cloneFixture();
    missingClaimAssumption.claims[0].assumptionIds = [];
    expect(
      issueCodes(
        validateCasimirSpecScientificClaimIrV1(missingClaimAssumption),
      ),
    ).toContain("claim_assumption_dependency_undeclared");

    const hiddenDefinitionDependency = cloneFixture();
    const pde = hiddenDefinitionDependency.definitions.find(
      (definition) => definition.definitionId === "definition:pde",
    );
    if (!pde) throw new Error("fixture drift");
    pde.dependencyDefinitionIds = pde.dependencyDefinitionIds.filter(
      (id) => id !== "definition:lab-frame",
    );
    expect(
      issueCodes(
        validateCasimirSpecScientificClaimIrV1(hiddenDefinitionDependency),
      ),
    ).toContain("definition_dependency_undeclared");

    const hiddenAssumptionDefinition = cloneFixture();
    const diffusivityAssumption = hiddenAssumptionDefinition.assumptions.find(
      (assumption) =>
        assumption.assumptionId === "assumption:diffusivity-nonnegative",
    );
    if (!diffusivityAssumption) throw new Error("fixture drift");
    diffusivityAssumption.proposition = {
      kind: "symbol_ref",
      symbolId: "symbol:velocity",
    };
    expect(
      issueCodes(
        validateCasimirSpecScientificClaimIrV1(hiddenAssumptionDefinition),
      ),
    ).toContain("definition_dependency_undeclared");

    const hiddenDomainFrame = cloneFixture();
    const diffusivityDefinition = hiddenDomainFrame.definitions.find(
      (definition) => definition.definitionId === "definition:diffusivity",
    );
    if (!diffusivityDefinition) throw new Error("fixture drift");
    diffusivityDefinition.validityDomain.frameDefinitionIds = [
      "definition:lab-frame",
    ];
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(hiddenDomainFrame)),
    ).toContain("definition_dependency_undeclared");
  });

  it("rejects source-map paths that do not resolve against the proposition", () => {
    const unsafe = cloneFixture();
    unsafe.claims[0].sourceMap[0].expressionPath = "/arguments/999";

    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(unsafe)),
    ).toContain("claim_source_map_path_unresolved");

    const primitiveTarget = cloneFixture();
    primitiveTarget.claims[0].sourceMap[0].expressionPath = "/kind";
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(primitiveTarget)),
    ).toContain("claim_source_map_target_not_expression");

    const missingAnchors = cloneFixture();
    missingAnchors.claims[0].sourceMap[0].definitionIds = [];
    missingAnchors.claims[0].sourceMap[0].symbolIds = [];
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(missingAnchors)),
    ).toContain("claim_source_map_anchor_required");

    const wrongSubtree = cloneFixture();
    wrongSubtree.claims[0].sourceMap[0].expressionPath = "/arguments/0";
    wrongSubtree.claims[0].sourceMap[0].definitionIds = ["definition:source"];
    wrongSubtree.claims[0].sourceMap[0].symbolIds = ["symbol:source"];
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(wrongSubtree)),
    ).toContain("claim_source_map_anchor_out_of_subtree");
  });

  it("keeps noncomputable separate from logical and coverage resolution", async () => {
    const noncomputable = cloneFixture();
    noncomputable.claims[0].axes.computational = {
      status: "noncomputable",
      reason:
        "The declaration is retained as a formal reference with no executable witness.",
      blockerIds: [],
    };
    const sealed =
      await unsafeSealCasimirSpecScientificClaimIrV1(noncomputable);

    expect(validateCasimirSpecScientificClaimIrV1(sealed)).toEqual([]);
    expect(
      await validateCasimirSpecScientificClaimIrIntegrityV1(sealed),
    ).toEqual([]);
    expect(sealed.claims[0].axes.logical.resolution).toBe("unassessed");
    expect(sealed.claims[0].axes.coverage.status).toBe("unknown");
  });

  it("rejects unregistered approximate bridges without error contracts", () => {
    const unsafe = cloneFixture() as unknown as Record<string, any>;
    unsafe.world.graphId = "graph:fixture";
    unsafe.world.badgeIds = ["badge:fixture"];
    unsafe.bridges = [
      {
        bridgeId: "bridge:forged",
        fromObservableId: "observable:concentration-lab",
        toObservableId: "observable:concentration-lab",
        kind: "approximation",
        authority: "proposed",
        registration: {
          graphId: "graph:fixture",
          edgeId: "edge:forged",
          edgeSemanticSha256: "a".repeat(64),
        },
        reversible: false,
        inverseBridgeId: null,
        assumptionIds: [],
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: ["definition:lab-frame"],
          conditions: ["No admitted approximation domain."],
        },
        errorContract: { kind: "exact", expression: null },
        provenanceIds: ["provenance:user-proposal"],
      },
    ];

    const codes = issueCodes(validateCasimirSpecScientificClaimIrV1(unsafe));
    expect(codes).toContain("bridge_authority_invalid");
    expect(codes).toContain("bridge_error_contract_missing");
    expect(codes).toContain("bridge_endpoint_invalid");
  });

  it("requires bridge endpoints and observable semantics in claim closure", () => {
    const unsafe = cloneFixture() as unknown as Record<string, any>;
    unsafe.world.graphId = "graph:fixture";
    unsafe.world.badgeIds = ["badge:fixture"];
    const destination = structuredClone(unsafe.observables[0]);
    destination.observableId = "observable:destination";
    destination.canonicalObservableId = "observable:canonical-destination";
    unsafe.observables.push(destination);
    unsafe.bridges = [
      {
        bridgeId: "bridge:missing-claim-endpoint",
        fromObservableId: "observable:concentration-lab",
        toObservableId: "observable:destination",
        kind: "identity",
        authority: "registered",
        registration: {
          graphId: "graph:fixture",
          edgeId: "edge:missing-claim-endpoint",
          edgeSemanticSha256: "a".repeat(64),
        },
        reversible: false,
        inverseBridgeId: null,
        assumptionIds: [],
        validityDomain: {
          scaleLog10M: null,
          frameDefinitionIds: ["definition:lab-frame"],
          conditions: ["Fixture-only candidate bridge."],
        },
        errorContract: { kind: "exact", expression: null },
        provenanceIds: ["provenance:user-proposal"],
      },
    ];
    unsafe.claims[0].bridgeIds = ["bridge:missing-claim-endpoint"];

    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(unsafe)),
    ).toContain("claim_bridge_observable_dependency_undeclared");
  });

  it("rejects executable admission with unknown coverage or unresolved units", () => {
    const unsafe = cloneFixture();
    unsafe.claims[0].axes.computational = {
      status: "executable",
      reason: null,
      blockerIds: [],
    };
    unsafe.symbols[0].unitBinding = {
      status: "unresolved",
      unit: null,
      dimensions: null,
    };
    unsafe.observables[0].unitBinding = {
      status: "unresolved",
      unit: null,
      dimensions: null,
    };

    const codes = issueCodes(validateCasimirSpecScientificClaimIrV1(unsafe));
    expect(codes).toContain("executable_requires_external_semantic_admission");
    expect(codes).toContain("coverage_claim_inconsistent");
    expect(codes).toContain("executable_unit_unresolved");
  });

  it("refuses to build a typed, hash-consistent artifact from invalid source IR", async () => {
    const unsafe = cloneFixture();
    unsafe.claims[0].axes.computational = {
      status: "executable",
      reason: null,
      blockerIds: [],
    };

    await expect(
      buildCasimirSpecScientificClaimIrV1(
        unsafe as unknown as Parameters<
          typeof buildCasimirSpecScientificClaimIrV1
        >[0],
      ),
    ).rejects.toThrow(/executable_requires_external_semantic_admission/u);
  });

  it("rejects source-IR empirical promotion even with a self-labelled receipt", () => {
    const unsafe = cloneFixture();
    unsafe.provenanceLedger.push({
      provenanceId: "provenance:forged-observation",
      kind: "observation_receipt",
      locator: "forged://observation",
      contentSha256: "b".repeat(64),
      fragment: null,
      citation: null,
    });
    unsafe.provenanceLedger.sort((left, right) =>
      left.provenanceId < right.provenanceId ? -1 : 1,
    );
    unsafe.claims[0].axes.scientific = {
      status: "measured",
      receiptProvenanceIds: ["provenance:forged-observation"],
    };

    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(unsafe)),
    ).toContain("scientific_status_external_receipt_required");

    const formalPromotion = cloneFixture();
    formalPromotion.claims[0].axes.scientific.status =
      "formal_model_consequence";
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(formalPromotion)),
    ).toContain("scientific_status_external_formal_certificate_required");

    const representedPromotion = cloneFixture();
    representedPromotion.world.graphId = "graph:self-attested";
    representedPromotion.world.badgeIds = ["badge:self-attested"];
    representedPromotion.claims[0].axes.coverage = {
      status: "represented",
      blockerIds: [],
    };
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(representedPromotion)),
    ).toContain("represented_coverage_requires_external_semantic_admission");
  });

  it("requires baseline claim exclusions", () => {
    const unsafe = cloneFixture();
    unsafe.claims[0].excludedClaimIds =
      unsafe.claims[0].excludedClaimIds.filter(
        (id) => id !== "excluded:physical-truth",
      );

    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(unsafe)),
    ).toContain("excluded_claims_incomplete");
  });

  it("rejects hidden axioms and raw or unadmitted expression nodes", () => {
    const hiddenAxiom = cloneFixture() as unknown as Record<string, any>;
    hiddenAxiom.axiomLedger.hiddenAxiomsAllowed = true;
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(hiddenAxiom)),
    ).toContain("hidden_axioms_forbidden");

    const rawBackend = cloneFixture() as unknown as Record<string, any>;
    rawBackend.claims[0].proposition = {
      kind: "raw_lean",
      source: "by exact True.intro",
    };
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(rawBackend)),
    ).toContain("expression_kind_invalid");

    const unadmittedOperator = cloneFixture() as unknown as Record<string, any>;
    unadmittedOperator.claims[0].proposition = {
      kind: "apply",
      operatorId: "unbound.catalog::unsafe",
      arguments: [],
    };
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(unadmittedOperator)),
    ).toContain("operator_not_admitted");

    const hiddenAxiomDependency = cloneFixture() as unknown as Record<
      string,
      any
    >;
    hiddenAxiomDependency.claims[0].observableIds = [];
    hiddenAxiomDependency.claims[0].definitionIds =
      hiddenAxiomDependency.claims[0].definitionIds.filter(
        (id: string) => id !== "definition:observation",
      );
    hiddenAxiomDependency.axiomLedger.entries.push({
      axiomId: "axiom:hidden-definition-dependency",
      foundationId: "foundation:lean4-unpinned",
      displayStatement: "Axiom with a definition dependency.",
      typeExpression: {
        kind: "definition_ref",
        definitionId: "definition:observation",
      },
      typeExpressionSha256: "f".repeat(64),
      provenanceIds: ["provenance:user-proposal"],
    });
    hiddenAxiomDependency.claims[0].allowedAxiomIds = [
      "axiom:hidden-definition-dependency",
    ];
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(hiddenAxiomDependency)),
    ).toContain("claim_definition_dependency_undeclared");

    const crossFoundationAxiom = cloneFixture() as unknown as Record<
      string,
      any
    >;
    crossFoundationAxiom.foundations.push({
      foundationId: "foundation:other",
      formalSystem: "Other",
      formalSystemVersion: "1",
      logicProfileId: "other-logic",
      profileSemanticSha256: "d".repeat(64),
      environmentLockProvenanceId: "provenance:user-proposal",
      provenanceIds: ["provenance:user-proposal"],
    });
    crossFoundationAxiom.axiomLedger.entries.push({
      axiomId: "axiom:other",
      foundationId: "foundation:other",
      displayStatement: "Other-foundation axiom.",
      typeExpression: {
        kind: "rational_literal",
        numerator: "1",
        denominator: "1",
      },
      typeExpressionSha256: "e".repeat(64),
      provenanceIds: ["provenance:user-proposal"],
    });
    crossFoundationAxiom.claims[0].allowedAxiomIds = ["axiom:other"];
    expect(
      issueCodes(validateCasimirSpecScientificClaimIrV1(crossFoundationAxiom)),
    ).toContain("claim_axiom_foundation_mismatch");
  });

  it("rejects every claim-boundary authority escalation", () => {
    const unsafe = cloneFixture() as unknown as {
      claimBoundary: Record<string, boolean>;
    };
    for (const field of [
      "humanRenderingAuthority",
      "semanticIdentityAuthority",
      "executesTools",
      "validatesTheory",
      "validatesPhysicalMechanism",
      "proofAuthority",
      "empiricalAuthority",
      "implementationCorrectnessAuthority",
      "promotionAllowed",
      "assistantAnswer",
      "terminalEligible",
    ]) {
      const candidate = structuredClone(unsafe);
      candidate.claimBoundary[field] = true;
      expect(
        issueCodes(validateCasimirSpecScientificClaimIrV1(candidate)),
      ).toContain("claim_boundary_false_required");
    }
  });

  it("detects proposition and whole-IR tampering", async () => {
    const unsafe = cloneFixture();
    if (unsafe.claims[0].proposition.kind !== "apply")
      throw new Error("fixture drift");
    unsafe.claims[0].proposition.operatorId = "casimir.core::add";

    expect(isCasimirSpecScientificClaimIrStructurallyValidV1(unsafe)).toBe(
      true,
    );
    expect(await isCasimirSpecScientificClaimIrIntegrityValidV1(unsafe)).toBe(
      false,
    );

    const codes = issueCodes(
      await validateCasimirSpecScientificClaimIrIntegrityV1(unsafe),
    );
    expect(codes).toContain("claim_proposition_sha256_mismatch");
    expect(codes).toContain("ir_semantic_sha256_mismatch");
    expect(codes).toContain("ir_artifact_sha256_mismatch");
  });

  it("separates stable semantic identity from volatile artifact metadata", async () => {
    const baselineInput = cloneFixture();
    baselineInput.source.kind = "parsed_surface";
    baselineInput.source.artifact = {
      path: "fixtures/original.casimir-spec",
      sha256: "c".repeat(64),
    };
    const baseline =
      await unsafeSealCasimirSpecScientificClaimIrV1(baselineInput);
    const modified = structuredClone(baseline);
    modified.generatedAt = "2026-07-21T00:00:01.000Z";
    modified.title = "Relocated human-readable presentation";
    modified.source.artifact.path = "fixtures/relocated.casimir-spec";
    modified.symbols[0].displayName = "concentration (presentation only)";
    modified.definitions[0].display = "Presentation-only definition wording.";
    modified.claims[0].displayStatement =
      "Presentation-only claim wording that has no semantic authority.";
    modified.claims[0].sourceMap[0].displayFragment =
      "presentation-only fragment";
    const resealed = await unsafeSealCasimirSpecScientificClaimIrV1(modified);

    expect(resealed.semanticSha256).toBe(baseline.semanticSha256);
    expect(resealed.artifactSha256).not.toBe(baseline.artifactSha256);
    expect(
      await validateCasimirSpecScientificClaimIrIntegrityV1(resealed),
    ).toEqual([]);
    expect(
      await verifyCasimirSpecScientificClaimIrSemanticCommitmentV1(
        resealed,
        baseline.semanticSha256,
      ),
    ).toEqual([]);
    expect(
      issueCodes(
        await verifyCasimirSpecScientificClaimIrCommitmentsV1(resealed, {
          semanticSha256: baseline.semanticSha256,
          artifactSha256: baseline.artifactSha256,
        }),
      ),
    ).toContain("ir_external_artifact_commitment_sha256_mismatch");
  });

  it("detects a recomputed self-hash against an external commitment", async () => {
    const originalCommitment = goldenFixture.semanticSha256;
    const modified = cloneFixture();
    modified.claims[0].maturityCeiling = "diagnostic";
    const resealed = await unsafeSealCasimirSpecScientificClaimIrV1(modified);

    expect(
      await validateCasimirSpecScientificClaimIrIntegrityV1(resealed),
    ).toEqual([]);
    expect(
      issueCodes(
        await verifyCasimirSpecScientificClaimIrSemanticCommitmentV1(
          resealed,
          originalCommitment,
        ),
      ),
    ).toContain("ir_external_commitment_sha256_mismatch");
  });

  it("keeps the six-arm benchmark draft visibly unfrozen and result-free", () => {
    expect(benchmarkPolicy.status).toBe("draft_design_no_results_not_frozen");
    expect(benchmarkPolicy.freezeState.preregistered).toBe(false);
    expect(benchmarkPolicy.freezeState.frozen).toBe(false);
    expect(benchmarkPolicy.freezeState.blockers.length).toBeGreaterThan(0);
    expect(benchmarkPolicy.arms).toHaveLength(6);
    expect(new Set(benchmarkPolicy.arms.map((arm) => arm.id)).size).toBe(6);
    expect(
      benchmarkPolicy.externalConsumerSurfacePolicy.gptPlusPrimaryBaseline,
    ).toBe(false);
    expect(benchmarkPolicy.pairing.seeds).toEqual([7, 11, 13]);
    expect(benchmarkPolicy.caseDesign.totalCaseCount).toBe(1320);
    expect(benchmarkPolicy.caseDesign.heldoutCaseCount).toBe(990);
    expect(benchmarkPolicy.primaryMetric.artifactFormatRewarded).toBe(false);
    expect(benchmarkPolicy.humanComprehensionStudy.includedInVcr).toBe(false);
    expect(
      benchmarkPolicy.promotionCriteria
        .minimumPointEstimateAbsoluteVcrImprovement,
    ).toBe(0.05);
    expect(benchmarkPolicy.promotionCriteria.requiredTamperDetectionRate).toBe(
      1,
    );
    expect(benchmarkPolicy.claimBoundary.resultsExist).toBe(false);
    expect(benchmarkPolicy.claimBoundary.preregistered).toBe(false);
    expect(benchmarkPolicy.claimBoundary.promotionAllowedBeforeFrozenRun).toBe(
      false,
    );
  });
});
