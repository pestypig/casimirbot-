# G2H-E-S5 A4 C08-011 Tail-Split Implementation Packet

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-011 tail-split discovery, append-only continuation chronology and first-passing witness selector
Current maturity: acknowledged total definition; predecessor C08-010 generic kernel complete-unexecuted; C08-011a chronology and C08-011b early-tail mathematics independently audited; C08-011c1 admission/history, C08-011c2 successor panel, C08-011c3 origin models and C08-011c4 stable scalar-ledger provider independently audited; real H2/P2/analytic C08-010 ledger realization remains absent and explicitly false, so C08-011c is incomplete and C08-011d/e remain absent
Target maturity: candidate-neutral implemented and independently fixture-audited C08-011 producer
Required frozen inputs: acknowledged Borel growth/quadrature definition raw SHA-256 `7dd4d30a...94737`; fixed `T0=1,2,...,4096` schedule; exact `T=2*T0`; compact-box LMI and operator selectors; append-only C08-006 through C08-010 finite-continuation records; onset/history, scalar-growth and metric-growth witness definitions; 512-bit directed arithmetic
Required evidence: exact candidate chronology; early-tail-before-finite ordering; byte-for-byte append-only ledger reuse; terminal propagation of finite producer failures; ordered rejected-witness reasons; first complete passing witness; fixed exhaustion; corruption, determinism and protected-root guards
Stop/fail criteria: changed `T0` schedule, recomputed accepted panel, finite request before early tail predicates, later candidate after a finite producer failure, hidden child reason, witness acceptance with a missing record field, retune/retry, candidate ingress, protected-root creation or authority promotion
Explicit non-goals: selected-member evaluation; positive sampling; C08-012 verifier promotion; C08-013 growth-DAG verification; C08-014 finite Laplace moments; C08-015 projection; C08-021 wire handler; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: C08-012 only after the complete C08-011 producer and independent audit pass

Date: August 25, 2026

## Frozen selector

The producer visits exactly 13 onsets in increasing order:

```text
T0 = 1,2,4,...,4096
T  = 2*T0
```

For each onset it must perform the following order without substitution:

1. verify parameter margins, construct the shifted-asymptotic `P_lyap`, and
   test positive definiteness, the compact-box LMI, K1 and K2;
2. only after the early tail predicate passes, extend the accepted finite
   ledger append-only through `T`, reusing every earlier accepted model and
   digest byte-for-byte;
3. propagate any finite origin/panel/Picard/convolution/resource failure at its
   earlier producer code and visit no later `T0`;
4. after finite success, verify scalar onset constants, every weighted edge
   history, and every value/first/second scalar and metric witness;
5. select the first onset whose complete witness and record inventory pass.

An early-tail rejection or a post-continuation growth-witness rejection may
advance to the next onset and must remain in the ordered child-reason ledger.
Only 13 such rejections emit `C08-011_TAIL_SPLIT_EXHAUSTION`.

## Bounded implementation slices

### C08-011a — typed chronology and append-only ledger controller

- Define the fixed onset schedule, typed rejection reasons and finite producer
  failure codes.
- Admit only ordered attempt records whose `T`, phase flags, model counts and
  prefix/terminal digests prove the frozen chronology.
- Reject finite requests before the early LMI/K predicate, model-count shrink,
  prefix replacement, missing rejection reason, false complete-pass inventory,
  attempts after selection/terminal failure, and partial ledgers represented as
  exhaustion.
- Emit only one of: first selected onset, propagated finite terminal failure,
  fixed exhaustion, incomplete ledger, or corrupt chronology.

This slice consumes already typed predicate results and constructs no
scientific witness. It is used by the integrated producer so the later
mathematical kernels cannot silently change selection order.

### C08-011b — scalar Lyapunov and operator-bound discovery

- Construct the shifted-asymptotic 4x4 Lyapunov solution for each onset, round
  the symmetric midpoint entrywise to denominator `2^256`, then independently
  verify symmetry, exact inverse, positive definiteness and component bound
  `EP`.
