import crypto from "node:crypto";
import {
  HELIX_LOCAL_SUPERVISOR_RESTART_SCHEMA,
  helixLocalSupervisorRestartCompletionInputSchema,
  helixLocalSupervisorRestartDispositionInputSchema,
  helixLocalSupervisorRestartOwnerDecisionInputSchema,
  helixLocalSupervisorRestartProposalInputSchema,
  type HelixLocalSupervisorRestartDisposition,
  type HelixLocalSupervisorRestartProposal,
} from "@shared/helix-local-supervisor-restart";
import type { HelixLocalSupervisorPresence } from
  "@shared/helix-local-supervisor-coordination";
import {
  HelixLocalSupervisorCoordinationError,
  HelixLocalSupervisorCoordinationStore,
} from "./local-supervisor-coordination";

const digest = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");
const clone = <T>(value: T): T =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value)) as T;

const isProtectedClaim = (
  claim: HelixLocalSupervisorPresence["resource_claims"][number],
): boolean => claim.collision_authority && (
  claim.claim_class === "retained_runtime" ||
  claim.claim_class === "mutation_lease_active"
);

type PrivateRestartProposal = HelixLocalSupervisorRestartProposal & {
  completionFingerprint: string | null;
};

export type HelixLocalSupervisorRestartCompletionCapability = Readonly<{
  kind: "trusted_local_supervisor_restart_completion";
}>;

export const createHelixLocalSupervisorRestartCompletionCapability =
  (): HelixLocalSupervisorRestartCompletionCapability => Object.freeze({
    kind: "trusted_local_supervisor_restart_completion",
  });

const publicProposal = (
  proposal: PrivateRestartProposal,
): HelixLocalSupervisorRestartProposal => {
  const { completionFingerprint: _private, ...publicValue } = proposal;
  return clone(publicValue);
};

export class HelixLocalSupervisorRestartCoordinator {
  private readonly proposals = new Map<string, PrivateRestartProposal>();
  private activeProposalRef: string | null = null;

  constructor(
    readonly serviceInstanceRef: string,
    readonly installedNodeOwnerProfileRef: string,
    private readonly coordination: HelixLocalSupervisorCoordinationStore,
    private readonly now: () => Date = () => new Date(),
    private readonly trustedCompletionCapability:
      HelixLocalSupervisorRestartCompletionCapability =
        createHelixLocalSupervisorRestartCompletionCapability(),
  ) {}

  private authenticate(input: {
    clientSessionRef: string;
    profileRef: string;
    accountSessionId: string;
  }): HelixLocalSupervisorPresence {
    return this.coordination.authenticateClient(input);
  }

