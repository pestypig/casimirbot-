import {
  canonicalizeCasimirSpecValueV1,
  computeCasimirSpecValueSha256V1,
  validateCasimirSpecScientificClaimIrIntegrityV1,
  type CasimirSpecExpressionV1,
  type CasimirSpecFrameBindingV1,
  type CasimirSpecScientificClaimIrV1,
  type CasimirSpecUnitBindingV1,
} from "../../../shared/contracts/casimir-spec-scientific-claim-ir.v1";
import type {
  TheoryBadgeObservableBridgeKindV1,
  TheoryBadgeObservableMathematicalTypeV1,
} from "../../../shared/contracts/theory-badge-graph.v1";

export const CASIMIR_SPEC_SEMANTIC_ADMISSION_RECEIPT_SCHEMA_VERSION =
  "casimir_spec_semantic_admission_receipt/v1" as const;

export type CasimirSpecSemanticCatalogEntryV1 = {
  entryId: string;
  entrySemanticSha256: string;
  semanticId: string;
  typeExpression: string;
  mathematicalType: TheoryBadgeObservableMathematicalTypeV1;
  unitBinding: CasimirSpecUnitBindingV1;
  frameBinding: CasimirSpecFrameBindingV1;
};

export type CasimirSpecSemanticCatalogSnapshotV1 = {
  catalogId: string;
  version: string;
  semanticSha256: string;
  entries: CasimirSpecSemanticCatalogEntryV1[];
};

export type CasimirSpecRegisteredIdentityBindingV1 = {
  bindingId: string;
  bindingSha256: string;
  semanticId: string;
  typeExpression: string;
  mathematicalType: TheoryBadgeObservableMathematicalTypeV1;
  unitBinding: CasimirSpecUnitBindingV1;
  frameBinding: CasimirSpecFrameBindingV1;
  provenanceIds: string[];
};

export type CasimirSpecSemanticGraphEdgeV1 = {
  edgeId: string;
  edgeSemanticSha256: string;
  fromObservableId: string;
  toObservableId: string;
  kind: TheoryBadgeObservableBridgeKindV1;
};

export type CasimirSpecSemanticGraphSnapshotV1 = {
  graphId: string;
  snapshotSha256: string;
  badgeIds: string[];
  edges: CasimirSpecSemanticGraphEdgeV1[];
};

export type CasimirSpecSemanticAdmissionIssueV1 = {
  code:
    | "claim_ir_integrity_invalid"
    | "catalog_snapshot_missing"
    | "catalog_snapshot_mismatch"
    | "catalog_entry_missing"
    | "catalog_entry_mismatch"
    | "registered_binding_missing"
    | "registered_binding_mismatch"
    | "graph_snapshot_missing"
    | "graph_snapshot_mismatch"
    | "graph_badge_missing"
    | "graph_bridge_missing"
    | "graph_bridge_mismatch"
    | "operator_arity_invalid"
    | "dimension_equation_mismatch"
    | "frame_equation_mismatch";
  path: string;
  detail: string;
};

export type CasimirSpecSemanticAdmissionReceiptV1 = {
  schemaVersion: typeof CASIMIR_SPEC_SEMANTIC_ADMISSION_RECEIPT_SCHEMA_VERSION;
  generatedAt: string;
  receiptId: string;
  claimIrSemanticSha256: string;
  claimIrArtifactSha256: string;
  graphSnapshotSha256: string | null;
  catalogSnapshotSha256s: string[];
  registeredBindingSha256s: string[];
  disposition: "admitted" | "admitted_with_declared_blockers" | "rejected";
  issues: CasimirSpecSemanticAdmissionIssueV1[];
  declaredBlockerIds: string[];
  receiptSha256: string;
  claimBoundary: {
    verifiesDeclaredSnapshotBindingsOnly: true;
    semanticIntentAuthority: false;
    graphCompletenessAuthority: false;
    proofAuthority: false;
    numericalAuthority: false;
    empiricalAuthority: false;
    physicalTruthAuthority: false;
    assistantAnswer: false;
    terminalEligible: false;
    postToolModelStepRequired: true;
  };
};

