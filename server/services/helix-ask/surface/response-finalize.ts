type MutableResult = Record<string, unknown> & {
  proof?: unknown;
};

type MutableDebugPayload = Record<string, unknown> | null | undefined;

type ArbiterAnswerArtifacts = {
  provenance_class?: string | null;
  claim_tier?: string | null;
  certifying?: boolean | null;
  fail_reason?: string | null;
};

export const applyFinalFailureClassification = (args: {
  result: MutableResult;
  strictConceptFailReason?: string | null;
  strictReadyFailReason?: string | null;
}): void => {
  if (args.strictConceptFailReason) {
    args.result.fail_reason = args.strictConceptFailReason;
    args.result.fail_class = "input_contract";
    return;
  }
  if (args.strictReadyFailReason) {
    args.result.fail_reason = args.strictReadyFailReason;
    args.result.fail_class = "input_contract";
  }
};

export const buildFinalResponseObservability = (args: {
  result: MutableResult;
  debugPayload: MutableDebugPayload;
  arbiterAnswerArtifacts: ArbiterAnswerArtifacts;
  strictReadyFailReason?: string | null;
  buildConvergenceVerificationMeta: (args: {
    verdict?: string | null;
    certificateHash?: string | null;
    certificateIntegrityOk?: boolean | null;
  }) => Record<string, unknown>;
  buildConvergenceEpistemicMeta: (args?: {
    arbiterMode?: string;
    claimTier?: string | null;
    provenanceClass?: string | null;
    certifying?: boolean | null;
    failReason?: string | null;
  }) => Record<string, unknown>;
  buildConvergenceIntentMeta: () => Record<string, unknown>;
}): {
  finalProofRecord: {
    verdict?: string;
    certificate?: { certificateHash?: string | null; integrityOk?: boolean | null } | null;
  } | null;
  finalVerificationMeta: Record<string, unknown>;
  epistemicMeta: Record<string, unknown>;
  intentMeta: Record<string, unknown>;
} => {
  const finalProofRecord =
    args.result.proof && typeof args.result.proof === "object"
      ? (args.result.proof as {
          verdict?: string;
          certificate?: { certificateHash?: string | null; integrityOk?: boolean | null } | null;
        })
      : null;
  const finalVerificationMeta = args.buildConvergenceVerificationMeta({
    verdict: finalProofRecord?.verdict ?? null,
    certificateHash: finalProofRecord?.certificate?.certificateHash ?? null,
    certificateIntegrityOk: finalProofRecord?.certificate?.integrityOk ?? null,
  });
  const epistemicMeta = args.buildConvergenceEpistemicMeta({
    arbiterMode:
      typeof args.debugPayload?.arbiter_mode === "string" ? args.debugPayload.arbiter_mode : undefined,
    claimTier: args.arbiterAnswerArtifacts.claim_tier ?? null,
    provenanceClass: args.arbiterAnswerArtifacts.provenance_class ?? null,
    certifying: args.arbiterAnswerArtifacts.certifying ?? null,
    failReason: args.strictReadyFailReason ?? args.arbiterAnswerArtifacts.fail_reason ?? null,
  });
  return {
    finalProofRecord,
    finalVerificationMeta,
    epistemicMeta,
    intentMeta: args.buildConvergenceIntentMeta(),
  };
};
