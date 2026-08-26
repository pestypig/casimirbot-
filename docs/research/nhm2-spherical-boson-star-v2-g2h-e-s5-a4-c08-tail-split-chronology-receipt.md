# G2H-E-S5 A4 C08-011a Tail-Split Chronology Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-011a typed tail-split chronology and append-only finite-ledger controller
Current maturity: candidate-neutral implemented and independently source/runtime-audited
Target maturity: chronology kernel inside the still-incomplete C08-011 tail-split producer
Required frozen inputs: acknowledged Borel growth/quadrature definition; complete-unexecuted C08-010 predecessor; exact 13-entry `T0=1..4096` schedule; `T=2*T0`; fixed failure precedence; 32-byte ledger identities
Required evidence: early-tail-before-finite ordering; exact onset/ordinal schedule; byte-for-byte prefix identity; no model-count shrink; ordered rejection ledger; first pass; terminal finite failure; partial versus exhaustion distinction; corruption, determinism and protected-root guards
Stop/fail criteria: changed schedule, finite request before LMI/K completion, accepted prefix replacement, later attempt after terminal outcome, missing child reason, false record completeness, retune, candidate ingress, protected-root creation or authority promotion
Explicit non-goals: constructing `P_lyap`, LMI/K witnesses, finite panels, onset/history bounds or growth witnesses; completing C08-011; C08-012+; handler; candidate/Rust/G3/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral C08-011 work at C08-011b scalar Lyapunov/operator discovery only

Date: August 25, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_C08_011A_CHRONOLOGY_ONLY`

The controller admits only typed attempt records at exact onsets
`1,2,4,...,4096` and exact split `T=2*T0`. It enforces the frozen phase order:

```text
parameter margins -> P construction -> compact-box LMI -> K1 -> K2
  -> append-only finite request -> finite result
  -> onset constants -> weighted edge history
  -> scalar witness -> metric witness -> complete record
```

An early missing predicate must carry its exact first rejection reason and may
not request finite continuation. A finite producer failure propagates its
C08-006 through C08-010/resource code and terminates the attempt ledger. A
post-finite witness rejection may advance only after a successful append-only
extension. A complete pass must be the final supplied record and is necessarily
the first pass.

Every attempt binds model counts plus before/reused-prefix/after 32-byte
identities. Counts cannot shrink, the next before identity must equal the prior
after identity, and any finite request must present the unchanged prior prefix.
Twelve rejections remain an incomplete ledger; exactly 13 rejections emit
`C08-011_TAIL_SPLIT_EXHAUSTION` without retuning.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_tail_split_chronology_v1.hpp` | `a2584c6110b2fae66106ef3c9e34d93f595620c45f48f091f805fd4b1147d56c` |
| `mini_boson_star_primary_c08_tail_split_chronology_v1.cpp` | `a56ff2f1dbcfed21b56b80dfae59f79cd4900168bb7dbb92a1dc0e5a74d9f77d` |
| `mini_boson_star_primary_c08_tail_split_chronology_fixture_v1.cpp` | `d4897e257c025ccad0cd6c2779962a41ac436809e8d8d1ec09577ebc0966f88a` |
| `Dockerfile.primary.mini-boson-c08-tail-split-chronology-fixture.v1` | `22a3e114458fc42b4f88b923d2fdba86859ddff12d6134401e806f4be7e0db2c` |
| `nhm2_g2h_e_s5_c08_tail_split_chronology_runtime_audit.py` | `d5e20f571b3a1d1dad59592932a90aa6cdf088051eabe31916eccbe1579671ca` |
| fixture executable | `9bc77bcb57b6cead428f92d7c5fcfed20cbd6ea410f8f8dfdbfa193c8cc91ebe` |

The final independent audit build produced local image ID
`sha256:d2a6b29fa525fda4646d5a9cc07c48425e5113e28df4bf1d2c061402ec5829b9`
from the digest-pinned builder and runtime bases. It is fixture evidence only.

## Evidence

- Candidate-neutral chronology fixture: `26/26 PASS`, identical twice.
- Independent source/runtime audit: `81/81 PASS`.
- Recursive C08-010 predecessor audit: `87/87 PASS`.
- Repaired-by-status reconciliation replay: `27/27 PASS`; acknowledged
  definition bytes and their hash remain unchanged.
- Fixtures cover immediate pass, early rejection, post-finite rejection,
  terminal C08-010 failure, 13-entry exhaustion, 12-entry partial ledger,
  schedule/T drift, wrong reason, premature finite request, prefix corruption,
  count shrink, phase disorder, missing record, attempts after pass, missing
  terminal code, missing pointer/output and resource overflow.
- Candidate evaluations, positive samples and selected-state reads: zero.
- Candidate roots, execution ledgers, token and authorization: absent.
- Scientific handler linked: false; every authority remains false.

## Current-head verification

- Repository math report and validation: `323/323 PASS`.
- Required WARP battery: `18/18` files and `179/179` tests PASS.
- Casimir adapter run `2511`: `PASS/GREEN`; `firstFail=null`;
  certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
  integrity true.
- Primary, independent, authorization and S5 execution roots remain absent;
  port 5050 was stopped after verification.

This verifies the repository checkpoint. It does not certify a tail witness,
link a scientific handler or promote any authority.

## Remaining boundary

C08-011a proves only the selector/chronology carrier. It does not construct or
verify a mathematical tail witness. C08-011b must next implement the 4x4
shifted-asymptotic Lyapunov construction, exact compact-box LMI and fixed K1/K2
selectors on candidate-neutral boxes. C08-011 remains incomplete.
