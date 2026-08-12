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
