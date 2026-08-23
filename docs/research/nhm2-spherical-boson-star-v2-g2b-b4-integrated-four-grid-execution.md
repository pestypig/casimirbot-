# NHM2 spherical boson-star v2 G2B-B4 integrated four-grid execution

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: immutable initializer-to-policy binding and integrated N=64/96/128/256 execution  
Current maturity: preregistered authority-neutral one-shot execution packet  
Target maturity: authenticated four-level terminal evidence with all three adjacent cross-grid checks, or exact first-failure evidence  
Required frozen inputs: passing M5-R1-derived B1-R2 initializer instance, final branch-selection policy, eleven-source radial closure, cross-grid evaluator, and admitted Linux runtime  
Required evidence: exact input closure, independent per-level initializer materialization, ascending one-shot solve chronology, persisted level states, three-pair receipt when reachable, and self-hashed terminal receipt  
Stop/fail criteria: first byte-binding, runtime, initializer, grid, solve, serialization, persistence, or mathematical-gate failure; no retry, retune, deletion, fallback, or later-level execution  
Explicit non-goals: vacuum-continuation proof, no-fold proof, candidate admission, joint geometry/state, 68-file lanes, replay authority, Theory Graph lamps, physical viability, propulsion, or transport  
Downstream gate unlocked: vacuum-continuation implementation only after an authenticated all-level and all-pair PASS

## Frozen decision

This packet adds an execution-instance binding around the already sealed branch-selection policy. It does not edit or reinterpret the policy's definition-only `initializerInstance: null` field. The instance binds the immutable passing M5-R1 representation through the persisted B1-R2 payload receipt and uses that same payload set to materialize a fresh lowest-amplitude initializer independently on each frozen grid.

The exact level order is `N=64,96,128,256`. Each level performs a complete seven-stage continuation from `A=2^-16` through `A=2^-10`. Only the previous accepted state on the same grid may predict its next amplitude. No state from a coarser grid may initialize or predict a finer-grid solve.

If all four solves complete, the frozen cross-grid evaluator runs once on the terminal states in exact pair order `64_to_96`, `96_to_128`, `128_to_256`. It evaluates every pair and preserves the first failing pair. A pair failure is terminal evidence and cannot trigger a retry, tolerance change, alternative projection, alternative initializer, or alternative grid.

## Exact upstream byte bindings

| Role | Relative path | Bytes | SHA-256 |
|---|---|---:|---|
| final branch policy | `shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts` | 44,912 | `d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82` |
| radial source-closure ledger | `shared/contracts/nhm2-spherical-boson-star-v2-radial-primary-numerics.v1.ts` | 34,965 | `dfec69750d345893a02483e1a13eb65c928966f0635e43ee559e0ed630634f10` |
| initializer evaluator definition | `shared/contracts/nhm2-spherical-boson-star-v2-initializer-evaluator.v1.ts` | 60,627 | `05d0c327090a30065a453941ad4612f518818dd88f230864d4ef257c9e8a2be4` |
| B1-R2 persistence receipt | `artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b1-r1-initializer-v1/persistence-receipt.json` | 2,092 | `b4d585e834782e173e1a3d96118eb5756c728f509739ac5e126b72c895399424` |
| B3 Linux runtime manifest | `artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b3-linux-runtime-v1/runtime-manifest.json` | 2,220 | `98cb6d63f94e3faf038621465f2417373b579b99e68d8f29473c9c3b79ee14c0` |
| cross-grid evaluator | `tools/nhm2-spherical-boson-star-v2-branch-proof/radial_cross_grid_convergence.py` | 51,746 | `dba7650a90a2f6b56ff95e63917e92e5e15465628cf7c5bdbff5ba97526b724f` |

The runner must additionally enforce the eleven exact radial source pins already frozen in the source-closure ledger and the six persisted payload bindings in the B1-R2 receipt before importing solver code or generating a grid.

## Persistence and terminal semantics

The sole output root is `artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-four-grid-v1`. Any pre-existing file, directory, or link at that path is a terminal collision. Files are created exclusively, flushed, read back, and hashed. Each attempted continuation stage persists its exact binary64 state and a canonical metadata receipt. A returned solve failure stops before the next grid. An exception stops at its point of observation and is recorded without retry.

The terminal receipt keeps candidate, proof, execution-authority, replay, pair-agreement, diagnostic-lamp, Theory Graph, physical, propulsion, and transport authority false regardless of numerical disposition. `PASS` means only that the bounded four-grid and adjacent-pair prerequisite is available to the next vacuum-continuation work packet.

