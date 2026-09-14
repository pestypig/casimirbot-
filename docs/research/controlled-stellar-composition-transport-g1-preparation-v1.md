Program gate: G1 — real calibrated solar baseline
Workstream: baseline preparation, revision 1
Capability or component: inspected runtime, calibration design, and launch prerequisites
Current maturity: reduced_order_diagnostic
Target maturity: calibrated_baseline; not reached by this packet
Required frozen inputs: G0 preregistration v1, G1 runtime v1, installed manifest digest, primary observation data
Required evidence: toolchain identity, reviewed inlists, observation and uncertainty manifest, convergence policy, resource preflight
Stop/fail criteria: unresolved provenance or uncertainty, age/transport mismatch, unavailable resources, fixture substitution
Explicit non-goals: launching stellar evolution, claiming a calibrated model, deleting data, changing G0 or admitting G2
Downstream gate unlocked: none; launch remains disabled

# G1 baseline preparation v1

Date: September 13, 2026.
Status: **PREPARATION_RECORDED_NOT_LAUNCH_READY**.
Governing [work program](./controlled-stellar-composition-transport-work-program.md).

This is not an executable science freeze. It records inspected facts and
pre-result design decisions while explicitly retaining unresolved prerequisites.
Do not run the bundled `rn`, `re`, `mk`, or optimizer using this packet as
authorization. The historical attempt-1 failure and runtime v1 remain unchanged.

## Verified runtime inventory

Image: `evbauer/mesa_lean@sha256:c9e4e66db3b34ca8b977bd32725a098eb4c6e81ac1e2f261aa4af38a7954de62`.
Configuration digest: `sha256:4c961961858c808842c133662416f14b44faa191b6765c7ab9aaded6e65aeaf6`.

| Item | Direct observation |
| --- | --- |
| MESA version file | `/home/docker/mesa/data/version_number`: `r24.03.1` |
| SDK | `mesasdk_version`: `x86_64-linux-20.3.1` |
| Compiler | GNU Fortran `9.2.0` |
| Compiler SHA-256 | `347a85f50514af5bbd38ae0a4275cbd3e0a817d6de58c64a7bdf109552061b01` |
| Calibration example | `/home/docker/mesa/star/test_suite/simplex_solar_calibration` |
| Git provenance | No `.git` repository at the MESA source root; claimed upstream commit is not independently established by `rev-parse` |
| `inlist_prezams` SHA-256 | `a7ed926e403c058b862e3cd79ccc037bf6211735c95718f2073be0850caa0fc3` |
| `inlist_solar` SHA-256 | `a7c0ff679181febc808574c72b8280a02dbc2958484f79dcae169403dccde7bb` |
| `inlist_simplex_search_controls_solar` SHA-256 | `013ea629d6d9deebc9f06500f9924570755d6e21c60a5a22db1a1c7be6e7c8bf` |
| `src/run_star_extras.f90` SHA-256 | `7ae9e0adf6f1f39a98980525bbb3d524aeaf50cf5c4a96be1cc7852341dfd5bc` |
| `src/simplex_search_run_support.f90` SHA-256 | `5c0ca126c10fdc4e7247710de53fe60c8dbcf7018fc28dcd985cad02fc7e32ee` |

Five bounded inspection containers were created with the prefixes
`starsim-g1-inspect`, `starsim-g1-toolchain`, `starsim-g1-source-inspect`,
`starsim-g1-sdk-inspect`, and `starsim-g1-sdk-version`, suffixed `-20260913`.
They used no network or host mounts, a read-only root, one CPU, 512 MiB memory
with no extra swap, 64 PIDs, no added capabilities and no-new-privileges.
They only read files or printed versions; no stellar model was evolved.
They were retained rather than automatically removed.

The first inventory returned exit 1 because a broad `find` encountered an
unrelated unreadable directory. The toolchain command also returned exit 1:
an assumed SDK version-file path did not exist and `git rev-parse` failed.
The later explicit `mesasdk_version` command succeeded. These inspection
errors are not solver failures and must not be hidden as successful evolution.
Docker's retained toolchain container has exit status 128 from the final Git
query; the host command wrapper reported 1. Subsequent three explicit inspection
containers exited 0. These distinct exit layers are retained for audit.

## Differences requiring deliberate configuration

The installed controls, not README prose, govern the example:

