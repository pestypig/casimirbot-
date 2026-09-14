# Expired preparation presence: MCP error boundary

CS1/O6 recovery evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md). Patch classification: evidence normalization. No identity, continuation or authority policy changed.

The ordinary delivery package's Ready up `read_preparation` first rejected with `insufficient_scope`, naming `helix.environment_actions.write`. Native Agent Access reported retained Full Harness device trust but inactive scope. The offscreen Start Harness accessibility input failed with `coordinate input geometry is unavailable`; a fresh screenshot identified the visible supported Refresh harness connection control. One activation restored transport using retained trust. No new human consent, task binding or gameplay approval was automated.

The next MCP read returned `internal_error`, retryable true, while task presence was expired. Refreshing this exact continuation's authenticated presence at 2026-09-12T20:19:39.761Z succeeded against the same service instance `service_instance:5a4e96f8fef15358b9a37e33c2b3dcdf`; a subsequent read succeeded with empty intents, ready false and execution authority false. This verifies authorized preflight access, not a prepared run or ready session.

Source inspection found `PreparationIntentError("preparation_target_unavailable")` was not translated by the MCP wrapper. A corrected in-memory MCP regression reproduced the exact generic internal_error/retryable-true result after expiry. Initial fixture attempts lacked a reasoning store and later had inconsistent store/heartbeat clocks; those failures are not product evidence. The final fixture shares the injected Date clock, advances beyond the 60-second heartbeat, checks the typed refusal, refreshes the same task and recovers an empty read without authority.

The source repair handles only this known error class and exact code, returns HTTP-contract status 409, `preparation_target_unavailable`, retryable false, and instructions to refresh same-task presence without renewing pairing or environment permission. It does not expose arbitrary exception text or change the presence requirement. Other exceptions retain existing handling.

Focused command: `npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`. The 30-test suite passed after the repair; final cleanup-hook verification accompanies this record. Quick discipline passed over the dirty checkout (186 changed files, three earlier Helix-sensitive files); that scan is not full repository verification. Documentation audit accompanies this record.

This repair is source-only and is not in the running delivery EXE. No rebuild/restart is justified solely to recheck the missing durable-tool catalog. Destination register/accept/recover adoption and the actual host bridge remain open. All CS1–CS4, O1–O6 and original ET6 exits retain their full scope and remain unfinished.
