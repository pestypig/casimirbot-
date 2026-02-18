# TOE-050 Comparative Evidence Pack: Ideology ↔ Physics Bridge

## 1) Claim being compared

Whether bridge outputs can be treated as tier-promotion candidates when strict evidence metadata is present versus missing.

## 2) Experiment design and bounds

- Lane: `research` (`tier_promotion`).
- Deterministic fixtures from required tests:
  - `tests/helix-ask-bridge.spec.ts`
  - `tests/helix-ask-graph-resolver.spec.ts`
  - `tests/ideology-dag.spec.ts`
- Comparator scenarios:
  - **A (present/complete):** bridge evidence includes complete metadata contract.
  - **B (missing/incomplete):** bridge evidence omits one or more required metadata fields.

## 3) Comparative results

| Scenario | strictBridgeEvidence | Metadata completeness | Expected behavior | Observed test-aligned behavior | Acceptance |
|---|---:|---:|---|---|---|
| A: present/complete | true | complete | no deterministic bridge-metadata fail | no strict fail for metadata-contract reason | PASS |
| B: missing/incomplete | true | incomplete | fail with deterministic reason | `fail_reason = IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING` | PASS |
| C: missing/incomplete (backward-compat) | false | incomplete | preserve legacy non-strict default | `fail_reason` undefined | PASS |

## 4) Deterministic thresholds for promotion acceptance

Promotion candidate may advance from diagnostic-only narration iff:

1. `strictBridgeEvidence=true`.
2. 100% bridge evidence entries in active path include:
   - `provenance_class`
   - `claim_tier`
   - `certifying` (boolean)
3. Deterministic fail taxonomy remains unchanged (`IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING` for incompleteness).
4. Required tests remain green with no fixture drift.

If any threshold fails, policy outcome is **conservative fallback to diagnostic tier**.

## 5) Falsifiability hooks

- Remove one metadata field in strict fixture → must reproduce deterministic fail reason.
- Disable strict mode with same incomplete fixture → fail reason must disappear (compatibility check).
- Alter resolver bridge fixture edges → deterministic traversal assertions must fail until corrected.

## 6) Tier recommendation

- **Current global recommendation:** `diagnostic` default with strict-mode guarded promotion.
- **Per-run promotion eligibility:** `reduced-order` candidate only when thresholds in Section 4 pass.
- **Not eligible for certified tier:** no certifying evidence chain with certificate-grade integrity for ideology↔physics bridge claims in this ticket scope.
