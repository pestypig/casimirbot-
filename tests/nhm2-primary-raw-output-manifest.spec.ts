import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES,
  type Nhm2PrimaryRawRoleContentPolicyV1,
} from "../shared/contracts/nhm2-primary-raw-content-policy.v1";

import {
  NHM2_PRIMARY_RAW_OUTPUT_FAMILY_DAG_ORDERING,
  NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS,
  NHM2_PRIMARY_RAW_OUTPUT_FILE_ORDERING,
  NHM2_PRIMARY_RAW_OUTPUT_INPUT_CLOSURE_ALGORITHM,
  NHM2_PRIMARY_RAW_OUTPUT_INPUT_ORDERING,
  NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID,
  NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION,
  NHM2_PRIMARY_RAW_OUTPUT_PARENT_FAMILIES,
  NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS,
  NHM2_PRIMARY_RAW_OUTPUT_SEMANTIC_ROLE_POLICIES,
  NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256,
  computeNhm2PrimaryRawOutputInputClosureSha256,
  isNhm2PrimaryRawOutputManifest,
  nhm2PrimaryRawOutputManifestViolations,
  type Nhm2PrimaryRawOutputFamilyId,
  type Nhm2PrimaryRawOutputFileV1,
  type Nhm2PrimaryRawOutputHashedInputV1,
  type Nhm2PrimaryRawOutputManifestV1,
  type Nhm2PrimaryRawOutputRepresentationKind,
} from "../shared/contracts/nhm2-primary-raw-output-manifest.v1";

const sha256 = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const utf8Compare = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const bind = (
  byId: ReadonlyMap<string, Nhm2PrimaryRawOutputHashedInputV1>,
  inputId: string,
) => {
  const entry = byId.get(inputId);
  if (entry == null) throw new Error(`Fixture input missing: ${inputId}`);
  return { inputId: entry.inputId, sha256: entry.sha256 };
};

const makeFile = (input: {
  familyId: Nhm2PrimaryRawOutputFamilyId;
  semanticRole: string;
  kind: Nhm2PrimaryRawOutputRepresentationKind;
  recordOrdinal: number;
}): Nhm2PrimaryRawOutputFileV1 => {
  const fileId = `${input.familyId}.${input.semanticRole}`;
  const contentPolicy = (
    NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES[input.familyId] as unknown as Record<
      string,
      Nhm2PrimaryRawRoleContentPolicyV1
    >
  )[input.semanticRole];
  if (contentPolicy == null)
    throw new Error(`Fixture content policy missing: ${fileId}`);
  if (input.kind === "numerical_array") {
    if (contentPolicy.kind !== "numerical_array") throw new Error();
    const path = `raw/${input.familyId}/${input.semanticRole}.f64le`;
    return {
      fileId,
      familyId: input.familyId,
      semanticRole: input.semanticRole,
      path,
      sha256: sha256(`contents:${path}`),
      sizeBytes:
        contentPolicy.minimumFirstAxis *
        contentPolicy.componentOrder.length *
        Float64Array.BYTES_PER_ELEMENT,
      mediaType: "application/octet-stream",
      representation: {
        kind: "numerical_array",
        dtype: "float64",
        encoding: "raw_ieee754",
        endianness: "little",
        shape: [
          contentPolicy.minimumFirstAxis,
          contentPolicy.componentOrder.length,
        ],
        storageOrder: "row-major",
        componentOrder: [...contentPolicy.componentOrder],
        unit: contentPolicy.unit,
      },
    };
  }
  if (contentPolicy.kind !== "records") throw new Error();
  const format = "ndjson" as const;
  const extension = "ndjson";
  const path = `raw/${input.familyId}/${input.semanticRole}.${extension}`;
  return {
    fileId,
    familyId: input.familyId,
    semanticRole: input.semanticRole,
    path,
    sha256: sha256(`contents:${path}`),
    sizeBytes: 128,
    mediaType: "application/x-ndjson",
    representation: {
      kind: "records",
      format,
      encoding: "utf8",
      recordMode: "record-stream",
      recordCount: contentPolicy.minimumRecordCount,
      schema: {
        schemaId: contentPolicy.schemaId,
        schemaVersion: contentPolicy.schemaVersion,
        primaryKey: [...contentPolicy.primaryKey],
        fields: contentPolicy.fields.map((entry) => ({ ...entry })),
      },
    },
  };
};

