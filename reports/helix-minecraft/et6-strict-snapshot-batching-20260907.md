# Strict snapshot batching repair

Classification: evidence persistence; preserves acknowledgement, identity, freshness and execution boundaries.

Source now batches concurrently waiting strict persistence callers. All required table names are unioned; an unknown-table request requires a full strict save. Each caller receives acknowledgement only after the batch's existing atomic snapshot operation succeeds. Calls arriving after capture wait for a subsequent save. A failed batch rejects all its callers without automatic retry. Flush and reset drain queued callers before shutting down the database. Best-effort writes still share the existing serialized writer lane.

Verification: five batching unit cases plus three enabled native receipt-persistence cases and one restart/fault case passed (9/9). The restart integration case additionally verifies that two concurrent strict calls covering different tables produce exactly one actual atomic rename, and both tables are present afterward. Its focused rerun passed. Fault tests continue to reject failed writes and required reads without issuing executable acknowledgements.

This reduces redundant full saves when receipt calls overlap; it does not eliminate full-snapshot cost or prove sustained live throughput. The live event backlog remains the acceptance target. No packaged rebuild, service restart, new binding, or Minecraft action occurred during this repair. ET6 is incomplete and NAV1 remains gated.
