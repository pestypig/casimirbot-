export type BindingVerificationPhase = "destination" | "repository" | "durability" | "record_read" | "accepted_record";

/** Server-owned diagnostics only; exception text and storage contents stay private. */
export class BindingVerificationError extends Error {
  readonly code = "reasoning_binding_verification_failed";
  readonly status = 503;
  readonly reason: "snapshot_changed" | "database_unavailable" | "snapshot_table_unknown" |
    "runtime_type_error" | "runtime_reference_error" | "unexpected_failure";
  constructor(readonly phase: BindingVerificationPhase, cause: unknown) {
    super("The current durable binding verification did not complete.");
    this.reason = cause instanceof Error && cause.message === "durable_snapshot_changed_during_confirmation"
      ? "snapshot_changed"
      : cause instanceof Error && cause.message === "durable_database_unavailable"
        ? "database_unavailable"
        : cause instanceof Error && cause.message === "durable_snapshot_table_unknown"
          ? "snapshot_table_unknown"
          : cause instanceof TypeError ? "runtime_type_error"
            : cause instanceof ReferenceError ? "runtime_reference_error" : "unexpected_failure";
  }
}
