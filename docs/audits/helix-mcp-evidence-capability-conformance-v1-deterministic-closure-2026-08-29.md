Program gate: G8
Workstream: MCP Evidence Capability Conformance v1
Capability or component: Provider-neutral evidence capability contract, lifecycle, retrieval, grounding, UI crosswalk, and deterministic conformance auditor
Lifecycle stage: deterministic framework closure
Reaction timescale: per MCP tool call, retained observation retrieval, and later Codex re-entry
Authority owner: Helix owns admission, evidence identity, provenance, claim ceilings, and terminal gates; Codex owns reasoning, retries, continuation, compaction, and final answer generation
Current maturity: deterministically verified
Target maturity: capability-specific live convergence remains separate G8 evidence
Required evidence: exact commands and results below
Explicit non-goals: live server, tunnel, installed EXE, browser, provider, mutation, private sampling loop, and Moral Badge Graph implementation
Downstream gate unlocked: capability-by-capability adoption using one uniform MCP evidence harness

# MCP Evidence Capability Conformance v1 deterministic closure

Date: 2026-08-29

This record closes MEC-0 through MEC-7 at the deterministic boundary. It does
not claim installed-client, tunnel, keyed-server, browser, or provider
convergence.

## Outcome

- 72 production MCP registration sites were found across the full and run MCP
  servers.
- 66 unique production tools receive a 14-dimension conformance row.
- Three reference tools are adopted: `helix_public_ui_catalog`,
  `helix_environment_device_check`, and
  `helix_evidence_observation_get`.
- 63 tools remain explicit
  `mcp_evidence_capability_descriptor_missing` gaps.
- All `live_convergence` dimensions remain `not_assessed`.
- The public crosswalk classifies 398 controls across 20 surfaces against 40
  user-policy semantic capability families.
- Zero individual controls currently carry an explicit semantic capability
  binding. The framework records this instead of inventing DOM or click
  authority.
- Ask-local controls remain local. The 103 Shared Live Room controls marked
  `blocked_pending_contract` remain blocked.
- No evidence packet, retrieval result, lifecycle record, or assessment gains
  assistant-answer, agent-execution, or terminal authority.

## Deterministic evidence

`npm run helix:mcp-evidence:audit`

```text
deterministic_framework_ok: true
registration_count: 72
unique_tool_count: 66
joined_tool_count: 3
gap_tool_count: 63
public_surface_count: 20
public_control_count: 398
public_semantic_group_count: 40
controls_with_explicit_capability_count: 0
live_convergence_claimed: false
report_sha256: sha256:3d7eb34a98778bdcb0d9f276040687e9415f1e806ad36433bd68deb8708a901c
```

Focused Vitest battery:

```text
Test Files  9 passed (9)
Tests       38 passed (38)
```

The battery covers schema and authority negatives, AST inventory, exact MCP
payload parity, observation uniqueness and hashing, owner-scoped persistence,
store re-instantiation, exact replay, identity collision,
missing/wrong-tenant/wrong-profile/expired/stale/revoked/corrupt retrieval,
lifecycle monotonicity and deduplication, terminal citation and
claim-ceiling failures, and public UI classification.

`npm run typecheck:mcp-evidence`

```text
PASS
```

The repository-wide TypeScript command was not used as proof: an earlier run
exhausted Node's roughly 4 GiB heap, and the broader dirty worktree also
contains unrelated type failures under active development. The focused project
type-checks the v1 contract, registry, stores, lifecycle, auditors, and tests.

## Operational boundary

No port, local server, tunnel, installed EXE, browser, keyed model wrapper, or
live provider was started or contacted. The next evidence step is an explicitly
authorized installed-client convergence run. It must validate OAuth scope,
profile ownership, persistence across the real process restart, catalog refresh,
and exact observation retrieval without changing the deterministic conformance
result into a live claim.

Moral Badge Graph implementation remained outside this workstream and was not
modified by this closure.
