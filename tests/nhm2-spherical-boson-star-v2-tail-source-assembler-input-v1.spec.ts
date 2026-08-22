import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_LITERAL_SEAL_STATUS,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SELF_HASH_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SEMANTIC_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_VERSION,
  nhm2SphericalBosonStarV2TailSourceAssemblerInputV1CalculateSelfHash,
  nhm2SphericalBosonStarV2TailSourceAssemblerInputV1WireViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-tail-source-assembler-input.v1";

const canonical = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
};

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const endpoint = (
  direction: "RNDD" | "RNDU",
  sign: "minus" | "plus" | "zero" = "zero",
  mantissaLowercaseHex = "0",
  exponent2 = 0,
) => ({ direction, exponent2, mantissaLowercaseHex, precisionBits: 256, sign });

const interval = () => ({ lower: endpoint("RNDD"), upper: endpoint("RNDU") });

const modelEntry = (coordinate: "nu" | "m" | "c") => ({
  coordinate,
  model: {
    basis: "Chebyshev_T_j_on_t_lambda_in_[-1,1]",
    coefficientCount: 33,
    coefficients: Array.from({ length: 33 }, interval),
    degree: 32,
    residualNormUpper: endpoint("RNDU"),
    weightExact: "17/16",
  },
});

const unsignedFixture = (cellOrdinal = 0) => ({
  authorityFalse: true,
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANDIDATE_ID,
  cellOrdinal,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_VERSION,
  orderedParameterModels: [modelEntry("nu"), modelEntry("m"), modelEntry("c")],
  tailSourceAssemblerInputSemanticSha256:
    NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SEMANTIC_SHA256,
});

const sealedFixture = (unsigned = unsignedFixture()) => {
  const unsignedWire = canonical(unsigned);
  return {
    ...unsigned,
    selfSha256:
      nhm2SphericalBosonStarV2TailSourceAssemblerInputV1CalculateSelfHash(
        unsignedWire,
      ),
  };
};

const recursivelyAll = (
  value: unknown,
  predicate: (leaf: unknown) => boolean,
): boolean => {
  if (value === null || typeof value !== "object") return predicate(value);
  return Object.values(value as Record<string, unknown>).every((child) =>
    recursivelyAll(child, predicate),
  );
};

