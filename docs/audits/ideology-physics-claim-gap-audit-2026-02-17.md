# Ideology-Physics Claim Gap Audit - 2026-02-17

## 1) Scope

This audit checks alignment between:

- Ideology claims (rooted at `mission-ethos`) and runtime enforcement.
- Physics viability/certificate claims and actual verification paths.
- Recollection/movement claims and implemented trace-memory behavior.

Ideology anchor:

- Root: `docs/ethos/ideology.json:3`
- Branches reviewed: `jurisdictional-floor`, `two-key-approval`, `no-bypass-guardrail`, `metric-integrity-guardrail`, `stewardship-ledger`, `lifetime-trust-ledger`.

## 2) Executive Summary

The repo has strong physics gate primitives (constraint gates, viability policy, certificate hashing, trace emission), but there are important claim-to-enforcement gaps:

1. Verify-mode fallback can produce a synthetic PASS path.
2. Ideology dual-key/jurisdiction claims are not enforced as hard runtime gates.
3. `firstFail` reporting does not consistently represent certificate-policy failures.
4. Certificate integrity is hash-based only; signer authenticity is optional and not enforced.
5. Operational defaults can weaken continuity/tenant guarantees unless env flags are configured.

## 3) Findings (Ordered by Severity)

### F1 - High: Verify fallback can mint proof from synthetic telemetry

Impact:
- A verify request can fall back to a synthetic `repo-convergence` pack and still build a "proof" object, weakening strict verify semantics.

Evidence:
- `server/routes/agi.plan.ts:15707`
- `server/routes/agi.plan.ts:15718`
- `server/routes/agi.plan.ts:15723`
- `server/routes/agi.plan.ts:15726`
- `server/routes/agi.plan.ts:15755`

Recommendation:
- Remove synthetic fallback for `mode=verify` or mark fallback proof as non-certifying and fail closed.

### F2 - High: Ideology dual-key and jurisdiction-floor are not hard action gates

Impact:
- Branches that state legal + ethos dual-key approval appear as guidance/retrieval content, not mandatory runtime gating before execution.

Evidence:
- `docs/ethos/ideology.json:5329`
- `docs/ethos/ideology.json:5431`
- `server/routes/ethos.ts:233`
- `server/routes/ethos.ts:493`
- `server/services/premeditation-scorer.ts:25`
- `server/services/premeditation-scorer.ts:29`
- `server/routes/agi.adapter.ts:193`

Recommendation:
- Add a policy gate that enforces legal-key + ethos-key checks for covered actions before PASS/execute.

### F3 - High: `firstFail` can be missing for certificate-policy FAIL states

Impact:
- Operator workflow says "fix first failing HARD constraint", but certificate integrity/status failures can fail overall without a matching `firstFail` HARD constraint.

Evidence:
- `AGENTS.md:16`
- `server/gr/gr-evaluation.ts:95`
- `server/gr/gr-evaluation.ts:99`
- `server/services/adapter/run.ts:91`
- `server/routes/warp-viability.ts:102`
- `server/routes/warp-viability.ts:107`
- `server/services/observability/constraint-pack-evaluator.ts:547`

Recommendation:
- Introduce canonical fail classes (`constraint`, `certificate_integrity`, `certificate_status`, `certificate_missing`) and always emit one actionable `firstFail`.

### F4 - Medium: Certificate trust model is integrity-only (no required signer verification)

Impact:
- Current checks prove payload consistency, but do not enforce signature authenticity.

Evidence:
- `types/physicsCertificate.ts:19`
- `tools/warpViabilityCertificate.ts:92`
- `tools/verifyCertificate.ts:18`
- `tools/verifyCertificate.ts:33`
- `server/services/robotics-handback.ts:24`

Recommendation:
- Add optional signer policy (key id + signature verify) for environments requiring stronger authenticity guarantees.

### F5 - Medium: Casimir verify defaults can drift from adapter-backed GR verification

Impact:
- Without `--url` or configured base URL, verifier runs local constraint-pack mode (often `tool-use-budget`), which is not equivalent to GR viability verification.

