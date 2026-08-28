Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P5A representative-width candidate-only calibration
Current maturity: implementation and inert preflight PASS; corrected cloud attempt blocked before build because the frozen upload omitted its Dockerfile; zero numerical runs
Target maturity: representative-width scaling evidence sufficient to bind the current runtime or require optimization first
Required frozen inputs: H2-P5 decision, exact P=1024 candidate-only ABI, pinned 512-bit/order-128 runtime, source manifest `7c56923d...a907`, and proposal `1eaea632...5a50`
Required evidence: exactly five complete runs at threads 1/4/8/16/16, full semantic digest equality, empty stderr, exact runtime identity, bounded timing projection, and false authority locks
Stop/fail criteria: any smaller-width or full-selector execution, timeout/partial output, semantic mismatch, nonempty stderr, changed arithmetic/equations/order/reduction, retry/retune, cost-ceiling breach, or authority promotion
Explicit non-goals: frozen-candidate evaluation, positive sampling, candidate/output roots, scientific handler linkage, H2 proof execution, G3, SI/metric, either 68-file lane, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: separately versioned candidate-neutral upload-inventory repair only; runtime binding remains blocked

# H2-P5A representative-width calibration packet

Status date: August 27, 2026.

Status: **BLOCKED PREEXECUTION: the corrected C4 VM ran, but the frozen
36-entry upload omitted the pinned Dockerfile; zero numerical runs occurred and
the VM is stopped.** The immutable
[corrected execution result](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p5a-execution-blocked-result.md)
passes an independent 25/25 blocker audit. The earlier
[storage compatibility correction](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p5a-storage-compatibility-correction.md)
is exhausted.

This packet freezes the smallest measurement that can distinguish the current
parallel implementation from the underfilled H2-P4 calibration. It changes no
scientific equation, frozen candidate, selector schedule, width threshold,
arithmetic, reduction order, proof definition, or authority.

## Why this measurement is representative

H2-P4 stopped at `P=4`, exposing at most four outer worker tasks. H2-P5A fixes
one candidate at `P=1024`, so all 16 cores can receive independent subpanel
work. The executable calls `evaluate_prepared_candidate` exactly once. It does
not evaluate `P=1..512`, perform width selection, execute a full selector, or
run an in-process serial oracle.

The manufactured candidate-neutral input is unchanged:

- 512-bit Arb arithmetic;
- retained order 128;
- 13 jets;
- 43 elementary convolutions per subpanel;
- prepared-moment kernel;
- ordinal subpanel storage and serial reduction;
- zero selected-member evaluations and positive samples.

## Exact execution surface

The executable is:

`/usr/local/bin/mini-boson-star-primary-c08-h2-p5a-width-calibration-v1`

Its source SHA-256 is
`57be54d69ab9e9dc3f43fd373bb98d29b45b600c478067a56c02520efca7e8ad`.
The Dockerfile SHA-256 is
`bf45b37bcac9d10d1d86215e82dc1dd09cb6d200934e48d3cfccdb385058de9c`.
The locally built binary SHA-256 is
`aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7`.

The builder and runtime OCI indices remain pinned respectively to
`9e94d19f...5221a1` and `8334e977...0159ab`. The cloud build must reproduce
the exact binary SHA-256 before any timed run. A differing binary is terminal
preexecution failure, not permission to rebuild differently.

The exact run sequence is:

1. `--threads 1`
2. `--threads 4`
3. `--threads 8`
4. `--threads 16`
5. `--threads 16` once more

Each process performs exactly one `P=1024` candidate-only call. Each has a
3,600-second external timeout. PASS, FAIL, timeout, or partial output becomes
immutable evidence. There is no retry.

## Semantic equality

Every successful run emits a domain-separated SHA-256 over all non-timing
semantics:

- target endpoints, center, and half-width;
- retained order and selected panel count;
- direct and reflected coverage offsets and ordinals;
- all retained coefficients and coefficient-width margins;
- all remainder bounds and remainder-width margins;
- every result counter, policy flag, and authority lock.

