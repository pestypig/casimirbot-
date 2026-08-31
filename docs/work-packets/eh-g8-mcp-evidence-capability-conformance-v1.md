Program gate: G8 — environment-harness release evaluation
Workstream: MCP evidence-capability conformance and public-surface lifecycle parity
Capability or component: Provider-neutral MCP Evidence Capability Conformance v1 contract, audit, and deterministic acceptance harness
Lifecycle stage: evidence normalization; secondary stages are tool admission, evidence re-entry, terminal authority, and presentation
Reaction timescale: none for static and request/response evidence capabilities; environment-specific adapters retain their separately declared reaction requirement
Authority owner: Codex owns capability selection, generic tool execution, retries, model-context compaction, follow-up reasoning, and final synthesis; Helix owns identity, admission, evidence identity, provenance, retention policy, and terminal eligibility; the producing handler owns only its typed observation
Current maturity: specified
Target maturity: deterministically verified
Required evidence: shared conformance schema; capability inventory; policy/tool/handler parity; typed observation and retrieval contracts; re-entry and terminal-grounding gates; public UI crosswalk; adversarial fixtures; focused deterministic tests; Helix Ask discipline quick check; environment-harness documentation audit; production build or type verification
Explicit non-goals: implementing or modifying the Moral Badge Graph capability; granting new user or environment mutation authority; mirroring DOM controls as tools; creating a Helix-owned model loop, retry chooser, compaction system, or answer writer; exposing credentials, pairing material, private endpoints, arbitrary host access, raw hidden state, or hidden reasoning; claiming keyed, tunnel, installed-node, browser-visible, or live-provider acceptance from deterministic evidence
Downstream gate unlocked: every MCP capability can be classified and promoted through one auditable observation-to-re-entry-to-grounding contract, and the installed-node release packet can test cross-surface catalog and evidence convergence without capability-specific lifecycle inventions

# EH-G8 MCP Evidence Capability Conformance v1

## Status and source-of-truth boundary

This work packet defines a cross-cutting conformance framework for MCP
capabilities. It is not a new environment-program gate and does not replace the
active-gate, maturity, or dependency authority in
`docs/helix-environment-harness-work-program-v1.md`.

The governing ownership and product boundaries remain:

- `docs/architecture/casimirbot-environment-harness-product-goal-v1.md`;
- `docs/architecture/helix-environment-agent-reasoning-v1.md`;
- `docs/helix-ask-codex-loop-discipline.md`;
- `docs/helix-ask-turn-solver-spine.md`;
- `docs/helix-ask-api-parity-matrix.md`; and
- `docs/architecture/helix-public-ui-agent-affordance-contract-v1.md`.

The Moral Badge Graph reflection capability is being developed in a separate
workstream. It may later adopt this framework, but this packet does not assign,
redesign, or authorize edits to that capability.

## Objective

Create one deterministic answer to this question for every MCP capability:

> Can an admitted Codex client discover the capability, call the real governed
> handler, receive a bounded typed observation, retain or reacquire that
> observation across context loss, reason from it, and ground a final candidate
> in its exact reference without allowing the tool artifact to become an answer
> or execution authority?

The conformance unit is a semantic capability, not a button, component, route,
or provider-specific prompt. Several UI controls may project one capability;
one control may remain presentation-only; and a capability may exist without a
visible control. DOM discovery and MCP authority remain separate.

## Non-negotiable ownership split

| Decision or responsibility | Codex/runtime | Helix/MCP boundary | Capability handler |
| --- | --- | --- | --- |
| Interpret the user's objective | owns | may supply policy context | no |
| Select whether and when to call a tool | owns | publishes admitted catalog | no |
| Choose a retry, another tool, clarification, or completion | owns | reports typed retryability and missing requirements | no |
| Validate account, tenant, profile, room, source, subject, scope, consent, and lease | consumes result | owns | reports authenticated producer identity where applicable |
| Execute generic tool loop and result re-entry | owns | preserves lifecycle facts | returns one typed result |
| Normalize evidence identity, provenance, freshness, and claim ceiling | consumes | owns shared envelope | owns domain payload correctness |
| Compact model context | owns | must make evidence bounded and reacquirable | no |
| Author final synthesis | owns | never writes substitute prose | never |
| Permit terminal projection | no | owns | no |