Evidence:
- `cli/casimir-verify.ts:2625`
- `cli/casimir-verify.ts:2628`
- `cli/casimir-verify.ts:2746`
- `cli/casimir-verify.ts:2750`
- `AGENTS.md:14`

Recommendation:
- Require explicit adapter endpoint in CI/release verification profile, and fail if only local fallback mode is available.

### F6 - Medium: Continuity and tenant isolation depend on environment flags

Impact:
- Session memory, persistence, and tenant-safe export behavior are partly optional; defaults can be weaker than long-horizon trust claims.

Evidence:
- `server/routes/agi.plan.ts:2759`
- `server/services/helix-ask/session-memory.ts:97`
- `server/services/helix-ask/session-memory.ts:142`
- `server/services/essence/memory-store.ts:31`
- `server/routes/training-trace.ts:150`
- `server/auth/tenant.ts:58`

Recommendation:
- Define hardened production defaults profile with required flags for tenant enforcement and persistence.

### F7 - Medium: Movement recollection exists but is still mostly simulated/heuristic

Impact:
- Deterministic movement episodes are traced, but sensing/control remains largely simulated with heuristic deltas rather than rich real-world sensor fusion.

Evidence:
- `client/src/store/useNavPoseStore.ts:40`
- `client/src/store/useNavPoseStore.ts:179`
- `client/src/hooks/use-nav-pose-driver.ts:55`
- `client/src/lib/nav/nav-dynamics.ts:47`
- `client/src/lib/nav/nav-dynamics.ts:103`
- `server/services/robotics-handback.ts:17`

Recommendation:
- Define a hardware-grade movement schema extension and provenance class for real sensor channels.

### F8 - Medium: Some narrative claims are ahead of declared math maturity for non-GR loops

Impact:
- Product narrative describes broad cross-domain loop reliability, while several analysis modules are still Stage 0.

Evidence:
- `docs/product-narrative.md:225`
- `MATH_STATUS.md:85`
- `MATH_STATUS.md:88`
- `MATH_STATUS.md:89`

Recommendation:
- Add explicit maturity badges in docs/UI and constrain claims by stage.

### F9 - Low: Goal-zone protocol doc includes verification step not executed by harness

Impact:
- Documentation asks for verify + trace export, but `helix-ask-goal-zone` script does not execute those steps.

Evidence:
- `docs/experiments/helix-ask-goal-zone.md:52`
- `scripts/helix-ask-goal-zone.ts:508`
- `scripts/helix-ask-goal-zone.ts:519`

Recommendation:
- Add optional post-pass verification hook in goal-zone automation.

## 4) ToE Readiness vs Total Evaluation

### 4.1 Definitions

- Fundamental ToE:
  - A unified, empirically validated theory combining gravity and quantum systems in one physics framework.
- Operational ToE (for Helix Ask):
  - A constrained decision framework that unifies physics gates, memory/recollection, and leadership-governance constraints to keep predictions aligned with reality over time.

### 4.2 Current Readiness Snapshot (Calibrated Estimate)

- Fundamental ToE readiness: low (about 5-10%).
  - Reason: strong guardrails and diagnostics exist, but no full quantum-gravity unification model is implemented.
- Operational ToE readiness for Helix Ask navigation: moderate (about 60%).
  - Reason: the repo already has most structural pieces for constrained, reality-checked reasoning under runtime limits.

### 4.3 What We Already Have

- Gravity/GR constraint pipeline with policy-gated acceptance:
  - `server/gr/gr-evaluation.ts`
  - `server/gr/gr-agent-loop.ts`
  - `WARP_AGENTS.md`
- Quantum-proxy guardrails (QI and related constraints) as executable checks:
  - `WARP_AGENTS.md`
  - `tools/warpViability.ts`
- Certificate + trace infrastructure for pass/fail provenance:
  - `tools/warpViabilityCertificate.ts`
  - `tools/verifyCertificate.ts`
  - `server/services/observability/training-trace-store.ts`
  - `server/routes/training-trace.ts`
