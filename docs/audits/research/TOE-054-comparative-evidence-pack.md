# TOE-054 Comparative Evidence Pack: Warp Viability Cross-Check Tier Promotion

## 1) Comparative claim

Assess whether warp-viability outputs satisfy tier-promotion criteria under strict, cross-checked evidence versus insufficient-evidence baselines.

## 2) Comparison design and bounds

- Lane: `tier_promotion` research.
- Deterministic comparison anchors:
  - `tests/warp-viability.spec.ts`
  - `tests/warp-metric-adapter.spec.ts`
  - `tests/proof-pack-strict-parity.spec.ts`
- Comparator scenarios:
  - **Baseline A:** strict path with non-metric/proxy fallback evidence.
  - **Baseline B:** parity or evidence incompleteness preventing promotion.
  - **Promoted C:** strict measured evidence, parity agreement, and cert-integrity OK.

## 3) Comparative matrix

| Scenario | Evidence posture | Expected tier behavior | Deterministic threshold | Outcome posture |
|---|---|---|---|---|
| Baseline A: proxy fallback present | non-metric or fallback source in strict-sensitive checks | No certified promotion | strict provenance/contract rejects fallback | downgrade to `diagnostic`/`reduced-order` |
| Baseline B: strict parity/evidence gap | cross-check mismatch or missing required promotion evidence | Promotion blocked | strict parity + required checks must all pass | conservative fallback retained |
| Promoted C: measured + strict + parity-aligned | metric-derived evidence with passing constraints and certificate integrity OK | Certified-eligible path allowed | hard constraints pass, strict-source pass, parity pass, integrity OK | promotion permitted per policy |

## 4) Deterministic acceptance thresholds

Promotion acceptance requires all of:

1. HARD viability constraints pass with admissible posture.
2. Strict-source/metric-contract requirements pass for promotion-sensitive checks.
3. Proof-pack strict parity remains deterministic and green.
4. Certificate verification indicates integrity OK (and authenticity OK when enforced).

Failure of any threshold yields deterministic conservative downgrade.

## 5) Counterexample hooks

- Introduce proxy fallback in a strict-sensitive path -> promotion must be blocked.
- Break strict parity assumptions in proof-pack surface -> promotion must be blocked.
- Provide certificate material with failed integrity/auth mismatch -> certifying posture must be denied.

## 6) Recommendation

- **Current recommendation:** maintain conservative default (`reduced-order`/`diagnostic`) and allow certified-eligible narration only in strict, fully cross-checked runs.
- This evidence pack supports tier promotion guardrails, not unconditional promotion.