describe("NHM2 spherical boson-star v2 tail source assembler input v1", () => {
  it("pins every exact predecessor raw byte identity and endpoint semantic wire", () => {
    for (const binding of Object.values(
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1.exactDependencyBindings,
    )) {
      if (!("relativePath" in binding)) continue;
      const bytes = readFileSync(binding.relativePath);
      expect(bytes.byteLength).toBe(binding.sizeBytes);
      expect(sha256(bytes)).toBe(binding.rawSha256);
    }
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1
        .exactDependencyBindings.scalarJetWire,
    ).toMatchObject({
      semanticSha256:
        "858e83405870b2a6bb170b42f9b85817f7cfd9413e6206faba1fbbd1ae27826d",
      canonicalSizeBytes: 12_234,
      exactCoefficientCount: 9,
      exactSparseTermCount: 516,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1
        .exactDependencyBindings.endpointQuotientWire,
    ).toMatchObject({
      semanticSha256:
        "c19b4795d314597d72d18ab8ad6e8dbfe55d16f58f31472402fff548417022a7",
      canonicalSizeBytes: 99_867,
      exactCoefficientCount: 17,
      exactSparseTermCount: 3_053,
    });
  });

  it("freezes one derived lambda map and exactly three ordered parameter models", () => {
    const contract =
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1;
    expect(contract.cellSchedule.exactCellOrdinals).toEqual(
      Array.from({ length: 1_024 }, (_, ordinal) => ordinal),
    );
    expect(contract.cellSchedule).toMatchObject({
      lambdaInterval: "[cellOrdinal*2^-15,(cellOrdinal+1)*2^-15]",
      lambdaAffineModel: "lambda(t)=((2*cellOrdinal+1)*2^-16)+(2^-16)*T_1(t)",
      lambdaIsDerivedFromCellOrdinal: true,
      lambdaMayBeCallerSupplied: false,
    });
    expect(contract.parameterModelSchema.orderedCoordinates).toEqual([
      "nu",
      "m",
      "c",
    ]);
    expect(
      contract.parameterModelSchema.fullIndependentCoordinateOrder,
    ).toEqual(["lambda", "nu", "m", "c"]);
    expect(contract.exactInputInventory).toMatchObject({
      exactTopLevelBindingCount: 1,
      exactOrderedParameterModelCount: 3,
      exactOrderedParameterRoles: ["nu", "m", "c"],
      finiteScalarJetIsDerivedFromFrozenWire: true,
      endpointQuotientIsDerivedFromFrozenWire: true,
    });
  });

  it("accepts one exact canonical self-hashed cell input", () => {
    const unsigned = unsignedFixture(1_023);
    const unsignedWire = canonical(unsigned);
    const expectedHash = createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SELF_HASH_DOMAIN,
        "utf8",
      )
      .update(
        (() => {
          const length = Buffer.alloc(8);
          length.writeBigUInt64LE(BigInt(Buffer.byteLength(unsignedWire)));
          return length;
        })(),
      )
      .update(unsignedWire, "utf8")
      .digest("hex");
    expect(
      nhm2SphericalBosonStarV2TailSourceAssemblerInputV1CalculateSelfHash(
        unsignedWire,
      ),
    ).toBe(expectedHash);
    expect(
      nhm2SphericalBosonStarV2TailSourceAssemblerInputV1WireViolations(
        canonical(sealedFixture(unsigned)),
      ),
    ).toEqual([]);
  });

  it("rejects cell, order, count, interval, residual, and self-hash drift", () => {
    const cases: unknown[] = [];
    cases.push(sealedFixture(unsignedFixture(-1)));
    cases.push(sealedFixture(unsignedFixture(1_024)));

    const wrongOrder = unsignedFixture();
    wrongOrder.orderedParameterModels = [
      modelEntry("m"),
      modelEntry("nu"),
      modelEntry("c"),
    ];
    cases.push(sealedFixture(wrongOrder));

    const wrongCount = unsignedFixture();
    wrongCount.orderedParameterModels[0].model.coefficients.pop();
    cases.push(sealedFixture(wrongCount));

    const reversed = unsignedFixture();
    reversed.orderedParameterModels[1].model.coefficients[0] = {
      lower: endpoint("RNDD", "plus", "3", -1),
      upper: endpoint("RNDU", "plus", "1", -1),
    };
    cases.push(sealedFixture(reversed));

    const negativeResidual = unsignedFixture();
    negativeResidual.orderedParameterModels[2].model.residualNormUpper =
      endpoint("RNDU", "minus", "1", -4);
    cases.push(sealedFixture(negativeResidual));

    const extremeReversed = unsignedFixture();
    extremeReversed.orderedParameterModels[0].model.coefficients[0] = {
      lower: endpoint("RNDD", "plus", "1", 1_073_741_823),
      upper: endpoint("RNDU", "plus", "1", -1_073_741_823),
    };
    cases.push(sealedFixture(extremeReversed));

    const exponentOutOfRange = unsignedFixture();
    exponentOutOfRange.orderedParameterModels[0].model.coefficients[0] = {
      lower: endpoint("RNDD", "zero", "0", 0),
      upper: endpoint("RNDU", "plus", "1", 1_073_741_824),
    };
    cases.push(sealedFixture(exponentOutOfRange));

    for (const value of cases) {
      expect(
        nhm2SphericalBosonStarV2TailSourceAssemblerInputV1WireViolations(
          canonical(value),
        ),
      ).toEqual(["tail_source_input_semantic_or_model_invalid"]);
    }

    const valid = sealedFixture();
    expect(
      nhm2SphericalBosonStarV2TailSourceAssemblerInputV1WireViolations(
        canonical({ ...valid, selfSha256: "0".repeat(64) }),
      ),
    ).toEqual(["tail_source_input_self_hash_mismatch"]);
  });

  it("forbids caller-supplied lambda and every derived physical quantity", () => {
    const forbiddenKeys = [
      "lambda",
      "s",
      "k",
      "w2",
      "sigma",
      "d",
      "b",
      "z",
      "finiteScalarJet",
      "sourceValues",
      "runtime",
      "path",
    ];
    for (const key of forbiddenKeys) {
      const value = { ...sealedFixture(), [key]: "forbidden" };
      expect(
        nhm2SphericalBosonStarV2TailSourceAssemblerInputV1WireViolations(
          canonical(value),
        ),
      ).toEqual(["tail_source_input_canonical_schema_required"]);
    }
  });

  it("is total and trap-free at primitive ingress", () => {
    let ownKeys = 0;
    const hostile = new Proxy(
      {},
      {
        ownKeys: () => {
          ++ownKeys;
          throw new Error("must not enumerate");
        },
      },
    );
    expect(
      nhm2SphericalBosonStarV2TailSourceAssemblerInputV1WireViolations(hostile),
    ).toEqual(["tail_source_input_primitive_string_required"]);
    expect(ownKeys).toBe(0);

    let getterReads = 0;
    const accessor = Object.defineProperty({}, "x", {
      get: () => {
        ++getterReads;
        return 1;
      },
    });
    expect(
      nhm2SphericalBosonStarV2TailSourceAssemblerInputV1WireViolations(
        accessor,
      ),
    ).toEqual(["tail_source_input_primitive_string_required"]);
    expect(getterReads).toBe(0);

    expect(
      nhm2SphericalBosonStarV2TailSourceAssemblerInputV1WireViolations(
        ` ${canonical(sealedFixture())}`,
      ),
    ).toEqual(["tail_source_input_canonical_schema_required"]);
    expect(
      nhm2SphericalBosonStarV2TailSourceAssemblerInputV1WireViolations(
        "[".repeat(1_000) + "0" + "]".repeat(1_000),
      ),
    ).toEqual(["tail_source_input_canonical_schema_required"]);
    expect(
      nhm2SphericalBosonStarV2TailSourceAssemblerInputV1WireViolations(
        String.raw`{"x":"\ud800"}`,
      ),
    ).toEqual(["tail_source_input_canonical_schema_required"]);
  });

  it("keeps every instance null and every readiness, authority, and lamp false", () => {
    const contract =
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1;
    expect(recursivelyAll(contract.instances, (leaf) => leaf === null)).toBe(
      true,
    );
    expect(recursivelyAll(contract.readiness, (leaf) => leaf === false)).toBe(
      true,
    );
    expect(
      recursivelyAll(contract.authorityLocks, (leaf) => leaf === false),
    ).toBe(true);
    expect(contract.blockers).toEqual([
      "parameter_center_producer_not_implemented",
      "ordered_1024_cell_input_instances_absent",
      "native_all_cover_consumer_not_implemented",
      "authenticated_runtime_and_persistence_issuer_absent",
      "independent_full_audit_absent",
    ]);
  });

  it("independently recomputes the acknowledged semantic/plain/size seal", () => {
    expect(
      canonical(
        JSON.parse(
          NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_JSON,
        ),
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_JSON,
    );
    expect(
      sha256(
        NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SEMANTIC_SHA256_DOMAIN +
          NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_JSON,
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_SEMANTIC_SHA256,
    );
    expect(
      sha256(
        NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_JSON,
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_PLAIN_CANONICAL_SHA256,
    );
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_JSON,
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_CANONICAL_SIZE_BYTES,
    );
    expect([
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_SEMANTIC_SHA256,
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    ]).toEqual([
      "c90de09dacfb6ed7507dcc1a56f19b28a7bc4dcac4996c9da7066a47e178f9e7",
      "1433ac8efacb99867d518295c92dad11c0bebc7b646ab340c48e0f6364acf3d3",
      10_136,
    ]);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_TAIL_SOURCE_ASSEMBLER_INPUT_V1_LITERAL_SEAL_STATUS,
    ).toBe(
      "sealed_after_independent_parent_acknowledgement_before_parameter_center_producer_implementation",
    );
  });
});