- Ideology tree and belief graph substrate, anchored at `mission-ethos`:
  - `docs/ethos/ideology.json:3`
  - `server/routes/ethos.ts`
- Recollection continuity and graph lock for multi-turn reasoning:
  - `server/services/helix-ask/session-memory.ts`
  - `server/services/helix-ask/graph-resolver.ts`
  - `configs/graph-resolvers.json`
- Curvature-unit and kappa proxy contract for reduced-order curvature bookkeeping:
  - `shared/curvature-proxy.ts`
  - `shared/essence-physics.ts`
  - `server/skills/physics.curvature.ts`
  - `tests/physics-contract.gate0.spec.ts`
  - `tests/curvature-unit.v2.spec.ts`
- Movement episode tracing and deterministic replay seed path:
  - `shared/schema.ts`
  - `client/src/store/useNavPoseStore.ts`
  - `client/src/hooks/use-nav-pose-driver.ts`

### 4.4 What Is Missing for a Total Evaluation Framework

- One canonical cross-domain state vector:
  - Missing a single typed state that jointly carries gravity residuals, quantum-proxy limits, ideology/leadership constraints, uncertainty, and confidence.
- One canonical objective:
  - Missing an explicit optimization target for "longevity of momentum" (long-horizon utility under risk, entropy, and governance constraints).
- Hard ideology-to-action enforcement:
  - `jurisdictional-floor` and `two-key-approval` are not yet mandatory runtime gates before action acceptance.
- Unified fail taxonomy:
  - Missing a fully normalized `firstFail` model that includes certificate failures, not only constraint failures.
- Prediction error-budget loop:
  - Missing a first-class "prediction vs observed reality" ledger with uncertainty intervals and trend-based calibration across runs.
- Local-model ToE profile:
  - Missing a productionized minimal feature set tuned for small runtime budgets (what to always compute, what to defer, and what to treat as advisory).
- Curvature-to-stress bridge contract:
  - Missing a canonical typed bridge from `kappa_drive`/`kappa_body`/`kappa_u` and curvature-unit artifacts to bounded semiclassical stress-energy approximations with provenance and uncertainty class.

### 4.5 Minimal Local-Model ToE Navigation Profile (Recommended)

Use a constrained "total evaluation" profile optimized for small local models:

1. Keep only high-value state features at runtime:
   - Gate pass/fail, first fail id/severity, certificate status/hash/integrity, coherence/dispersion, entropy/optimism, kappa proxy values, and session graph-lock ids.
2. Enforce a strict action admissibility formula:
   - Maximize predicted progress subject to physics PASS, certificate integrity, ideology gate PASS, and memory continuity.
3. Require uncertainty-aware outputs:
   - Every high-impact recommendation includes confidence band, limiting assumptions, and required next verification step.
4. Promote only constraints with real error-margin impact:
   - Prioritize constraints that most reduce prediction error in observed runs; defer low-impact diagnostics to background.

## 5) Repo Forest Coverage Map (Tree + DAG Guardrails)

### 5.1 Path Inventory Snapshot (2026-02-17)

Largest path clusters in the current repository snapshot:

- `external` (3615 files)
- `client` (656 files)
- `server` (472 files)
- `docs` (450 files)
- `tests` (178 files)
- `scripts` (103 files)
- `shared` (86 files)
- `tools` (56 files)
- `reports` (34 files)
- `modules` (33 files)

This is sufficient to define a stable forest of domains while keeping tree + DAG boundaries explicit.

### 5.2 Forest Domains (Defined Areas, Coverage, Gap Fill)

