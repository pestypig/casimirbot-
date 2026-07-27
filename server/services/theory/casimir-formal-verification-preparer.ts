import { randomUUID } from "node:crypto";

import {
  computeCasimirFormalVerificationPreparationReceiptSha256V1,
  validateCasimirFormalVerificationPreparationReceiptIntegrityV1,
  CASIMIR_FORMAL_VERIFICATION_PREPARATION_ARTIFACT_ID,
  CASIMIR_FORMAL_VERIFICATION_PREPARATION_SCHEMA_VERSION,
  type CasimirFormalPreparationMissingRequirementV1,
  type CasimirFormalPreparationRequirementCodeV1,
  type CasimirFormalVerificationPreparationReceiptV1,
} from "@shared/contracts/casimir-formal-verification-preparation.v1";
import {
  computeCasimirSpecValueSha256V1,
  validateCasimirSpecScientificClaimIrIntegrityV1,
  type CasimirSpecScientificClaimIrV1,
} from "@shared/contracts/casimir-spec-scientific-claim-ir.v1";
import {
  validateCasimirArtifactGenerationReceiptIntegrityV1,
  type CasimirArtifactGenerationReceiptV1,
} from "@shared/contracts/casimir-artifact-generation.v1";
import {
  THEORY_EXPERIMENT_PROCEDURE_HASH_DOMAIN,
  validateTheoryExperimentProcedureV1,
  type TheoryExperimentProcedureV1,
} from "@shared/contracts/theory-experiment-procedure.v1";

import type { CasimirFormalVerifierSealedInputV1 } from "./casimir-formal-verifier-job-service";
import {
  inspectCasimirFormalEnvironmentPolicyCatalogV1,
  resolveCasimirFormalEnvironmentPolicyCatalogEntryV1,
} from "./casimir-formal-environment-policy-catalog";

const CURRENT_TURN_ARTIFACT_SCHEMA = "helix.current_turn_artifact.v1";
const PROCEDURE_OBSERVATION_SCHEMA =
  "casimir.theory_experiment_procedure.observation.v1";
const SEMANTIC_ADMISSION_OBSERVATION_SCHEMA =
  "casimir.theory_semantic_admitter.observation.v1";
const LANYON_ADMISSION_OBSERVATION_SCHEMA =
  "casimir.theory_artifact_producer.lanyon_admission_observation.v1";
const SHA256 = /^[a-f0-9]{64}$/;

type RecordValue = Record<string, unknown>;

type StoredPreparation = {
  profileScope: string;
  receipt: CasimirFormalVerificationPreparationReceiptV1;
  sealedInput: CasimirFormalVerifierSealedInputV1 | null;
};

const preparations = new Map<string, StoredPreparation>();

const readRecord = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter(
          (entry): entry is string =>
            typeof entry === "string" && Boolean(entry.trim()),
        )
        .map((entry) => entry.trim())
    : [];

const profileScope = (
  profileId: string | null | undefined,
): string | null => readString(profileId);

const artifactIdentity = (payload: RecordValue): string | null =>
  readString(
    payload.artifact_id ??
      payload.artifactId ??
      payload.receipt_id ??
      payload.receiptId ??
      payload.procedure_id ??
      payload.procedureId,
  );

const artifactRefs = (envelope: RecordValue): string[] => {
  const payload = readRecord(envelope.payload);
  const receipt = readRecord(payload.receipt);
  const procedure = readRecord(payload.procedure);
  const semanticReceipt = readRecord(
    payload.semantic_admission_receipt ??
      payload.semanticAdmissionReceipt,
  );
  return Array.from(
    new Set(
      [
        readString(envelope.artifact_id ?? envelope.artifactId),
        ...readStringArray(
          envelope.produced_artifact_refs ??
            envelope.producedArtifactRefs,
        ),
        artifactIdentity(payload),
        readString(receipt.receiptId ?? receipt.receipt_id),
        readString(procedure.procedureId ?? procedure.procedure_id),
        readString(
          semanticReceipt.receiptId ?? semanticReceipt.receipt_id,
        ),
      ].filter((entry): entry is string => Boolean(entry)),
    ),
  );
};

