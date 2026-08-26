# G2H-E-S5 A4 C08-010d Selector and Integrated-Producer Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-010d fixed dyadic selector, integrated derivative-convolution output and C08-010 closure
Current maturity: candidate-neutral implemented and independently source/runtime-audited
Target maturity: complete-unexecuted C08-010 producer inside the still-incomplete C08 duty
Required frozen inputs: acknowledged Borel growth/quadrature and state-jet definitions; audited C08-010a ledger, C08-010b bivariate and C08-010c remainder/13-jet kernels; fixed `P=1..65536` dyadic schedule; 512-bit directed arithmetic; fixed `2^-180` width rule
Required evidence: increasing candidate/subpanel chronology; exact dyadic endpoints; first-passing selection; boundary functional exactly once; all coefficient/remainder balls and margins; source-ordinal coverage; exhaustion replay; corruption, determinism and protected-root guards
Stop/fail criteria: schedule or tolerance drift, repeated boundary term, missing source coverage, nonfinite accumulation, output before width acceptance, exhaustion retune, candidate ingress, protected-root creation, handler linkage or authority promotion
Explicit non-goals: C08-011 through C08-015 and C08-021; C08 handler integration; candidate execution; token/authorization/root creation; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral A4 implementation at C08-011 only

Date: August 25, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_C08_010_COMPLETE_UNEXECUTED`

The selector visits exactly

```text
P = 1,2,4,...,65536
```

and constructs each exact dyadic subpanel in increasing ordinal order. For
each subpanel it invokes the audited C08-010c 13-jet kernel and records the
C08-010a direct-F and reflected-G source ordinals with explicit offsets.

The Volterra boundary term `F(t)G(0)` is supplied only on subpanel ordinal
zero. Every later subpanel receives an exact-zero boundary vector. Therefore
subdivision partitions only the integral and cannot multiply the single
boundary functional.

For every stored Taylor coefficient and complete uniform-remainder ball `z`,
the selector computes and stores the directed margin

```text
2^-180 * max(1, mag(z)) - rad(z)
```

and publishes only the first complete candidate for which every margin is
nonnegative. A failed width candidate remains local and cannot become output.
All 17 false decisions replay the exact failure
`C08-010_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION`; the policy does not
change the equations, order, tolerance, accepted C08-009 panel or resource
cap.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_convolution_ledger_v1.hpp` | `68f10eba4d35d09630c4343fde425cd216e9da79a2d450d852e828f2fb345b46` |
| `mini_boson_star_primary_c08_convolution_ledger_v1.cpp` | `6a077eeca8554cf65861747d545cfdb7b44cd6b100d442d5bc096a6712c585d7` |
| `mini_boson_star_primary_c08_convolution_bivariate_v1.hpp` | `ca406246c6894be06dfcddd92f0f797f512c10ebd96060112aa07c69995df108` |
| `mini_boson_star_primary_c08_convolution_bivariate_v1.cpp` | `f11d0c88fd98713adbf6eeffd4d7f1d65bc62df647f7a3a382b81581d5f2b1d1` |
| `mini_boson_star_primary_c08_convolution_jet_v1.hpp` | `219fbbfd9e5056cda99dc00108ee003a22286311be9fc409695e444780f02b6f` |
| `mini_boson_star_primary_c08_convolution_jet_v1.cpp` | `eccf43d23ae6667816441bbcbb0185630cbbec981d88206a54771e72dfe196d2` |
| `mini_boson_star_primary_c08_convolution_selector_v1.hpp` | `48344536a2ec09c510c71c02c1cd62cdd82e6612f0412223e0735e99c9d9e45f` |
| `mini_boson_star_primary_c08_convolution_selector_v1.cpp` | `057ddf85b0aaf68f9ef2f538c07687a48c910b3f62c4355449e673df15b903a7` |
| `mini_boson_star_primary_c08_convolution_selector_fixture_v1.cpp` | `0448473b451a4ff09f8ec47376eebab254cf1ba856182c5e08fc2b8e3480d628` |
| `Dockerfile.primary.mini-boson-c08-convolution-selector-fixture.v1` | `ebf9e3dca54802950c2d5e989b54a1c6af0b92c3d96a299e48a0749b2a01216a` |
| `nhm2_g2h_e_s5_c08_convolution_selector_runtime_audit.py` | `6855147ccd68be4cb8cc48ae9c63f8d9fbc2f6120ce2a6ef48a4ae4761822499` |
| fixture executable | `d2e7e3178c038d808a4a19b4fc6b1914587d738f21bbe7d171eb98b6c106daed` |

The independent audit build produced local image ID
`sha256:ef8c21326c1c1af7b7060595086829318cf8941497319c8a4853352f9f2d5159`
from the digest-pinned builder and runtime bases. It is fixture evidence only.

## Evidence

- Integrated selector fixture: `23/23 PASS`, identical twice.
- Independent source/runtime audit: `87/87 PASS`.
- Recursive C08-010c predecessor audit: `62/62 PASS`; it recursively preserves
  the independently audited C08-010b and C08-010a evidence.
- The exact manufactured convolution selected `P=1`, stored all 338
  coefficient/remainder numerical-width margins for order 24 and reproduced
  every value, first and ordered-second expected coefficient.
- The pure frozen-policy replay selected the first true entry at `P=8`,
  distinguished a 16-entry partial chronology from exhaustion, and returned
  exhaustion only after all 17 entries were false.
- Short, null and nonfinite boundary inventories, corrupt ledger chronology,
  invalid order, missing output and null result fail closed.
- Candidate evaluations, positive samples and selected-state reads: zero.
- Candidate roots, execution ledgers, token and authorization: absent.
- Scientific handler linked: false; every authority remains false.

## Remaining boundary

C08-010 is now complete-unexecuted as a candidate-neutral producer component.
The full C08 duty remains incomplete. C08-011 tail-split selection is the next
eligible A4 component; C08-012 through C08-015, C08-021 and the A5 handler stay
ordered behind their predecessors. No selected member has been evaluated.

## Current-head global verification

Current-head verification passes: math report/validation `323/323`, all 18
required WARP files `179/179`, and Casimir adapter run `2510` `PASS/GREEN` with
no first failure, certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. The temporary adapter used for this check was stopped.
This evidence completes only the C08-010 candidate-neutral component; it does
not link C08, authorize execution or promote any scientific or physical claim.
