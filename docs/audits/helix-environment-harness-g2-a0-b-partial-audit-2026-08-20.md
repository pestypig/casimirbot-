# Helix environment harness G2 A0/B partial audit — 2026-08-20

Status: immutable capability-specific evidence snapshot. This audit accepts the
exact fluid micro-course through A0 direct Fabric and B keyed Helix Ask. It does
not close G2 because the authenticated A1 Codex-through-MCP route is absent.

```text
Program gate: G2
Workstream: A0 / A1 / B differential parity
Capability or component: com.casimirbot.minecraft.player.sequence.execute
Lifecycle stage: execution through presentation
Reaction timescale: short semantic replanning plus bounded Fabric execution
Authority owner: Codex strategy; Helix admission/evidence/terminal eligibility; Fabric execution
Current maturity: live accepted for A0/B; A1 unaccepted
Target maturity: integrated accepted tripath parity
Required evidence: equivalent A0, A1, and B traces with first-divergence hashes
Explicit non-goals: G3 resident viability, live-mail wakes, durable goals, learned controllers
Downstream gate unlocked: none until A1 passes and G2 closes
```

## Fixed fixture and prompt

The B32 Codex turn authored the admitted sequence. The exact admitted graph was
then replayed unchanged through the direct Fabric diagnostic lane after the
same deterministic world/player fixture was restored. This preserves Codex
ownership of the program while using A0 only as the reference actuator.

Canonical program hash:

`ba5694f58ece1938b1d889dc79c3905fcd11c7ddf7fd636f4fbc64e8786cf926`

Both lanes used the same scenario, prompt hash, starting-state hash, capability
contract hash, capability ID, normalized argument hash, ordered causal-progress
hashes, and postcondition status. The source captures retain exact clocks. The
comparison hashes exclude only volatile clock/tick fields; they still include
ordered node outcomes, condition results, checkpoint IDs, mutation counts,
terminal reason, and control release.

## A0 direct Fabric

- Workflow: `direct_player_action_workflow:a6a5dcd9-2fd0-498c-9b30-42c0acc02268`
- Outcome: `succeeded`
- Nodes: 14/14 succeeded
- Condition observations: 8/8 satisfied
- Inventory mutations: 4
- World mutations: 0
- Scheduler measurement: 24 ticks; wall clock 1,145 ms
- Controls released: true
- Capture: `artifacts/g2-fluid-parity/a0-b32-exact-capture.json`
  (`F20EA791DC9F85A2A491B8978C6D9B78AB7C79EF7A3161223EB9AB61EE610224`)
- Trace: `artifacts/g2-fluid-parity/a0-b32-exact-trace.json`
  (`CC88BD6CA2E24B2EEFD32939CEE7E6CDAF97CA1292E00EDD63F00304334E9AB6`)

## B keyed Helix Ask

- Turn: `ask:3aabfbbc-20a3-4a2b-8b47-8f9bf194674c`
- Outcome: `final_answer`
- Provider reasoning re-entry: `completed`
- Compound coverage: `PASS`, 7/7 requirements resolved
- Nodes: 14/14 succeeded in the terminal repair sequence
- Condition observations: 8/8 satisfied
- Inventory mutations: 4
- World mutations: 0
- Scheduler measurement: 19 ticks; wall clock 901 ms
- Controls released: true
- Terminal eligible/server authoritative/single-writer synchronized: true
- Lifecycle differential audit: `ok=true`, no first divergent stage
- Model saw and cited observation evidence; policy override: false
- Terminal public-text hash:
  `fca60343175e660b80ea5c48a0b3624bc7819a1c95c2f6fa5735d22090c582d6`
- Ask evidence: `artifacts/g2-fluid-parity/b32-ask-debug.json`
  (`0D57A1D4B4B634B5F338745E75AFB0DFF6BE85912B54D7E882B5D499B2FE7636`)
- Capture: `artifacts/g2-fluid-parity/b32-helix-capture.json`
  (`2037F7E2247481E21D2264E1D8B0F114CCBC332165047DE44CB43A50B7F34222`)
