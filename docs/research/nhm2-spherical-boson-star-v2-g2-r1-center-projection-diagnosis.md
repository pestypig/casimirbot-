# NHM2 Spherical Boson-Star v2 G2-R1 Center/Projection Diagnosis

Program gate: G2-R1 — global-center/core-representation diagnosis

Workstream: versioned classical-branch repair review

Capability or component: exact source-of-residual separation at the immutable
failed point

Current maturity: closed; exact original-center and projection residuals both
fail, selecting the upstream global-center accuracy successor class

Target maturity: achieved by receipt
`86633508a20c79b56d7ed0455102fd1c35f206e521dbda8e3e9d79b85aef243f`

Required frozen inputs: global-center raw
`d0b0f74da5eb2512fe23e4bb049aa1d68cef6d9c9f590af993027b4af6509f30`;
projection payloads; admission receipt; exact counterexample receipt
`bde9c4ebfefade6354c8248295d5511cbc864dc23e79a7948ff976a91c2e188d`;
point `x=1/128`; rail `1/10^10`

Required evidence: exact binary64-to-rational decoding; exact stored-mesh
interval selection; exact cubic-Hermite value, first derivative, and second
derivative; exact Schrödinger residual; exact comparison with the already
frozen polynomial witness; content-addressed authority-neutral receipt

Stop/fail criteria: any input drift; ambiguous mesh interval; nonfinite or
negative-zero input; exact arithmetic budget failure; result inconsistent with
the frozen polynomial witness; any attempted center, point, threshold, or mode
change

Explicit non-goals: replacement solve or projection; threshold relaxation;
later proof duties; N=64/96/128/256 execution; candidate, lamp, physical,
propulsion, or transport authority

Downstream gate unlocked: review of exactly one versioned successor class

Change class: diagnostic-only mathematical cause separation

## Frozen decision table

At `x=1/128`, compute the normalized Schrödinger residual of the original
piecewise cubic-Hermite representation using the exact binary64 mesh, values,
and derivatives from the immutable global-center receipt.

| Exact original representation | Frozen 128-mode projection | Disposition                                        |
| ----------------------------- | -------------------------- | -------------------------------------------------- |
| `>1/10^10`                    | `>1/10^10`                 | upstream global-center accuracy successor required |
| `<=1/10^10`                   | `>1/10^10`                 | core codec/mode-count successor required           |
| any result                    | `<=1/10^10`                | current G2 decision inconsistency; stop and audit  |

The polynomial result is not recomputed with a new coefficient set. Its exact
fraction digest remains
`0dedd3a913bd1e70c75b5b6fa74cbd7be2a358c518562f19f2dfd80fcd068706`.
The Hermite interval is selected by the exact stored mesh ordering; a different
interpolant, fit, smoothing rule, or diagnostic point is forbidden.

## Successor boundary

This diagnosis may recommend a separately versioned proposal, but it may not
authorize or execute one. Any replacement must freeze its solver, precision,
mesh/mode count, projection, tolerances, runtime, output root, and first-failure
rule before observing replacement results. The failed G2 artifacts remain
immutable evidence.

## Terminal result

The exact original cubic-Hermite normalized residual is approximately
`8.60026440092028e-8`, or `860.026440092028` times the rail. The frozen
128-mode result remains approximately `1.2062499930716589e-8`, or
`120.62499930716588` times the rail. Both are strict exact failures.

The diagnosis therefore selects
`UPSTREAM_GLOBAL_CENTER_ACCURACY_SUCCESSOR_REQUIRED`. A codec/mode-count-only
repair is not authorized. Full evidence is preserved in
[`nhm2-spherical-boson-star-v2-g2-r1-exact-hermite-diagnosis-record.md`](./nhm2-spherical-boson-star-v2-g2-r1-exact-hermite-diagnosis-record.md).