  private requireProposal(proposalRef: string): PrivateRestartProposal {
    const proposal = this.proposals.get(proposalRef);
    if (!proposal) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_proposal_not_found",
        404,
      );
    }
    return proposal;
  }

  private activePresence(): HelixLocalSupervisorPresence[] {
    return this.coordination.listPresence().filter((entry) => entry.active);
  }

  private refresh(proposal: PrivateRestartProposal): PrivateRestartProposal {
    if (["completed", "cancelled", "expired"].includes(proposal.state)) {
      return proposal;
    }
    if (this.now().getTime() >= Date.parse(proposal.acknowledgement_deadline_at)) {
      proposal.state = "expired";
      proposal.authorization_ref = null;
      if (this.activeProposalRef === proposal.proposal_ref) this.activeProposalRef = null;
      return proposal;
    }

    const active = this.activePresence();
    for (const entry of active) {
      if (!proposal.affected_client_session_refs.includes(entry.client_session_ref)) {
        proposal.affected_client_session_refs.push(entry.client_session_ref);
      }
    }
    proposal.affected_client_session_refs.sort((left, right) => left.localeCompare(right));

    const activeRefs = new Set(active.map((entry) => entry.client_session_ref));
    const dispositions = new Map(
      proposal.dispositions.map((entry) => [entry.client_session_ref, entry]),
    );
    proposal.missing_acknowledgement_client_session_refs =
      proposal.affected_client_session_refs
        .filter((clientRef) => activeRefs.has(clientRef))
        .filter((clientRef) => dispositions.get(clientRef)?.disposition !== "acknowledge")
        .sort((left, right) => left.localeCompare(right));
    proposal.objection_client_session_refs = proposal.dispositions
      .filter((entry) => entry.disposition === "object" && activeRefs.has(entry.client_session_ref))
      .map((entry) => entry.client_session_ref)
      .sort((left, right) => left.localeCompare(right));
    proposal.protected_claim_refs = active
      .flatMap((entry) => entry.resource_claims.filter(isProtectedClaim))
      .map((claim) => claim.resource_ref)
      .filter((value, index, values) => values.indexOf(value) === index)
      .sort((left, right) => left.localeCompare(right));

    if (proposal.state === "authorized") return proposal;
    if (proposal.objection_client_session_refs.length > 0) {
      proposal.state = "blocked";
    } else if (proposal.owner_approved_at) {
      proposal.state = "draining";
    } else {
      proposal.state = "proposed";
    }
    return proposal;
  }

  propose(input: {
    profileRef: string;
    accountSessionId: string;
    proposal: unknown;
  }): HelixLocalSupervisorRestartProposal {
    const parsed = helixLocalSupervisorRestartProposalInputSchema.parse(input.proposal);
    if (parsed.expected_service_instance_ref !== this.serviceInstanceRef) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_service_instance_mismatch",
        409,
      );
    }
    if (this.activeProposalRef) {
      const existing = this.refresh(this.requireProposal(this.activeProposalRef));
      if (!["completed", "cancelled", "expired"].includes(existing.state)) {
        throw new HelixLocalSupervisorCoordinationError(
          "supervisor_restart_already_pending",
          409,
        );
      }
      this.activeProposalRef = null;
    }
    const proposer = this.authenticate({
      clientSessionRef: parsed.proposer_client_session_ref,
      profileRef: input.profileRef,
      accountSessionId: input.accountSessionId,
    });
    if (!proposer.active) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_proposer_inactive",
        409,
      );
    }
    const proposedAt = this.now();
    const proposalRef = `supervisor_restart_proposal:${digest(
      `${this.serviceInstanceRef}\n${proposer.client_session_ref}\n${proposedAt.toISOString()}`,
    ).slice(0, 32)}`;
    const proposal: PrivateRestartProposal = {
      schema: HELIX_LOCAL_SUPERVISOR_RESTART_SCHEMA,
      proposal_ref: proposalRef,
      service_instance_ref: this.serviceInstanceRef,
      proposer_client_session_ref: proposer.client_session_ref,
      proposer_profile_ref: proposer.authenticated_profile_ref,
      installed_node_owner_profile_ref: this.installedNodeOwnerProfileRef,
      reason_code: parsed.reason_code,
      state: "proposed",
      proposed_at: proposedAt.toISOString(),
      acknowledgement_deadline_at: new Date(
        proposedAt.getTime() + parsed.acknowledgement_deadline_seconds * 1000,
      ).toISOString(),
      affected_client_session_refs: this.activePresence()
        .map((entry) => entry.client_session_ref)
        .sort((left, right) => left.localeCompare(right)),
      dispositions: [{
        client_session_ref: proposer.client_session_ref,
        profile_ref: proposer.authenticated_profile_ref,
        disposition: "acknowledge",
        blocker_code: null,
        recorded_at: proposedAt.toISOString(),
      }],
      owner_approved_at: null,
      protected_claim_refs: [],
      missing_acknowledgement_client_session_refs: [],
      objection_client_session_refs: [],
      authorization_ref: null,
      authorization_consumed_at: null,
      completed_at: null,
      new_service_instance_ref: null,
      client_reconnect_required: false,
      room_grant_revalidation_required: false,
      prior_runtime_grants_valid: true,
      trusted_supervisor_consumption_required: true,
      advisory_relay_can_authorize_restart: false,
      arbitrary_process_control: false,
      environment_mutation_authority: false,
      credential_included: false,
      private_endpoint_included: false,
      process_identity_included: false,
      hidden_reasoning_included: false,
      content_role: "local_supervisor_restart_coordination_not_authority",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      completionFingerprint: null,
    };
    this.proposals.set(proposalRef, proposal);
    this.activeProposalRef = proposalRef;
    return publicProposal(this.refresh(proposal));
  }

  recordDisposition(input: {
    profileRef: string;
    accountSessionId: string;
    disposition: unknown;
  }): HelixLocalSupervisorRestartProposal {
    const parsed = helixLocalSupervisorRestartDispositionInputSchema.parse(input.disposition);
    const proposal = this.refresh(this.requireProposal(parsed.proposal_ref));
    if (["authorized", "completed", "cancelled", "expired"].includes(proposal.state)) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_disposition_closed",
        409,
      );
    }
    const client = this.authenticate({
      clientSessionRef: parsed.client_session_ref,
      profileRef: input.profileRef,
      accountSessionId: input.accountSessionId,
    });
    if (!client.active || !proposal.affected_client_session_refs.includes(client.client_session_ref)) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_client_not_affected",
        403,
      );
    }
    const disposition: HelixLocalSupervisorRestartDisposition = {
      client_session_ref: client.client_session_ref,
      profile_ref: client.authenticated_profile_ref,
      disposition: parsed.disposition,
      blocker_code: parsed.blocker_code,
      recorded_at: this.now().toISOString(),
    };
    proposal.dispositions = proposal.dispositions
      .filter((entry) => entry.client_session_ref !== client.client_session_ref)
      .concat(disposition)
      .sort((left, right) => left.client_session_ref.localeCompare(right.client_session_ref));
    return publicProposal(this.refresh(proposal));
  }

  recordOwnerDecision(input: {
    profileRef: string;
    accountSessionId: string;
    decision: unknown;
  }): HelixLocalSupervisorRestartProposal {
    const parsed = helixLocalSupervisorRestartOwnerDecisionInputSchema.parse(input.decision);
    const proposal = this.refresh(this.requireProposal(parsed.proposal_ref));
    const ownerClient = this.authenticate({
      clientSessionRef: parsed.owner_client_session_ref,
      profileRef: input.profileRef,
      accountSessionId: input.accountSessionId,
    });
    if (ownerClient.authenticated_profile_ref !== this.installedNodeOwnerProfileRef) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_owner_required",
        403,
      );
    }
    if (!ownerClient.active) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_owner_inactive",
        409,
      );
    }
    if (["authorized", "completed", "cancelled", "expired"].includes(proposal.state)) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_owner_decision_closed",
        409,
      );
    }
    if (parsed.decision === "cancel") {
      proposal.state = "cancelled";
      proposal.owner_approved_at = null;
      proposal.authorization_ref = null;
      this.activeProposalRef = null;
      return publicProposal(proposal);
    }
    proposal.owner_approved_at = this.now().toISOString();
    return publicProposal(this.refresh(proposal));
  }

  authorize(input: {
    proposalRef: string;
    ownerProfileRef: string;
    ownerAccountSessionId: string;
    ownerClientSessionRef: string;
  }): HelixLocalSupervisorRestartProposal {
    const proposal = this.refresh(this.requireProposal(input.proposalRef));
    const ownerClient = this.authenticate({
      clientSessionRef: input.ownerClientSessionRef,
      profileRef: input.ownerProfileRef,
      accountSessionId: input.ownerAccountSessionId,
    });
    if (ownerClient.authenticated_profile_ref !== this.installedNodeOwnerProfileRef) {
      throw new HelixLocalSupervisorCoordinationError("supervisor_restart_owner_required", 403);
    }
    if (!ownerClient.active) {
      throw new HelixLocalSupervisorCoordinationError("supervisor_restart_owner_inactive", 409);
    }
    if (proposal.state === "authorized") return publicProposal(proposal);
    if (proposal.state !== "draining" || !proposal.owner_approved_at) {
      throw new HelixLocalSupervisorCoordinationError("supervisor_restart_not_draining", 409);
    }
    if (proposal.missing_acknowledgement_client_session_refs.length > 0) {
      throw new HelixLocalSupervisorCoordinationError("supervisor_restart_acknowledgements_missing", 409);
    }
    if (proposal.objection_client_session_refs.length > 0) {
      throw new HelixLocalSupervisorCoordinationError("supervisor_restart_objection_active", 409);
    }
    if (proposal.protected_claim_refs.length > 0) {
      throw new HelixLocalSupervisorCoordinationError("supervisor_restart_protected_claim_active", 409);
    }
    proposal.authorization_ref = `supervisor_restart_authorization:${digest(
      `${proposal.proposal_ref}\n${proposal.owner_approved_at}\n${this.serviceInstanceRef}`,
    ).slice(0, 32)}`;
    proposal.state = "authorized";
    return publicProposal(proposal);
  }

  completeFromTrustedSupervisor(
    input: unknown,
    completionCapability: HelixLocalSupervisorRestartCompletionCapability,
  ): HelixLocalSupervisorRestartProposal {
    if (completionCapability !== this.trustedCompletionCapability) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_trusted_completion_required",
        403,
      );
    }
    const parsed = helixLocalSupervisorRestartCompletionInputSchema.parse(input);
    const found = [...this.proposals.values()].find(
      (candidate) => candidate.authorization_ref === parsed.authorization_ref,
    );
    if (!found) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_authorization_not_found",
        404,
      );
    }
    const proposal = this.refresh(found);
    if (parsed.previous_service_instance_ref !== this.serviceInstanceRef) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_previous_instance_mismatch",
        409,
      );
    }
    if (
      proposal.protected_claim_refs.length > 0 ||
      proposal.missing_acknowledgement_client_session_refs.length > 0 ||
      proposal.objection_client_session_refs.length > 0
    ) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_drain_regressed",
        409,
      );
    }
    const fingerprint = digest(JSON.stringify(parsed));
    if (proposal.state === "completed") {
      if (proposal.completionFingerprint !== fingerprint) {
        throw new HelixLocalSupervisorCoordinationError(
          "supervisor_restart_authorization_already_consumed",
          409,
        );
      }
      return publicProposal(proposal);
    }
    if (proposal.state !== "authorized" || !proposal.authorization_ref) {
      throw new HelixLocalSupervisorCoordinationError(
        "supervisor_restart_not_authorized",
        409,
      );
    }
    const completedAt = this.now().toISOString();
    proposal.state = "completed";
    proposal.authorization_consumed_at = completedAt;
    proposal.completed_at = completedAt;
    proposal.new_service_instance_ref = parsed.new_service_instance_ref;
    proposal.client_reconnect_required = true;
    proposal.room_grant_revalidation_required = true;
    proposal.prior_runtime_grants_valid = false;
    proposal.completionFingerprint = fingerprint;
    this.activeProposalRef = null;
    return publicProposal(proposal);
  }

  read(proposalRef: string): HelixLocalSupervisorRestartProposal {
    return publicProposal(this.refresh(this.requireProposal(proposalRef)));
  }
}