- `just_do_first_values = .true.` disables optimization even though the
  [upstream README](https://raw.githubusercontent.com/MESAHub/mesa/24.03.1/star/test_suite/simplex_solar_calibration/README.rst)
  describes a simplex calculation. A successful one-model test is not a fit.
- `age_target = 4.61d9` includes a stated 40 Myr pre-main-sequence offset;
  G0 specifies 4.57 Gyr without resolving the zero point. Preserve 4.57 Gyr;
  freeze and document its age origin before generating final inlists. Do not
  silently add the example's 40 Myr offset.
- The example varies overshoot as a fourth fit parameter. Its initial
  `f_ov = 0.0314081331` also exceeds its stated search maximum `0.022`.
  G0 allows only initial Y, initial Z and mixing length as fit parameters.
  Proposed baseline: no extra overshoot or other imposed transport, with
  ordinary convection and microscopic settling retained. Verify all inherited
  controls before calling this zero-intervention.
- The example parameterizes metallicity via FeH; its source converts this to
  X and Z using Y and a reference Z/X. A later wrapper must expose the frozen
  physical parameter Z, enforce X+Y+Z=1 and retain the exact transformation.
- The runner can reuse a bundled pre-ZAMS model if `MESA_SKIP_OPTIONAL` is set.
  That shortcut is excluded: initial-model construction must have retained
  execution provenance and consistent composition for each trial.
- The solar network is `pp_and_cno_extras.net`; opacity prefixes are `OP_gs98`
  and `lowT_fa05_gs98`; atmospheric treatment is table/photosphere; atomic
  diffusion and diffusion heating are enabled. EOS controls are inherited;
  audit the resolved defaults and data hashes, not just the empty EOS block.
- TDC, turbulent pressure, diffusion classes, energy equation, custom boundary
  mesh function and a 1,200-model test cap need review. Do not silently remove
  a cap or change convection theory after observing a result.

## Observation roles and source intake

Freeze a fit using L, R and surface Z/X with the three G0 calibration
parameters. Treat Teff as a derived consistency diagnostic when calculated
from the same L and R; do not count it as independent information. Reserve
surface helium, convection-zone depth, structural inversions and neutrinos
as tests, not optimizer feedback. An observational failure is retained, not
used to retune the same attempt. G5 mode/chemical requirements remain intact.

| Source | Verified use and remaining requirement |
| --- | --- |
| [IAU B3](https://arxiv.org/abs/1510.07674) | Nominal constants are conversion factors, not measured targets with zero errors; freeze observational L/R sources and their uncertainty separately |
| [Basu and Antia 2004 v1](https://arxiv.org/pdf/astro-ph/0403485v1) | Distinguishes GONG and MDI inferences and systematic errors; choose an exact dataset/mixture and retain its uncertainty model, rather than treating the example's rounded helium sigma as authoritative |
| [Borexino 2018](https://doi.org/10.1038/s41586-018-0624-y) and [collaboration data page](https://borex.lngs.infn.it/papers/articles/solar_nu/comprehensive-measurement-of-pp-chain-solar-neutrinos/) | pp-chain measurement source located; extract exact values, units, likelihood/covariance and oscillation assumptions into a hashed manifest |
| [Borexino CNO 2022](https://arxiv.org/abs/2205.15975) | Separate CNO source located; distinguish detector interaction rate from inferred all-flavor solar flux and retain asymmetric likelihood and nuisance assumptions |
| Installed GS98 example | Candidate historical mixture for a declared baseline, not proof of the current photospheric abundance; primary mixture/uncertainty reference and data checksums still needed |

The existing `data/starsim/solar-reference-pack.v1.json` has `example.com`
URLs and explicitly fixture-oriented notes. It must not supply science
uncertainties. Leave that fixture unchanged; create a separate source-backed
science manifest. A paper citation without the required numeric data is not
a completed observational gate.

Do not assign final numerical acceptance thresholds until the observation
manifest is retained. Use covariance-aware residuals with units, systematic
and numerical errors separated. Where joint covariance/likelihood is missing,
do not invent independence or an overall chi-square significance. Preregister
the chosen marginal multiple-test or likelihood policy before execution.
Missing required data must fail closed, not disappear from the score.

## Numerical convergence design

Use a base run plus independent mesh-only and timestep-only refinements, then
a combined refinement, with identical microphysics and trial parameters.
Require agreement for every required observable and conservation diagnostic,
not just optimizer score. Freeze base controls and absolute/relative change
limits against the reviewed numerical and observational error budgets before
execution. Refine the accepted trial without reoptimizing first, so mesh error
is not hidden by fit changes. Resource limits never relax physical tolerances.

Retain nuclear, neutrino, gravothermal and surface-energy terms: equating
surface luminosity solely to nuclear luminosity is not full energy closure.
History/profile extraction and unit tests must be prepared before the first
scientific run. G0 TAMS/shell/radius thresholds remain unresolved and must
receive operational definitions before intervention outcomes, not toy hazards.

## Bounded resource proposal and current blocker

The new preflight measured `17,692,483,584` free bytes on C:, below the frozen
25 GB threshold. The inspections do not establish the cause of the reduction
since installation. Host memory was about 16 GiB total with 4.3 GiB free at a
later sample. No unrelated development processes were stopped or inspected
for deletion candidates.

Proposed first-run limits, to be enforced by a reviewed launcher:

- One job, two CPUs maximum; OMP threads 2, BLAS threads 1.
- Container memory 2 GiB, memory-plus-swap 2 GiB, 128 PIDs; no privileged mode,
  no Docker socket mount, no network during science execution.
- Start only with at least 25 GB free and at least 4 GiB host-available memory;
  recheck Docker VM headroom and concurrent workloads immediately before launch.
- Total attempt working/output budget 5 GB; stop before crossing it or falling
  below 20 GB host-free space. Include logs, checkpoints and failed trials.
- First pilot wall-clock ceiling 2 hours; any later optimizer campaign requires
  a measured per-model cost and separately frozen total evaluation/time budget.
- Resource or timeout stop means incomplete, never a passed calibration. Keep
  inputs, stdout/stderr, exit/OOM state and any valid checkpoint. No automatic
  deletion or retry under relaxed limits.

These are conservative proposed limits, not a performance guarantee or an
implemented monitor. The future launcher must enforce and test them. No run
is permitted while the current capacity gate fails.

## Ordered remaining work before launch

### Model design and initial-trial inlist now retained

The [model design v1](../../configs/research/controlled-stellar-composition-transport-g1-model-design.v1.json)
fixes a 4.57 Gyr model clock starting on the newly constructed homogeneous
pre-MS model, without a later age reset or fixed ZAMS offset. Initial-condition
sensitivity remains a model systematic, not a claim of exact formation age.
It fixes a historical GS98 family, Henyey convection, ordinary settling,
no added overshoot/transport, three parameter bounds, numerical fit accuracy,
four refinement configurations and conservative resource ceilings.

The [initial-trial inlist](../../ops/mesa/g1-preparation-v1/inlist_project)
implements those choices without using the test-suite simplex runner or its
saved-model shortcut. It is not executable authority. All 73 assignment keys
were found in the pinned defaults in a read-only static check; Fortran namelist
parsing, effective-default resolution, build/extractor tests and the complete
observation freeze are still required. No MESA evolution was launched.
SHA-256 of this initial inlist as checked:
`20e2a14d328721618d790101409a879f79917b14e60b46cfb08adb399a8d9a77`.

The nominal L/R references and 1e-4 fitting accuracy are explicitly conventional
calibration targets and numerical choices, not measurement uncertainties. They
cannot supply an independent observational pass. Keep the uncertainty review
below and the complete G1 held-out gate intact.

Defaults additionally fingerprinted during inspection:

| Installed path relative to MESA | SHA-256 |
| --- | --- |
| `star/defaults/controls.defaults` | `1e159d0e3e8e07b5071bbec26c44fd4841e40d4b96d4cc404c2afe890e68c4ef` |
| `star/defaults/star_job.defaults` | `96afcb0c3e30a6407acfa42d015cd68bbe6940375a75b91bde6e84a744ac8c59` |
| `eos/defaults/eos.defaults` | `b1974d782a9d8bb927507697f7de38910cda3e4fbe20778ef7fb244e52d1ce48` |
| `kap/defaults/kap.defaults` | `fdc2134f218081ddde22579e4f0e4c9d67396422015d222a54330a9fe0ad42c5` |
| `data/net_data/nets/pp_and_cno_extras.net` | `8828c416d71f3cad7815cf7bca830e8f09edcf5a38c42c599664a686d1f598b2` |

These root hashes do not yet cover their complete data/include dependencies.

### Remaining observation and execution prerequisites

The [pp-chain source record](../../configs/research/controlled-stellar-composition-transport-g1-neutrino-source.v1.json)
now retains uncertainties from visually reviewed Tables 28 and 31 of Penek's
Borexino thesis, with its PDF hash. The PDF review caught a conflicting Be7
exponent in later summary Table 42; the earlier dedicated table agrees with
collaboration open data and is used explicitly. The same manifest now binds
the CNO 2022 production flux and asymmetric total errors, and the sources'
conditional flavor-conversion assumptions. Compare predicted production flux
directly to these inferred all-flavor fluxes; do not apply survival probability
twice. This is not a detector-level refit, and modified CNO species ratios or
interior conversion assumptions require a later response review. Structural
inversion source binding remains open.

Applying the frozen conservative three-width rule gives these componentwise
intervals in cm^-2 s^-1: pp [3.1e10, 8.5e10], Be7 [4.42e9, 5.50e9],
B8 [4.36e6, 6.94e6], CNO [3.9e8, 1.26e9]. These are research envelopes,
not a joint confidence interval. For pp-chain channels the same-side statistical
and systematic widths are added; CNO uses its published total width directly.

The [acceptance design](../../configs/research/controlled-stellar-composition-transport-g1-acceptance-design.v1.json)
now fixes componentwise envelopes and numerical tolerances, with no joint
confidence claim. Its numerical tolerances are pre-result design choices;
they are not measurement errors. The helium/CZ summary dataset is explicitly
selected for these two scalar tests. Structural-inversion data still require
primary-source binding before the complete vector can be evaluated. This is a frozen decision policy, not a
completed numerical observation manifest. Inaccessible full-text endpoints
and missing source content do not authorize use of search snippets as final
uncertainty evidence or substitution of fixtures.

The [source-intake manifest](../../configs/research/controlled-stellar-composition-transport-g1-source-intake.v1.json)
now records five installed/upstream file hash matches and primary Borexino
data identities. This is partial evidence, not a full source-tree audit or
an acceptance freeze. Published summary helium/CZ values are separated from
unresolved dataset-specific likelihood choices. The detector correlation
matrix includes a CNO prior and must not be reused as global flux covariance.

1. Bind a primary sound-speed and density inversion dataset, including grid,
   reference convention, published uncertainty and reliable radial support.
   The scalar observations, mixture, age convention and decision rules are
   already selected above. Do not invent a covariance or substitute Model S
   predictions for observational inversion data.
2. Resolve/hash the full microphysics include/data and library dependencies.
   Five selected source files match the declared upstream commit; this is
   not a whole-tree provenance audit.
3. Validate the initial-trial namelist with the pinned parser and resolved
   defaults; implement and test extraction and conservation ledgers. Static
   key existence has passed, but neither parser nor evolution has run.
4. Implement a bounded calibration driver. Only Y, Z and mixing length may
   vary within the frozen bounds; success requires all three fit residuals
   within tolerance. Boundary hits, failed models, stagnation or resource
   exhaustion are not successful fits. Freeze the total evaluation/time
   budget after the separately authorized pilot, before optimizer execution.
   Convergence controls are already frozen; hash each final execution input.
5. Implement/test the bounded launcher and recheck storage/memory. Capacity
   recovery requires separate scoped authorization; do not prune automatically.
6. Create a new immutable execution attempt. Only that later step can launch
   evolution and earn a calibrated baseline under the G1 acceptance vector.

## Preparation-goal completion audit

The preparation deliverable is complete as a versioned, non-launchable packet.
This does not close program gate G1. The goal explicitly permits unresolved
prerequisites to be documented; the ordered list above is the required next
work, not a claim that those checks passed.

| Requested preparation | Evidence and boundary |
| --- | --- |
| Inspect pinned image without evolution | Immutable image/config references, installed toolchain and read-only inspection record above |
| Verify authoritative calibration sources | Five upstream byte matches, primary solar-calibration references and retained observational source manifests |
| Freeze model inputs | Model-design v1 and initial-trial inlist; effective-default/parser and complete dependency closure remain prerequisites |
| Freeze observational roles/tolerances | Acceptance-design v1 separates conventional fit targets, held-out scalar tests and unresolved structural inversion binding; missing data fails closed |
| Freeze convergence policy | Base, mesh-only, time-only and combined refinement at fixed parameters/age; no refit or post-result tolerance relaxation |
| Bound resources | One job, 2 CPUs, 2 GiB memory, 2-hour pilot, 5 GB output budget, 25 GB start / 20 GB stop; enforcement and fresh capacity checks required |
| Preserve scope and uncertainty | No evolution or deletion; no calibrated baseline, G2 admission, lifetime extension or actuator-feasibility claim |

Next proposed goal: close the structural-observation source manifest and
validate the zero-transport input/dependency packet without evolving a star.
If the inversion data or resolution metadata cannot be obtained, retain a
typed source-binding blocker rather than weakening G1. Launcher implementation
and an explicitly authorized, capacity-cleared pilot follow separately.