const currentTurnCandidates = (input: {
  turnId: string;
  authoritativeEvidenceArtifacts?: unknown[];
  payloadSchema: string;
  artifactRef: string | null;
}): Array<{
  envelope: RecordValue;
  payload: RecordValue;
  refs: string[];
}> => {
  if (!Array.isArray(input.authoritativeEvidenceArtifacts)) return [];
  return input.authoritativeEvidenceArtifacts
    .map(readRecord)
    .filter(
      (envelope) =>
        envelope.schema === CURRENT_TURN_ARTIFACT_SCHEMA &&
        readString(envelope.turn_id ?? envelope.turnId) === input.turnId &&
        envelope.assistant_answer === false &&
        envelope.terminal_eligible === false,
    )
    .map((envelope) => ({
      envelope,
      payload: readRecord(envelope.payload),
      refs: artifactRefs(envelope),
    }))
    .filter(
      (candidate) =>
        candidate.payload.schema === input.payloadSchema &&
        candidate.payload.status === "succeeded" &&
        candidate.payload.assistant_answer === false &&
        candidate.payload.terminal_eligible === false &&
        (!input.artifactRef ||
          candidate.refs.includes(input.artifactRef)),
    );
};

const requirementMessages: Record<
  CasimirFormalPreparationRequirementCodeV1,
  {
    message: string;
    repairAction: CasimirFormalPreparationMissingRequirementV1["repairAction"];
  }
