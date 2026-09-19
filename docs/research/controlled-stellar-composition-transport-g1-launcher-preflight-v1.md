Program gate: G1 — real calibrated solar baseline
Workstream: zero-transport execution preparation
Capability or component: bounded-launcher preflight and pure calibration objective
Current maturity: reduced_order_diagnostic
Target maturity: reduced_order_diagnostic; non-executing safety and fit components only
Required frozen inputs: model-design v1, acceptance-design v1, structural-source v1, installed-provenance v1, initial inlist hash
Required evidence: fail-closed resource/source/hash tests, current host-capacity receipt, no solver execution
Stop/fail criteria: any missing launch authority, unbound comparison operator, insufficient disk or RAM, input or resource-policy drift, incomplete execution adapter
Explicit non-goals: starting Docker/MESA, optimizing parameters, observational admission, G1 closure, G2 admission
Downstream gate unlocked: none

# G1 no-run launcher and calibration components v1

Date: September 19, 2026. Status: **preparation implemented; science launch disabled**.

The [preflight module](../../ops/mesa/g1-preparation-v1/g1_bounded_launcher.py)
reads the frozen model, acceptance, structural and installed-provenance
manifests. It checks the exact inlist SHA-256, image identity, resource-policy
constants, 25,000,000,000-byte host free-space floor and 4-GiB host-available
RAM floor. Every `launchAllowed` authority must be true and a structural
comparison operator must be bound. Unknown capacity fails closed. It also
unconditionally reports `BLOCK_EXECUTION_ADAPTER_NOT_IMPLEMENTED`: there is
**no** Docker invocation, container monitor, filesystem cleanup or run path.

The [pure calibration objective](../../ops/mesa/g1-preparation-v1/g1_calibration_objective.py)
accepts exactly the frozen `initial_Y`, `initial_Z` and
`mixing_length_alpha` parameters within their bounds. Given externally
supplied positive finite luminosity, radius and surface Z/X, it returns the
declared sum of squared relative residuals normalized by `1e-4`. It rejects
additional held-out quantities and policy drift. A zero objective is numerical
fit arithmetic only, **not** a calibrated stellar model or G1 admission.

`python -m unittest discover -s ops/mesa/g1-preparation-v1 -p 'test_g1_*.py' -v`
passed all 11 no-solver tests. The live preflight reported:

| Check | September 19 result |
| --- | --- |
| Host free bytes | `13,848,379,392`, below 25 GB |
| Host-available RAM | `2,834,886,656`, below 4 GiB |
| Inlist SHA-256 | `20e2a14d328721618d790101409a879f79917b14e60b46cfb08adb399a8d9a77`, matches retained receipt |
| Science authority | Model, acceptance, structural and provenance manifests all keep `launchAllowed: false` |
| Structural operator | null; `BLOCK_SOURCE_BINDING` unchanged |
| Execution adapter | Not implemented; no container started |

The future execution adapter still needs verified Docker data-drive capacity,
image digest and runtime state, MESA native input parsing, an exact build/run
command, loaded-microphysics evidence, one-job concurrency enforcement,
CPU/memory/swap/PID/network isolation, continuous output/disk/time monitoring,
bounded termination with retained logs/checkpoints, and adversarial tests.
Only a new source-bound and capacity-cleared G1 attempt may consider enabling
that adapter. The author inquiry does not itself satisfy source binding.