| Forest area | Primary repo paths | Tree packs / DAG anchors | What we have now | Gap fill candidates |
| --- | --- | --- | --- | --- |
| Governance + ideology | `docs/ethos/ideology.json`, `docs/knowledge/ethos/*`, `server/routes/ethos.ts`, `server/services/premeditation-scorer.ts` | `ideology`, `ethos-knowledge`, `zen-society`, `zen-ladder-pack` | Ideology tree root at `mission-ethos`, belief graph APIs, entropy/optimism-aware premeditation scoring. | Turn `jurisdictional-floor` and `two-key-approval` into hard pre-action gates (F2). |
| Physics viability + GR | `server/gr/*`, `tools/warpViability.ts`, `tools/warpViabilityCertificate.ts`, `tools/verifyCertificate.ts`, `WARP_AGENTS.md` | `physics-foundations`, `warp-mechanics`, `gr-solver`, `casimir-tiles`, `dp-collapse`, `uncertainty-mechanics` | Constraint evaluation, viability checks, cert hashing/integrity checks, solver loops. | Enforce certifying verify mode without synthetic fallback (F1), and add signer authenticity policy (F4). |
| Curvature unit + kappa bridge | `shared/curvature-proxy.ts`, `shared/essence-physics.ts`, `server/skills/physics.curvature.ts`, `server/helix-proof-pack.ts`, `client/src/physics/curvature.ts` | `physics-foundations`, `warp-mechanics`, `uncertainty-mechanics` | Canonical `kappa_*` formulas, typed curvature-unit IO, provenance/hash artifacts, and proof-pack surfaced curvature signals are already implemented and tested. | Add a canonical semiclassical bridge contract from curvature-unit outputs to stress-energy approximation and bind it to uncertainty + gate scoring. |
| Helix Ask graph reasoning | `server/services/helix-ask/graph-resolver.ts`, `server/routes/agi.plan.ts`, `configs/graph-resolvers.json` | `helix-ask`, `certainty-framework`, `agi-runtime`, `debate-specialists` | Deterministic tree/DAG walk and graph-lock continuity APIs. | Add KPI/SLO coverage (gate pass mix, graph-lock stability, arbiter mix) tied to release gates. |
| Recollection + trace memory | `server/services/observability/training-trace-store.ts`, `server/routes/training-trace.ts`, `shared/schema.ts`, `server/services/essence/*` | `trace-system`, `robotics-recollection`, `essence-luma-noise` | Typed `trajectory` and `movement_episode` trace payloads with optimism + entropy, export path for replay analytics. | Add one canonical cross-domain state vector and normalized FAIL taxonomy including certificate failures (F3). |
| Movement + robotics execution | `client/src/store/useNavPoseStore.ts`, `client/src/hooks/use-nav-pose-driver.ts`, `client/src/lib/nav/nav-dynamics.ts`, `server/services/robotics-handback.ts` | `robotics-recollection` | Nav state, movement loops, waypoint dynamics, replay-oriented event traces. | Add hardware-grade sensor fusion provenance and deterministic reenactment contracts for real devices. |
| Runtime + local model toolchain | `server/services/adapter/*`, `cli/casimir-verify.ts`, `sdk/*`, `packages/*`, `scripts/*` | `llm-runtime`, `skills-tooling`, `sdk-integration`, `packages` | Adapter-driven verification flow and local-model runtime scaffolding are present. | Ship a constrained local-model ToE profile (always-on checks vs deferred checks) and enforce adapter URL in release verify mode (F5). |
| Ops + trust + deployment | `.github/workflows/casimir-verify.yml`, `ops/*`, `reports/*`, `artifacts/*` | `ops-deployment`, `telemetry-console`, `security-hull-guard` | CI verification gate and artifact pipeline exist. | Add persistent audit log storage + operator dashboards + hardened tenant defaults (F6). |

### 5.3 Tree + DAG Guardrail Contract for New Areas

Any new "forest area" should be admitted only if all conditions pass:

1. Register a tree pack in `configs/graph-resolvers.json` with bounded walk parameters (`maxAnchors`, `maxDepth`, `maxNodes`) and explicit edge priority.
2. Respect global congruence defaults from `docs/warp-tree-dag-walk-config.json`: `allowedCL=CL4`, `allowConceptual=false`, `allowProxies=false`, `chart=comoving_cartesian`, deterministic `seedOrder=lex`, `walkMode=bfs`.
3. Persist session continuity via graph locks and `graphTreeIds` in session memory APIs (`server/routes/agi.plan.ts`, `server/services/helix-ask/session-memory.ts`).
4. Emit trace artifacts with tree IDs, gate verdicts, first-fail class, and certificate status/hash for replay and audit.
5. Define promotion criteria before production use (coverage, latency budget, failure mode thresholds, rollback policy).

