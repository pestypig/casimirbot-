Program gate: G2H — Tolman-VII proof implementation/preexecution
Workstream: authenticated classical and quantum control branch
Capability or component: candidate-capable proof-program architecture and duty dispatch
Current maturity: toolchains and fixture harnesses exist; candidate proof algorithms remain unexecuted and incomplete
Target maturity: two source/runtime-disjoint programs implementing every frozen G2G duty behind a hard execution guard
Required frozen inputs: G2G contract SHA-256 30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d and seven source digests
Required evidence: complete duty-to-algorithm map, deterministic record ABI, independent source audit and no-candidate fixtures
Stop/fail criteria: omitted duty, theorem-assumption bypass, candidate-specific smoothing, shared arithmetic lineage or execution
Explicit non-goals: candidate evaluation, proof receipt, G3 acceptance, SI, lanes, lamp or physical claims
Downstream gate unlocked: G2H-E authorization proposal only after compiled-source and fixture closure

# G2H proof-program architecture

Parallel-lane declaration: while G2H-R1 is active, this is source/design work
only. It cannot alter, build, execute, retry or reinterpret either fixture
harness or evidence root and therefore cannot perturb the open R1 prerequisite.

## Purpose

This document binds implementation behavior that was implicit in the G2G proof
duties. It does not evaluate the Tolman-VII member. Both implementations must
dispatch the same 18 duties and the same first-failure precedence, while sharing
no implementation code, arithmetic kernel, generated table or runtime layer.

## Mandatory preflight order

1. Rehash the G2G contract, seven scientific sources, implementation manifest,
   executable, container and authorization record.
2. Reject G2D identity/path/token/root reuse and any identity/member mutation.
3. Confirm 512-bit arithmetic, exact-layer semantics, fixed partitions and
   non-adaptive chronology.
4. Prove the joined metric has the regularity required by every theorem or
   renormalization construction invoked later.
5. Only after all preflight records persist may the classical duty engine become
   eligible. The state/RSET/noise engine remains ineligible until every classical
   duty passes.

## Surface regularity is a hard theorem-assumption gate

The cited static-Hadamard and point-splitting frameworks operate on smooth
Lorentzian metrics and smooth static Cauchy data. Matching only the induced
metric and extrinsic curvature excludes a thin shell but does not establish the
smoothness needed by those frameworks.

Both programs must therefore compare the one-sided analytic germs of `A` and
`B` at `x=1` before `G2G-Q01`. For each metric coefficient they must either:

- establish an exact analytic identity of the interior and exterior germs; or
- persist the lowest derivative order whose one-sided exact/interval values are
  disjoint.

A first differing jet is terminal `GLOBAL_STATIC_STATE_FAIL`. It makes Q01-Q06
ineligible. It may not be repaired during execution by mollification, a surface
layer, a material boundary condition, a different density tail or a changed
matching radius because each would define another candidate.

The RSET engine must additionally demonstrate that the metric regularity is
sufficient for every curvature derivative appearing in the frozen `v1`,
including `Box R_scalar`. It cannot interpret an unregistered surface
distribution as the smooth Hadamard coefficient.

## Duty engines

| Engine | Frozen duties | Required implementation strategy |
| --- | --- | --- |
| Ingress/exact identities | C01-C05 | exact integer/rational/algebraic preprocessing; independent symbolic residual construction; origin Taylor remainders |
| Interior inequalities | C06-C10 | fixed 256-cell interval Taylor/Bernstein bounds with analytic endpoint limits and strict-sign policy |
| Radial stability | C11 | certified Sturm count plus a strict lower enclosure for the fundamental Rayleigh/Sturm eigenvalue |
| Junction/exterior | C12 | exact first/second fundamental forms, analytic-germ regularity gate and fixed `q=1/x` infinity cells |
| Static quantum state | Q01-Q03 | theorem-assumption certificates, Friedrichs/operator positivity bounds and state/mode normalization records |
| RSET/noise | Q04-Q05 | same-state/same-scale identity, Hadamard subtraction ABI, conservation residual and smeared positive-type tests |
| Cross-implementation agreement | Q06 | byte-bound primary/independent record comparison after both immutable executions |

## Record ABI

Every duty record must contain the contract/executable/container identities,
duty ID, fixed cell or theorem-assumption inventory, exact inputs, interval
endpoints as canonical hexadecimal integers plus shared exponents, decision,
typed failure, predecessor-record hash, candidate-evaluation counter and all
authority locks. A skipped duty receives an explicit `INELIGIBLE_AFTER_FIRST_FAIL`
record; absence cannot be interpreted as a pass.

Receipt writing is append-only. The primary root is exclusive to the primary
executable, the independent root is exclusive to the independent executable,
and neither root may exist during G2H.

## Implementation independence

The primary C17 program uses FLINT exact objects and Arb/MPFR outward balls. The
independent Rust program uses its own limb integers, rational normalization,
dyadic interval endpoints, range reduction and transcendental remainder proofs.
The only shared bytes are the frozen scientific contract/source inputs and the
serialized record ABI. Agreement is assessed after execution and cannot select
precision, partitions, algorithms or tolerances.
