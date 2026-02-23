# Business Model (Mission Overwatch Pivot)

Status: draft (pivoted for Dot framework + Helix Ask + Go Board).

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