### 5.4 Total-Evaluation Gap Matrix (Across the Forest)

| Total-evaluation capability | Current status | Required fill |
| --- | --- | --- |
| Unified gravity + quantum-proxy + ideology + memory state vector | Missing | Add canonical schema and carry it through traces, memory, and gate scoring. |
| Curvature-unit to stress-energy bridge state | Partial | Promote `kappa_*` + curvature-unit artifact hashes/provenance into a first-class bridge contract consumed by policy and trace scoring. |
| Unified "longevity of momentum" objective function | Partial | Add explicit objective with risk, entropy, coherence, and governance terms. |
| Hard ideology enforcement at action time | Missing | Implement mandatory dual-key + jurisdiction checks before PASS/execute. |
| Certificate trust (integrity + signer authenticity) | Partial | Add signature verification policy with required key-id trust roots in hardened profiles. |
| Prediction error-budget loop (predicted vs observed with confidence bands) | Missing | Add first-class calibration ledger and trend policy for gate tuning. |
| Local-model constrained navigation profile (8 GB class runtime) | Partial | Productize minimal compute profile and publish always-on guardrails. |
| Operator observability for claim-to-enforcement | Partial | Persist audit logs and expose dashboards mapping ideology/physics claims to runtime evidence. |

### 5.5 Physics Primitive Inventory (Current vs Missing)

This primitive map is intended as the handoff baseline for Codex Cloud execution.

| Primitive class | Current primitives in code | Status | Gaps to close for complete parity |
| --- | --- | --- | --- |
| Warp viability constraint primitives | `FordRomanQI`, `ThetaAudit`, `TS_ratio_min`, `CL3_RhoDelta`, `VdB_band`, `M_exotic_budget` (`tools/warpViability.ts`) | Implemented and executable. | `M_exotic_budget` is runtime-only and not declared in `WARP_AGENTS.md` JSON policy; keep policy/spec parity so cloud agents cannot drift. |
| GR residual gate primitives | `BSSN_H_rms`, `BSSN_M_rms` (HARD), `BSSN_H_maxAbs`, `BSSN_M_maxAbs` (SOFT) (`server/gr/constraint-evaluator.ts`) | Implemented and policy-gated via GR gate + certificate checks (`server/gr/gr-evaluation.ts`). | Add explicit first-fail mapping for certificate-policy failures, not only residual constraint failures (F3). |
| Congruence and chart-contract primitives | Strict congruence toggle and metric-source checks, chart contract status, metric-derived theta and rho references (`tools/warpViability.ts`, `server/energy-pipeline.ts`, `tests/warp-metric-adapter.spec.ts`). | Implemented with strict mode behavior; CL4 congruence defaults are documented in tree-walk config. | Promote strict-congruence mode to hardened default profile for production lanes. |
| Curvature proxy + curvature-unit primitives | Canonical `kappa_body`, `kappa_drive`, `kappa_u` (`shared/curvature-proxy.ts`), typed curvature-unit IO (`shared/essence-physics.ts`), deterministic provenance/hash pipeline (`server/skills/physics.curvature.ts`), parity checks (`tests/physics-contract.gate0.spec.ts`, `tests/curvature-unit.v2.spec.ts`). | Implemented and reproducible for reduced-order curvature bookkeeping and artifact replay. | Add a typed semiclassical bridge primitive linking curvature-unit outputs to bounded `<T_mu_nu>` approximations and uncertainty propagation for gate-level use. |
| Natario metric/stress primitives | Natario-family metric-derived `T00` paths and canonical refs (`warp.metric.T00.natario.shift`, `...natario_sdf.shift`, `...irrotational.shift`) tested in `tests/natario-metric-t00.spec.ts`. | Implemented and tested for metric-derived stress provenance. | Add a compact primitive manifest consumed by runtime + docs so references remain synchronized when new field families are added. |
| VdB derivative-support primitives | Region-II/IV derivative support checks and two-wall support coupling (`tools/warpViability.ts`). | Implemented as pass/fail support qualifiers for `VdB_band`. | Add explicit tree-pack node coverage for derivative-support evidence in `warp-mechanics` knowledge graph. |
| Certificate primitives | Header, payload hash, certificate hash issuance (`tools/warpViabilityCertificate.ts`), integrity recheck (`tools/verifyCertificate.ts`). | Integrity chain is implemented and enforced in viability routes. | Signer authenticity is optional (`types/physicsCertificate.ts`) and not required by policy (F4). |
| Math-maturity primitives | Stage ladder (0 to 3) + stage-tagged modules (`MATH_STATUS.md`) with required-test policy in `WARP_AGENTS.md`. | Implemented as governance and reporting structure. | Several non-GR analysis modules remain Stage 0, so narrative claims must stay bounded by maturity (F8). |
| Physics trace/replay primitives | Viability traces with `pass`, `firstFail`, `certificate`, and export pipeline (`server/routes/warp-viability.ts`, `server/routes/training-trace.ts`). | Implemented and available for replay/audit. | Persisted audit storage and dashboards are still incomplete for long-horizon operator review (F6). |

