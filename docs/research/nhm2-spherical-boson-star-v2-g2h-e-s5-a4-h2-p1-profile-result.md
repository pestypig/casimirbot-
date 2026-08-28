Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P1 function-level performance attribution
Current maturity: candidate-neutral diagnostic profile PASS; no scientific execution or proof
Target maturity: H2-P2 prepared-subpanel caching with exact enclosure equivalence
Required frozen inputs: frozen timing executable `0afc791e...b73`, 512-bit Arb arithmetic, order 128, 13-jet inventory, 43 elementary convolutions per subpanel, candidate-neutral exponent-zero fixture, and all authority locks
Required evidence: immutable failed instrumentation attempts, one complete v4 function profile, exact semantic-output equivalence, exact image/executable identities, symbolized call/time report, zero profiler overflow, focused tests, and current documentation/math validation
Stop/fail criteria: any scientific-output difference other than excluded timing fields, profiler loss/overflow, changed candidate byte or equation, selected-member ingress, positive sampling, candidate root/token/authorization creation, active-run mutation, or authority promotion
Explicit non-goals: optimizing H2; stopping or changing either preserved serial H2 execution; evaluating the frozen member; authorizing a scientific run; completing C08, the boson-star benchmark, G3, SI/metric, either lane, the lamp, physical viability, propulsion, or transport
Downstream gate unlocked: H2-P2 may implement a separately versioned prepared-subpanel cache, subject to exact equivalence

# H2-P1 candidate-neutral profile result

Status date: August 27, 2026.

## Verdict

H2-P1 passes as a diagnostic implementation result. A compiler-instrumented,
non-PIE executable completed exactly one exponent-zero candidate-neutral
subpanel, emitted 770 symbolized function records, returned with zero depth or
bucket overflow, and matched the frozen timing executable exactly after
excluding only the two preregistered timing fields. Both active serial H2 runs
were left unchanged.

This is performance evidence only. It is not an H2 enclosure result, a frozen-
candidate evaluation, a proof, or scientific/physical authority.

## Preserved attempts and repair boundary

Three earlier GNU `gprof` attempts are immutable `FAIL` evidence because no
`gmon.out` survived the real numerical process lifecycle. All three numerical
outputs nevertheless passed the exact semantic oracle:

| Attempt | Receipt SHA-256 | Result |
| --- | --- | --- |
| v1 fixed-name `gmon` | `939c3e1a56c757c5ca38d5c83e0e6d80f8209d66c94049eba78480c069b1084d` | instrumentation artifact absent; semantic equivalence true |
| v2 PID-prefix wrapper | `5a43eb18ac041ddbbae3ed8a7d6774cd42a1767e0742909b7f6bdac6ac7e334b` | instrumentation artifact absent; semantic equivalence true |
| v3 PID-independent rename | `b68466fb8e3b5035f2711693c64db4ffb8b466d6997955c86c0bb147e02ed30c` | instrumentation artifact absent; semantic equivalence true |

The v4 repair changed only instrumentation. GCC function-entry/exit hooks
accumulate calls, inclusive time and self time in fixed-size storage and emit
records to stderr. Scientific stdout remains available to the unchanged exact
semantic comparator.

## Bound identities