const completeManifest = (): Nhm2PrimaryRawOutputManifestV1 => {
  const requiredInputPaths: Record<string, string> = {
    [NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.candidateManifest]:
      "inputs/candidate-manifest.json",
    [NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.selectedProfile]:
      "inputs/selected-profile.json",
    [NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.chartDefinition]:
      "inputs/chart-definition.json",
    [NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.atlas]:
      "inputs/layered-ledger-atlas.json",
    [NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.units]:
      "inputs/units-definition.json",
    [NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.normalization]:
      "inputs/normalization-definition.json",
    [NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.solver]:
      "toolchain/primary-solver.bin",
    [NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.environment]:
      "toolchain/environment-lock.json",
    [NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.producerBundle]:
      "toolchain/primary-producer-bundle.mjs",
  };
  const inputs = Object.entries(requiredInputPaths)
    .map(([inputId, path]): Nhm2PrimaryRawOutputHashedInputV1 => ({
      inputId,
      path,
      sha256: sha256(`input:${inputId}:${path}`),
      sizeBytes: 64 + inputId.length,
      mediaType: path.endsWith(".json")
        ? "application/json"
        : "application/octet-stream",
    }))
    .sort((left, right) => utf8Compare(left.path, right.path));
  const inputsById = new Map(inputs.map((entry) => [entry.inputId, entry]));

  let recordOrdinal = 0;
  const files = NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS.flatMap((familyId) =>
    Object.entries(
      NHM2_PRIMARY_RAW_OUTPUT_SEMANTIC_ROLE_POLICIES[familyId],
    ).map(([semanticRole, kind]) =>
      makeFile({
        familyId,
        semanticRole,
        kind,
        recordOrdinal: recordOrdinal++,
      }),
    ),
  ).sort((left, right) => utf8Compare(left.path, right.path));

  const nodes = NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS.map((familyId) => ({
    familyId,
    parentFamilyIds: [...NHM2_PRIMARY_RAW_OUTPUT_PARENT_FAMILIES[familyId]],
    semanticRoles: Object.keys(
      NHM2_PRIMARY_RAW_OUTPUT_SEMANTIC_ROLE_POLICIES[familyId],
    ),
    fileIds: files
      .filter((file) => file.familyId === familyId)
      .map((file) => file.fileId)
      .sort(utf8Compare),
  }));

  return {
    artifactId: NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID,
    contractVersion: NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION,
    contentPolicy: {
      artifactId: "nhm2.primary_raw_content_policy",
      contractVersion: "nhm2_primary_raw_content_policy/v1",
      sha256: NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256,
    },
    generatedAt: "2026-07-19T18:00:01.000Z",
    identity: {
      candidateId: "candidate-alpha-0.7",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "profile-alpha-0.7",
      chartId: "nhm2-cartesian",
      candidateManifest: bind(
        inputsById,
        NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.candidateManifest,
      ),
      selectedProfile: bind(
        inputsById,
        NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.selectedProfile,
      ),
      chartDefinition: bind(
        inputsById,
        NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.chartDefinition,
      ),
      atlas: bind(inputsById, NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.atlas),
      units: bind(inputsById, NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.units),
      normalization: bind(
        inputsById,
        NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.normalization,
      ),
    },
    execution: {
      planRole: "primary_numerical",
      requestId: "primary-request-001",
      runId: "primary-run-001",
      runtimeId: "nhm2-primary-runtime",
      receiptId: "primary-receipt-001",
      sourceCommitSha: "a".repeat(40),
      solver: {
        solverId: "nhm2-primary-solver",
        solverVersion: "1.0.0",
        implementationId: "nhm2-primary-implementation",
        input: bind(
          inputsById,
          NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.solver,
        ),
      },
      environment: {
        environmentId: "nhm2-primary-environment",
        input: bind(
          inputsById,
          NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.environment,
        ),
      },
      producerBundle: {
        bundleId: "nhm2-primary-producer-bundle",
        input: bind(
          inputsById,
          NHM2_PRIMARY_RAW_OUTPUT_REQUIRED_INPUT_IDS.producerBundle,
        ),
      },
      invocation: {
        command: "node",
        argv: [
          "toolchain/primary-producer-bundle.mjs",
          "--run",
          "primary-run-001",
        ],
        workingDirectory: ".",
      },
      startedAt: "2026-07-19T18:00:00.000Z",
      completedAt: "2026-07-19T18:00:01.000Z",
      durationMs: 1000,
      deterministicSeed: "nhm2-primary-seed-001",
      exitCode: 0,
      terminationSignal: null,
    },
    inputClosure: {
      frozenBeforeExecution: true,
      digestAlgorithm: NHM2_PRIMARY_RAW_OUTPUT_INPUT_CLOSURE_ALGORITHM,
      ordering: NHM2_PRIMARY_RAW_OUTPUT_INPUT_ORDERING,
      entries: inputs,
      closureSha256: computeNhm2PrimaryRawOutputInputClosureSha256(inputs),
    },
    familyDag: {
      ordering: NHM2_PRIMARY_RAW_OUTPUT_FAMILY_DAG_ORDERING,
      nodes,
    },
    fileInventory: {
      ordering: NHM2_PRIMARY_RAW_OUTPUT_FILE_ORDERING,
      files,
    },
    claimBoundary: {
      rawOutputEvidenceOnly: true,
      scientificEvaluationExternal: true,
      scientificConclusionEncoded: false,
      theoryClosureClaimAllowed: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedClaimAllowed: false,
      empiricalReceiptsRequired: true,
    },
  };
};