- Verify the cleared-denominator compact-box base LMI in fixed variable order.
- Select K1 and K2 independently from `2^e`, `e=0..1024`, with exact directed
  LDL pivots; touching or exhaustion rejects the current onset.

Implemented and independently audited. The candidate-neutral kernel retains
exact P/Pinv, EP, the cleared-denominator enclosure, every base/K1/K2 LDL pivot
and both exact selected power-of-two values. Manufactured primary, vacuum and
non-point boxes pass 23/23 fixtures; the recursive audit passes 92/92. No
selected-member box was loaded.

### C08-011c — append-only finite continuation and onset/history inputs

- Extend the audited C08-006 through C08-010 ledger only after C08-011b passes.
- Reuse every prior model byte-for-byte; record prefix and terminal digests.
- Produce scalar onset P-norms and every weighted finite-history panel
  contribution through `T0` in increasing panel chronology without remainder
  cancellation.

C08-011c1 is implemented and independently audited as a partial kernel. It
admits a typed provider only after C08-011b passes, verifies the returned prefix
byte-for-byte, replays terminal ledger coverage, produces all 13 onset P-norm
boxes and applies the exact weighted-history panel algorithm. Manufactured and
corruption fixtures pass 25/25 twice and the recursive audit passes 86/86.

C08-011c2 now implements the separately versioned arbitrary-left successor
step. It consumes all 52 accepted left-state balls as `p0`, retains the audited
equations and fixed order/halving/inflation schedules, and passes 17/17
manufactured multi-panel fixtures twice plus a 57/57 recursive audit. The audit
also proves continue-on-failure chronology through 36 order attempts before the
first pass.

C08-011c3 now exposes the audited origin recurrence as four canonical B,V,J1,J2
models at the common selected origin order. Exact factorial/integral
normalization, outward tail/truncation/replay radii and all four C08-010 origin
ledger admissions pass 13/13 fixtures twice plus a 48/48 recursive audit.

This still does not complete C08-011c. The origin models and successor step
must be owned by one stable append-only store, driven monotonically through
`T=2*T0`, and every accepted model must carry validated C08-010 derivative-
convolution evidence before the provider can truthfully bind to C08-011c1.

C08-011c4 now owns the four scalar ledgers in stable append-only storage,
commits each successor panel atomically across B,V,J1,J2, preserves immutable
prior publications, and makes a first finite failure terminal. Manufactured
prefix/corruption/determinism fixtures pass 17/17 twice plus a 51/51 recursive
audit. It deliberately leaves C08-010 false because the real H2/P2 and
analytic-factor source-ledger recipes do not yet exist.

The remaining C08-011c integration must instantiate those acknowledged source
recipes, produce their valid origin models, append each C08-010 result in DAG
order for every scalar target panel, and only then bind the complete invariant
ledger set to C08-011c1.

### C08-011d — scalar and metric tail witness assembly

- Assemble the fixed sigma/tau tiers, K-dependent scalar constants, analytic
  factor jets, oriented convolution-growth DAG, absorption constants, metric
  KM0/KM1/KM2 selectors and all displayed output constants.
- Retain every value, first and ordered-second orientation and every compact-box
  denominator/LDL margin.

### C08-011e — integrated first-pass output and audit

- Bind C08-011b/c/d into C08-011a, store the complete tail record and every
  rejected child reason, and publish only the first passing onset.
- Exercise candidate-neutral manufactured pass, early rejection, post-finite
  rejection, finite terminal failure, exhaustion, corruption and determinism.

## Current boundary

This packet decomposes the acknowledged algorithm; it does not add a selector,
threshold or witness condition. C08-011a, C08-011b and partial C08-011c1/c2/c3/c4
components pass their independent audits, but C08-011 remains incomplete until
the real analytic/convolution provider integration, C08-011d/e and the
integrated independent audit pass. The frozen member at `shat(0)=6/5` remains
unread and unevaluated.
