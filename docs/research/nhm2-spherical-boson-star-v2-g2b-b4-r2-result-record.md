# NHM2 spherical boson-star v2 G2B-B4-R2 result record

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: corrected-initializer integrated four-grid successor  
Current maturity: immutable prerequisite `FAIL`, independently audited  
Target maturity: versioned initializer amplitude/lift and evidence-path diagnosis  
Required frozen inputs: B4-R2 packet, B4-R1 initializer, immutable B4 spine, solver policy and Linux runtime  
Required evidence: exclusive preexecution/terminal receipts, zero-retry chronology and read-only audit  
Stop/fail criteria: first prerequisite/grid/solve/pair failure; no retry or retune  
Explicit non-goals: repairing after observation, another solve, later proofs or authority promotion  
Downstream gate unlocked: diagnosis only; no four-grid or vacuum execution

## Result

Status: **FAIL** at `g2b_b4_initializer_origin_amplitude_mismatch`.

The sole offline Linux invocation consumed the audited B4-R1 initializer and passed all six scalar recomputation identities. It then created the N=64 directory and generated the N=64 grid in memory, but failed while materializing the lowest-stage state, before persisting an initializer state or calling the continuation/Newton solver.

Terminal evidence:

- preexecution raw SHA-256: `3d850a6f63cc22088920b18f013c5b9adbc7c094f28b94a4414e25653d1f9ed5`;
- preexecution self hash: `2c89a6c85844468a79cf7a4485b3d8e758e8d46185f3d3294089dd138211d4b2`;
- terminal raw SHA-256: `16d9f8e2914076ed31e00b37df8b4fd135c81b36a45b9f4f092612c85420d474`;
- terminal self hash: `cafa0a8d0bc63ec3c8c166ef63e7be9cc52be278c79a0c112ed69763ab8a42f0`;
- attempted level receipts: `0`;
- solver calls/stages/pairs/retries/retunes: `0`;
- output inventory: the two receipts plus an empty `level-64/` directory.

Every authority lock is false and `vacuumContinuationWorkUnlocked=false`.

## Read-only diagnosis boundary

An MPFR512 reconstruction of the persisted 128-mode core at the origin gives `base_u=1+O(2^-55)`. The immutable lift applies `varphi=lambda^2*base_u` with `lambda=1/32`, producing binary64 `2^-10`, word `3f50000000000000`. The same routine requires the first continuation amplitude `2^-16`, word `3ef0000000000000`. The mismatch is exactly a factor of 64.

This record does not choose a repair. The next parent decision must determine whether the core representation requires an explicit amplitude normalization before the lift, whether the lowest continuation stage is intended to start from a rescaled unit-amplitude shape, and how all coupled `u/V/C/N0` quantities transform. Changing only the assertion or schedule is forbidden.

## Independent audit finding

The independent 4-test audit passed on host and Linux for the immutable observations, and also exposed a receipt-path defect: the preexecution binding read successor payload bytes and recorded their successor hashes, but inherited B4's hard-coded legacy B1 path strings. For example, `initializer_payload_0` records corrected hash `47f2858a...` beside the old path whose actual hash is `da88f738...`.

Therefore B4-R2 is valid terminal chronology for the observed fail-closed execution, but its `sourceAndPayloadBindings` path map is not replay-complete. Any successor must repair the emitted paths as well as resolve the amplitude/lift semantics, using a fresh output root. This immutable result must not be relabeled as a four-grid numerical attempt or PASS.

## Current-tree verification

- math registry: `318` entries, PASS;
- WARP suite: `18/18` files, `179/179` tests, PASS;
- Casimir adapter run `2437`: `PASS/GREEN`;
- certificate hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: `true`.

The green constraint-pack certificate does not override the authenticated B4-R2 failure or grant any scientific/physical authority.
