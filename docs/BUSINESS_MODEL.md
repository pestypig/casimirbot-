# Business Model (Mission Overwatch Pivot)

Status: draft (pivoted for Dot framework + Helix Ask + Go Board).

Planning precedence: the current installed-product commercial direction is
defined in `docs/architecture/casimirbot-environment-harness-product-goal-v1.md`.
Reconcile this draft through
`docs/work-packets/eh-g8-codex-first-paid-product-delivery-v1.md`; current stage
and dependencies live only in `docs/helix-environment-harness-work-program-v1.md`.
The open-source-core funnel, seat/voice pricing, and mission-overwatch milestones
below are earlier proposals, not mandatory terms of the paid Codex-first
harness. They remain visible for the staged audit; no license, price, or
publication change follows from this note.

## Current paid-harness specification

`docs/work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md` separates
software use and required hosted identity/connection operation. The selected
offer is free supported personal MCP tools and recurring subscription for hosted collaboration, with no
credit purchases, credit bundles or CasimirBot-funded model/API service. Users
connect their supported external reasoning application. Minecraft is a visible
technical proof of concept. Existing Stripe $5/$10 presets are billing
groundwork; subscription benefits and interval remain to define. Earlier
credit/provider proposals below are deferred outside this initial offer. Commercial permission, component distribution
rights, trial and exact service/expiry terms remain to finish; no sale or
source-license change is approved here.
The subscription must define expiry and preserve owner safety/recovery access.
The prepared cost worksheet measures hosting, support, payment and update costs
without pretending that model resale is the value of the base product.

Authenticated hosted collaboration is the leading paid-service candidate:
maintained room hosting, scoped participant access to owner-shared program
capabilities, revocation/recovery, action history and connector support. It does
not grant another person's model account or subscription. Security boundaries
apply regardless of payment; room eligibility never replaces consent. Prove
the personal tool loop first, then the invite/grant/use/revoke/reconnect journey
specified in CFP-1. Payer roles, guest policy and price-tier mapping remain open.

The developer-platform direction is defined in
`docs/architecture/casimirbot-developer-platform-product-contract-v1.md`: program
developers expose reviewed capabilities once for personal use and opt into
shared hosted collaboration. Developer-kit completeness and cross-program
claims require independent integration evidence.

The public landing page offers Download and Open app; the browser service
uses authenticated domain accounts and durable hosted-subscription records.
See `docs/architecture/casimirbot-domain-accounts-and-delivery-plan-v1.md` for
identity, payment, program-grant and GitHub/Replit deployment boundaries.

## One sentence
Helix is a constraint-first mission overwatch platform that converts live system
events into actionable callouts, operator board state, and auditable decisions.

## Product thesis
Most AI systems are prompt-first. Mission teams need event-first operations.
Helix differentiates by combining:
- repo-grounded reasoning (`docs/helix-ask-flow.md`)
- conservative evidence policy (`docs/helix-ask-agent-policy.md`)
- runtime-aware backpressure and bulkheads (`docs/helix-ask-runtime-limitations.md`)
- verification and trace artifacts (`WARP_AGENTS.md`, adapter/training trace)

## Core problem
Operators lose tempo when key changes are buried in long chat outputs or spread
across disconnected tools. They need one loop that handles:
- what changed
- why it matters
- what to do next
- what evidence supports the recommendation

## Solution shape
1) Helix Ask remains the grounded reasoning surface.
2) Dottie layer adds low-noise event callouts (voice/text parity).
3) Mission Go Board tracks shared operational state, risk, confidence, and
   pending actions with evidence links.
4) Verification and training traces preserve replayable accountability.

## Target customers
- Engineering operations teams running high-consequence workflows
- Research and simulation teams that require evidence and audit trails
- Enterprise platform teams deploying local/on-prem AI under policy controls

## Value propositions
- Faster operator reaction: event-salient callouts over long narrative outputs
- Higher trust: certainty posture is preserved from text to voice
- Better coordination: shared Go Board mission state across users and sessions
- Better governance: deterministic traces, fail reasons, and certificate records
- Lower switching cost: local-first architecture with replaceable voice backend

