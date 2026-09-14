# Authenticated emergency-stop persistence boundary

The five existing strict-snapshot-barrier regressions also passed, covering concurrent tables, late mutations, failure propagation without replay and shutdown draining. Documentation audit passed.

CS4 recovery prerequisite under the [continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md). Classification: evidence normalization / authority-reduction acknowledgement. This is a component repair, not packaged recovery or authenticated live revocation acceptance.

Inspection found emergencyStopEnvironmentActionAuthority used the default room transaction persistence path. That path permits deferred local snapshot persistence; it does not require the snapshot barrier before returning the stop receipt. The new handler regression reproduced three failures: owner and paired-player calls omitted required persistence options, and an injected required-snapshot failure was acknowledged rather than rejected. An unrelated participant was correctly rejected before writes.

The handler now requests the existing strict local snapshot barrier for authority, action-request and control-request tables. It retains the same membership checks, authority suspension, release-only control and action invalidation semantics. It does not grant authority or change production consent. Snapshot failure propagates instead of acknowledging durable completion. This does not imply rollback of a transaction already committed in memory.

Verification: emergency-stop handler, authority supersession and finite lease-extension suites passed 17/17 tests. The new handler tests use fixture membership/query responses and inject a transaction-layer snapshot failure. They establish the caller's persistence contract and failure propagation, not an actual disk failure or restart trace. Native tunnel safety interaction is stubbed in this isolated test; no production stop is performed.

Remaining work includes an actual snapshot/restart test spanning this handler, idempotent recovery after uncertain acknowledgement, authenticated control delivery into the resident executor, policy revocation races, and ordinary packaged workflow. The existing connected stop tests inject stop at the controller and cannot substitute for those requirements. No package was rebuilt for this repair. Original ET6 remains unpassed and no NAV1 qualification is claimed.

## Current catalog and service boundary

At 2026-09-12T21:25:06.909Z the supported supervisor-presence MCP call succeeded for this exact task continuation against service_instance:5a4e96f8fef15358b9a37e33c2b3dcdf. The declaration was tool_activity_only, with empty resource claims and null room/run/environment; it did not establish binding or execution authority. Its three-minute advisory presence expires and must not be treated as durable readiness.

The current task catalog contains Ready up, prompt submit, legacy binding claim, steering read/ack and supervisor presence tools. Destination registration and pairing accept/recover are still absent. No replacement task, reconnect, recycled claim or human rebind was requested. This observation confirms a responding authenticated service, not current package-content integrity or an integrated session.
