# Forest-Wide First-Class Lane Audit and Lane Expansion Plan (2026-02-19)

## Executive Summary
The resolver forest is broad and operational, but first-class lane closure is uneven.

What is strong now:
- Resolver forest and deterministic graph traversal are in place.
- Bridge strict-fail contracts are deterministic in relation assembly.
- Physics root-to-leaf manifest has explicit falsifier and maturity fields.
- ToE preflight already orchestrates validation gates.

What is missing for full root-to-leaf theory congruence:
- Many lanes are traversal-capable but not falsifier-first.
- Physics roots are modeled in the manifest, but several are not yet represented as dedicated lane boundaries in the resolver forest.
- Tool planning/execution and evidence semantics are not yet normalized as first-class cross-cutting lanes.

## Evidence Base
Primary repo surfaces used:
- `configs/graph-resolvers.json`
- `configs/resolver-owner-coverage-manifest.v1.json`
- `configs/physics-root-leaf-manifest.v1.json`
- `configs/physics-equation-backbone.v1.json`
- `scripts/validate-physics-root-leaf-manifest.ts`
- `scripts/validate-resolver-owner-coverage.ts`
- `scripts/toe-agent-preflight.ts`
- `server/services/helix-ask/graph-resolver.ts`
- `server/services/helix-ask/relation-assembly.ts`
- `tests/helix-ask-graph-resolver.spec.ts`
- `tests/helix-ask-bridge.spec.ts`
- `docs/audits/root-to-leaf-theory-congruence-audit.md`
- `docs/audits/repo-forest-coverage-audit-2026-02-18.md`

## First-Class Lane Definition
A lane is first-class when it has all three:
1. Dedicated tree lane (`tree.id` in `configs/graph-resolvers.json`)
2. Deterministic bridge/fail contracts
3. Explicit root-to-leaf falsifier path(s)

Status vocabulary:
- `present_dedicated`
- `present_shared`
- `underpowered`
- `overloaded`
- `missing`

## Forest-Wide Lane Census
| lane_family | current tree_ids | status | rationale | confidence |
|---|---|---|---|---|
| Physics foundations | `physics-foundations`, `gr-solver`, `math` | overloaded | Physics concepts are broad, but falsifier mapping is concentrated in manifest rather than lane boundaries. | 0.80 |
| Physics bridges | `stellar-ps1-bridges`, `ideology-physics-bridge` | present_dedicated | Deterministic strict fail reasons and replay-stable behavior are tested. | 0.85 |
| Uncertainty/certainty | `uncertainty-mechanics`, `certainty-framework` | underpowered | Central to falsifiability but not yet normalized as explicit cross-lane falsifier contracts. | 0.75 |
| Runtime/security | `agi-runtime`, `security-hull-guard` | underpowered | Deterministic gating exists in parts, but tool contract closure is not lane-level. | 0.75 |
| Tooling | `skills-tooling`, `packages`, `sdk-integration`, `llm-runtime` | underpowered | Tool metadata and execution provenance remain fragmented. | 0.70 |
| Telemetry/provenance | `trace-system`, `telemetry-console`, `hardware-telemetry`, `pipeline-ledger` | underpowered | Evidence paths exist but not consolidated into a falsifier ledger lane. | 0.70 |
| Simulation/atomic | `simulation-systems`, `atomic-systems`, `brick-lattice-dataflow` | underpowered | Present and routed; first-class falsifier closure is partial. | 0.70 |
| Governance | `ops-deployment`, `ideology`, `ethos-knowledge` | present_shared | Preflight governance is strong but lane-level falsifier contracts are mixed. | 0.80 |
| UI/binding | `ui-components`, `ui-backend-binding` | underpowered | Binding integrity is mostly system-falsifiable, not lane-falsifiable. | 0.65 |
| Integrations | `external-integrations`, `knowledge-ingestion` | underpowered | Provenance and drift contracts need deterministic closure. | 0.70 |
| Robotics | `robotics-recollection` | underpowered | Replay/veto semantics need explicit falsifier templates. | 0.70 |
| Missing cross-cutting lane | none | missing | No dedicated evidence-falsifier ledger lane yet. | 0.90 |
| Missing cross-cutting lane | none | missing | No dedicated tool contract lane yet. | 0.85 |
| Missing domain lane | none | missing | No dedicated orbital/ephemeris provenance lane yet. | 0.80 |

## Root-to-Leaf Congruence Coverage Matrix
| root family | leaf families | supporting lanes | bridge contracts | falsifier readiness | falsifiability type |
|---|---|---|---|---|---|
| `physics_spacetime_gr` | life/cosmology prompts | `physics-foundations`, `gr-solver` | present via bridge + manifest | partial | system-falsifiable |
| `physics_quantum_semiclassical` | life/cosmology/consciousness | `physics-foundations`, `uncertainty-mechanics`, bridges | strong bridge strictness | partial | mixed |
| `physics_thermodynamics_entropy` | `leaf_universe_produces_life` | `physics-foundations`, `stellar-ps1-bridges` | canonical entropy path checks | strong in manifest | local + system |
| `physics_information_dynamics` | life emergence, safety narratives | `certainty-framework`, `helix-ask` | indirect | weak | system-falsifiable |
| `physics_prebiotic_chemistry` | life emergence | `physics-foundations`, `simulation-systems` | indirect | weak | system-falsifiable |
| `physics_biology_life` | life + safety leaves | `stellar-ps1-bridges`, runtime/security | strict bridge evidence patterns | partial | mixed |
| `physics_runtime_safety_control` | human-ai-financial safety | runtime/security/trace | strict fail taxonomy partially shared | weak | system-falsifiable |
| tool planning/execution | tool-backed answers | runtime/tooling/ops | not yet lane-normalized | missing | system-falsifiable |
| telemetry/provenance | diagnostic leaves | trace/telemetry | partial | weak | system-falsifiable |
| orbital/ephemeris/time | planning + UI leaves | runtime + integrations | missing dedicated contract lane | missing | system-falsifiable |

