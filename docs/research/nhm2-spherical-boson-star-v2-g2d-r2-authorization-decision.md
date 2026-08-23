Program gate: G2D — fresh replacement-candidate proof attempt
Workstream: authenticated classical control branch
Capability or component: G2D-R2 one-shot authorization decision
Current maturity: execution-ready identity; explicit user authority absent
Target maturity: one explicit immutable-attempt authorization or continued stop
Required frozen inputs: G2D-R1 checkpoint, implementation manifest, token and root
Required evidence: exact acknowledgement, unchanged hashes/runtimes and absent root
Stop/fail criteria: paraphrased authority, identity drift, root collision or prior run
Explicit non-goals: execution by this packet, candidate admission, G3/lane/lamp claims
Downstream gate unlocked: exactly one G2D execution only after exact acknowledgement

# G2D-R2 one-shot authorization decision

## Decision

`PENDING_EXPLICIT_USER_AUTHORIZATION`

The implementation is technically ready, but neither the identity token nor a
generic instruction to continue grants execution authority. This packet does
not run the candidate and does not authorize the exact future command.

## Frozen identity

- Implementation manifest SHA-256:
  `21e20f53f33f7517322a1a9d3c2e4290e8cf000617efe445cbebf349bacf81e5`.
- G2D-R1 checkpoint SHA-256:
  `5480ec2ad381ae9f3fc685f1d29f9a2096f5cee8146021f7f1f94b63700d23c1`.
- Linux image:
  `sha256:c4c437edf2ae480445f2ec9c1a551e6d88d264947d6238e023d5368b4a7c158a`.
- Native binary SHA-256:
  `ff56a59d33e2e450986aadb81769c1a141677fb830d75c0f960bf163a96a6713`.
- Identity token:
  `359cdf5d87e865dc3721b99bd79c3453046f5e489d51f67676dbc1c48167d034`.
- Exclusive future root:
  `artifacts/nhm2-spherical-boson-star-v2-g2d/fluid-star-chi-1-over-4-v1`.

## Exact authorization required

To authorize the one-shot attempt, the user must send this exact statement:

```text
I authorize exactly one G2D fluid-star execution under token 359cdf5d87e865dc3721b99bd79c3453046f5e489d51f67676dbc1c48167d034 using the checkpointed command. I understand that PASS, FAIL, or partial output becomes immutable evidence and there will be no retry, retune, deletion, or alternate output root.
```

Any shorter instruction, paraphrase, token omission, altered token, or missing
immutability/no-retry term leaves execution unauthorized.

## Consequence of authorization

Exactly one host command becomes eligible. The neutral orchestrator will verify
all bindings before exclusively creating the root, then run the Windows primary
and—only if chronologically eligible—the offline Linux independent evaluator.
The first failure is terminal. Any reached prefix is retained as evidence.

A `PASS` would be classical diagnostic evidence for this control geometry only.
It would not accept a quantum state, produce the 68-file lanes, light the Theory
Graph lamp, validate an NHM2 hull, or authorize physical, propulsion or
transport claims.

## Current locks

Authorization evidence is null. Candidate executions are zero. The future root
is absent. Execution, candidate admission, classical proof, state, SI, metric,
lane, replay, pair agreement, lamp, physical, propulsion and transport
authority remain false.
