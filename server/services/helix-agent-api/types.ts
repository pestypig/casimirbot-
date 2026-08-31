import type { HelixAccountType } from "@shared/helix-account-session";
import type {
  HelixAgentPendingQuestion,
  HelixAgentTerminalAuthorityStatus,
} from "@shared/contracts/helix-agent-api.v1";
import type { HelixWorkstationGatewayAccountContext } from "../helix-ask/workstation-tool-gateway/account-policy";

export type HelixAgentApiPrincipal = {
  tenantId: string;
  issuer: string;
  subjectId: string;
  accountProfileId: string;
  accountType: HelixAccountType;
  /**
   * Server-verified profile classification before OAuth scope attenuation.
   * This never grants generic developer capabilities; a capability must still
   * require its own exact OAuth scope and any separate native delegation.
   */
  trustedDeveloperProfile?: boolean;
  /** Stable server-derived reference to the authenticated MCP client, never its secret. */
  mcpClientRef?: string | null;
  /** Stable server-derived reference to the signed OAuth client, never its secret. */
  oauthClientRef?: string | null;
  scopes: ReadonlySet<string>;
  tokenExpiresAt: string | null;
  accountContext: HelixWorkstationGatewayAccountContext;
};

export type HelixAgentRunTurnExecutorInput = {
  runId: string;
  runVersion: number;
  turnId: string;
  traceId: string;
  internalSessionId: string;
  objective: string;
  instruction: string;
  constraints: string[];
  databaseScope: string[];
  allowedTools: string[];
  requiredEvidence: string[];
  previousSummary: string | null;
  previousObservationRefs: string[];
  previousEvidenceRefs: string[];
  previousReceiptRefs: string[];
  previousUnresolvedRequirements: string[];
  previousContradictions: string[];
  pendingQuestions: HelixAgentPendingQuestion[];
  remainingSteps: number;
  deadlineAt: string;
  signal: AbortSignal;
  principal: HelixAgentApiPrincipal;
};

export type HelixAgentRunTerminalProduct = {
  authority_ref: string;
  artifact_kind: string;
  text: string;
  supporting_evidence_refs: string[];
};

export type HelixAgentRunTurnExecutorResult = {
  ok: boolean;
  statusCode: number;
  summary: string;
  observationRefs: string[];
  evidenceRefs: string[];
  receiptRefs: string[];
  claimsSupported: string[];
  claimsContradicted: string[];
  unresolvedRequirements: string[];
  resolvedRequirements: string[];
  /**
   * Required-evidence families that the canonical current-turn projection
   * proved from re-entered artifacts. Generic requirement resolution is not
   * sufficient to grant evidence-backed terminal authority.
   */
  satisfiedEvidenceRequirements: string[];
  contradictions: string[];
  resolvedContradictions: string[];
  pendingQuestions: HelixAgentPendingQuestion[];
  terminalAuthorityStatus: HelixAgentTerminalAuthorityStatus;
  terminalProduct: HelixAgentRunTerminalProduct | null;
  outputFields: Record<string, unknown>;
  failureCode: string | null;
  needsInput: boolean;
  sanitizedResult: Record<string, unknown>;
};

export interface HelixAgentRunTurnExecutor {
  executeTurn(
    input: HelixAgentRunTurnExecutorInput,
  ): Promise<HelixAgentRunTurnExecutorResult>;
}
