# NHM2 spherical boson-star v2 G2B-B4-R4 result record

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: fresh-output four-grid execution with audited predictor/path semantics  
Current maturity: independently audited numerical `FAIL`  
Target maturity: bounded terminal-Newton scientific diagnosis  
Required frozen inputs: B4-R4 packet/checkpoint/runner, B4-R1 initializer, B4-R3 decision, immutable B4 sources and admitted Linux runtime  
Required evidence: exclusive terminal inventory, self hashes, binding replay, chronology, first-failure state and authority locks  
Stop/fail criteria: first N=64/stage-0 solve failure; no later level, pair, retry, retune or candidate substitution  
Explicit non-goals: treating near convergence as PASS, changing tolerances or Armijo policy, vacuum proof, candidate/lane/lamp/physical/propulsion/transport authority  
Downstream gate unlocked: bounded read-only diagnosis of the persisted terminal Newton/Armijo failure

## Result

Status: **FAIL**.

The sole admitted Linux invocation passed prerequisite closure, materialized the
unchanged λ=`2^-5` caller predictor at origin `2^-10`, supplied the frozen first
Newton target `2^-16`, and entered the N=64 stage-0 solve. Newton accepted 29
updates, then no trial in the frozen Armijo schedule `alpha=2^-k`, `k=0..24`,
satisfied the acceptance rule. The runner stopped with:

```text
armijo_schedule_exhausted_without_retry
```

No N=96, N=128 or N=256 grid was created. No adjacent cross-grid comparison
ran. This is a mathematical candidate failure under the frozen policy, not an
infrastructure block and not permission to rerun or retune B4-R4.

## Exact evidence

Output root:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/
```

The exclusive inventory contains six files:

| File | Bytes | Raw SHA-256 |
|---|---:|---|
| `preexecution-binding.json` | 7,580 | `58e17389d77c136331c7fcbc2a03d9a6cf875d181cff8086ee17f0338f6302c3` |
| `level-64/initializer-state.f64le` | 1,544 | `e275934b041d2a4b067ad8f5c2c3f21c25b46f9edae60805871021773c1732a2` |
| `level-64/stage-00-state.f64le` | 1,544 | `972b05243ee51e7fa9c19a525e050f7302001c68a5187428ccff43a7aebf5d9c` |
| `level-64/stage-00.json` | 831 | `08309d40bd590996ba976839abeacbf2b492e2af03d49014ee55c7acb09bd1c2` |
| `level-64/level-receipt.json` | 1,414 | `d45e7e730e1775e834303ccb40518f4bbbb7448946c988b83ba35ac06bc81ef5` |
| `terminal-receipt.json` | 2,739 | `4a76e65331e6b6244fe9fbf9437552a4f450423eb1d57ee0b8e42d6452de9204` |

Preexecution self hash:
`f8e75820961d5812bb21d1d3fd23bc6720ec57a2b7472519b1857ff02bb8ba63`.

Terminal self hash:
`361116765976f0ebb4e8236780f09d77ee17a6dff7f6e640975e8687bfa10c28`.

The terminal receipt binds the preexecution self hash, one attempted level,
one attempted and zero accepted continuation stages, no cross-grid receipt,
`noRetry=true`, `noRetune=true`, and every authority lock false.

## Numerical endpoint

| Quantity | Persisted value |
|---|---:|
| accepted Newton updates | 29 |
| final residual L∞ | `3.9006884704107466e-9` (`3e30c0da3244efc6`) |
| final scaled step L∞ | `1.984960497126475e-12` (`3d8175bbd24b9a49`) |
| unused constraint L∞ | `1.5889862975902e-4` (`3f24d3c0d61d8cf5`) |
| final `w` | `0.9999999999984018` (`3fefffffffffc7c5`) |
| finite-node `varphi > 0` | true |
| `varphi` nonnegative | true |
| `varphi` nonincreasing | false |

The frozen acceptance thresholds are residual L∞ `2^-40` (about
`9.09e-13`) and scaled-step L∞ `2^-42` (about `2.27e-13`) for two consecutive
accepted updates. The endpoint therefore misses both gates; residual is about
4,289 times its threshold and the last accepted scaled step about 8.73 times
its threshold. Its small absolute numbers are useful diagnostic evidence but
cannot be promoted to convergence.

## Independent audit

The producer-independent audit imports neither the runner nor the solver. It:

- rehashes both self-hashed receipts and all source/payload/output bindings;
- opens all six payloads from the actual B4-R1 root;
- verifies the exact six-file inventory and write chronology;
- independently unpacks predictor origin `2^-10` and terminal target origin
  `2^-16` from the binary state files;
- verifies 29 Armijo exponents, the typed first failure, absence of later levels
  and cross-grid output, and all false authority locks.

It passed `6/6` on the host and `6/6` in the admitted offline Linux image. The
audit source is 6,767 bytes with SHA-256
`75ce0d76ba9a0aeea067e076187a031a8346a3d15c090444e5ee250de74a4ca5`.

## Verification handoff

- math registry: `318` entries, PASS;
- required WARP suite: `18/18` files and `179/179` tests, PASS;
- Casimir adapter constraint-pack run `2438`: `PASS/GREEN`;
- certificate hash:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: `true`.

The adapter certificate covers its constraint-pack handoff. It does not convert
B4-R4's authenticated numerical `FAIL` into a pass, certify this documentation
snapshot as a scientific result, or authorize candidate/physical claims.

## Next bounded lead

The highest-value next operation is not another four-grid run. It is a sealed,
read-only terminal-Newton diagnosis over the persisted N=64 stage-0 state:

1. independently evaluate and rank residual rows at the exact terminal bytes;
2. quantify Jacobian conditioning, pivot growth and Newton-direction scale;
3. evaluate every already-frozen Armijo trial exponent from that endpoint and
   classify rejection as domain, non-finite, or insufficient merit decrease;
4. localize the `varphi` monotonicity violation and unused-constraint maximum;
5. decide whether evidence supports a formulation/discretization defect, a
   binary64/globalization limit, or no justified successor.

That diagnosis may propose a separately frozen new candidate/version. It may
not alter, retry or reinterpret B4-R4. Vacuum, no-fold, positivity and all later
program duties remain blocked.