- Trace: `artifacts/g2-fluid-parity/b32-helix-trace.json`
  (`405A70BD7E042E739A243A80D3E2246326556FF47B18014061A31FCCF59AFBF2`)

Earlier failed repair attempts remain in the B32 provenance. Successful nodes
and checkpoints satisfy compound subgoals only when current-turn evidence
proves them; the observer selects the final successful matching call for the
comparison capture without deleting earlier failures.

## Independent live postconditions

After B32, read-only server queries reported four oak planks, a stick in the
selected main hand, and health `20.0f`. Every sequence attempt reported
`controls_released=true`.

## A1 OAuth progression

The repository Codex CLI has an enabled `casimirbot_local` MCP profile and the
protected-resource discovery chain exposes the CasimirBot resource, Auth0
authorization/token metadata, PKCE `S256`, and the required Helix scopes.
Native `codex mcp login casimirbot_local` fails before user authorization with:

```text
Registration failed: Dynamic registration failed: HTTP 400 Bad Request:
dynamic client registration is disabled
```

No bearer token was injected and no credential was inspected. The supported
next route is an Auth0 pre-registered public OAuth client passed to Codex with
`--oauth-client-id`, or enabling the documented Auth0 CIMD/DCR profile. That is
an authorization-provider configuration step, not an environment-adapter or
Fabric defect. G2 remains active and G3 remains blocked until A1 executes the
same program and produces its observation-supported Codex candidate.

The credential-free discovery preflight is implemented at
`scripts/helix-codex-mcp-oauth-preflight.ts` and records the typed public result
at `artifacts/g2-fluid-parity/a1-oauth-preflight.json`. It fixes the callback at
`http://127.0.0.1:8766/callback`, confirms PKCE `S256` and the three required G2
scopes, performs no registration or token request, and requires no client
secret. The Auth0/Codex operator sequence is documented in
`docs/runbooks/auth0-codex-device-check.md`.

The recorded preflight artifact has SHA-256
`F60BF34215AC8336C5F1FB8C0FC39C90A55C764A5A8CF1A371460DF1E5349041`.
Its typed status is `client_registration_required`; this is an accurate
external-provider prerequisite, not an A1 execution result or a G2 acceptance
claim.

The repository's existing desktop native account-link flow is not a substitute
for this client: its contract uses the `casimirbot://oauth/callback` custom URI,
whereas the reference Codex CLI listener requires the registered loopback
callback above. No compatible public client identifier is published by the
application metadata inspected for this audit. Reusing a different redirect or
injecting a bearer would invalidate A1 rather than close it.

The external client-registration prerequisite was resolved on 2026-08-20 by
creating one dedicated Auth0 Native/public application without revealing or
using a client secret. Its verified configuration is:

- exact callback `http://127.0.0.1:8766/callback`;
- token endpoint authentication method `none`;
- authorization-code and refresh-token grants; and
- PKCE `S256` through the authorization-server contract.

The ready preflight is
`artifacts/g2-fluid-parity/a1-oauth-preflight-ready.json`, SHA-256
`B0EA46684DFA833E7F9B738A7DA38573770C172475F18DE40DB092E698E29B16`.
It reports `ready_for_interactive_login`, all three G2 scopes present,
`oauth_client_secret_required=false`, `mutating_request_performed=false`, and
`credentials_included=false`. This resolves registration but is not A1
acceptance: user consent, token/account binding, the MCP action, observation
re-entry, and differential parity remain to be captured.

## Verification

- `npm run helix:ask:discipline:quick`: passed
- API parity matrix: 31/31 passed in three RAM-bounded groups
- Prompt-solving benchmark: 36/36 passed
- Focused normalization/catalog/sequence/retry/terminal bundle: 116/116 passed
- Differential capture/audit observers: 21/21 passed before the final wrapper
  regression; the final observer group is 5/5 passed
- `npm run helix:environment-harness:docs-audit`: passed before this snapshot;
  rerun is required after linking this audit
- `git diff --check`: passed before this snapshot

Casimir verification is not applicable: this increment does not change warp/GR,
constraint, certificate, proof-maturity, or training-trace semantics.
