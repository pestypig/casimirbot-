# Helix environment harness G7 closure audit — 2026-08-24

Program gate: G7 — Second-domain transfer
Workstream: Provider-neutral environment lifecycle portability into a contrasting, high-consequence domain
Capability or component: Developer-only Robinhood private-room read observation through reference, MCP, and keyed Helix Ask
Lifecycle stage: request → admission → execution → normalization → evidence re-entry → Runtime Codex synthesis → terminal authority → presentation
Reaction timescale: on-demand observation and short semantic replanning
Authority owner: Runtime Codex owns capability selection, interpretation, and the terminal candidate; Helix owns developer/profile identity, owner-private room binding, read admission, freshness, provenance, redaction, route authority, and terminal eligibility
Current maturity: integrated accepted
Target maturity: integrated accepted
Required evidence: one clean owner-private read-only room; successful reference, authenticated MCP, and natural keyed Ask observations; exact Ask evidence re-entry and terminal support; zero mutation calls; no credential or account-number projection; deterministic adversarial regressions
Explicit non-goals: trading recommendation, paper or live order mutation, order review or approval, live-control arming, unattended market monitoring, provider UI automation, or credential inspection
Downstream gate unlocked: G8 — Environment-harness release evaluation

## Verdict

G7 is **closed** and the second-domain transfer is **integrated accepted** for
the exact developer-only, owner-private Robinhood read surface.

The accepted evidence comes from room
`shared_realtime_room:ed8d1963-ee0b-48b0-9ebd-c6b2a11aa096`. The reference
route recorded five sanitized read receipts without requiring a paper account;
the authenticated CasimirBot MCP tool returned a fresh SPY observation; and a
natural keyed Helix Ask turn requested the same capability, re-entered the
current observation into Runtime Codex, selected the grounded candidate, and
projected it through the terminal single writer. No route received order
authority or emitted financial advice.

Sanitized retained evidence:
`artifacts/g7-second-domain-transfer/live-tripath-acceptance-2026-08-24.json`.

## Accepted tripath

| Route | Result | Evidence |
| --- | --- | --- |
| Reference room acceptance | passed | Five sanitized account/market receipts; SPY quote probe; zero review or order calls; UI explicitly showed that a paper account was not required. |
| Authenticated MCP | passed | `casimirbot_g2_a1_local/helix_brokerage_robinhood_read`; SPY `$763.11`; observed `2026-08-24T14:03:21.937Z`; `fresh`; no typed failure; no order authority. |
| Keyed Helix Ask | passed | Turn `ask:c870d876-de84-4508-842c-e083269e745b`; SPY `$762.915`; observed `2026-08-24T14:04:44.594Z`; `fresh`; no typed failure; order authority not used. |

The market observations were sequential, so price and timestamp equality is
neither expected nor asserted. The invariant is the same server-derived
developer identity, exact owner-private room binding, read capability, fresh
normalized evidence, non-mutating authority, and causal lifecycle continuity.

## Ask lifecycle continuity

The exact Ask debug export recorded:

- capability result `succeeded`;
- `reentered_solver: true`;
- `selected_for_answer: true`;
- terminal support ref
  `ask:c870d876-de84-4508-842c-e083269e745b:workstation_gateway:environment.brokerage.robinhood.read:25dce2d1ff7dd646`;
- visible answer matching the selected current turn; and
- no debug strings matching access-token, refresh-token, bearer-token,
  account-number, or raw-provider markers.

The observation remained nonterminal. Runtime Codex produced the answer and
Helix granted terminal eligibility after current-turn evidence re-entry.

## Presentation correction

The backend read-acceptance endpoint never required paper state, but the room UI
rendered its button only inside the paper-account branch. The read verifier now
renders independently and states that a paper account is not required. A UI
regression proves the verifier can complete while `paperCreated` remains
`false`.

## Setup deviation

Before that coupling was identified, one empty deterministic paper-account
fixture was created in a different room to expose the verifier. This was outside
the packet's explicit non-goals and is not acceptance evidence. It produced
zero orders, zero fills, zero journal events, no review call, and no live effect.
The clean tripath above was then repeated in a room with no paper account. This
deviation is retained explicitly rather than hidden by the later success.

## Verification

| Gate | Result |
| --- | --- |
| G7 brokerage/MCP/gateway/intent/routes/read-acceptance/UI group | 50/50 passed across 8 files |
| Helix Ask discipline quick check | passed; inferred categories include presentation, source/tool admission, evidence re-entry, terminal authority, and Codex-owned runtime behavior |
| Ask API parity matrix | 31/31 passed before the live OAuth step; the only subsequent product change was the independently tested room presentation correction |
| Client production build | passed |
| Environment-harness documentation audit | passed after the G8 transition |
| Casimir verification | not applicable; no warp/GR, proof, certificate, or training-trace surface changed |

An additional parity invocation after the UI-only correction was stopped during
its memory-heavy transform to keep the workstation responsive; it had emitted
no failure, and the correction cannot alter the server parity contract.

## Gate transition

G7 closes with this audit. G8 becomes the sole active gate for release
evaluation and installed-node convergence. The reserved legitimate-survival
Nether objective is now eligible as a post-G7 integration journey, but it does
not inherit release readiness from this read-only brokerage acceptance.