An MCP tool may be agent-callable while every artifact it returns remains
`agent_executable: false`. The former describes who may invoke the read or
governed operation. The latter prevents the returned packet, recommendation,
or receipt from becoming execution permission.

## Canonical lifecycle

```text
capability discovery
  -> account and scope admission
  -> Codex-selected MCP call
  -> real handler execution
  -> typed result normalization
  -> durable observation identity
  -> exact Codex tool-result re-entry
  -> Codex follow-up reasoning
  -> selected terminal support references
  -> Helix terminal-eligibility check
  -> one supported answer or typed failure
```

Each arrow is independently auditable. A later projection must not regress a
verified earlier fact. Tool success does not prove re-entry, re-entry does not
prove grounding, and grounding does not make the observation itself an answer.

## Evidence capability descriptor

Every conforming capability must have one machine-readable descriptor with at
least:

```text
capability_id
capability_version
mcp_tool_name
semantic_family
handler_id
handler_contract_version
admission_profiles[]
  surface
  account_scope
  required_oauth_scopes
permission_class
interaction_kind
effect_class
confirmation_policy
observation_schema
observation_retention_class
reentry_required
terminal_support_policy
claim_ceiling
```

Required invariants:

1. `capability_id`, tool name, handler, account policy, and observation schema
   have an explicit join; similarity of labels is insufficient.
   A tool published through more than one MCP surface declares a separate
   admission profile for each surface instead of unioning scopes into a false
   all-scopes requirement.
2. The MCP adapter calls the same real handler or a documented thin adapter
   around that handler. A second implementation is nonconforming.
3. Read-only evidence tools declare read-only, non-destructive annotations.
4. Mutating or consequential capabilities use their existing separate
   authority, confirmation, idempotency, receipt, and postcondition contracts.
   This framework does not grant those effects.
5. The descriptor never contains a credential, pairing value, private endpoint,
   arbitrary host path, raw prompt, hidden reasoning, or unrestricted handler
   expression.

## Canonical MCP observation envelope

Domain payloads remain independently versioned, but MCP results must normalize
into a shared envelope containing at least:

```text
schema
observation_ref
capability_id
capability_version
tool_call_ref
handler_id
handler_contract_version
producer_ref
subject_refs
request_fingerprint
outcome
summary
payload_schema
payload
support_refs
missing_or_uncertain
observed_at
freshness
provenance
retryability
claim_ceiling
retention
authority
```

The authority block must preserve these exact negative facts on every success,
partial result, rejection, failure observation, receipt projection, compact
projection, and retrieval result:

```text
assistant_answer: false
answer_authority: false
agent_executable: false
terminal_eligible: false
raw_content_included: false
reentry_required: true
```

Additional domain-specific restrictions may only narrow authority.

### Observation identity

`observation_ref` must be unique for the produced observation and immutable
after publication. A constant artifact type, schema name, capability name, or
reflection family is not an observation reference.

The reference must bind or resolve to:

- exact tenant/profile ownership;
- exact capability and handler contract versions;
- request fingerprint;
- producer and applicable subject/environment identity;
- creation time and freshness semantics;
- payload integrity or canonical content hash; and
- retention and revocation state.

Repeated idempotent calls may return the same observation only when the
capability contract explicitly defines a content-addressed replay and reports
that replay. Otherwise, each call receives a new observation reference even
when its semantic payload is equal.

### Compactness and raw material

The default MCP result is a bounded mediation or observation packet, not a dump
of the full handler, graph, page, room, repository, or environment state.
Compact results should preserve exact values, units, uncertainty, source
identity, freshness, claim boundaries, missing evidence, and support refs.

Large or sensitive raw material remains behind its existing governed artifact
boundary. A `raw_debug_ref` is allowed only when it resolves through a separate
authorized read contract; it is not proof that the caller received or may cite
the raw material.

## Compaction survival and retrieval

Codex owns model-context compaction. Helix and MCP must not implement a private
session-compaction policy or decide which call Codex makes next.

Conformance instead requires:

1. the normalized observation is written to the authorized durable artifact
   boundary before or atomically with successful publication;
2. the tool result contains its immutable `observation_ref` and a bounded
   summary sufficient for immediate reasoning;
3. conversation/session projections retain reusable evidence references under
   existing ownership and freshness rules;
4. a read-only retrieval capability can reacquire the same bounded observation
   by exact reference after context loss;