> = {
  formal_preparation_profile_id_required: {
    message:
      "Select an exact developer profile before preparing a reusable formal-verification request.",
    repairAction: "select_developer_profile",
  },
  authoritative_evidence_artifacts_required: {
    message:
      "Provide current-turn authoritative evidence artifacts; prompt text and copied payloads are not admissible evidence.",
    repairAction: "retrieve_authoritative_evidence",
  },
  authoritative_procedure_artifact_required: {
    message:
      "Prepare and re-enter an exact theory experiment procedure observation.",
    repairAction: "retrieve_authoritative_evidence",
  },
  authoritative_procedure_artifact_not_admitted: {
    message:
      "The requested procedure was not found in current-turn authoritative evidence.",
    repairAction: "retrieve_authoritative_evidence",
  },
  authoritative_procedure_artifact_ambiguous: {
    message:
      "More than one authoritative procedure matches; select its exact artifact reference.",
    repairAction: "retrieve_authoritative_evidence",
  },
  procedure_id_required: {
    message: "Bind the exact procedure ID before formal preparation.",
    repairAction: "retrieve_authoritative_evidence",
  },
  procedure_sha256_required: {
    message: "Bind the exact procedure SHA-256 before formal preparation.",
    repairAction: "retrieve_authoritative_evidence",
  },
  procedure_integrity_invalid: {
    message:
      "The selected procedure failed its structural or hash integrity checks.",
    repairAction: "retrieve_authoritative_evidence",
  },
  semantic_admission_artifact_required: {
    message:
      "Re-enter an admitted Casimir Spec semantic-claim observation.",
    repairAction: "retrieve_authoritative_evidence",
  },
  semantic_admission_artifact_not_admitted: {
    message:
      "The requested semantic-admission observation was not admitted in the current turn.",
    repairAction: "retrieve_authoritative_evidence",
  },
  semantic_admission_artifact_ambiguous: {
    message:
      "More than one semantic-admission observation matches; select its exact artifact reference.",
    repairAction: "retrieve_authoritative_evidence",
  },
  semantic_admission_integrity_invalid: {
    message:
      "The selected semantic claim IR or admission receipt failed integrity checks.",
    repairAction: "retrieve_authoritative_evidence",
  },
  artifact_generation_receipt_required: {
    message:
      "Admit and re-enter the exact formal-artifact producer receipt.",
    repairAction: "retrieve_authoritative_evidence",
  },
  artifact_generation_receipt_not_admitted: {
    message:
      "The requested artifact-generation receipt was not admitted in the current turn.",
    repairAction: "retrieve_authoritative_evidence",
  },
  artifact_generation_receipt_ambiguous: {
    message:
      "More than one artifact-generation receipt matches; select its exact artifact reference.",
    repairAction: "retrieve_authoritative_evidence",
  },
  artifact_generation_receipt_integrity_invalid: {
    message:
      "The selected artifact-generation receipt failed integrity checks.",
    repairAction: "retrieve_authoritative_evidence",
  },
  formal_claim_selection_required: {
    message:
      "Select one admitted semantic claim for the formal verification request.",
    repairAction: "select_claim",
  },
  formal_claim_selection_invalid: {
    message:
      "The requested claim is not present in the admitted semantic claim IR.",
    repairAction: "select_claim",
  },
  formal_theorem_selection_required: {
    message:
      "Select an exact theorem from a server-governed formal-artifact registry.",
    repairAction: "select_registered_theorem",
  },
  formal_theorem_selection_unregistered: {
    message:
      "The named theorem is only a caller hint and has no server-governed artifact binding.",
    repairAction: "select_registered_theorem",
  },
  formal_theorem_type_digest_required: {
    message:
      "Register the exact observed Lean theorem-type digest independently of the Casimir semantic proposition hash.",
    repairAction: "select_registered_theorem",
  },
  semantic_to_lean_binding_required: {
    message:
      "Register an inspected semantic-to-Lean translation binding; source correlation is not semantic equivalence.",
    repairAction: "register_semantic_binding",
  },
  formal_import_closure_required: {
    message:
      "Register the exact import source/object closure that the Lean process will actually load.",
    repairAction: "register_import_closure",
  },
  formal_environment_policy_catalog_unconfigured: {
    message:
      "Configure a server-owned formal environment-policy catalog with pinned executable and dependency closure.",
    repairAction: "register_environment_policy",
  },
  formal_environment_policy_unregistered: {
    message:
      "Select a formal environment policy registered by the server; caller-supplied self-hashed policies are not trust roots.",
    repairAction: "register_environment_policy",
  },
  formal_graph_snapshot_required: {
    message:
      "Bind the semantic claim and procedure to an admitted Theory Badge Graph snapshot hash.",
    repairAction: "register_graph_snapshot",
  },
  formal_source_root_unconfigured: {
    message:
      "Configure and admit the pinned producer source root before selecting a formal source.",
    repairAction: "configure_source_root",
  },
  formal_evidence_identity_mismatch: {
    message:
      "The admitted producer receipt does not bind the selected semantic claim identity.",
    repairAction: "retrieve_authoritative_evidence",
  },
};

const addRequirement = (
  requirements: CasimirFormalPreparationMissingRequirementV1[],
  code: CasimirFormalPreparationRequirementCodeV1,
): void => {
  if (requirements.some((entry) => entry.code === code)) return;
  requirements.push({ code, ...requirementMessages[code] });
};

async function validateProcedure(
  procedure: TheoryExperimentProcedureV1,
): Promise<string[]> {
  const issues = validateTheoryExperimentProcedureV1(procedure);
  const {
    procedureSha256: _ignored,
    artifactId: _artifactId,
    schemaVersion: _schemaVersion,
    ...unsigned
  } = procedure;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: THEORY_EXPERIMENT_PROCEDURE_HASH_DOMAIN,
    value: unsigned,
  });
  if (procedure.procedureSha256 !== expected) {
    issues.push("procedure_sha256_mismatch");
  }
  return issues;
}