const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const canonicalEqual = (left: unknown, right: unknown): boolean =>
  canonicalizeCasimirSpecValueV1(left) ===
  canonicalizeCasimirSpecValueV1(right);

const CORE_OPERATOR_ARITY: Record<string, number | "at_least_two"> = {
  "casimir.core::add": "at_least_two",
  "casimir.core::and": "at_least_two",
  "casimir.core::declares": 1,
  "casimir.core::eq": 2,
  "casimir.core::field": "at_least_two",
  "casimir.core::frame_definition": 0,
  "casimir.core::ge": 2,
  "casimir.core::implies": 2,
  "casimir.core::is_constant": 1,
  "casimir.core::mul": "at_least_two",
  "casimir.core::neg": 1,
  "casimir.core::partial_t": 1,
  "casimir.core::partial_x": 1,
  "casimir.core::partial_xx": 1,
};

const DIMENSION_KEYS = [
  "mass",
  "length",
  "time",
  "current",
  "temperature",
  "amount",
  "luminousIntensity",
] as const;

type Rational = { numerator: bigint; denominator: bigint };
type RationalDimensions = Record<(typeof DIMENSION_KEYS)[number], Rational>;
type ExpressionSignature = {
  dimensions: RationalDimensions | null;
  boundFrameIds: Set<string>;
};

const gcd = (left: bigint, right: bigint): bigint => {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a === 0n ? 1n : a;
};

function rational(numerator: bigint, denominator = 1n): Rational {
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator, denominator);
  return {
    numerator: (numerator * sign) / divisor,
    denominator: (denominator * sign) / divisor,
  };
}

function parseRational(value: string): Rational {
  const [numerator, denominator] = value.split("/");
  return rational(BigInt(numerator), BigInt(denominator ?? "1"));
}