5. retrieval revalidates principal ownership, scope, revocation, retention,
   freshness, and payload integrity; and
6. retrieval produces another nonterminal tool observation and does not mark
   the original evidence as newly observed or fresher than it is.

The target semantic operation is equivalent to:

```text
helix_evidence_observation_get({ observation_ref })
```

The final tool name and shared schema are implementation decisions for the
framework phase. Capability-specific retrieval tools should not proliferate
unless a domain requires materially different authorization or payload
handling.

## Re-entry contract

A tool result becomes usable evidence only after exact result re-entry into the
same Codex lifecycle that will reason from it, or through an explicitly allowed
prior-evidence continuation contract.

The lifecycle audit must correlate:

```text
tool_call_ref
observation_ref
tool_result_published_at
reentered_turn_id
reentered_at
selected_for_reasoning
selected_for_terminal_support
```

Required behavior:

- a receipt or observation cannot become terminal before re-entry;
- re-entry is monotonic and cannot regress prior execution or normalization;
- duplicated projections of one observation do not count as multiple
  independent observations;
- failed or stale observations remain provenance but cannot satisfy a current
  required observation family;
- a strictly later successful current-turn observation may supersede a failed
  read only under the existing capability and subgoal rules; and
- Helix may state `retryable`, missing requirements, and admitted repair
  affordances, but it may not choose the retry or generate substitute reasoning.

## Terminal grounding and citation

An evidence capability remains `terminal_eligible: false` forever. Codex's
separate final candidate may become terminal only when the route-product and
terminal-authority contracts accept it.

For a final candidate that materially relies on an MCP observation:

1. the exact `observation_ref` must appear in the candidate's machine-readable
   `support_refs` or equivalent canonical support field;
2. it must also appear in the terminal selection record, such as
   `selected_terminal_support_refs`;
3. the reference must resolve to a successfully re-entered, authorized,
   non-stale observation whose claim ceiling supports the candidate;
4. the candidate must distinguish what the packet observed, what it did not
   establish, and any material unresolved evidence; and
5. if the route contract requires a user-visible reference, presentation must
   render the same observation reference without substituting a different
   display artifact.

Stable typed failures should distinguish at least:

```text
mcp_evidence_observation_ref_missing
mcp_evidence_observation_not_found
mcp_evidence_observation_not_reentered
mcp_evidence_observation_not_selected
mcp_evidence_observation_stale
mcp_evidence_observation_scope_mismatch
mcp_evidence_observation_integrity_failed
mcp_evidence_claim_ceiling_exceeded
mcp_evidence_terminal_citation_missing
```

These failures constrain terminal eligibility; they do not author an answer.

## Conformance audit dimensions

Each semantic capability receives one row for every dimension below. Dimension
state is exactly `not_assessed`, `not_applicable`, `gap`, or `conforms`. These
are audit states, not environment-harness capability maturity terms.

| Dimension | Conformance question |
| --- | --- |
| `catalog_identity` | Does the capability have stable semantic, MCP, handler, and schema identities? |
| `account_admission` | Do account policy, OAuth scope, tenant/profile ownership, and feature gates agree? |
| `handler_parity` | Does MCP call the same governed handler as the native/API surface? |
| `effect_boundary` | Are read, configuration, mutation, confirmation, and receipt semantics explicit? |
| `observation_schema` | Is the result typed, bounded, nonterminal, and claim-limited? |
| `observation_identity` | Is every result uniquely and immutably referenceable? |
| `secret_exclusion` | Are credentials, pairing material, private endpoints, host access, and hidden reasoning excluded? |
| `durable_retrieval` | Can an authorized client reacquire the same bounded observation by reference? |
| `reentry` | Is exact tool-result re-entry correlated and monotonic? |
| `followup_ownership` | Does Codex, rather than Helix or MCP, choose retries and further calls? |
| `terminal_grounding` | Must the final candidate select and cite the exact supporting observation refs? |
| `ui_crosswalk` | Do applicable public controls map to the semantic capability without DOM authority? |
| `deterministic_evidence` | Do focused positive and adversarial tests prove the declared contract? |
| `live_convergence` | Has the capability separately passed its required authenticated installed/live surface? |

`live_convergence` remains `not_assessed` or `gap` until exact live evidence
exists. Deterministic conformance must never promote it.

## Public UI, Ask, and Shared Live Room crosswalk

