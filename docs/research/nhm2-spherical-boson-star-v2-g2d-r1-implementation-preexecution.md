Program gate: G2D — fresh replacement-candidate proof attempt
Workstream: authenticated classical control branch
Capability or component: G2D-R1 source-disjoint evaluator implementation
Current maturity: implementation design sealed; candidate execution unauthorized
Target maturity: independently audited execution-ready implementation
Required frozen inputs: G2D v1 preregistration manifest and checkpoint
Required evidence: source/runtime hashes, neutral orchestration, tests and absent root
Stop/fail criteria: shared evaluator logic, root ambiguity, hash drift or any evaluation
Explicit non-goals: candidate execution, proof admission, G3, lanes, lamp, physical claims
Downstream gate unlocked: separate one-shot G2D execution authorization only

# G2D-R1 fluid-star evaluator implementation and preexecution

## Scope and semantic status

This packet changes receipt ownership and implements the already frozen
mathematics. It does not change `chi=1/4`, the metric, matter definitions,
proof-duty order, replay grids, hard rails or falsifiers in the G2D v1
preregistration manifest. It changes no runtime or scientific authority.

No candidate evaluator may be imported through the preexecution audit, and no
metric, pressure, density, residual, interval or replay node may be evaluated
until a later explicit one-shot authorization.

## Root-ownership clarification

The v1 manifest freezes one exclusive future root and one receipt-prefix order,
but intentionally predates evaluator implementation. It does not assign root
creation between two source/runtime-disjoint executors. G2D-R1 resolves that
preexecution ambiguity without changing the frozen mathematical semantics:

1. An authority-neutral Windows host orchestrator is the sole root owner.
2. It verifies all source/runtime/manifest hashes and the exact token before
   exclusively creating the future root.
3. It writes and reopens `preexecution-binding.json`, then exclusively creates
   `primary/` and `independent/` lane directories.
4. The Windows CPython evaluator may write only beneath `primary/`.
5. The offline Linux C17 GMP/MPFR evaluator may write only beneath
   `independent/` through the canonical repository mount.
6. Each lane uses duties 00 through 07 from the frozen order. Neither evaluator
   may emit duty 08, pair agreement or a terminal program verdict.
7. After reopening both immutable lane prefixes, the neutral orchestrator alone
   emits `duty-08-independent-agreement.json` and `terminal-receipt.json`.
8. A first failure at any reached step is terminal. The reached prefix remains
   immutable evidence; the second evaluator is ineligible after a primary
   failure, and agreement is ineligible unless both lanes pass duties 00–07.

The neutral orchestrator may compare hashes, duty IDs/statuses, failure codes
and interval overlap. It must not contain or import metric, matter, Einstein,
TOV, surface or asymptotic evaluation logic.

## Independence boundary

The primary evaluator is standard-library CPython using `Fraction` certificates
and 220-digit directed `Decimal` intervals on Windows. The independent evaluator
is a compiled C17 program using GMP/MPFR 4.2.1 at 768 bits in an offline Linux
container. It does not invoke Python or link against the CPython ABI.

They may share only immutable problem inputs and receipt-schema definitions.
They may not share evaluator source, generated formulas, interval operations,
runtime, arithmetic library, parser implementation or receipt writer.

## Command and authority boundary

The final preexecution checkpoint must bind:

- the base manifest and preregistration checkpoint;
- both evaluator sources;
- the neutral orchestrator and source-independent audit;
- the exact Windows executable identity;
- the exact Linux image digest and compiled-binary identity;
- the exact single host command and derived SHA-256 token;
- the still-absent future root.

The derived token is an identity capability, not authorization. Even after the
checkpoint is green, execution remains false until the user quotes a separate
authorization acknowledging that any PASS, FAIL or partial prefix is immutable
and that there is no retry, retune, deletion or alternate root.

## Authority locks

Candidate admission, classical proof, joint geometry/state, quantum-state
acceptance, SI, metric inputs, 68-file lanes, replay, pair agreement, diagnostic
lamp, Theory Graph, physical viability, propulsion and transport authority all
remain false.

## Implemented identities

The primary source uses standard-library `Fraction` reductions for the exact
mass, lapse, TOV, Buchdahl, horizon, central-lapse, central-pressure and surface
certificates. It then uses 220-digit outward-rounded `Decimal` interval
operations on the frozen rational open-domain nodes. The independent C source
rederives the rational certificates with GMP `mpq_t` and reimplements every
interval operation with explicit MPFR `RNDD`/`RNDU` endpoints at 768 bits.

Both evaluators directly enclose mass, lapse, TOV and angular Einstein
residuals in the separate interior and compactified exterior domains. No
finite-difference or spectral stencil crosses the material surface. Exact
origin, surface and infinity duties precede sampled replay.

## Admitted preexecution runtimes

Primary runtime:

```text
Windows-11-10.0.26200-SP0, AMD64
CPython 3.13.7, standard library only
executable sha256:d932e5e2f324d57f392e8fd063dcf6d0185be8a664c57c6d24e7762ed02c28ca
```

Independent runtime:

```text
Linux amd64, Debian 12
C17 GCC 12.2.0, GMP 6.3.0, MPFR 4.2.1 at 768 bits
image sha256:c4c437edf2ae480445f2ec9c1a551e6d88d264947d6238e023d5368b4a7c158a
binary sha256:ff56a59d33e2e450986aadb81769c1a141677fb830d75c0f960bf163a96a6713
```

The Linux evaluator is a native binary and does not link the CPython ABI. Its
future container invocation is fixed to `--network none`, one CPU, 2048 MiB and
a bounded PID count. Both evaluator subprocesses have a 600-second terminal
timeout. Inert startup of both implementations was observed; candidate
evaluation was not.

## Derived identity token and exact future command

The derived token is:

```text
359cdf5d87e865dc3721b99bd79c3453046f5e489d51f67676dbc1c48167d034
```

It is SHA-256 over a domain separator and canonical bindings for the base
manifest, both evaluator sources, neutral orchestrator, both runtime manifests
and exclusive output root. It remains unauthorized.

The sole eligible future command from the canonical repository root is:

```powershell
$env:NHM2_G2D_EXECUTION_TOKEN='359cdf5d87e865dc3721b99bd79c3453046f5e489d51f67676dbc1c48167d034'; python -I -B tools/nhm2-spherical-boson-star-v2-branch-proof/g2d_fluid_star_orchestrator.py --execute --implementation-manifest docs/research/nhm2-spherical-boson-star-v2-g2d-implementation.v1.json
```

This packet does not authorize that command. A later user authorization must
quote the token and acknowledge immutable PASS, FAIL or partial evidence with
no retry, retune, deletion or alternate root.

## Preexecution evidence

Focused and source-independent tests pass `12/12`. They rehash every bound
source/runtime input, rederive the token, inspect the native image and binary,
prove the orchestrator has no candidate mathematics, verify the execution gates
precede candidate calls, enforce resource/receipt contracts and confirm the
future root remains absent. Neither suite calls an evaluator with `--execute`.
