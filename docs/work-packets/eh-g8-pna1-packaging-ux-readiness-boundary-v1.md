# EH-G8 PNA1 packaging, UX, and readiness boundary v1

Program gate: G8 — environment-harness release evaluation
Workstream: provider-neutral installed-node release boundary
Capability or component: PNA1 — Stage 1A packaging inventory, UX baseline, sanitized readiness contract, no-agent operation, and release guard
Lifecycle stage: installed startup and readiness presentation (primary); provider and environment admission remain unchanged
Reaction timescale: none
Authority owner: the installed CasimirBot host owns packaging and local readiness projection; the selected external AI application owns its model session; Helix retains identity, admission, evidence, and effect authority
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: exact Codex-specific artifact classification; current UX surface/disposition map; versioned sanitized readiness schema with independent application, authorization, presence, catalog, attachment, continuation, and environment axes; deterministic no-agent/degraded fixtures; bundled-service startup with an intentionally absent Codex executable and home while useful authenticated account/history/policy surfaces remain available; staged and packed runtime scans that reject a Codex executable, `@openai/codex` runtime tree, or required runtime dependency; desktop runtime manifest receipt; focused test/build/smoke output; canonical documentation audit
Explicit non-goals: no provider-app chat creation or control; no provider credential capture; no hidden-reasoning projection; no replacement model loop, tool executor, approval system, compactor, or terminal writer; no removal of the current Codex client adapter before its replacement profile is accepted; no Stage 2 setup wizard, Stage 3 activity redesign, Stage 4 provider-backed Helix conversation, installed external-user acceptance, or G8 release-ready claim
Downstream gate unlocked: PNA Stage 2 — provider-neutral Agent Connections

## Objective and first affected boundary

This packet executes only Stage 1 of
`docs/work-packets/eh-g8-provider-neutral-agent-connection-and-helix-activity-v1.md`.
The first affected boundary is installed startup/readiness presentation. It does
not change prompt interpretation, source admission, tool admission, evidence
normalization or re-entry, follow-up reasoning, terminal authority, or Codex-
owned runtime behavior.

The falsifiable release rule is:

> The base CasimirBot EXE may ship a client-specific connection adapter, but it
> must neither contain nor require the selected provider's reasoning runtime.

The Codex marketplace/device-check package is therefore not evidence that Codex
is bundled. It is a read-only client adapter. Conversely, a staged `codex.exe`,
`codex.cmd`, `codex.ps1`, `bin/codex`, `node_modules/@openai/codex`, or required
runtime dependency on `@openai/codex` violates the base-release boundary.

## Production artifact inventory and disposition

| Surface | Current location | Classification | Stage 1 disposition |
| --- | --- | --- | --- |
| Codex Device Check marketplace and plugin | `.agents/plugins/marketplace.json`; `plugins/casimirbot-device-check/`; staged under `codex-marketplace/` | `release-required client adapter` | Retain as the first explicit, read-only Codex App connection adapter. Hash and allowlist it separately from reasoning runtimes. |
| Desktop plugin inspection and deep link | `apps/desktop/src/codex-plugin.ts`; `shared/codex-plugin.ts`; `apps/desktop/src/main.ts` | `release-required client adapter` | Retain until the Stage 2 client-profile manifest subsumes it. It may open an explicit user-consented client path but may not mutate provider configuration or imply session control. |
| Manual Codex MCP setup guidance | `client/src/lib/agent-access/agentAccessContent.ts` | `release-required client adapter` | Retain under Advanced setup during Stage 1. Stage 2 must replace it as the ordinary-user path. |
| Codex-native Helix provider and binary resolver | `server/services/helix-ask/agent-providers/codex-provider.ts`; `server/services/helix-ask/agent-providers/codex-native/` | `optional provider-runtime adapter` | Keep source compatibility, but prohibit it from the base EXE's required external dependency closure. Its availability cannot define base startup readiness. |
| Root `@openai/codex` dependency | `package.json`; root lockfile | `optional provider-runtime adapter` | Retain for development and optional server/provider tests during Stage 1. The desktop lock, service dependency manifest, staged tree, and packed tree must not require or copy it. Revisit dependency isolation only after build/reference use is measured. |
| Codex OAuth/preflight and parity scripts | `scripts/helix-codex-mcp-oauth-preflight.ts`; `scripts/helix-ask-gpt-live-codex-proof.ts`; related runbooks | `development/reference only` | Keep outside installed runtime; use only for operator diagnostics and acceptance evidence. |
| Codex-native/parity/unit fixtures | `server/services/helix-ask/agent-providers/**/__tests__/`; `server/__tests__/helix.ask.codex-*`; `tests/desktop-codex-plugin.spec.ts` | `development/reference only` | Retain as regression evidence; never stage test code as a provider runtime. |
| Ignored OpenAI Codex comparison checkout | `external/openai-codex-compare` | `development/reference only` | Read-only comparison source; never stage, package, commit, or mutate it through this packet. |