| Item | Identity |
| --- | --- |
| Baseline executable | `0afc791ec06d1d9870f77b4a0cc95460a3d0dca61a103e47a106e9415c2b2b73` |
| Baseline image | `sha256:a63eb6626fb2b427f5f6241eb543f28294752cc9c6e4a67390fe1539d2c184d1` |
| v4 profile executable | `860d3b75ad7f36c4d11b56695432425fdeb188769a12d5e6605a2d4a0d5f9738` |
| v4 profile image | `sha256:63606c1826ab71030e2df183a92c9561d6db30912ea74a17492914c12082ac15` |
| v4 profiler source | `7abc564f79833c7df3130b694c740679122ae25c45d4a1bca481ab692eb33a0d` |
| v4 Docker definition | `6aa4fc74f197d81554c0a54912359d9555803ef918c63e55faf82e280caf2513` |
| v4 runner | `5aa269e44a3ace2745cb3e49105a9e746fd574a729bb38a027c1ec4a153bbb1f` |
| Exact equivalence oracle | `91a759548d9fb13cca05eb27503cfc0661f5603d6660c8b62fad1c1a98756f06` |
| Receipt | `d4382aa127dbd839f73cddd4c0e6db5d0e38f555ee5a31317c7c5e0741aa0a1f` |
| Symbolized report | `708ff98c99fd964c74d7d85763903f6925ce75f26c262327d4582c59810d8276` |
| Equivalence receipt | `155b39984256a695b181194e12665187145ec69f090438bc9c7a30689599e51c` |
| Evidence inventory | `1ad6a3a2bae563e469a9df3600ee2a8f9cbb2816d0016d64a980a4103bcd5cfd` |

The evidence root is
`artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-function-profile-v4-exp0-20260827`.

## Profile result

The frozen baseline completed the subpanel in 22.576 seconds. Instrumentation
increased the profiled execution to 56.201 seconds, so absolute v4 timing is not
a runtime forecast. The call distribution is the useful result.

| Symbolized function/group | Calls | Self time | Share of recorded self time |
| --- | ---: | ---: | ---: |
| `beta_moment` | 715,563 | 22.261 s | 39.51% |
| `multiply_binomial` | 49,029,933 | 12.924 s | 22.94% |
| instrumented vector data/accessor layers | at least 93 million each in the leading accessors | 13.539 s across the three leading accessor rows | 24.02% |
| bivariate `evaluate` body excluding children | 43 | 2.106 s | 3.74% |
| `fmpz_init` plus `fmpz_clear` | about 49–55 million each | 3.275 s | 5.81% |

The exact count identity is decisive:

```text
715,563 beta moments / 43 elementary convolutions = 16,641 = 129^2
```

Every elementary convolution recomputes the same complete `(a,b)` moment table
for the same subpanel endpoints. The moments depend on `(a,b,u_left,u_right)`;
they do not depend on the selected `f_jet` or `gprime_jet`. That makes the first
H2-P2 lead a prepared immutable moment table computed once per subpanel and
reused by all 43 jet pairings.

The profile also supports later, separately gated reuse of ledger coverage,
endpoint powers, unique translated source-jet hulls and bounded workspaces.
Those changes must not be bundled into the first H2-P2 equivalence step.

## H2-P2 resume contract

The first H2-P2 patch should be deliberately narrow:

1. Add a versioned prepared-moment object whose construction performs the
   existing `fill_powers` and `beta_moment` operations once, in their current
   loop order and at 512-bit precision.
2. Let the bivariate predecessor consume that immutable table without changing
   coefficient, remainder, counter or failure-detail semantics.
3. Preserve the original evaluator as the oracle path.
4. Compare every output Arb value with `arb_equal`, and compare all counters and
   failure details exactly, across bounded manufactured and calibration
   fixtures.
5. Stop at the first difference. Do not combine parallelism, new recurrence
   mathematics, precision changes, allocation reuse or candidate execution.

The theoretical maximum from eliminating 42 of 43 identical moment-table
constructions is substantial, but the instrumented proportions cannot by
themselves certify the preregistered 4x H2-P2 target. Only an uninstrumented
post-equivalence calibration may establish speedup.

## Current-head verification

- Exact equivalence-oracle unit tests: 4/4 PASS.
- Math-stage validation: 323 entries, PASS.
- Required WARP battery: 18 files and 179 tests, PASS.
- Casimir adapter: run `2532`, `PASS/GREEN`, no first failure or deltas;
  certificate `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

These checks validate the current diagnostic patch and repository gate. They
do not certify H2, admit a candidate, or promote any scientific or physical
authority.
