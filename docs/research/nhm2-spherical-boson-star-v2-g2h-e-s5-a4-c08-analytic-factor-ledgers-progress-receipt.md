Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: append-only analytic `F/E1/E2` ledgers
Current maturity: candidate-neutral implementation and independent audit PASS
Target maturity: audited inputs for remaining derivative-convolution ledgers
Required frozen inputs: audited factor models, scalar chronology and parameter jets
Required evidence: atomic triples, complete prefix locking, stable replay
Stop/fail criteria: partial append, mutated prefix, parameter drift, roots or authority
Explicit non-goals: H2/P2 closure, derivative convolutions, complete C08 or execution
Downstream gate unlocked: candidate-neutral analytic derivative-convolution persistence

# C08 analytic-factor ledger progress receipt

Date: August 25, 2026

## Decision

Persistent candidate-neutral ledgers for `F`, `E1`, and `E2` pass. Each scalar
source ordinal is converted by the independently audited per-panel analytic
factor primitive. All three pending factor models are ledger-validated before
the model triple is committed. Publications own stable model storage and keep
prior model bytes unchanged across extension.

The complete `B,V,J1,J2` scalar inventory is validated for common geometry and
every prior source model in all four ledgers is digest-locked. The chart,
`kappa`, `theta2`, and optional fixed `eta` parameter identity is separately
locked. A changed parameter box and mutation of the otherwise unused `J2`
source are both rejected without changing the published factor prefix.

## Evidence

- Strict fixture: `13/13 PASS`.
- Independent recursive source/runtime audit: `45/45 PASS`.
- Two read-only isolated fixture reports are identical.
- Manufactured extension publishes two models in each of `F`, `E1`, `E2`.
- All three complete ledgers independently validate after extension.
- Candidate evaluations and positive samples: `0`.
- Candidate roots, scientific handler linkage and authority promotion: false.
- Protected roots were absent before and after the recursive audit.

## Identities

| Artifact | SHA-256 |
| --- | --- |
| Header | `8c7b84dfcdaf0ee4eb2384ba6c528c56b8cf26e38ec996c2faca552c4a98a677` |
| Implementation | `20380c43627e0278e888e8c1ff0e16ea94d8a49732182af7488eed23766356a8` |
| Fixture | `611beee2a571bc8c220445f770726c7d83d2b1a3b75293c5dda0443012b409cf` |
| Dockerfile | `6d3f6727f69a472f7a8da3b3e78708938adab923898f427d3b0c08d7fc7e41f3` |
| Independent audit | `d849fd09e132fbcd1060119e80ae286ee8d3635871bf7fb7d0838df240161e41` |
| Fixture executable | `3a9e4f425e6453f5770f77709d14aa4294d84c10faa111f96cf41fa07673555f` |

The audit-local image identity was
`sha256:402169ec3be404a3ee45bdeff1481efd50d963380c2eaf779e0e95dca541ff90`.

## Boundary

This closes factor persistence only. It does not close H2, P2, any of
`E1 diamond H2`, `F diamond P2`, or `E2 diamond H2`, the history callback, or
C08. The frozen candidate was not loaded, sampled, evaluated or authorized;
all proof and downstream authority remains false.