Arb values use `arb_dump_str` before hashing. All five digests must be exactly
equal. Timing is intentionally excluded. The two 16-thread runs also establish
repeatability.

## Frozen turnaround decision

One complete selector visits

`1 + 2 + ... + 65536 = 131071`

subpanels. Relative to one `P=1024` candidate, two selectors therefore use the
predeclared linear multiplier

`2 * 131071 / 1024 = 255.998046875`.

The slower of the two 16-thread `P=1024` measurements must be no more than
`337502` ms. This is a conservative integer boundary below

`24 hours / 255.998046875 = 337502.575... ms`.

- If all semantic gates pass and the slower repeated-16 time is at most
  `337502` ms, close H2-P5A `PASS_RUNTIME_BINDING` and prepare the bounded
  downstream runtime packet.
- If semantics pass but timing exceeds that boundary, close H2-P5A
  `OPTIMIZE_FIRST`. The next gate must preregister an algorithmic change before
  further representative timing.
- Any mismatch, timeout, partial output, nonempty stderr, identity failure, or
  authority-lock failure closes `FAIL_PREEXECUTION_OR_EQUIVALENCE`. Do not
  retry or retune.

## Machine and cost boundary

The proposed machine is exactly one temporary on-demand Google Compute Engine
`c4-standard-16` VM named `nhm2-h2-p5a-c4-16-20260827` in
`us-central1-a`, with a 30 GB `hyperdisk-balanced` boot disk under the
separately sealed storage correction. The planning rate is
`$0.79068/hour`; the total ceiling is `$2.00`. The VM must be stopped after
evidence capture or immediately when any stop criterion is reached.

## Inert evidence already complete

- implementation preflight: 32/32 PASS;
- independent preflight audit: 32/32 PASS;
- source manifest SHA-256:
  `7c56923df16e3cae9b82af3581de26a777a0b2b37f561012c40c29d0c2a7a907`;
- execution proposal SHA-256:
  `1eaea63238df4f81e043dc18c93ae2510253e8a9bdc187e34fc846078c7f5a50`;
- numerical runs executed: 0;
- corrected VM created and stopped: true;
- corrected attempt active or retryable: false;
- every candidate, proof, lane, lamp, physical, propulsion, and transport
  authority: false.

Current-head repository verification also passes: math registry `323/323`, the
required 18-file WARP battery `179/179`, and Casimir adapter run `2545`
`PASS/GREEN` with certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. The adapter PASS verifies gate integrity; it does not
promote this blocked preexecution attempt.

## Exact authorization text

> I authorize creation of exactly one temporary on-demand c4-standard-16 Google Compute Engine VM named nhm2-h2-p5a-c4-16-20260827 in us-central1-a with approximately 30 GB balanced storage, at the official listed compute rate of approximately $0.79068/hour and a total cost ceiling of $2.00, under H2-P5A proposal SHA-256 1eaea63238df4f81e043dc18c93ae2510253e8a9bdc187e34fc846078c7f5a50. Upload only the candidate-neutral source inventory and pinned Docker build dependencies named by source manifest SHA-256 7c56923df16e3cae9b82af3581de26a777a0b2b37f561012c40c29d0c2a7a907; build the pinned image; require binary SHA-256 aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7 before timing; and execute exactly one P=1024 candidate-only calibration at 1, 4, 8, and 16 threads plus exactly one repeated 16-thread calibration, each with a 60-minute external timeout. Preserve PASS, FAIL, timeout, or partial output as immutable evidence, independently audit it, and stop the VM afterward. I do not authorize smaller-width calibration, a full selector, changing or restarting any preserved earlier run, frozen-candidate evaluation, positive sampling, candidate/output-root creation, scientific handler linkage, retuning, retry, evidence deletion, G3/SI/metric/lane work, or any candidate, proof, geometry/state, lane, lamp, physical, propulsion, or transport authority promotion.