const firstNumericalFile = (
  manifest: Nhm2PrimaryRawOutputManifestV1,
): Nhm2PrimaryRawOutputFileV1 => {
  const file = manifest.fileInventory.files.find(
    (entry) => entry.representation.kind === "numerical_array",
  );
  if (file == null) throw new Error("Fixture numerical file missing");
  return file;
};

const firstRecordFile = (
  manifest: Nhm2PrimaryRawOutputManifestV1,
): Nhm2PrimaryRawOutputFileV1 => {
  const file = manifest.fileInventory.files.find(
    (entry) => entry.representation.kind === "records",
  );
  if (file == null) throw new Error("Fixture record file missing");
  return file;
};

describe("NHM2 primary raw output manifest", () => {
  it("accepts an exact raw-only family DAG and complete replay inventory", () => {
    const manifest = completeManifest();

    expect(nhm2PrimaryRawOutputManifestViolations(manifest)).toEqual([]);
    expect(isNhm2PrimaryRawOutputManifest(manifest)).toBe(true);
    expect(manifest.familyDag.nodes.map((node) => node.familyId)).toEqual(
      NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS,
    );
    expect(manifest.claimBoundary).toMatchObject({
      scientificConclusionEncoded: false,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedClaimAllowed: false,
    });
    for (const familyId of NHM2_PRIMARY_RAW_OUTPUT_FAMILY_IDS) {
      expect(
        Object.keys(NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES[familyId]),
      ).toEqual(
        Object.keys(NHM2_PRIMARY_RAW_OUTPUT_SEMANTIC_ROLE_POLICIES[familyId]),
      );
    }
  });

  it("binds the exact content policy and marks producer-derived comparison values non-authoritative", () => {
    const wrongPolicy = completeManifest();
    wrongPolicy.contentPolicy.sha256 = sha256("different-policy");
    expect(nhm2PrimaryRawOutputManifestViolations(wrongPolicy)).toContain(
      "content_policy_binding_invalid",
    );

    expect(
      NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES.full_apparatus_source_tensor
        .residual_components.producerValueIsComparisonOnly,
    ).toBe(true);
    expect(
      NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES
        .finite_temperature_finite_geometry_maxwell_stress
        .electric_green_dyadic_components.producerValueIsComparisonOnly,
    ).toBe(false);
    expect(Object.isFrozen(NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES)).toBe(true);
    expect(
      Object.isFrozen(
        NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES.semiclassical_state
          .mode_basis_samples.componentOrder,
      ),
    ).toBe(true);
  });

  it("rejects producer-authored derived conclusion fields at any depth", () => {
    for (const fieldName of [
      "authority",
      "scientificStatus",
      "physicsPass",
      "theoryReady",
      "closureChecks",
      "runtimeBlockers",
    ]) {
      const manifest = completeManifest() as unknown as Record<string, unknown>;
      manifest[fieldName] = fieldName === "scientificStatus" ? "pass" : true;
      expect(nhm2PrimaryRawOutputManifestViolations(manifest)).toContain(
        `derived_field_forbidden:/${fieldName}`,
      );
    }

    const nested = completeManifest() as unknown as Record<string, unknown>;
    (nested.execution as Record<string, unknown>).scienceReady = true;
    expect(nhm2PrimaryRawOutputManifestViolations(nested)).toContain(
      "derived_field_forbidden:/execution/scienceReady",
    );
  });

  it("freezes all nine families, exact role vocabularies, and a topological acyclic DAG", () => {
    const missing = completeManifest();
    missing.familyDag.nodes.pop();
    expect(nhm2PrimaryRawOutputManifestViolations(missing)).toContain(
      "family_set_not_exact",
    );

    const changedRole = completeManifest();
    changedRole.familyDag.nodes[0].semanticRoles[0] = "derived_summary";
    expect(nhm2PrimaryRawOutputManifestViolations(changedRole)).toContain(
      "family_semantic_roles_invalid:/familyDag/nodes/0",
    );

    const futureParent = completeManifest();
    futureParent.familyDag.nodes[1].parentFamilyIds = ["observable_projection"];
    const violations = nhm2PrimaryRawOutputManifestViolations(futureParent);
    expect(violations).toContain(
      "family_parent_set_invalid:/familyDag/nodes/1",
    );
    expect(violations).toContain(
      "family_parent_not_topological:/familyDag/nodes/1",
    );
  });

  it("requires canonical portable raw family paths and unique sorted IDs and paths", () => {
    const traversal = completeManifest();
    traversal.fileInventory.files[0].path =
      "raw/semiclassical_state/../escape.f64le";
    expect(nhm2PrimaryRawOutputManifestViolations(traversal)).toContain(
      "file_raw_path_invalid:/fileInventory/files/0",
    );

    const absolute = completeManifest();
    absolute.fileInventory.files[0].path = "C:/raw/output.f64le";
    expect(nhm2PrimaryRawOutputManifestViolations(absolute)).toContain(
      "file_raw_path_invalid:/fileInventory/files/0",
    );

    const duplicate = completeManifest();
    duplicate.fileInventory.files[1].fileId =
      duplicate.fileInventory.files[0].fileId;
    expect(nhm2PrimaryRawOutputManifestViolations(duplicate)).toContain(
      "files_not_exact_sorted_unique",
    );
  });

  it("enforces float64 raw IEEE-754 little-endian row-major arrays with exact byte math", () => {
    const mutations: Array<(file: Nhm2PrimaryRawOutputFileV1) => void> = [
      (file) => {
        if (file.representation.kind === "numerical_array")
          (file.representation as { dtype: string }).dtype = "float32";
      },
      (file) => {
        if (file.representation.kind === "numerical_array")
          (file.representation as { encoding: string }).encoding = "text";
      },
      (file) => {
        if (file.representation.kind === "numerical_array")
          (file.representation as { endianness: string }).endianness = "big";
      },
      (file) => {
        if (file.representation.kind === "numerical_array")
          (file.representation as { storageOrder: string }).storageOrder =
            "column-major";
      },
    ];
    for (const mutate of mutations) {
      const manifest = completeManifest();
      mutate(firstNumericalFile(manifest));
      expect(
        nhm2PrimaryRawOutputManifestViolations(manifest).some((entry) =>
          entry.startsWith("numerical_encoding_invalid:"),
        ),
      ).toBe(true);
    }

    const wrongBytes = completeManifest();
    firstNumericalFile(wrongBytes).sizeBytes += 8;
    expect(
      nhm2PrimaryRawOutputManifestViolations(wrongBytes).some((entry) =>
        entry.startsWith("numerical_size_byte_math_mismatch:"),
      ),
    ).toBe(true);

    const badComponents = completeManifest();
    const numerical = firstNumericalFile(badComponents);
    if (numerical.representation.kind !== "numerical_array") throw new Error();
    numerical.representation.componentOrder = ["x", "x"];
    numerical.representation.shape = [2, 2];
    numerical.sizeBytes = 32;
    expect(
      nhm2PrimaryRawOutputManifestViolations(badComponents).some((entry) =>
        entry.startsWith("numerical_component_order_invalid:"),
      ),
    ).toBe(true);

    const unitless = completeManifest();
    const unitlessFile = firstNumericalFile(unitless);
    if (unitlessFile.representation.kind !== "numerical_array")
      throw new Error();
    unitlessFile.representation.unit = "";
    expect(
      nhm2PrimaryRawOutputManifestViolations(unitless).some((entry) =>
        entry.startsWith("numerical_unit_invalid:"),
      ),
    ).toBe(true);

    const vacuous = completeManifest();
    const vacuousFile = firstNumericalFile(vacuous);
    if (vacuousFile.representation.kind !== "numerical_array")
      throw new Error();
    vacuousFile.representation.shape[0] = 1;
    vacuousFile.sizeBytes =
      vacuousFile.representation.shape[1] * Float64Array.BYTES_PER_ELEMENT;
    expect(
      nhm2PrimaryRawOutputManifestViolations(vacuous).some((entry) =>
        entry.startsWith("numerical_shape_invalid:"),
      ),
    ).toBe(true);
  });

  it("requires exact JSON or NDJSON record schemas and forbids hidden disposition fields", () => {
    const manifest = completeManifest();
    expect(
      manifest.fileInventory.files.some(
        (file) =>
          file.representation.kind === "records" &&
          file.representation.format === "ndjson",
      ),
    ).toBe(true);

    const wrongMedia = completeManifest();
    const wrongMediaFile = firstRecordFile(wrongMedia);
    wrongMediaFile.mediaType = "application/json";
    expect(
      nhm2PrimaryRawOutputManifestViolations(wrongMedia).some((entry) =>
        entry.startsWith("record_file_format_invalid:"),
      ),
    ).toBe(true);

    const hiddenConclusion = completeManifest();
    const recordFile = firstRecordFile(hiddenConclusion);
    if (recordFile.representation.kind !== "records") throw new Error();
    recordFile.representation.schema.fields[0].name = "closure_status";
    expect(
      nhm2PrimaryRawOutputManifestViolations(hiddenConclusion).some((entry) =>
        entry.startsWith("record_schema_field_name_invalid:"),
      ),
    ).toBe(true);

    const nullableKey = completeManifest();
    const nullableKeyFile = firstRecordFile(nullableKey);
    const nullableRepresentation = nullableKeyFile.representation;
    if (nullableRepresentation.kind !== "records") throw new Error();
    nullableRepresentation.schema.fields.find(
      (entry) => entry.name === nullableRepresentation.schema.primaryKey[0],
    )!.nullable = true;
    expect(
      nhm2PrimaryRawOutputManifestViolations(nullableKey).some((entry) =>
        entry.startsWith("record_schema_primary_key_nullable:"),
      ),
    ).toBe(true);

    const tooFewRecords = completeManifest();
    const tooFewFile = firstRecordFile(tooFewRecords);
    if (tooFewFile.representation.kind !== "records") throw new Error();
    tooFewFile.representation.recordCount = 0;
    expect(
      nhm2PrimaryRawOutputManifestViolations(tooFewRecords).some((entry) =>
        entry.startsWith("record_encoding_invalid:"),
      ),
    ).toBe(true);
  });

  it("requires every family role to be covered and every inventory file to be DAG-reachable", () => {
    const roleGap = completeManifest();
    const node = roleGap.familyDag.nodes[0];
    node.fileIds.shift();
    const violations = nhm2PrimaryRawOutputManifestViolations(roleGap);
    expect(
      violations.some((entry) =>
        entry.startsWith(
          "family_semantic_role_cardinality_invalid:semiclassical_state:",
        ),
      ),
    ).toBe(true);
    expect(violations).toContain("file_inventory_not_exactly_reachable");

    const wrongOwner = completeManifest();
    const firstNode = wrongOwner.familyDag.nodes[0];
    const secondNode = wrongOwner.familyDag.nodes[1];
    firstNode.fileIds[0] = secondNode.fileIds[0];
    firstNode.fileIds.sort(utf8Compare);
    expect(
      nhm2PrimaryRawOutputManifestViolations(wrongOwner).some((entry) =>
        entry.startsWith("family_file_owner_mismatch:semiclassical_state:"),
      ),
    ).toBe(true);
  });

  it("cross-binds identity and execution inputs to an exact frozen input closure", () => {
    const hashMismatch = completeManifest();
    hashMismatch.identity.atlas.sha256 = "b".repeat(64);
    expect(nhm2PrimaryRawOutputManifestViolations(hashMismatch)).toContain(
      "input_binding_sha256_mismatch:/identity/atlas",
    );

    const unsorted = completeManifest();
    [unsorted.inputClosure.entries[0], unsorted.inputClosure.entries[1]] = [
      unsorted.inputClosure.entries[1],
      unsorted.inputClosure.entries[0],
    ];
    unsorted.inputClosure.closureSha256 =
      computeNhm2PrimaryRawOutputInputClosureSha256(
        unsorted.inputClosure.entries,
      );
    expect(nhm2PrimaryRawOutputManifestViolations(unsorted)).toContain(
      "input_entries_not_exact_sorted_unique",
    );

    const alteredClosure = completeManifest();
    alteredClosure.inputClosure.entries[0].sizeBytes += 1;
    expect(nhm2PrimaryRawOutputManifestViolations(alteredClosure)).toContain(
      "input_closure_sha256_mismatch",
    );

    const badInterval = completeManifest();
    badInterval.execution.durationMs = 999;
    expect(nhm2PrimaryRawOutputManifestViolations(badInterval)).toContain(
      "execution_interval_invalid",
    );
  });

  it("rejects any attempt to unlock theory, physical, transport, or speed claims", () => {
    for (const key of [
      "theoryClosureClaimAllowed",
      "physicalViabilityClaimAllowed",
      "transportClaimAllowed",
      "propulsionClaimAllowed",
      "routeEtaClaimAllowed",
      "speedClaimAllowed",
    ] as const) {
      const manifest = completeManifest();
      manifest.claimBoundary[key] = true as never;
      expect(nhm2PrimaryRawOutputManifestViolations(manifest)).toContain(
        "claim_boundary_invalid",
      );
    }
  });

  it("returns violations instead of throwing for malformed or cyclic unknown input", () => {
    const malformedParents = completeManifest() as unknown as {
      familyDag: { nodes: Array<Record<string, unknown>> };
    };
    malformedParents.familyDag.nodes[0].parentFamilyIds = null;
    malformedParents.familyDag.nodes[0].fileIds = 7;
    expect(() =>
      nhm2PrimaryRawOutputManifestViolations(malformedParents),
    ).not.toThrow();
    expect(nhm2PrimaryRawOutputManifestViolations(malformedParents)).toEqual(
      expect.arrayContaining([
        "family_parent_set_invalid:/familyDag/nodes/0",
        "family_file_ids_invalid:/familyDag/nodes/0",
      ]),
    );

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => nhm2PrimaryRawOutputManifestViolations(cyclic)).not.toThrow();
    expect(nhm2PrimaryRawOutputManifestViolations(cyclic)).toContain(
      "manifest_shape_invalid",
    );

    const malformedPath = completeManifest() as unknown as {
      fileInventory: { files: Array<Record<string, unknown>> };
    };
    malformedPath.fileInventory.files[0].path = 42;
    expect(() =>
      nhm2PrimaryRawOutputManifestViolations(malformedPath),
    ).not.toThrow();
    expect(nhm2PrimaryRawOutputManifestViolations(malformedPath)).toContain(
      "file_identity_invalid:/fileInventory/files/0",
    );
  });

  it("requires the exact input set, successful execution, and one unique file per role", () => {
    const extraInput = completeManifest();
    extraInput.inputClosure.entries.push({
      inputId: "undeclared-input",
      path: "inputs/undeclared.json",
      sha256: sha256("undeclared"),
      sizeBytes: 16,
      mediaType: "application/json",
    });
    extraInput.inputClosure.entries.sort((left, right) =>
      utf8Compare(left.path, right.path),
    );
    extraInput.inputClosure.closureSha256 =
      computeNhm2PrimaryRawOutputInputClosureSha256(
        extraInput.inputClosure.entries,
      );
    expect(nhm2PrimaryRawOutputManifestViolations(extraInput)).toContain(
      "input_entries_not_exact_sorted_unique",
    );

    const failedProcess = completeManifest();
    failedProcess.execution.exitCode = 1;
    failedProcess.execution.terminationSignal = "SIGTERM";
    expect(nhm2PrimaryRawOutputManifestViolations(failedProcess)).toContain(
      "execution_values_invalid",
    );

    const duplicateRole = completeManifest();
    const original = duplicateRole.fileInventory.files[0];
    const duplicate = structuredClone(original);
    duplicate.fileId = `${original.fileId}.duplicate`;
    duplicate.path = duplicate.path.replace(".f64le", ".duplicate.f64le");
    duplicate.sha256 = sha256(`duplicate:${duplicate.path}`);
    duplicateRole.fileInventory.files.push(duplicate);
    duplicateRole.fileInventory.files.sort((left, right) =>
      utf8Compare(left.path, right.path),
    );
    duplicateRole.familyDag.nodes
      .find((node) => node.familyId === duplicate.familyId)
      ?.fileIds.push(duplicate.fileId);
    duplicateRole.familyDag.nodes
      .find((node) => node.familyId === duplicate.familyId)
      ?.fileIds.sort(utf8Compare);
    expect(nhm2PrimaryRawOutputManifestViolations(duplicateRole)).toEqual(
      expect.arrayContaining([
        "files_not_exact_sorted_unique",
        `family_semantic_role_cardinality_invalid:${duplicate.familyId}:${duplicate.semanticRole}`,
      ]),
    );
  });
});
