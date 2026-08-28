export type PaperTradingErrorCode =
  | "paper_account_not_found"
  | "paper_candidate_identity_mismatch"
  | "paper_source_observation_invalid"
  | "paper_candidate_replay_conflict"
  | "paper_quote_evidence_invalid"
  | "paper_quote_evidence_stale"
  | "paper_risk_decision_not_accepted"
  | "paper_order_not_found"
  | "paper_order_replay_conflict"
  | "paper_position_not_found"
  | "reactive_controller_not_found"
  | "reactive_controller_identity_mismatch"
  | "reactive_controller_replay_conflict"
  | "reactive_controller_not_active"
  | "reactive_controller_effect_unresolved"
  | "reactive_shadow_not_found"
  | "reactive_shadow_contract_invalid"
  | "reactive_shadow_source_identity_invalid"
  | "reactive_shadow_quote_invalid"
  | "reactive_shadow_clock_invalid"
  | "reactive_shadow_evidence_incomplete"
  | "reactive_shadow_acceptance_not_ready"
  | "paper_trading_unavailable";

export class PaperTradingError extends Error {
  constructor(
    readonly code: PaperTradingErrorCode,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PaperTradingError";
  }
}