## Missing Lane Estimate
### Scenario A (minimum closure)
New lane IDs:
- `evidence-falsifier-ledger`
- `tool-plan-contracts`
- `orbital-ephemeris-provenance`
- `physics_runtime_safety_control`

Expected effect: medium risk reduction, medium complexity.

### Scenario B (recommended closure)
Scenario A plus physics root lane split:
- `physics_spacetime_gr`
- `physics_quantum_semiclassical`
- `physics_thermodynamics_entropy`
- `physics_information_dynamics`
- `physics_prebiotic_chemistry`
- `physics_biology_life`

Expected effect: high risk reduction, high complexity.

### Scenario C (strict first-principles closure)
Scenario B plus governance expansion:
- `toe-governance-root-leaf`
- `ui-binding-contracts`
- `ingestion-falsifiability`
- `external-provenance-contracts`

Expected effect: very high risk reduction, high complexity.

## Candidate New Lane Specs
### `evidence-falsifier-ledger`
- purpose: normalize evidence/provenance/claim-tier semantics across lanes
- deterministic fail reasons:
  - `EVIDENCE_ENTRY_SCHEMA_INVALID`
  - `EVIDENCE_CONTRACT_MISSING_REQUIRED_FIELDS`
  - `EVIDENCE_CONTRACT_CONTRADICTORY`
  - `FALSIFIER_TEMPLATE_MISSING_FIELDS`
- falsifier template:
  - observable: `evidence_contract_completion_rate`
  - reject_rule: `completion_rate < 1.0 OR contradiction_count > 0`
  - uncertainty_model: `deterministic_contract_gate`

### `tool-plan-contracts`
- purpose: deterministic tool plan and execution receipts
- deterministic fail reasons:
  - `TOOL_PLAN_SCHEMA_INVALID`
  - `TOOL_EXECUTION_RECEIPT_MISSING`
  - `TOOL_RECEIPT_NOT_REPLAY_SAFE`
  - `TOOL_RESULT_OUT_OF_ALLOWED_BOUNDS`
- falsifier template:
  - observable: `tool_receipt_integrity_ok`
  - reject_rule: `receipt_missing OR receipt_hash_mismatch OR schema_validation_fail`
  - uncertainty_model: `runtime_gate_thresholds`

### `orbital-ephemeris-provenance`
- purpose: deterministic orbital/time provenance and drift checks
- deterministic fail reasons:
  - `EPHEMERIS_SOURCE_DIVERGENCE`
  - `EPHEMERIS_PARSE_NONDETERMINISTIC`
  - `TIME_MODEL_MATURITY_LABEL_MISSING`
  - `ORBITAL_OUTPUT_OUT_OF_BOUNDS`
- falsifier template:
  - observable: `ephemeris_proxy_consistency_ok`
  - reject_rule: `proxy_diff > allowed_eps OR parse_hash_mismatch`
  - uncertainty_model: `deterministic_threshold_contract_v1`

### Physics root lane split specs
Lane IDs:
- `physics_spacetime_gr`
- `physics_quantum_semiclassical`
- `physics_thermodynamics_entropy`
- `physics_information_dynamics`
- `physics_prebiotic_chemistry`
- `physics_biology_life`
- `physics_runtime_safety_control`

Shared requirements:
- root-to-leaf manifest path parity
- equation-backbone reference parity (where applicable)
- deterministic strict fail reasons
- explicit falsifier template for each root-to-leaf path

## Tool-Use Congruence Impact
Current strength:
- Deterministic graph traversal and blocked-edge reasons exist.
- Strict bridge fail taxonomy is replay-stable.

Current weakness:
- Tool plan to execution to evidence is not lane-contract normalized.
- Orbital/time tools do not yet have dedicated provenance lane closure.
- Evidence semantics can drift between lanes without a single ledger contract.

Consequence:
- Many failures are still system-level detections instead of local lane falsifiers.

## Prioritized Roadmap
### P0
- TOE-082: evidence-falsifier-ledger lane
- TOE-083: tool-plan-contracts lane
- TOE-084: orbital-ephemeris-provenance lane

### P1
- TOE-085: add `physics_spacetime_gr`, `physics_quantum_semiclassical`
- TOE-086: add `physics_thermodynamics_entropy`, `physics_information_dynamics`
- TOE-087: add `physics_prebiotic_chemistry`, `physics_biology_life`, `physics_runtime_safety_control`

### P2
- TOE-088: robotics-recollection lane promotion
- TOE-089: external-integrations lane promotion

## TOE Prompt Batch Reference
Full ticket prompt pack and execution details are maintained in:
- `docs/audits/toe-sequence-forest-lane-closure-2026-02-19.md`

## Execution Rules
For each TOE ticket:
1. Keep changes within `allowed_paths`.
2. Run ticket `required_tests`.
3. Run `npm run audit:toe:preflight`.
4. Run Casimir verify:
   - `npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
5. Write ticket receipt under `docs/audits/ticket-results/`.
6. Refresh ToE progress snapshot.
