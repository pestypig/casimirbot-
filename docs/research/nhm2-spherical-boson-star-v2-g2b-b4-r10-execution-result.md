Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: sole B4-R10 equilibrated four-grid execution
Current maturity: immutable numerical `FAIL`, independently audited
Target maturity: typed first-failure evidence for one bounded diagnosis
Required frozen inputs: authorized token, checkpoint, image and R9/R10 closure
Required evidence: exclusive prefix, terminal receipt, profiles and audit replay
Stop/fail criteria: preserve first failure; no retry, retune, deletion or reuse
Explicit non-goals: second execution, candidate admission, proof/lane/lamp authority
Downstream gate unlocked: one no-solve terminal-mechanism diagnosis only

# NHM2 spherical-boson-star v2 G2B-B4-R10 execution result

## Verdict

The exactly authorized offline command ran once and terminated with:

```text
status = FAIL
decision = STOPPED_AT_FIRST_SOLVE_FAILURE
firstFailure = armijo_schedule_exhausted_without_retry
level = L0 / N=64
stage = 0 / origin amplitude 2^-16
```

One level and one stage were attempted; zero levels and zero stages completed.
No N=96/128/256 solve and no field or constraint cross-grid gate ran. The
exclusive output root is now immutable and cannot be deleted, reused, renamed
into place, or retried.

The terminal receipt self-hash is
`e8d0268f499f6e1cba9ccf26cc34dc602b4a40f7f96478bb7e59e7acce037706`.
Its raw file SHA-256 is
`947377efc9648e6fc59a73a78e65eb0eb83a7b335252bd3c87bbe02a263fbd99`.

## Terminal numerical evidence

The equilibrated run accepted 29 Newton updates and constructed 30 linear
correction traces before exhausting the unchanged 25-exponent Armijo schedule.
The returned endpoint records:

| Quantity | Binary64 value |
|---|---:|
| raw residual Linf | `3.900686589666604e-9` |
| scaled step Linf | `1.9849604952690325e-12` |
| unused constraint Linf | `1.5889862975117312e-4` |
| direct frequency `w` | `0.9999999999984228` |
| accepted alpha count | 29 |
| consecutive pass count | 0 |
| `varphi` nonincreasing | false |

The new constraint monitor is valid diagnostic evidence at the failed endpoint:

| Profile norm | Value |
|---|---:|
| `q` Linf | `3.1341256374082717e-7` |
| `q` Clenshaw-Curtis L2 | `9.655130306236519e-8` |
| `delta` Linf | `1.631890802104974e-7` |
| `delta` Clenshaw-Curtis L2 | `9.404809903679196e-8` |

These values are not acceptance thresholds. Four-level contraction was never
eligible because stage zero failed.

## Comparison with immutable B4-R4

The R10 and R4 accepted-alpha sequences are identical. Equilibration changes
the endpoint only at small numerical scale:

- residual ratio R10/R4: `0.9999995178430278`;
- scaled-step ratio: `0.9999999990642421`;
- unused-constraint ratio: `0.9999999999506171`;
- maximum state-word absolute difference: `2.324568760137674e-14` at ordinal 61;
- frequency difference: `2.098321516541546e-14`.

The preregistered power-of-two correction scaling therefore did not remove the
stage-zero Armijo failure. This is evidence for a bounded no-solve diagnosis,
not authority to alter the candidate, extend backtracking, or try another
formulation.

## Immutable output inventory

Exactly 11 files exist:

| Path | Bytes | Raw SHA-256 |
|---|---:|---|
| `preexecution-binding.json` | 8,537 | `b6e4066a54d042e5bf3e0a9caa3a1ebbac9bb42895d44dd6c228b40b0158c611` |
| `level-64/initializer-state.f64le` | 1,544 | `e275934b041d2a4b067ad8f5c2c3f21c25b46f9edae60805871021773c1732a2` |
| `level-64/stage-00-state.f64le` | 1,544 | `e331f74f0f479297b15b960f9d8c81f81c6aa15a4844b4770357c4aca7852b4a` |
| `level-64/stage-00.json` | 23,511 | `7c9bd9108d88e119fd00d6afff28c2b2a8b063ab201e64bdfe93587901f01837` |
| `level-64/stage-00-q.f64le` | 512 | `bf92f55966eb8fbe283c546ac5b9f9ff901b568c2544d73ec8d2fb00939380f5` |
| `level-64/stage-00-g.f64le` | 512 | `7a4d0dccb8f03523ca34fe4524a11fd94b0b3497e5dc99956aaad0551f3920cf` |
| `level-64/stage-00-prefix.f64le` | 512 | `96e57d0883cdf94c9fafbbfe87d37edadeba4da3e349ebe2607441edbf1d21f5` |
| `level-64/stage-00-delta.f64le` | 512 | `2eb0d29d177915e89f056e2197f7669923a79cf644b32cfe048228861a59e8c1` |
| `level-64/stage-00-constraint-monitor.json` | 1,543 | `688ed3914a542e3b9861f5068562f47a27d8cacb2b143dc580e72366b03046ab` |
| `level-64/level-receipt.json` | 749 | `412cc07f47a9e89516e39d6a6255a35b8bd22fda269a5d886188cf647b22f9d1` |
| `terminal-receipt.json` | 2,038 | `947377efc9648e6fc59a73a78e65eb0eb83a7b335252bd3c87bbe02a263fbd99` |

## Independent audit

The producer-independent audit source is 16,324 bytes with SHA-256
`513f0e1ae5b435776c62bdc7a2d8b1afe10da2223c9f7f198175c010d688fdf1`.
It imports neither the R10 producer nor Newton/continuation. Host and admitted
Linux both pass 6/6. The audit independently:

- verifies exact inventory and write chronology;
- rehashes both self-hashed receipts and every checkpoint/R9 dependency;
- reopens every state/profile/metadata binding;
- regenerates only the frozen grid and independently reproduces `q`, `g`, the
  MPFR512 shifted-Chebyshev prefix, `delta`, and all four reported norms
  byte-for-byte;
- confirms 30 correction trace identities, 29 accepted updates, first-failure
  precedence, no cross-grid duties, no retry/retune, and all false locks.

No Newton, continuation, or Armijo replay was performed by the audit.

## Repository verification

The post-execution repository gates pass:

- math registry: 318 entries valid;
- required WARP regression: 18 files and 179/179 tests pass;
- Casimir adapter: run `2448`, `PASS` / `GREEN`;
- certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: true.

The training-trace export is
`artifacts/training-trace-g2b-b4-r10-execution-result.jsonl`.

## Authority boundary

This execution establishes only an authenticated classical numerical failure.
Candidate admission, continuous vacuum connection, proof, replay, lane, pair
agreement, joint geometry/state, diagnostic lamp, Theory Graph, physical
viability, propulsion and transport authority remain false. A Casimir adapter
PASS verifies repository gate integrity; it cannot convert this numerical FAIL
into scientific acceptance.
