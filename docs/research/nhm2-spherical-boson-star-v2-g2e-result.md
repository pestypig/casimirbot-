Program gate: G2E — candidate-neutral interval/provenance repair
Workstream: authenticated classical proof infrastructure
Capability or component: directed square root and bounded failure provenance
Current maturity: independently audited candidate-neutral infrastructure `PASS`
Target maturity: closed G2E evidence and fresh candidate-selection handoff
Required frozen inputs: G2E generic contract and immutable G2D no-retry evidence
Required evidence: primary exact postconditions, offline MPFR replay and synthetic receipts
Stop/fail criteria: G2D reuse, candidate evaluation, identity drift or missing error bytes
Explicit non-goals: scientific proof, candidate admission, G3, lanes or physical claims
Downstream gate unlocked: fresh candidate-family selection and preregistration only

# G2E interval/provenance result

## Verdict

```text
PASS_CANDIDATE_NEUTRAL_INFRASTRUCTURE_ONLY
```

G2E repairs the two infrastructure defects exposed by G2D. It does not repair,
rerun or reinterpret the closed G2D attempt.

## Directed arithmetic

The primary CPython implementation computes a guarded square-root estimate,
rounds it onto the requested decimal lattice, then adjusts and tightens each
endpoint using exact `Fraction` square comparisons. It accepts an endpoint only
when the exact postconditions and adjacent-endpoint tightness rules hold.

Nine preregistered generic vector roles cover zero, unit, an exact fractional
square, two ordinary irrationals, tiny exact/irrational inputs, a huge exact
square and interval endpoints. All nine pass.

The source/runtime-disjoint C17 implementation uses GMP rationals and MPFR at
512 output bits, 4096 input bits, directed `RNDD/RNDU` square roots and exact
rational postcondition adjustment. Its offline, network-none Docker replay
passes all ten scalar endpoint checks.

Image ID:
`sha256:b927cf05736373c71f03acc8f53f88f3d2fe0f17cc4d2f68edc31622ba3797f0`.

Native binary SHA-256:
`09e1b6d0e27ac3bce81efcdada44fc78a58ef02c47f21c79b48d9706ae314198`.

## Durable failure provenance

The neutral harness now streams stdout and stderr through independent digest
workers. It retains only the frozen 64-byte prefix per stream while persisting:

- total byte count;
- exact SHA-256 of the complete stream;
- base64 prefix;
- truncation flag; and
- return code, timeout status and first-failure identity.

Synthetic exit-7 evidence proves 96 stdout bytes and 80 stderr bytes are fully
hashed, both prefixes are capped at 64 bytes, both truncation flags are true,
and preexecution/terminal self-hashes verify. Reusing the same synthetic root
raises an exclusive-creation failure without changing either receipt.

## Audit and noninterference

Focused acceptance passes `7/7`. The audit also rehashes the occupied G2D root:

- `preexecution-binding.json` remains
  `dfde4d74b7fbe6b73216cf0b263fc165c127820411b6f8ab61ffedd38acbf76c`;
- `terminal-receipt.json` remains
  `25bc26daa110d7de50b2657325bb9d5c6c767482887ba79211c97c7f514ccc83`;
- the primary directory remains empty; and
- no independent G2D lane exists.

No G2E source imports a G2D evaluator or contains its scientific formulas.

## Successor boundary

G2E is closed. The next eligible work is a fresh candidate-family selection
and preregistration. It must use a genuinely new scientific identity, root,
thresholds and separate future execution authority. The G2D identity remains
ineligible.

Candidate admission, classical proof, state, lane, replay, lamp, physical,
propulsion and transport authority remain false.