The public UI audit remains the source for public control discovery. This
framework consumes its stable control, surface, capability, interaction, and
authority identifiers; it does not rescan the DOM or make a button executable.

Controls are treated as follows:

| Control class | MCP treatment |
| --- | --- |
| Presentation-only navigation, zoom, focus, disclosure, scrolling, and local visualization | Usually `not_applicable`; do not create a tool merely to reproduce a click. |
| Read-only status, catalog, participant, source, subject, grant, lease, freshness, or bounded content inspection | Candidate evidence capability when a semantic read contract exists. |
| Reversible configuration | Requires an explicit configuration capability, policy, receipt, and resulting state observation; never infer authority from the local handler. |
| Consequential action | Requires the existing separate permission, confirmation, idempotency, effect, receipt, and postcondition contracts before crosswalk promotion. |
| Human-only control | Remains human-only with a stable reason. |
| Codex-owned loop control | Do not expose through Helix MCP when doing so would recreate model sampling, generic retry, approval, compaction, or terminal-completion machinery. |

The previously inventoried public controls must be grouped through semantic
capabilities. The framework must not generate one MCP tool per control. Shared
Live Room controls classified `blocked_pending_contract` remain blocked until
their exact room, participant, source, subject, consent, lease, confirmation,
receipt, and post-state contract conforms. Ask controls remain subject to the
Codex/Helix ownership boundary even when they are publicly visible.

## Ordered implementation phases

These are work-packet phases, not environment-program gates. An assigned agent
must name exactly one primary phase.

| Phase | Scope | Deterministic exit |
| --- | --- | --- |
| MEC-0 — Contract freeze | Freeze descriptor, observation envelope, audit states, authority negatives, and ownership boundaries. | Shared schema proposal and this packet agree; no adopter-specific fields leak into the base contract. |
| MEC-1 — Capability inventory | Join existing MCP tools to capability IDs, handlers, schemas, policies, scopes, UI surfaces, and effects. | Every inventoried tool has one row; orphans and collisions are typed gaps. |
| MEC-2 — Handler and observation parity | Prove real-handler invocation and shared envelope normalization for selected read-only reference capabilities. | Direct-handler versus MCP fixture parity and negative authority assertions pass. |
| MEC-3 — Durable identity and retrieval | Add immutable observation identity, authorized persistence, and generic bounded retrieval. | Store/retrieve/restart, wrong-owner, stale, revoked, corrupt, and missing-ref fixtures pass. |
| MEC-4 — Re-entry lifecycle | Correlate publication, exact re-entry, reuse, and monotonic lifecycle facts. | Receipt-before-re-entry fails; duplicate projections deduplicate; successful re-entry cannot regress. |
| MEC-5 — Terminal grounding | Require selected support refs and claim-ceiling compatibility without making packets terminal. | Grounded candidate passes; uncited, stale, forged, un-reentered, and over-claiming candidates fail with typed reasons. |
| MEC-6 — Public UI crosswalk | Join public controls and semantic capability families without remote DOM control. | No orphan promoted binding, no per-button tool explosion, and room/Ask ownership boundaries pass. |
| MEC-7 — Deterministic closure | Run the full conformance auditor, focused tests, docs audits, discipline classifier, and build/type gate. | Reproducible evidence record names exact commands, counts, gaps, and hashes where applicable. |

Live installed/tunnel/provider acceptance is a later capability-specific
evidence step. Stop MEC work at that boundary and request the required
operator-started environment rather than launching an unkeyed substitute.

### Phase evidence ledger

