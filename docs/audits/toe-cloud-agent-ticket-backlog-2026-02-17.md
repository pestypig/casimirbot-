# ToE Cloud Agent Ticket Backlog (2026-02-17)

This backlog decomposes remaining ToE work into falsifiable, non-overlapping tickets for parallel Codex Cloud execution.

Canonical machine-readable source: `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json`.

## Coverage Notice (2026-02-18)

This backlog remains valid for the current 10-ticket execution lane. A follow-up forest scan found the resolver graph defines more owners than this lane currently covers.

- Coverage audit: `docs/audits/repo-forest-coverage-audit-2026-02-18.md`
- Coverage-extension backlog: `docs/audits/toe-coverage-extension-backlog-2026-02-18.md`
- Progress context: treat `toe_progress_pct` as scoped progress for the active lane until coverage-extension tickets are added.

Recommended planning policy:

1. Keep current queue through `TOE-010` stable.
2. Add post-010 coverage-extension tickets for unrepresented high-impact owners (orbital/halobank, atomic-systems, robotics-recollection, external-integrations, resolver-owner manifest).
3. Resume strict sequencing with `TOE-008`/`TOE-009` hardening once coverage freeze is documented for the next batch.

Global execution contract for every ticket:

- Read: `docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md`, `docs/audits/helix-agent-context-checklist-2026-02-17.json`, `WARP_AGENTS.md`
- Maintain tree/DAG defaults: `allowedCL=CL4`, `allowConceptual=false`, `allowProxies=false`, `chart=comoving_cartesian`
- Run required gate:
  - `npm run audit:agent-context:check`
  - `npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl --trace-limit 200 --json .cal/casimir-audit-payload-9.json`
- If Casimir verdict is `FAIL`, fix first `HARD` failure and rerun until `PASS`
- Output strict JSON summary with `ticket_id`, `files_changed`, `tests_run`, `claim_tier`, and Casimir certificate metadata

## Reusable Worker Prompt

```md
You are Codex Cloud working in CasimirBot.

Objective:
Implement exactly one primitive ticket for the ToE framework using falsifiable, stage-bounded evidence.

Ticket:
- id: <TICKET_ID>
- tree_owner: <OWNER>
- primitive: <PRIMITIVE_NAME>
- done_criteria:
  1) <criterion>
  2) <criterion>
  3) <criterion>

File scope:
- allowed_paths:
  - <path 1>
  - <path 2>

Execution rules:
1) Update contract/schema first, runtime second, tests third.
2) Keep claims bounded to diagnostic/reduced-order/certified.
3) Do not modify files outside allowed_paths.

Run:
- npm run audit:agent-context:check
- npx vitest run <ticket tests>
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl --trace-limit 200 --json .cal/casimir-audit-payload-9.json

Fail policy:
- If Casimir verdict FAIL: fix first HARD fail and rerun until PASS.
- If warp policy fallback is active: claim_tier=diagnostic.

Return strict JSON only:
{
  "ticket_id": "",
  "files_changed": [],
  "tests_run": [],
  "claim_tier": "diagnostic|reduced-order|certified",
  "casimir": {
    "verdict": "PASS|FAIL",
    "trace_id": "",
    "run_id": "",
    "certificate_hash": "",
    "integrity_ok": false
  },
  "remaining_gaps": []
}
```

## Parallel Ticket Set (10)