### 5.6 Natario-Congruence Definition of Done (Scientific Path)

For this repo, a build is "scientifically admissible" only when all checks below hold in one run record:

1. GR gate PASS for HARD residual constraints (`BSSN_H_rms`, `BSSN_M_rms`) under configured thresholds.
2. Warp viability has no HARD fails (`FordRomanQI`, `ThetaAudit`) and status resolves to `ADMISSIBLE`.
3. Congruence evidence is metric-derived and chart-contract valid (no proxy fallback accepted in strict paths).
4. Certificate exists, hash integrity is `integrityOk=true`, and policy status is admissible.
5. Trace artifact is emitted with gate outcome, first fail (if any), certificate refs, and reproducible run metadata.

This aligns to:

- Constraint policy source: `WARP_AGENTS.md`.
- Runtime viability + congruence execution: `tools/warpViability.ts`.
- Certificate issuance and verification: `tools/warpViabilityCertificate.ts`, `tools/verifyCertificate.ts`.
- GR gate and policy combination: `server/gr/constraint-evaluator.ts`, `server/gr/gr-evaluation.ts`.
- Tree/DAG congruence defaults: `docs/warp-tree-dag-walk-config.json`.

### 5.7 Codex Cloud Build Contract (Fill Gaps Without Breaking Tree/DAG)

Every future cloud patch that extends physics capability should follow this sequence:

1. Choose one forest area and one tree-pack owner (`physics-foundations`, `warp-mechanics`, `gr-solver`, `uncertainty-mechanics`, or `dp-collapse`).
2. Add or update primitive definitions in one place first (policy file or typed schema), then bind runtime evaluators to that primitive ID.
3. Add or update tests that prove both pass and fail behavior for the primitive.
4. Emit trace fields required for replay (`primitive_id`, pass/fail, first-fail class, certificate metadata, tree IDs).
5. Keep claims within declared math stage (Stage 0 to Stage 3) and do not label as certified without Stage 3 evidence.
6. Run Casimir verification via adapter endpoint and record PASS + certificate hash/integrity in the audit.
7. Update this audit's primitive table so the forest remains explicit and bounded.

Scientific narrative contract for all cloud-generated work:

- Observation -> Primitive -> Constraint -> Gate -> Certificate -> Trace -> Replay.
- Any missing step means the result is diagnostic, not certified.

### 5.8 Missing Fundamental-Bridge Primitives (Gravity + Quantum)

These are the highest-value missing primitives for a stricter gravity/quantum "total evaluation" program:

| Missing primitive | Tree-pack owner | Minimum done criteria |
| --- | --- | --- |
| Semiclassical coupling primitive (`G_mu_nu` vs renormalized `<T_mu_nu>`) | `physics-foundations` + `gr-solver` | Typed contract for both sides of the equation, units validated, and fail/pass tests for mismatch thresholds. |
| Curvature-unit bridge primitive (`kappa_*` -> bounded stress-energy surrogate) | `physics-foundations` + `uncertainty-mechanics` | Define canonical mapping from curvature-unit/proxy outputs to stress-energy surrogate fields, include provenance class (`measured`, `proxy`, `inferred`), and enforce uncertainty band checks in traces. |
| Quantum-source provenance primitive (measured vs proxy vs inferred) | `uncertainty-mechanics` + `warp-mechanics` | Every QI or quantum-proxy gate carries provenance class and confidence band in trace payloads. |
| Cross-scale uncertainty propagation primitive | `uncertainty-mechanics` | Constraint decisions include propagated uncertainty, not just point estimates, with confidence-aware first-fail output. |
| Prediction-vs-observation calibration primitive | `simulation-systems` + `trace-system` | Persistent error ledger with trend checks that can tighten/relax thresholds only through policy updates. |
| Unified primitive manifest (policy + runtime + tests parity) | `math` + `ops-deployment` | One machine-readable manifest links primitive id -> policy -> evaluator -> tests -> tree-pack node. |
| Certificate authenticity primitive (signer verification) | `security-hull-guard` + `ops-deployment` | Required signature verification for hardened profiles, with trusted key-id policy and fail-closed behavior. |

### 5.9 Major Defined Areas Now Added to Agent Context

The following areas already exist in code and are large enough that agents must treat them as first-class context:

| Area | Defined in code | Why this is major | Required agent behavior |
| --- | --- | --- | --- |
| GR policy fallback path | `server/gr/gr-constraint-policy.ts` | If `WARP_AGENTS.md` cannot load, runtime falls back to defaults. | Treat fallback as non-certifying for release/certified lanes; escalate and fail closed for production verification. |
| Proof-pack CL4 evidence contract | `server/helix-proof-pack.ts`, `docs/proof-pack.md`, `tests/proof-pack.spec.ts`, `tests/proof-pack-strict-parity.spec.ts` | This is the strict provenance layer for proof-facing values (`source`, `proxy`, strict keys). | Keep proof-pack parity with viability gates; do not promote UI proof claims from pipeline-only proxy fields. |
| Curvature-unit and kappa parity contract | `shared/curvature-proxy.ts`, `shared/essence-physics.ts`, `server/skills/physics.curvature.ts`, `server/helix-proof-pack.ts`, `tests/physics-contract.gate0.spec.ts`, `tests/curvature-unit.v2.spec.ts` | It is the current bridge from energy-density inputs to reproducible reduced-order curvature evidence and proof-pack surfacing. | Preserve SI-unit lock, preserve shared/client kappa parity, and require curvature artifact hashes/provenance on any cloud patch that claims stress-energy directionality. |
| GR-OS stage/action contract | `server/gr/gr-os-payload.ts` | Encodes halt/throttle/notify actions and stage (`diagnostic`, `reduced-order`, `certified`). | Emit and evaluate GR-OS actions in cloud workflows so failed certificate/gate states are actionable, not silent. |
| Certificate drift recheck path | `tools/verifyCertificate.ts` (`recheckWarpViabilityCertificate`) | Integrity hash match alone does not prove current physics parity over time. | For long-lived or replay-critical tasks, run recheck and record `physicsOk` plus differences. |
| Constraint-pack policy profiles and tenant overrides | `server/routes/agi.constraint-packs.ts`, `server/services/constraint-packs/constraint-pack-policy.ts`, `server/services/constraint-packs/constraint-pack-policy-store.ts` | Cloud/offloaded runs need explicit customer/tenant-safe policy application. | Include policy profile id/version/customer in run artifacts; reject cross-tenant policy mismatch. |
| Required test matrix as policy contract | `WARP_AGENTS.md` (`requiredTests`) | Certification depends on the declared suite, not just one verify call. | Run required test subsets for touched physics surfaces before claiming certified output. |
| TS autoscale mitigation semantics | `tools/warpViability.ts` (`TS_autoscale_resampled`, active gating, resample loop) | TS thresholds can be recovered by autoscale/resample behavior and affect verdict interpretation. | Persist autoscale/resample metadata in trace interpretation and replay acceptance criteria. |