const receiptIdentityIsBound = (input: {
  receipt: CasimirArtifactGenerationReceiptV1;
  claimIr: CasimirSpecScientificClaimIrV1;
  claimId: string;
  propositionSha256: string;
}): boolean =>
  input.receipt.request.casimirSpec.semanticSha256 ===
    input.claimIr.semanticSha256 &&
  input.receipt.request.casimirSpec.artifactSha256 ===
    input.claimIr.artifactSha256 &&
  input.receipt.request.claimId === input.claimId &&
  input.receipt.request.propositionSha256 === input.propositionSha256;

export type PrepareCasimirFormalVerificationRequestResultV1 = {
  ok: boolean;
  receipt: CasimirFormalVerificationPreparationReceiptV1;
};

export async function prepareCasimirFormalVerificationRequestV1(input: {
  profileId?: string | null;
  turnId: string;
  args: Record<string, unknown>;
  authoritativeEvidenceArtifacts?: unknown[];
}): Promise<PrepareCasimirFormalVerificationRequestResultV1> {
  const requirements: CasimirFormalPreparationMissingRequirementV1[] = [];
  const ownerProfileScope = profileScope(input.profileId);
  if (!ownerProfileScope) {
    addRequirement(
      requirements,
      "formal_preparation_profile_id_required",
    );
  }
  const procedureArtifactRef = readString(
    input.args.procedure_artifact_ref ??
      input.args.procedureArtifactRef,
  );
  const procedureId = readString(
    input.args.procedure_id ?? input.args.procedureId,
  );
  const procedureSha256 = readString(
    input.args.procedure_sha256 ?? input.args.procedureSha256,
  );
  const semanticAdmissionArtifactRef = readString(
    input.args.semantic_admission_artifact_ref ??
      input.args.semanticAdmissionArtifactRef,
  );
  const artifactGenerationArtifactRef = readString(
    input.args.artifact_generation_artifact_ref ??
      input.args.artifactGenerationArtifactRef,
  );
  const requestedClaimId = readString(
    input.args.claim_id ?? input.args.claimId,
  );
  const formalArtifactId = readString(
    input.args.formal_artifact_id ?? input.args.formalArtifactId,
  );
  const theoremName = readString(
    input.args.theorem_name ?? input.args.theoremName,
  );
  const environmentPolicyId = readString(
    input.args.environment_policy_id ??
      input.args.environmentPolicyId,
  );

  if (!Array.isArray(input.authoritativeEvidenceArtifacts)) {
    addRequirement(
      requirements,
      "authoritative_evidence_artifacts_required",
    );
  }
  if (!procedureId) addRequirement(requirements, "procedure_id_required");
  if (!procedureSha256 || !SHA256.test(procedureSha256)) {
    addRequirement(requirements, "procedure_sha256_required");
  }

  let admittedProcedureRef: string | null = null;
  if (!procedureArtifactRef) {
    addRequirement(
      requirements,
      "authoritative_procedure_artifact_required",
    );
  }
  if (procedureId && procedureSha256 && SHA256.test(procedureSha256)) {
    const candidates = currentTurnCandidates({
      turnId: input.turnId,
      authoritativeEvidenceArtifacts:
        input.authoritativeEvidenceArtifacts,
      payloadSchema: PROCEDURE_OBSERVATION_SCHEMA,
      artifactRef: procedureArtifactRef,
    }).filter((candidate) => {
      const procedure = readRecord(candidate.payload.procedure);
      return (
        procedure.procedureId === procedureId &&
        procedure.procedureSha256 === procedureSha256
      );
    });
    if (candidates.length === 0) {
      addRequirement(
        requirements,
        "authoritative_procedure_artifact_not_admitted",
      );
    } else if (candidates.length > 1) {
      addRequirement(
        requirements,
        "authoritative_procedure_artifact_ambiguous",
      );
    } else {
      const procedure = readRecord(
        candidates[0].payload.procedure,
      ) as TheoryExperimentProcedureV1;
      const issues = await validateProcedure(procedure);
      if (issues.length > 0) {
        addRequirement(requirements, "procedure_integrity_invalid");
      } else {
        admittedProcedureRef =
          procedureArtifactRef ?? candidates[0].refs[0] ?? null;
      }
    }
  }

  let admittedSemanticRef: string | null = null;
  let claimIr: CasimirSpecScientificClaimIrV1 | null = null;
  let selectedClaimId: string | null = null;
  let selectedPropositionSha256: string | null = null;
  let graphSnapshotSha256: string | null = null;
  if (!semanticAdmissionArtifactRef) {
    addRequirement(
      requirements,
      "semantic_admission_artifact_required",
    );
  }
  const semanticCandidates = currentTurnCandidates({
    turnId: input.turnId,
    authoritativeEvidenceArtifacts: input.authoritativeEvidenceArtifacts,
    payloadSchema: SEMANTIC_ADMISSION_OBSERVATION_SCHEMA,
    artifactRef: semanticAdmissionArtifactRef,
  });
  if (semanticCandidates.length === 0) {
    addRequirement(
      requirements,
      "semantic_admission_artifact_not_admitted",
    );
  } else if (semanticCandidates.length > 1) {
    addRequirement(
      requirements,
      "semantic_admission_artifact_ambiguous",
    );
  } else {
    const candidate = semanticCandidates[0];
    const candidateClaimIr = readRecord(
      candidate.payload.claim_ir ?? candidate.payload.claimIr,
    ) as CasimirSpecScientificClaimIrV1;
    const semanticReceipt = readRecord(
      candidate.payload.semantic_admission_receipt ??
        candidate.payload.semanticAdmissionReceipt,
    );
    const integrityIssues =
      await validateCasimirSpecScientificClaimIrIntegrityV1(
        candidateClaimIr,
      );
    const { receiptSha256: _ignored, ...unsignedReceipt } =
      semanticReceipt;
    const expectedReceiptSha256 =
      Object.keys(semanticReceipt).length > 0
        ? await computeCasimirSpecValueSha256V1(unsignedReceipt)
        : null;
    if (
      integrityIssues.length > 0 ||
      !["admitted", "admitted_with_declared_blockers"].includes(
        String(semanticReceipt.disposition),
      ) ||
      semanticReceipt.claimIrSemanticSha256 !==
        candidateClaimIr.semanticSha256 ||
      semanticReceipt.claimIrArtifactSha256 !==
        candidateClaimIr.artifactSha256 ||
      !expectedReceiptSha256 ||
      semanticReceipt.receiptSha256 !== expectedReceiptSha256
    ) {
      addRequirement(
        requirements,
        "semantic_admission_integrity_invalid",
      );
    } else {
      admittedSemanticRef =
        semanticAdmissionArtifactRef ?? candidate.refs[0] ?? null;
      claimIr = candidateClaimIr;
      graphSnapshotSha256 = readString(
        semanticReceipt.graphSnapshotSha256,
      );
      const selectedClaim = requestedClaimId
        ? claimIr.claims.find(
            (claim) => claim.claimId === requestedClaimId,
          )
        : claimIr.claims.length === 1
          ? claimIr.claims[0]
          : null;
      if (!selectedClaim) {
        addRequirement(
          requirements,
          requestedClaimId
            ? "formal_claim_selection_invalid"
            : "formal_claim_selection_required",
        );
      } else {
        selectedClaimId = selectedClaim.claimId;
        selectedPropositionSha256 =
          selectedClaim.propositionSha256;
      }
    }
  }
  if (
    !selectedClaimId &&
    !requirements.some(
      (requirement) =>
        requirement.code === "formal_claim_selection_invalid",
    )
  ) {
    addRequirement(requirements, "formal_claim_selection_required");
  }
  if (!graphSnapshotSha256) {
    addRequirement(requirements, "formal_graph_snapshot_required");
  }

  let admittedArtifactGenerationRef: string | null = null;
  let formalSourceSha256: string | null = null;
  if (!artifactGenerationArtifactRef) {
    addRequirement(
      requirements,
      "artifact_generation_receipt_required",
    );
  }
  const artifactCandidates = currentTurnCandidates({
    turnId: input.turnId,
    authoritativeEvidenceArtifacts: input.authoritativeEvidenceArtifacts,
    payloadSchema: LANYON_ADMISSION_OBSERVATION_SCHEMA,
    artifactRef: artifactGenerationArtifactRef,
  });
  if (artifactCandidates.length === 0) {
    addRequirement(
      requirements,
      "artifact_generation_receipt_not_admitted",
    );
    addRequirement(requirements, "formal_source_root_unconfigured");
  } else if (artifactCandidates.length > 1) {
    addRequirement(
      requirements,
      "artifact_generation_receipt_ambiguous",
    );
  } else {
    const candidate = artifactCandidates[0];
    const generationReceipt = readRecord(
      candidate.payload.receipt,
    ) as CasimirArtifactGenerationReceiptV1;
    const receiptIssues =
      await validateCasimirArtifactGenerationReceiptIntegrityV1(
        generationReceipt,
      );
    if (
      receiptIssues.length > 0 ||
      generationReceipt.run?.status !== "succeeded"
    ) {
      addRequirement(
        requirements,
        "artifact_generation_receipt_integrity_invalid",
      );
    } else {
      admittedArtifactGenerationRef =
        artifactGenerationArtifactRef ?? candidate.refs[0] ?? null;
      const formalArtifact = generationReceipt.artifacts.find(
        (artifact) => artifact.role === "formal_source",
      );
      formalSourceSha256 =
        readString(formalArtifact?.artifactSha256) ?? null;
      const bindings = readRecord(
        candidate.payload.artifactBindings ??
          candidate.payload.artifact_bindings,
      );
      if (
        !readString(
          bindings.formal_source_path ?? bindings.formalSourcePath,
        )
      ) {
        addRequirement(
          requirements,
          "formal_source_root_unconfigured",
        );
      }
      if (
        claimIr &&
        selectedClaimId &&
        selectedPropositionSha256 &&
        !receiptIdentityIsBound({
          receipt: generationReceipt,
          claimIr,
          claimId: selectedClaimId,
          propositionSha256: selectedPropositionSha256,
        })
      ) {
        addRequirement(
          requirements,
          "formal_evidence_identity_mismatch",
        );
      }
    }
  }

  addRequirement(
    requirements,
    theoremName
      ? "formal_theorem_selection_unregistered"
      : "formal_theorem_selection_required",
  );
  addRequirement(
    requirements,
    "formal_theorem_type_digest_required",
  );
  addRequirement(requirements, "semantic_to_lean_binding_required");
  addRequirement(requirements, "formal_import_closure_required");

  const catalog =
    inspectCasimirFormalEnvironmentPolicyCatalogV1();
  const environmentEntry =
    resolveCasimirFormalEnvironmentPolicyCatalogEntryV1(
      environmentPolicyId,
    );
  if (!catalog.configured) {
    addRequirement(
      requirements,
      "formal_environment_policy_catalog_unconfigured",
    );
  } else if (!environmentEntry) {
    addRequirement(
      requirements,
      "formal_environment_policy_unregistered",
    );
  }

  const generatedAt = new Date().toISOString();
  const preparedRequestId = `formal-preparation:${randomUUID()}`;
  const unsignedReceipt: Omit<
    CasimirFormalVerificationPreparationReceiptV1,
    "receiptSha256"
  > = {
    artifactId:
      CASIMIR_FORMAL_VERIFICATION_PREPARATION_ARTIFACT_ID,
    schemaVersion:
      CASIMIR_FORMAL_VERIFICATION_PREPARATION_SCHEMA_VERSION,
    generatedAt,
    preparedRequestId,
    sourceTurnId: input.turnId,
    disposition: "blocked",
    requestedBindings: {
      procedureArtifactRef,
      procedureId,
      procedureSha256,
      semanticAdmissionArtifactRef,
      artifactGenerationArtifactRef,
      claimId: requestedClaimId,
      formalArtifactId,
      theoremName,
      environmentPolicyId,
    },
    admittedBindings: {
      procedureArtifactRef: admittedProcedureRef,
      semanticAdmissionArtifactRef: admittedSemanticRef,
      artifactGenerationArtifactRef:
        admittedArtifactGenerationRef,
      claimId: selectedClaimId,
      claimPropositionSha256: selectedPropositionSha256,
      graphSnapshotSha256,
      formalSourceSha256,
      theoremTypeSha256: null,
      semanticToLeanBindingSha256: null,
      importClosureSha256: null,
      environmentPolicySha256:
        environmentEntry?.policyArtifactSha256 ?? null,
    },
    missingRequirements: requirements,
    preparedSealedInputSha256: null,
    authority: {
      evidenceOnly: true,
      serverOwnedPreparation: true,
      executesLean: false,
      executesTools: false,
      validatesScientificTruth: false,
      validatesSemanticEquivalence: false,
      proofAuthority: false,
      assistantAnswer: false,
      terminalEligible: false,
      postToolModelStepRequired: true,
    },
  };
  const receipt: CasimirFormalVerificationPreparationReceiptV1 = {
    ...unsignedReceipt,
    receiptSha256:
      await computeCasimirFormalVerificationPreparationReceiptSha256V1(
        unsignedReceipt,
      ),
  };
  if (ownerProfileScope) {
    preparations.set(preparedRequestId, {
      profileScope: ownerProfileScope,
      receipt,
      sealedInput: null,
    });
  }
  return { ok: false, receipt };
}

