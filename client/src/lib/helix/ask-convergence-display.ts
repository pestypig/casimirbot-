import type {
  ContextCapsuleMaturityState,
  ContextCapsuleProofState,
  ContextCapsuleSourceState,
} from "@shared/helix-context-capsule";

export const CONVERGENCE_SOURCE_LABEL: Record<ContextCapsuleSourceState, string> = {
  atlas_exact: "atlas exact",
  repo_exact: "repo exact",
  open_world: "open-world",
  unknown: "unknown",
};

export const CONVERGENCE_PROOF_LABEL: Record<ContextCapsuleProofState, string> = {
  confirmed: "confirmed",
  reasoned: "reasoned",
  hypothesis: "hypothesis",
  unknown: "unknown",
  fail_closed: "fail-closed",
};

export const CONVERGENCE_MATURITY_LABEL: Record<ContextCapsuleMaturityState, string> = {
  exploratory: "exploratory",
  reduced_order: "reduced-order",
  diagnostic: "diagnostic",
  certified: "certified",
};