```json
[
  {
    "id": "TOE-001-curvature-stress-bridge",
    "tree_owner": "physics-foundations",
    "gap_refs": ["5.4", "5.5", "5.8"],
    "primitive": "Curvature-unit bridge primitive (kappa_* -> bounded stress-energy surrogate)",
    "primary_path_prefix": "shared/essence-physics.ts",
    "allowed_paths": [
      "shared/essence-physics.ts",
      "shared/curvature-proxy.ts",
      "tests/stress-energy-units.spec.ts",
      "tests/physics-contract.gate0.spec.ts"
    ],
    "required_tests": [
      "tests/stress-energy-units.spec.ts",
      "tests/physics-contract.gate0.spec.ts"
    ],
    "done_criteria": [
      "Define typed bridge fields linking curvature-unit outputs to bounded stress-energy surrogate values with SI unit lock",
      "Add explicit provenance class and uncertainty envelope fields on bridge outputs",
      "Pass/fail tests verify threshold mismatch behavior and parity with canonical kappa formulas"
    ]
  },
  {
    "id": "TOE-002-semiclassical-coupling-contract",
    "tree_owner": "gr-solver",
    "gap_refs": ["5.8"],
    "primitive": "Semiclassical coupling primitive (G_mu_nu vs renormalized <T_mu_nu>)",
    "primary_path_prefix": "server/gr/constraint-evaluator.ts",
    "allowed_paths": [
      "server/gr/constraint-evaluator.ts",
      "server/gr/gr-evaluation.ts",
      "server/gr/gr-agent-loop-schema.ts",
      "tests/gr-constraint-contract.spec.ts",
      "tests/gr-constraint-gate.spec.ts"
    ],
    "required_tests": [
      "tests/gr-constraint-contract.spec.ts",
      "tests/gr-constraint-gate.spec.ts"
    ],
    "done_criteria": [
      "Add typed residual fields for semiclassical mismatch with threshold policy hooks",
      "Emit deterministic first-fail ids when semiclassical mismatch breaches HARD limits",
      "Coverage includes both admissible and non-admissible cases"
    ]
  },
  {
    "id": "TOE-003-quantum-provenance-class",
    "tree_owner": "uncertainty-mechanics",
    "gap_refs": ["5.8"],
    "primitive": "Quantum-source provenance primitive",
    "primary_path_prefix": "tools/warpViability.ts",
    "allowed_paths": [
      "tools/warpViability.ts",
      "tests/warp-viability.spec.ts",
      "tests/qi-guardrail.spec.ts",
      "tests/pipeline-ts-qi-guard.spec.ts"
    ],
    "required_tests": [
      "tests/warp-viability.spec.ts",
      "tests/qi-guardrail.spec.ts",
      "tests/pipeline-ts-qi-guard.spec.ts"
    ],
    "done_criteria": [
      "Every QI/quantum-proxy gate emits provenance_class in {measured,proxy,inferred}",
      "Confidence bands are included in gate payload and certificate payload",
      "Fail policy rejects missing provenance_class in strict mode"
    ]
  },
  {
    "id": "TOE-004-uncertainty-propagation-gates",
    "tree_owner": "uncertainty-mechanics",
    "gap_refs": ["4.4", "5.8"],
    "primitive": "Cross-scale uncertainty propagation primitive",
    "primary_path_prefix": "server/services/physics/invariants.ts",
    "allowed_paths": [
      "server/services/physics/invariants.ts",
      "server/services/physics/unit-signatures.ts",
      "tests/gr-invariants.spec.ts",
      "tests/stress-energy-integrals.spec.ts"
    ],
    "required_tests": [
      "tests/gr-invariants.spec.ts",
      "tests/stress-energy-integrals.spec.ts"
    ],
    "done_criteria": [
      "Propagate uncertainty intervals through key derived metrics, not point estimates only",
      "Constraint decisions consume propagated intervals and set confidence-aware fail reasons",
      "Tests confirm uncertainty-aware pass/fail flips at threshold boundaries"
    ]
  },
  {
    "id": "TOE-005-prediction-observation-ledger",
    "tree_owner": "trace-system",
    "gap_refs": ["4.4", "5.4", "5.8"],
    "primitive": "Prediction-vs-observation calibration primitive",
    "primary_path_prefix": "server/services/observability/training-trace-store.ts",
    "allowed_paths": [
      "server/services/observability/training-trace-store.ts",
      "server/routes/training-trace.ts",
      "shared/schema.ts",
      "tests/trace-api.spec.ts",
      "tests/trace-export.spec.ts"
    ],
    "required_tests": [
      "tests/trace-api.spec.ts",
      "tests/trace-export.spec.ts"
    ],
    "done_criteria": [
      "Add canonical prediction_vs_observation ledger record with uncertainty and trend fields",
      "Persist calibration deltas and expose them in trace export",
      "Gate tuning references ledger trend, with test coverage for trend rollups"
    ]
  },
  {
    "id": "TOE-006-firstfail-taxonomy-normalization",
    "tree_owner": "agi-runtime",
    "gap_refs": ["F3", "4.4"],
    "primitive": "Unified fail taxonomy primitive",
    "primary_path_prefix": "server/services/adapter/run.ts",
    "allowed_paths": [
      "server/services/adapter/run.ts",
      "server/routes/agi.adapter.ts",
      "server/services/observability/constraint-pack-evaluator.ts",
      "tests/runtime-frame-contract.spec.ts"
    ],
    "required_tests": [
      "tests/runtime-frame-contract.spec.ts"
    ],
    "done_criteria": [
      "firstFail always present on FAIL with canonical class in {constraint,certificate_integrity,certificate_status,certificate_missing}",
      "Certificate-policy FAIL states map to actionable firstFail ids",
      "Regression tests prevent null firstFail on FAIL verdict"
    ]
  },
  {
    "id": "TOE-007-ideology-hard-action-gates",
    "tree_owner": "ideology",
    "gap_refs": ["F2", "4.4"],
    "primitive": "Dual-key and jurisdictional-floor hard gate primitive",
    "primary_path_prefix": "server/routes/ethos.ts",
    "allowed_paths": [
      "server/routes/ethos.ts",
      "server/services/premeditation-scorer.ts",
      "docs/ethos/ideology.json",
      "tests/agi-plan.spec.ts",
      "tests/helix-ask-evidence-gate.spec.ts"
    ],
    "required_tests": [
      "tests/agi-plan.spec.ts",
      "tests/helix-ask-evidence-gate.spec.ts"
    ],
    "done_criteria": [
      "Covered actions require legal_key && ethos_key before execute/PASS",
      "Jurisdictional-floor violations produce explicit HARD gate failures",
      "Trace artifacts include ideology gate decision fields for replay"
    ]
  },
  {
    "id": "TOE-008-certificate-authenticity-policy",
    "tree_owner": "security-hull-guard",
    "gap_refs": ["F4", "5.8"],
    "primitive": "Certificate authenticity primitive",
    "primary_path_prefix": "tools/verifyCertificate.ts",
    "allowed_paths": [
      "tools/verifyCertificate.ts",
      "tools/warpViabilityCertificate.ts",
      "types/physicsCertificate.ts",
      "tests/verify-certificate-robotics.spec.ts"
    ],
    "required_tests": [
      "tests/verify-certificate-robotics.spec.ts"
    ],
    "done_criteria": [
      "Add required signer key-id trust policy for hardened profiles",
      "Verification fails closed when signature missing/invalid under hardened mode",
      "Integrity and authenticity checks are independently reported"
    ]
  },
  {
    "id": "TOE-009-verify-endpoint-hardening",
    "tree_owner": "ops-deployment",
    "gap_refs": ["F1", "F5"],
    "primitive": "Adapter verify-mode hardening primitive",
    "primary_path_prefix": "cli/casimir-verify.ts",
    "allowed_paths": [
      "cli/casimir-verify.ts",
      ".github/workflows/casimir-verify.yml",
      ".github/workflows/release-packages.yml",
      "tests/runtime-tool-policy.spec.ts"
    ],
    "required_tests": [
      "tests/runtime-tool-policy.spec.ts"
    ],
    "done_criteria": [
      "CI/release verify paths require explicit adapter endpoint and fail if unreachable",
      "Synthetic fallback marked non-certifying and blocked in certifying lanes",
      "Workflow logs include adapter URL, verdict, and certificate integrity state"
    ]
  },
  {
    "id": "TOE-010-unified-primitive-manifest",
    "tree_owner": "math",
    "gap_refs": ["5.8", "6"],
    "primitive": "Unified primitive manifest primitive (policy/runtime/tests/tree-node parity)",
    "primary_path_prefix": "configs/warp-primitive-manifest.v1.json",
    "allowed_paths": [
      "configs/warp-primitive-manifest.v1.json",
      "scripts/validate-agent-context-checklist.ts",
      "WARP_AGENTS.md",
      "tests/startup-config.spec.ts",
      "tests/theory-checks.spec.ts"
    ],
    "required_tests": [
      "tests/startup-config.spec.ts",
      "tests/theory-checks.spec.ts"
    ],
    "done_criteria": [
      "Manifest maps primitive_id -> policy source -> evaluator -> tests -> tree_owner",
      "Validation fails on missing or dangling manifest links",
      "Audit/checklist tooling consumes manifest for parity checks"
    ]
  }
]
```

## Coordinator Prompt (Parallelization)

```md
Create a worker batch from docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json tickets.

Rules:
1) One agent per ticket.
2) Do not combine tickets.
3) Enforce allowed_paths and required_tests per ticket.
4) Merge only tickets with:
   - casimir.verdict=PASS
   - casimir.integrity_ok=true
5) Keep unresolved tickets in backlog with explicit blocker notes.

Return a merge queue sorted by impact:
- physics safety first,
- then trace/calibration,
- then policy/compliance,
- then packaging/tooling.
```