### 5.10 Agent Execution Runbook (Markdown-Complete Context)

Machine-readable ingestion artifact:

- `docs/audits/helix-agent-context-checklist-2026-02-17.json` (`schema_version=helix_agent_context_checklist/1`)
- CI gate command: `npm run audit:agent-context:check`
- Parallel cloud backlog: `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.md`

Use this runbook for every cloud/offloaded patch touching ideology, physics, viability, or curvature-adjacent surfaces:

1. Determine tree-pack scope and policy lane.
2. Confirm no policy fallback path is active for certification lanes (`WARP_AGENTS.md` must load).
3. Update primitive/policy/schema definitions first, then runtime evaluators, then tests.
4. Keep proof-pack parity for every changed proof-facing primitive.
5. For curvature- or stress-energy-facing claims, preserve `kappa_*` canonical formulas and include curvature-unit provenance/hash artifacts in the run output.
6. Run required tests relevant to changed surfaces, including strict parity/proof tests when proof, congruence, or curvature contracts are touched.
7. Run adapter-backed Casimir verify and record verdict/certificate integrity.
8. For long-horizon changes, run certificate recheck and record `physicsOk` plus difference fields.
9. Record policy profile context (profile id/version/customer) for tenant-scoped runs.
10. Emit final artifact bundle: plan, diff, constraint report, GR-OS payload, proof-pack snapshot, curvature bundle refs (when applicable), verification report, certificate refs, training-trace export.
11. Mark claim tier explicitly:
`diagnostic` if any policy fallback/proxy-only or missing required evidence remains.
`reduced-order` if constraints pass but full certified evidence path is incomplete.
`certified` only if all hard constraints, policy checks, required tests, proof-pack parity, and certificate integrity checks pass.

## 6) Priority Remediation Sequence

1. Block synthetic verify fallback for certifying paths (F1).
2. Implement hard dual-key/jurisdiction gate for covered actions (F2).
3. Normalize `firstFail` taxonomy for all FAIL outcomes (F3).
4. Enforce adapter-endpoint verification mode in CI/release profiles (F5).
5. Add production hardening profile for tenant/persistence defaults (F6).
6. Publish a single physics primitive manifest and enforce parity between `WARP_AGENTS.md`, runtime evaluators, and tests.
7. Add signer-authenticity policy for certificates in hardened production profiles.

## 7) Notes

- This report is an audit snapshot dated 2026-02-17.
- No source code behavior was changed by this document itself.

## 8) Patch Verification Record

- Command:
  - `npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl --trace-limit 200 --json .cal/casimir-audit-payload-9.json`
- Verdict: `PASS`
- Trace ID: `audit:2026-02-17:ideology-physics-doc-v9-release-workflow-gate`
- Run ID: `17902`
- Certificate hash: `d2821c7d650d8d4c86f5270c2510b94ed7cd8c45b12d807e0420613f9fe7ce5d`
- Certificate ID: `constraint-pack:repo-convergence:d2821c7d650d`
- Integrity: `integrityOk=true`

## 9) Coverage Addendum (2026-02-18)

A follow-up forest scan was run to reduce scope-blind spots in ToE planning. See:

- `docs/audits/repo-forest-coverage-audit-2026-02-18.md`

Key addendum outcomes:

- Current ToE ticket map covers `9` owners while resolver forest currently defines `41` tree owners.
- Coverage ratio for active ToE owners is therefore about `21.95%` of currently configured resolver owners.
- This means current `toe_progress_pct` should be interpreted as progress on the active 10-ticket lane, not full-forest completion.
- High-value defined but under-ticketed domains include:
  - Halobank/orbital/horizons runtime surfaces
  - atomic-systems lane
  - robotics-recollection lane
  - external-integrations evidence lane

Planning impact:

- It is acceptable to delay `TOE-008` briefly while adding a coverage-expansion planning pass, as long as safety/security hardening remains queued and explicit in backlog governance.
