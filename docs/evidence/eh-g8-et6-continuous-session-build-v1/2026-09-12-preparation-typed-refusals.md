# Typed preparation refusals through MCP

CS1 recovery / evidence-normalization follow-up to [expired presence](2026-09-12-preparation-presence-error-boundary.md), under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

After authenticated same-task presence recovery, a missing preparation intent reproduced another generic `internal_error`, retryable true, through the actual in-memory MCP handler. The regression requests `acknowledge_preparation` for a nonexistent intent; no run or consent is created. This is a deterministic fixture reproduction, not a new production request.

The existing preparation error class now carries one of eleven defined codes. The MCP wrapper recognizes that class plus an own-property whitelist and returns the typed code with fixed recovery guidance and retryable false. It never forwards arbitrary exception messages. Codes cover unavailable/changed/mismatched target, changed service, conflicting request/run, expired/unavailable intent, mailbox capacity, required run selection and unavailable room. All existing validation and state transitions remain intact. Browser route behavior continues to receive the same Error.message code; no route policy was changed.

Verification: `npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts server/services/environment-connectors/session/__tests__/preparation-intent-store.test.ts --pool=forks --maxWorkers=1 --minWorkers=1` passed 47/47 in 31.45 seconds (30 MCP, 17 mailbox). The new missing-intent assertion failed before the repair with internal_error/retryable true and passes after it. Existing same-task expiry/recovery assertions also pass. Quick discipline passed over the dirty checkout; classification is evidence normalization. Documentation audit accompanies this record.

This is source-only. The ordinary running delivery package is preserved. Full host adoption, actual pairing/automatic delivery, complete readiness, continuous motion, intervention/re-entry and ET6 acceptance remain unverified. No rebuild, rebind, new task or authority renewal was performed in this follow-up.