No inventoried item is classified `remove` in Stage 1. Removal without a Stage 2
replacement would break the first supported client while providing no stronger
proof that the reasoning runtime is absent.

## Current user-experience surface map

| User need | Current surface | Observed Stage 1 state | Disposition |
| --- | --- | --- | --- |
| Understand how an AI app connects | `AgentAccessGuide`; `agentAccessContent.ts` | Provider-specific manual snippets expose CLI/config concepts. | Retain as Advanced; replace with the Stage 2 resumable wizard. |
| See account/client authorization | `AgentAccountBindingReadiness` | Sanitized account binding and a narrow native Auth0 link exist, but external-app setup is still separate. | Reuse identity projection; do not merge credentials or claim provider presence. |
| See installed service relationships | `InstalledServicesPanel`; `shared/helix-installed-account-services.ts` | Codex is `managed_elsewhere`; access, provider, subscription, and device concepts are distinguished. | Reuse the panel and replace the coarse status with the shared axes in Stage 2. |
| Know where a composer message goes | `HelixAskComposer` | Placeholder names a runtime, while destination/delivery semantics are not yet the Stage 3 contract. | Inventory only; Stage 3 must expose exact destination and delivery state. |
| Select Helix-owned model/runtime | `HelixAskRuntimePicker`; `HelixAskLanguageModelPicker` | Appropriate to optional provider-backed Helix chat, misleading for provider-native Mode A. | Stage 3/4 must hide or relabel by mode; no Stage 1 behavior change. |
| Attach an external task/run | `agent-run-observer/AgentRunObserverBindingSurface` | Exact one-chat claim/binding exists but is an advanced one-time flow. | Preserve identity semantics; Stage 2/3 must turn it into profile-owned task selection. |
| Review external-agent activity | `agent-run-observer/AgentRunObserverLane` | Ordered durable events are pageable; the recent lane is compact and receipts cannot answer. | Reuse as the Stage 3 seed; keep progressive disclosure and non-answer authority. |
| Use voice steering | Helix Ask voice capture/steering modules | Voice starts disarmed and has governed delivery contracts. | Preserve; Stage 3 must bind delivery to the exact principal session or show `awaiting_agent_pickup`. |
| Use compact/mobile/accessibility paths | workstation/Ask responsive surfaces | Partial responsive and assistive patterns exist; the full PNA journey is not accepted. | Stage 2/3 acceptance work; no Stage 1 maturity claim. |
| Recover from connection failures | scattered account, observer, and provider messages | Typed failures exist but no single shared plain-language recovery reducer spans all axes. | Introduce shared semantics in Stage 1; wire surfaces in Stage 2. |

## Shared readiness semantics

`shared/helix-agent-client-readiness.ts` is the Stage 1 semantic owner. It keeps
these axes independent:

```text
provider_application
client_authorization
client_presence
catalog_sync
thread_attachment
continuation_readiness
environment_readiness
```

The projection has one deterministic headline and one recovery action. It
contains no credential, raw provider-thread content, hidden reasoning, or
answer authority. In particular:

- active authorization does not imply online presence;
- a synchronized catalog does not imply task attachment or continuation;
- an attached task does not imply environment readiness;
- environment degradation does not erase a healthy agent connection; and
- no selected agent is a useful `no_agent` state, not a startup failure.

The no-agent capability set is explicit: Account, connection status, manual
connector controls, run history, evidence, revocation, and Emergency Stop.
Reasoning, continuation, and provider-owned chat features remain unavailable
until the user selects and authorizes a conforming client.

## Packaging and isolated-startup guard

`apps/desktop/scripts/provider-neutral-runtime-guard-lib.mjs` scans actual files
rather than trusting allowlist names. `stage-runtime.mjs` fails before writing a
release manifest if a forbidden reasoning runtime appears. The manifest records
the negative boundary and separately classifies the Codex marketplace as a
release-required client adapter. `verify-runtime-tree.mjs` repeats the scan on
both staged and packed trees.

`apps/desktop/scripts/smoke-service-boundary.mjs` supplies an intentionally
absent `CODEX_BIN` and isolated absent `CODEX_HOME`. The bundled service must
still mount its authenticated loopback boundary, return version and release
status, create an isolated public-user session, preserve policy closure for
developer-only connector inventory, persist local state, and avoid creating
provider runtime state. This is an equivalent isolated-machine test for Stage
1; it is not signed-installer or external-client acceptance.

## Verification commands

Run in this order and preserve exact output in the evidence record:

```text
npx vitest run shared/__tests__/helix-agent-client-readiness.spec.ts tests/desktop-provider-neutral-runtime-guard.spec.ts --pool=forks
npm --prefix apps/desktop run build:host
npm --prefix apps/desktop run stage:runtime
npm --prefix apps/desktop run smoke:service-boundary
npm --prefix apps/desktop run pack:dir
npm --prefix apps/desktop run verify:runtime-tree
npm run helix:ask:discipline:quick
npm run helix:environment-harness:docs-audit
```

The packed-tree commands may be reported as not run if an existing unrelated
desktop build or host-resource constraint makes them unsafe; deterministic
schema and guard success alone does not substitute for the missing packed-tree
receipt.

## Stop/fail criteria

Stop Stage 1A and do not advance if any of the following occurs:

- the base desktop runtime requires or contains an OpenAI Codex npm/CLI runtime;
- the release cannot distinguish a Codex client adapter from Codex reasoning;
- startup, account/session, manual control, evidence, revocation, or Emergency
  Stop becomes conditional on an external agent;
- readiness collapses authorization, presence, catalog, task, continuation, or
  environment state into a single misleading boolean;
- a readiness or activity projection gains assistant-answer or terminal
  authority;
- a credential, raw provider-thread content, or hidden reasoning enters the
  projection; or
- existing OAuth, observer, event-ledger, connector, lease, approval, sandbox,
  or terminal-authority contracts are weakened.

## Evidence record

Record reproducible results under
`docs/evidence/eh-g8-pna1-packaging-ux-readiness-boundary-v1/`. Deterministic
success promotes only this Stage 1A boundary to `deterministically verified`.
It does not promote the parent provider-neutral connection/activity capability,
G8, the setup wizard, cross-client conformance, or installed-node release.

Deterministic acceptance is recorded at
`docs/evidence/eh-g8-pna1-packaging-ux-readiness-boundary-v1/2026-08-31-deterministic-acceptance.json`.
The optional packaged GUI launch smoke was not accepted because its unchanged
4 GiB physical-headroom guard refused the run. This is recorded separately from
the passing isolated bundled-service and packed-runtime evidence.