export type ResolveCasimirFormalPreparedRequestResultV1 = {
  ok: boolean;
  receipt: CasimirFormalVerificationPreparationReceiptV1 | null;
  sealedInput: CasimirFormalVerifierSealedInputV1 | null;
  issues: string[];
};

export async function resolveCasimirFormalPreparedRequestV1(input: {
  profileId?: string | null;
  preparedRequestId: string | null;
}): Promise<ResolveCasimirFormalPreparedRequestResultV1> {
  const ownerProfileScope = profileScope(input.profileId);
  if (!ownerProfileScope) {
    return {
      ok: false,
      receipt: null,
      sealedInput: null,
      issues: ["formal_prepared_request_profile_id_required"],
    };
  }
  if (!input.preparedRequestId) {
    return {
      ok: false,
      receipt: null,
      sealedInput: null,
      issues: ["formal_prepared_request_required"],
    };
  }
  const stored = preparations.get(input.preparedRequestId);
  if (!stored) {
    return {
      ok: false,
      receipt: null,
      sealedInput: null,
      issues: ["formal_prepared_request_not_found"],
    };
  }
  if (stored.profileScope !== ownerProfileScope) {
    return {
      ok: false,
      receipt: null,
      sealedInput: null,
      issues: ["formal_prepared_request_scope_mismatch"],
    };
  }
  const integrityIssues =
    await validateCasimirFormalVerificationPreparationReceiptIntegrityV1(
      stored.receipt,
    );
  if (integrityIssues.length > 0) {
    return {
      ok: false,
      receipt: stored.receipt,
      sealedInput: null,
      issues: [
        "formal_prepared_request_integrity_invalid",
        ...integrityIssues,
      ],
    };
  }
  if (
    stored.receipt.disposition !== "ready" ||
    !stored.sealedInput
  ) {
    return {
      ok: false,
      receipt: stored.receipt,
      sealedInput: null,
      issues: [
        "formal_prepared_request_not_ready",
        ...stored.receipt.missingRequirements.map(
          (requirement) => requirement.code,
        ),
      ],
    };
  }
  return {
    ok: true,
    receipt: stored.receipt,
    sealedInput: stored.sealedInput,
    issues: [],
  };
}

export const resetCasimirFormalVerificationPreparationStoreForTests =
  (): void => {
    preparations.clear();
  };