## Packaging and pricing
### 1) Core (Open Source)
- Existing repository stack, local deployment, community support.
- Objective: adoption funnel and developer trust.

### 2) Team Overwatch (SaaS or managed self-host)
- Per-seat base license.
- Included monthly voice synthesis minutes.
- Overage pricing per additional minute and verification run volume.
- Includes basic mission templates and dashboard export.

### 3) Enterprise Sovereign
- Annual platform license for on-prem or air-gapped deployment.
- Policy controls: auth/tenant isolation, audit retention, signing workflows.
- Advanced support and integration SLA.

### 4) Voice Asset Program (professional services)
- Consent and governance workflow design.
- Voice profile hardening and safety review.
- Site-specific mission-control onboarding.

## Revenue model
- Recurring subscription (seat + platform)
- Usage (voice minutes + premium verification throughput)
- Services (integration, compliance, and operational readiness)

## Cost model and margin drivers
Primary COGS:
- inference compute (LLM + TTS)
- storage and retention for traces/audio artifacts
- enterprise support workload

Primary margin levers:
- event salience policy (speak less, higher value per utterance)
- queue/concurrency controls
- adaptive output budgets under load
- deterministic per-tenant/per-mission voice budget guards
- local-first deployment for customers with strict data constraints

## Differentiators
- Event-driven operating model, not chat-only interface
- Evidence-gated certainty policy carried into callouts
- Mission board state model tied to proof artifacts
- Verification and certificate culture already present in repo processes
- Clear local-first architecture for ownership-sensitive deployments

## Go-to-market
- Lead with design partners in constrained engineering operations
- Demo on mission replay scenarios with measurable operator outcomes
- Use open-source core as top-of-funnel and enterprise conversion path

## KPI framework
Product metrics:
- callout precision (useful callouts / total callouts)
- callout latency to critical event (p50/p95)
- operator action completion time after callout
- Go Board state freshness and unresolved critical count

Quality metrics:
- Helix Ask evidence-gate pass rate
- arbiter mix (`repo_grounded|hybrid|general|clarify`)
- graph-lock stability and deterministic replay rate
- voice/text certainty parity violations (target: zero)

Business metrics:
- active operator seats
- net revenue retention
- gross margin by deployment tier
- pilot-to-production conversion rate

## Risks and mitigations
- Risk: certainty inflation in voice.
  Mitigation: enforce no-stronger-than-text certainty contract.
- Risk: licensing drift in voice engines/weights.
  Mitigation: explicit model allowlist by license tier and deployment mode.
- Risk: latency spikes under concurrent load.
  Mitigation: queue caps, adaptive token budgets, and clear degradation states.
- Risk: overcollection of sensitive telemetry.
  Mitigation: consent assertions, retention windows, and minimal audit fields.

## Execution milestones
1) Ship Dottie callout policy + voice proxy contract.
2) Ship Go Board mission-state schema and event APIs.
3) Ship operator dashboards linking outcomes to evidence and actions.
4) Publish pricing table and deployment playbooks tied to ROI.

## Repo alignment snapshot
Existing strengths:
- Live event streams in desktop/pill Helix Ask surfaces.
- Async Helix Ask job store for partial/final result continuity.
- Runtime resilience controls and concurrency bulkheads.
- Adapter verification and training-trace pipelines.

Current gaps for this pivot:
- No first-class mission-state Go Board schema yet.
- No unified voice service contract in server routes yet.
- No explicit business KPI dashboard for mission-control outcomes.


## Voice economics: managed-off vs fallback-enabled
- Managed-off mode: lowest external usage COGS, highest ownership posture, and predictable local capacity planning requirements.
- Fallback-enabled mode: higher resilience for non-critical paths but introduces variable managed-provider spend and provider governance overhead.
- Pricing posture should separate guaranteed local-core continuity from optional managed fallback usage so customers can choose sovereignty vs elasticity.


## Voice lane economics (experimental vs production)

- Experimental lane (`audiocraft`/Colab): low setup friction, variable reproducibility, and higher operator supervision burden.
- Production lane (`tts_prod_train`): higher up-front containerization cost with lower incident rate via deterministic status and artifact protocols.
- Margin preference for operator deployments: use production lane for repeatable outcomes, keep experimental lane for research only.