| Phase | State | Evidence | Remaining boundary |
| --- | --- | --- | --- |
| MEC-0 — Contract freeze | complete | `shared/contracts/helix-mcp-evidence-capability.v1.ts`; `shared/contracts/__tests__/helix-mcp-evidence-capability.v1.spec.ts`; 7 focused deterministic contract tests passed on 2026-08-29 | The v1 descriptor, observation, re-entry, terminal-assessment, authority-negative, audit-state, and typed-failure contracts are frozen. Later incompatible changes require a schema-version decision. |
| MEC-1 — Capability inventory | complete | `shared/helix-mcp-evidence-capability-registry.ts`; `scripts/lib/helix-mcp-evidence-capability-inventory.ts`; `tests/helix-mcp-evidence-capability-inventory.spec.ts` | The deterministic inventory finds 72 production registration sites and 66 unique tools across the full and run MCP servers, with zero unresolved registrations, orphan descriptors, or invalid descriptors. |
| MEC-2 — Handler and observation parity | complete | `server/services/mcp-evidence/observation.ts`; `server/mcp/helix-mcp-server.ts`; public-catalog and Device Check in-memory MCP tests | `helix_public_ui_catalog` and `helix_environment_device_check` preserve exact legacy root-payload parity while publishing unique, hash-stable, schema-validated evidence envelopes with all answer and execution authority negative. |
| MEC-3 — Durable identity and retrieval | complete | `server/db/migrations/074_mcp_evidence_observations.ts`; `server/services/mcp-evidence/observation-store.ts`; `server/services/mcp-evidence/postgres-observation-store.ts`; `helix_evidence_observation_get`; eight store fixtures plus MCP retrieval fixture | Owner-scoped persistence and exact bounded retrieval pass re-instantiation, exact persistence replay, identity collision, wrong-tenant, wrong-profile, missing, retention-expired, freshness-stale, revoked, and corrupt cases. Retrieval creates a separate nonterminal observation and never refreshes the original. |
| MEC-4 — Re-entry lifecycle | complete | `server/services/mcp-evidence/reentry-lifecycle.ts`; `server/services/mcp-evidence/__tests__/reentry-lifecycle.test.ts` | Publication, exact re-entry, reasoning selection, and terminal-support selection are monotonic. Duplicate projections deduplicate and conflicting identity or selection-before-re-entry fails closed. |
| MEC-5 — Terminal grounding | complete | shared terminal assessment schema; generic terminal-grounding fixtures in `reentry-lifecycle.test.ts` | Grounded candidates pass; uncited, unselected, missing, un-reentered, stale, forged, unresolved, and claim-ceiling-exceeding candidates fail with typed reasons. The assessment authors no answer. |
| MEC-6 — Public UI crosswalk | complete | `scripts/lib/helix-mcp-evidence-public-ui-crosswalk.ts`; `tests/helix-mcp-evidence-public-ui-crosswalk.spec.ts` | All 398 controls across 20 public surfaces are classified against 40 public semantic capability families. Ask-local controls stay local, 103 Shared Live Room controls stay `blocked_pending_contract`, direct DOM authority is false, and per-button tool generation is false. Zero controls currently carry an explicit semantic capability binding; that gap remains visible. |
| MEC-7 — Deterministic closure | complete | `scripts/lib/helix-mcp-evidence-conformance.ts`; `scripts/audit-helix-mcp-evidence-capabilities.ts`; 9-file/38-test focused battery; `npm run typecheck:mcp-evidence`; deterministic closure audit | The audit emits one 14-dimension row per production tool: 3 adopted reference tools conform deterministically and 63 remain explicit `mcp_evidence_capability_descriptor_missing` gaps. Every `live_convergence` dimension remains `not_assessed`. |

## Deterministic test matrix

Every reference capability used to verify the framework must cover:

1. tool catalog identity and exact annotations;
2. allowed developer principal and denied insufficient-scope principal;
3. user-account behavior matching the capability's declared policy, without
   assuming developer admission implies public admission;
4. direct handler and MCP `structuredContent` semantic parity;
5. strict output-schema validation;
6. all authority negatives on success, partial, denied, failed, compacted, and
   retrieved artifacts;
7. unique observation references across distinct calls;
8. explicit idempotent replay semantics where applicable;
9. canonical payload hash or integrity verification;
10. persistence and exact bounded retrieval;
11. wrong tenant/profile, missing scope, revoked grant, expired retention,
    stale evidence, and corrupted payload rejection;
12. exact tool-result re-entry before reasoning or terminal selection;
13. duplicate-projection deduplication and monotonic lifecycle facts;
14. Codex-owned continuation when evidence is incomplete;
15. final support-ref and selected-terminal-ref enforcement;
16. claim-ceiling and unresolved-evidence enforcement;
17. secret-exclusion snapshots; and
18. public control/capability crosswalk parity where a UI surface applies.

Shortcut-sensitive admission tests must include contextual, negated,
future/conditional, historical, quoted or screen-visible, and mixed-intent
mentions. Words that resemble a tool or control are not affirmative execution.

## Target audit artifacts

MEC-0 and MEC-1 should choose final locations, but the intended artifact set is:

```text
shared MCP evidence descriptor and observation-envelope contracts
shared capability-to-handler/policy/schema inventory
deterministic conformance auditor
generated machine-readable conformance report
focused MCP in-memory tests
focused re-entry and terminal-grounding tests
public UI semantic-capability crosswalk audit
immutable deterministic closure record
```

The target command name is:

```text
npm run helix:mcp-evidence:audit
```

This command is a target, not a claim that it already exists. Once implemented,
it must remain deterministic and must not require a tunnel, keyed model server,
browser session, provider credential, installed EXE, or live environment.

## Multi-agent coordination contract

Before editing, every development agent assigned under this packet must state:

```text
Program gate: G8
Workstream: MCP Evidence Capability Conformance v1
Assigned phase: MEC-0 through MEC-7
Capability or shared component:
Primary lifecycle stage:
Files owned for this packet:
Existing tests to preserve:
Required new evidence:
Explicit non-goals:
Stop condition:
```

Coordination rules:

1. One agent owns shared base schemas and the generated inventory format at a
   time. Adopter agents extend registered rows rather than forking the base
   envelope.
2. Capability agents own their domain payload and handler parity. They do not
   modify Codex loop, compaction, or terminal machinery to make one adopter
   pass.
3. Re-entry and terminal-gate agents work from generic observation references,
   never capability-specific prompt phrases.
4. UI agents bind controls only after the semantic capability passes its policy,
   handler, observation, and receipt requirements.
5. Moral Badge Graph work remains with its existing assigned agent. Framework
   agents may publish an adopter checklist but must not edit its implementation
   without an explicit handoff.
6. Existing user changes and dirty-worktree files are preserved. Shared-file
   overlap requires coordination before editing.
7. Dated audits remain immutable. New results create a new evidence record.
8. No agent may promote a capability's environment-harness maturity from this
   framework alone; the canonical work program and exact evidence control that
   claim.

## Stop and fail conditions

Stop the assigned phase and report the exact boundary when:

- the next test requires a keyed server, live provider, tunnel reconnect,
  installed-package refresh, browser session, or environment credential;
- a capability lacks a discoverable real handler or policy owner;
- the proposed shared envelope would expose raw credentials, pairing material,
  hidden reasoning, arbitrary host access, or private endpoints;
- a capability-specific workaround would make Helix select tools, retries, or
  answer prose;
- an observation cannot be assigned immutable owner-scoped identity;
- retrieval would bypass the original account, scope, retention, freshness, or
  revocation boundary;
- a UI control is being promoted from its label, DOM handler, or visibility
  without a semantic capability contract;
- a receipt or observation would become answer or terminal authority;
- deterministic evidence is being presented as live or installed acceptance;
  or
- shared-file ownership conflicts with another active agent.

## Verification order

Use the narrowest deterministic path first:

1. shared schema and validator tests;
2. capability inventory joins and orphan/collision tests;
3. in-memory MCP handler-parity and annotation tests;
4. observation persistence, retrieval, integrity, scope, and freshness tests;
5. evidence re-entry and terminal-grounding fixtures;
6. public UI control-to-semantic-capability audit;
7. `npm run helix:ask:discipline:quick`;
8. `npm run helix:environment-harness:docs-audit`;
9. the narrowest relevant server/client build or type check; and
10. only when separately authorized and required, authenticated live
    convergence.

Casimir verification is not required for this documentation/framework work
unless a later patch enters its warp/GR, adapter-certificate, constraint-pack,
training-trace, or proof-maturity scope.

## Definition of deterministic completion

MCP Evidence Capability Conformance v1 reaches `deterministically verified`
only when:

- the shared descriptor and observation envelope are implemented and validated;
- every inventoried MCP tool has a complete conformance row or an explicit gap;
- at least two materially different read-only reference capabilities pass the
  complete handler-to-retrieval-to-re-entry-to-grounding path;
- no test grants mutation authority as a side effect of evidence conformance;
- the public UI crosswalk proves semantic grouping and zero implicit DOM
  promotions;
- the adversarial and authority-negative battery passes;
- generated artifacts have no drift;
- required documentation and discipline audits pass; and
- a reproducible evidence record reports exact commands, results, remaining
  gaps, and tests deferred to live acceptance.

This completion does not mean every MCP capability conforms, every public UI
control is agent-operable, or the installed tunnel has passed convergence. It
means the repository has one enforceable framework that can state those facts
accurately and guide each later promotion.