function addRational(left: Rational, right: Rational): Rational {
  return rational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function dimensionsFromBinding(
  binding: CasimirSpecUnitBindingV1,
): RationalDimensions | null {
  if (binding.dimensions === null) return null;
  return Object.fromEntries(
    DIMENSION_KEYS.map((key) => [
      key,
      parseRational(binding.dimensions?.[key] ?? "0"),
    ]),
  ) as RationalDimensions;
}

function addDimensions(
  left: RationalDimensions,
  right: RationalDimensions,
): RationalDimensions {
  return Object.fromEntries(
    DIMENSION_KEYS.map((key) => [key, addRational(left[key], right[key])]),
  ) as RationalDimensions;
}

function subtractDimension(
  dimensions: RationalDimensions,
  key: "length" | "time",
  amount: bigint,
): RationalDimensions {
  return {
    ...dimensions,
    [key]: addRational(dimensions[key], rational(-amount)),
  };
}

function dimensionsEqual(
  left: RationalDimensions,
  right: RationalDimensions,
): boolean {
  return DIMENSION_KEYS.every(
    (key) =>
      left[key].numerator === right[key].numerator &&
      left[key].denominator === right[key].denominator,
  );
}

function displayDimensions(dimensions: RationalDimensions): string {
  return DIMENSION_KEYS.map((key) => {
    const exponent = dimensions[key];
    const value =
      exponent.denominator === 1n
        ? `${exponent.numerator}`
        : `${exponent.numerator}/${exponent.denominator}`;
    return `${key}=${value}`;
  }).join(",");
}

function frameIdsFromBinding(binding: CasimirSpecFrameBindingV1): Set<string> {
  return binding.status === "bound"
    ? new Set([binding.frameDefinitionId])
    : new Set();
}

function unionFrames(signatures: ExpressionSignature[]): Set<string> {
  return new Set(
    signatures.flatMap((signature) => [...signature.boundFrameIds]),
  );
}

function validateScientificExpressionSemantics(
  claimIr: CasimirSpecScientificClaimIrV1,
  issues: CasimirSpecSemanticAdmissionIssueV1[],
): void {
  const symbols = new Map(
    claimIr.symbols.map((symbol) => [symbol.symbolId, symbol]),
  );
  const definitions = new Map(
    claimIr.definitions.map((definition) => [
      definition.definitionId,
      definition,
    ]),
  );
  const definitionMemo = new Map<string, ExpressionSignature>();
  const definitionStack = new Set<string>();
  const dimensionless = dimensionsFromBinding({
    status: "dimensionless",
    unit: "1",
    dimensions: {
      mass: "0",
      length: "0",
      time: "0",
      current: "0",
      temperature: "0",
      amount: "0",
      luminousIntensity: "0",
    },
  });

  const evaluate = (
    expression: CasimirSpecExpressionV1,
    path: string,
  ): ExpressionSignature => {
    if (expression.kind === "symbol_ref") {
      const symbol = symbols.get(expression.symbolId);
      return {
        dimensions: symbol ? dimensionsFromBinding(symbol.unitBinding) : null,
        boundFrameIds: symbol
          ? frameIdsFromBinding(symbol.frameBinding)
          : new Set(),
      };
    }
    if (expression.kind === "definition_ref") {
      const memo = definitionMemo.get(expression.definitionId);
      if (memo) return memo;
      const definition = definitions.get(expression.definitionId);
      if (!definition || definitionStack.has(expression.definitionId)) {
        return { dimensions: null, boundFrameIds: new Set() };
      }
      definitionStack.add(expression.definitionId);
      const signature = evaluate(
        definition.expression,
        `${path}.definition(${expression.definitionId})`,
      );
      definitionStack.delete(expression.definitionId);
      definitionMemo.set(expression.definitionId, signature);
      return signature;
    }
    if (
      expression.kind === "assumption_ref" ||
      expression.kind === "axiom_ref"
    ) {
      return { dimensions: dimensionless, boundFrameIds: new Set() };
    }
    if (expression.kind === "rational_literal") {
      return { dimensions: dimensionless, boundFrameIds: new Set() };
    }
    if (expression.kind === "binder") {
      return evaluate(expression.body, `${path}.body`);
    }

    const argumentSignatures = expression.arguments.map((argument, index) =>
      evaluate(argument, `${path}.arguments[${index}]`),
    );
    const operatorId = expression.operatorId;
    const checkComparable = (): void => {
      const knownDimensions = argumentSignatures
        .map((signature, index) => ({
          dimensions: signature.dimensions,
          expression: expression.arguments[index],
        }))
        .filter(
          (entry) =>
            !(
              entry.expression?.kind === "rational_literal" &&
              BigInt(entry.expression.numerator) === 0n
            ),
        )
        .map((entry) => entry.dimensions)
        .filter(
          (dimensions): dimensions is RationalDimensions => dimensions !== null,
        );
      if (
        knownDimensions.length > 1 &&
        knownDimensions
          .slice(1)
          .some(
            (dimensions) => !dimensionsEqual(knownDimensions[0], dimensions),
          )
      ) {
        issues.push({
          code: "dimension_equation_mismatch",
          path,
          detail: `${operatorId} compares or combines incompatible dimensions: ${knownDimensions
            .map(displayDimensions)
            .join(" | ")}`,
        });
      }
      const frames = unionFrames(argumentSignatures);
      if (frames.size > 1) {
        issues.push({
          code: "frame_equation_mismatch",
          path,
          detail: `${operatorId} compares or combines quantities bound to different frames: ${[...frames].sort(compareCodeUnits).join(",")}`,
        });
      }
    };

    if (
      operatorId === "casimir.core::add" ||
      operatorId === "casimir.core::eq" ||
      operatorId === "casimir.core::ge"
    ) {
      checkComparable();
    }
    if (
      operatorId === "casimir.core::eq" ||
      operatorId === "casimir.core::ge" ||
      operatorId === "casimir.core::and" ||
      operatorId === "casimir.core::implies" ||
      operatorId === "casimir.core::is_constant"
    ) {
      return { dimensions: dimensionless, boundFrameIds: new Set() };
    }
    if (operatorId === "casimir.core::mul") {
      const known = argumentSignatures.map((signature) => signature.dimensions);
      const allKnown = known.every(
        (dimensions): dimensions is RationalDimensions => dimensions !== null,
      );
      return {
        dimensions: allKnown
          ? (known as RationalDimensions[]).reduce(addDimensions)
          : null,
        boundFrameIds: unionFrames(argumentSignatures),
      };
    }
    const first = argumentSignatures[0] ?? {
      dimensions: null,
      boundFrameIds: new Set<string>(),
    };
    if (operatorId === "casimir.core::partial_t" && first.dimensions !== null) {
      return {
        ...first,
        dimensions: subtractDimension(first.dimensions, "time", 1n),
      };
    }
    if (operatorId === "casimir.core::partial_x" && first.dimensions !== null) {
      return {
        ...first,
        dimensions: subtractDimension(first.dimensions, "length", 1n),
      };
    }
    if (
      operatorId === "casimir.core::partial_xx" &&
      first.dimensions !== null
    ) {
      return {
        ...first,
        dimensions: subtractDimension(first.dimensions, "length", 2n),
      };
    }
    return first;
  };

  claimIr.definitions.forEach((definition, index) =>
    evaluate(
      definition.expression,
      `$.claimIr.definitions[${index}].expression`,
    ),
  );
  claimIr.assumptions.forEach((assumption, index) =>
    evaluate(
      assumption.proposition,
      `$.claimIr.assumptions[${index}].proposition`,
    ),
  );
  claimIr.axiomLedger.entries.forEach((axiom, index) =>
    evaluate(
      axiom.typeExpression,
      `$.claimIr.axiomLedger.entries[${index}].typeExpression`,
    ),
  );
  claimIr.claims.forEach((claim, index) =>
    evaluate(claim.proposition, `$.claimIr.claims[${index}].proposition`),
  );
}

function validateExpressionArities(
  expression: unknown,
  path: string,
  issues: CasimirSpecSemanticAdmissionIssueV1[],
): void {
  if (
    !expression ||
    typeof expression !== "object" ||
    Array.isArray(expression)
  )
    return;
  const record = expression as Record<string, unknown>;
  if (record.kind === "apply" && typeof record.operatorId === "string") {
    const argumentsValue = Array.isArray(record.arguments)
      ? record.arguments
      : [];
    const expected = CORE_OPERATOR_ARITY[record.operatorId];
    if (
      (typeof expected === "number" && argumentsValue.length !== expected) ||
      (expected === "at_least_two" && argumentsValue.length < 2)
    ) {
      issues.push({
        code: "operator_arity_invalid",
        path,
        detail:
          expected === "at_least_two"
            ? `${record.operatorId} requires at least two arguments`
            : `${record.operatorId} requires exactly ${expected} arguments`,
      });
    }
    argumentsValue.forEach((argument, index) =>
      validateExpressionArities(
        argument,
        `${path}.arguments[${index}]`,
        issues,
      ),
    );
  } else if (record.kind === "binder") {
    validateExpressionArities(record.body, `${path}.body`, issues);
  }
}

function symbolSignature(symbol: {
  typeExpression: string;
  mathematicalType: TheoryBadgeObservableMathematicalTypeV1;
  unitBinding: CasimirSpecUnitBindingV1;
  frameBinding: CasimirSpecFrameBindingV1;
}): object {
  return {
    typeExpression: symbol.typeExpression,
    mathematicalType: symbol.mathematicalType,
    unitBinding: symbol.unitBinding,
    frameBinding: symbol.frameBinding,
  };
}

export async function admitCasimirSpecScientificClaimIrV1(input: {
  claimIr: CasimirSpecScientificClaimIrV1;
  generatedAt: string;
  receiptId: string;
  catalogSnapshots: CasimirSpecSemanticCatalogSnapshotV1[];
  registeredIdentityBindings: CasimirSpecRegisteredIdentityBindingV1[];
  graphSnapshot: CasimirSpecSemanticGraphSnapshotV1 | null;
}): Promise<CasimirSpecSemanticAdmissionReceiptV1> {
  const issues: CasimirSpecSemanticAdmissionIssueV1[] = [];
  const integrityIssues = await validateCasimirSpecScientificClaimIrIntegrityV1(
    input.claimIr,
  );
  issues.push(
    ...integrityIssues.map((detail) => ({
      code: "claim_ir_integrity_invalid" as const,
      path: "$.claimIr",
      detail,
    })),
  );

  const catalogs = new Map(
    input.catalogSnapshots.map((snapshot) => [snapshot.catalogId, snapshot]),
  );
  for (const [index, binding] of input.claimIr.catalogBindings.entries()) {
    const snapshot = catalogs.get(binding.catalogId);
    if (!snapshot) {
      issues.push({
        code: "catalog_snapshot_missing",
        path: `$.claimIr.catalogBindings[${index}]`,
        detail: `missing server-owned snapshot ${binding.catalogId}`,
      });
    } else if (
      snapshot.version !== binding.version ||
      snapshot.semanticSha256 !== binding.semanticSha256
    ) {
      issues.push({
        code: "catalog_snapshot_mismatch",
        path: `$.claimIr.catalogBindings[${index}]`,
        detail: `snapshot commitment does not match ${binding.catalogId}`,
      });
    }
  }

  const registered = new Map(
    input.registeredIdentityBindings.map((binding) => [
      binding.bindingId,
      binding,
    ]),
  );
  for (const [index, symbol] of input.claimIr.symbols.entries()) {
    if (symbol.identity.kind === "catalog") {
      const identity = symbol.identity;
      const snapshot = catalogs.get(identity.catalogId);
      const entry = snapshot?.entries.find(
        (candidate) => candidate.entryId === identity.entryId,
      );
      if (!entry) {
        issues.push({
          code: "catalog_entry_missing",
          path: `$.claimIr.symbols[${index}].identity`,
          detail: `missing catalog entry ${identity.entryId}`,
        });
      } else if (
        entry.entrySemanticSha256 !== identity.entrySemanticSha256 ||
        entry.semanticId !== identity.semanticId ||
        !canonicalEqual(symbolSignature(entry), symbolSignature(symbol))
      ) {
        issues.push({
          code: "catalog_entry_mismatch",
          path: `$.claimIr.symbols[${index}].identity`,
          detail: `catalog identity or scientific signature does not match ${identity.entryId}`,
        });
      }
    } else if (symbol.identity.kind === "registered") {
      const binding = registered.get(symbol.identity.bindingId);
      if (!binding) {
        issues.push({
          code: "registered_binding_missing",
          path: `$.claimIr.symbols[${index}].identity`,
          detail: `missing registered binding ${symbol.identity.bindingId}`,
        });
      } else if (
        binding.bindingSha256 !== symbol.identity.bindingSha256 ||
        binding.semanticId !== symbol.identity.semanticId ||
        !canonicalEqual(binding.provenanceIds, symbol.identity.provenanceIds) ||
        !canonicalEqual(symbolSignature(binding), symbolSignature(symbol))
      ) {
        issues.push({
          code: "registered_binding_mismatch",
          path: `$.claimIr.symbols[${index}].identity`,
          detail: `registered identity or scientific signature does not match ${symbol.identity.bindingId}`,
        });
      }
    }
  }

  if (input.claimIr.world.graphId !== null) {
    if (!input.graphSnapshot) {
      issues.push({
        code: "graph_snapshot_missing",
        path: "$.graphSnapshot",
        detail: `missing server-owned graph snapshot ${input.claimIr.world.graphId}`,
      });
    } else if (input.graphSnapshot.graphId !== input.claimIr.world.graphId) {
      issues.push({
        code: "graph_snapshot_mismatch",
        path: "$.graphSnapshot.graphId",
        detail: `expected ${input.claimIr.world.graphId}`,
      });
    } else {
      for (const badgeId of input.claimIr.world.badgeIds) {
        if (!input.graphSnapshot.badgeIds.includes(badgeId)) {
          issues.push({
            code: "graph_badge_missing",
            path: "$.claimIr.world.badgeIds",
            detail: `badge ${badgeId} is absent from the committed graph snapshot`,
          });
        }
      }
      for (const [index, bridge] of input.claimIr.bridges.entries()) {
        const edge = input.graphSnapshot.edges.find(
          (candidate) => candidate.edgeId === bridge.registration.edgeId,
        );
        if (!edge) {
          issues.push({
            code: "graph_bridge_missing",
            path: `$.claimIr.bridges[${index}].registration`,
            detail: `edge ${bridge.registration.edgeId} is absent`,
          });
        } else if (
          bridge.registration.graphId !== input.graphSnapshot.graphId ||
          bridge.registration.edgeSemanticSha256 !== edge.edgeSemanticSha256 ||
          bridge.fromObservableId !== edge.fromObservableId ||
          bridge.toObservableId !== edge.toObservableId ||
          bridge.kind !== edge.kind
        ) {
          issues.push({
            code: "graph_bridge_mismatch",
            path: `$.claimIr.bridges[${index}]`,
            detail: `bridge does not match committed edge ${edge.edgeId}`,
          });
        }
      }
    }
  } else if (input.graphSnapshot !== null) {
    issues.push({
      code: "graph_snapshot_mismatch",
      path: "$.graphSnapshot",
      detail:
        "claim IR declares no graph; an unsolicited snapshot cannot admit it",
    });
  }

  input.claimIr.definitions.forEach((definition, index) =>
    validateExpressionArities(
      definition.expression,
      `$.claimIr.definitions[${index}].expression`,
      issues,
    ),
  );
  input.claimIr.assumptions.forEach((assumption, index) =>
    validateExpressionArities(
      assumption.proposition,
      `$.claimIr.assumptions[${index}].proposition`,
      issues,
    ),
  );
  input.claimIr.axiomLedger.entries.forEach((axiom, index) =>
    validateExpressionArities(
      axiom.typeExpression,
      `$.claimIr.axiomLedger.entries[${index}].typeExpression`,
      issues,
    ),
  );
  input.claimIr.claims.forEach((claim, index) =>
    validateExpressionArities(
      claim.proposition,
      `$.claimIr.claims[${index}].proposition`,
      issues,
    ),
  );
  validateScientificExpressionSemantics(input.claimIr, issues);

  const declaredBlockerIds = input.claimIr.blockers
    .map((blocker) => blocker.blockerId)
    .sort(compareCodeUnits);
  const disposition: CasimirSpecSemanticAdmissionReceiptV1["disposition"] =
    issues.length > 0
      ? "rejected"
      : declaredBlockerIds.length > 0
        ? "admitted_with_declared_blockers"
        : "admitted";
  const unsigned = {
    schemaVersion: CASIMIR_SPEC_SEMANTIC_ADMISSION_RECEIPT_SCHEMA_VERSION,
    generatedAt: input.generatedAt,
    receiptId: input.receiptId,
    claimIrSemanticSha256: input.claimIr.semanticSha256,
    claimIrArtifactSha256: input.claimIr.artifactSha256,
    graphSnapshotSha256: input.graphSnapshot?.snapshotSha256 ?? null,
    catalogSnapshotSha256s: input.catalogSnapshots
      .map((snapshot) => snapshot.semanticSha256)
      .sort(compareCodeUnits),
    registeredBindingSha256s: input.registeredIdentityBindings
      .map((binding) => binding.bindingSha256)
      .sort(compareCodeUnits),
    disposition,
    issues,
    declaredBlockerIds,
    claimBoundary: {
      verifiesDeclaredSnapshotBindingsOnly: true as const,
      semanticIntentAuthority: false as const,
      graphCompletenessAuthority: false as const,
      proofAuthority: false as const,
      numericalAuthority: false as const,
      empiricalAuthority: false as const,
      physicalTruthAuthority: false as const,
      assistantAnswer: false as const,
      terminalEligible: false as const,
      postToolModelStepRequired: true as const,
    },
  };
  return {
    ...unsigned,
    receiptSha256: await computeCasimirSpecValueSha256V1(unsigned),
  };
}
