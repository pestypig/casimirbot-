# NHM2 Current Status Memo

## Overall NHM2 verdict

NHM2 can now answer a bounded mission-question family in a way that is internally consistent across (i) certified solve-backed transport surfaces, (ii) certified in-hull observer acceleration, and (iii) a hardened `latest` publication/provenance manifest. Concretely, the repo can now publish certified, bounded outputs for: a local-comoving warp worldline as a descriptor, not speed; a cruise-envelope preflight band; a local route-time worldline extension; a target-coupled mission-time estimator; a target-coupled mission-time comparison; a cruise-envelope consistency layer; and an in-hull proper-acceleration profile, plus a manifest that ties the whole stack together with checksums.

The current solve and diagnostic classification aligns with the repo's low-expansion / Natario-like diagnostic family under the York diagnostic contract, with explicit calibration against `alcubierre_control` and `natario_control`, and with NHM2's `winning_reference` reported as the Natario control. This is stated as a diagnostic-local morphology verdict, not a theory-identity claim.

The repo is at final bounded-stack status in the sense of having a coherent bounded answer chain, but it still carries a last semantic closure issue in the publication/provenance layer: the emitted evidence-state is `repo_tracked_latest_evidence`, explicitly not the strongest clean-landed state, `repo_landed_clean_latest_evidence`. Separately, speed semantics, route-map ETA, and speed-based SR/NR comparators remain deferred by contract and are explicitly forbidden to be inferred from the bounded stack.

Non-claim boundary, repo-wide: having a bounded, certified stack does not imply viability, scalar max speed, route-map ETA, full route dynamics, curvature-gravity certification, or comfort/safety certification.

## Direct answers to the mission-question family

### Hull-gravity question

Exact quantity being answered: experienced proper-acceleration magnitude for a declared in-hull observer family, computed from brick-resolved Eulerian acceleration channels, expressed in `m/s^2` and `g`.

Current value: the certified cabin-cross profile is an honest zero profile: `min_mps2 = 0`, `max_mps2 = 0`, representative `0 m/s^2`, across `sampleCount = 7`.

Artifact path supporting it: `artifacts/research/full-solve/nhm2-in-hull-proper-acceleration-latest.json`, certified as `bounded_in_hull_profile_certified`.

Non-claim boundary: this is observer-defined experienced proper acceleration, not curvature gravity. It is also not comfort/safety certification, and it does not promote any source/mechanism narrative.

### Cruise or "maximum speed" question

Exact quantity being answered: a bounded cruise-control descriptor envelope over the dimensionless quantity `bounded_local_transport_descriptor_norm = ||beta_eff||`. This is explicitly a fixed-chart local descriptor, not a ship speed.

Current value: the certified admissible descriptor band is `min = 3.6531425984160347e-16`, `max = 1.9546804721038186e-15`, dimensionless, with representative value `1.9546804721038186e-15`.

Artifact path supporting it: `artifacts/research/full-solve/nhm2-cruise-envelope-latest.json`, certified as `bounded_cruise_envelope_certified`, with the preflight support in `artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json`.

Non-claim boundary: this artifact does not certify scalar max speed, `vmax`, does not map the descriptor to an unconstrained speed, does not certify route-map ETA, and is not viability evidence.

### Acceleration-profile question

Exact quantity being answered in current repo scope: a bounded local route-time progression in a fixed chart, parameter `lambda` in `[0,1]`, plus a bounded in-hull experienced proper-acceleration profile for cabin sample points.

Current values that exist:

- Route-time worldline: coordinate time spans `0 -> 3.3587237719787246e-6 s`, with matching proper time span and `dtau_dt = 1` at all progression samples, as published.
- In-hull acceleration profile: all cabin samples report `0 m/s^2`.

Artifact paths supporting it:

- `artifacts/research/full-solve/nhm2-route-time-worldline-latest.json`
- `artifacts/research/full-solve/nhm2-in-hull-proper-acceleration-latest.json`

Non-claim boundary: the repo still does not publish a full mission route-dynamic acceleration history, a comfort profile, or a speed history. The route-time schedule is explicitly a bounded local probe parameterization, not a full trajectory.

### Relativistic-vs-nonrelativistic question

Exact quantity being answered: a bounded mission-time comparison on a deterministic committed local-rest target-distance basis, comparing warp coordinate time, warp proper time, and a classical no-time-dilation reference, described as imposing `tau=t` on the same estimator basis.

Current value: the comparison reports an honest zero differential:

- `warpCoordinateYears = 4.3652231448899625`
- `warpProperYears = 4.3652231448899625`
- `classicalReferenceYears = 4.3652231448899625`
- `properMinusCoordinateSeconds = 0`
- `properMinusClassicalSeconds = 0`

Artifact path supporting it: `artifacts/research/full-solve/nhm2-mission-time-comparison-latest.json`.

Non-claim boundary: this is not a speed-based SR-vs-NR comparison. Speed-based nonrelativistic and SR comparators are explicitly deferred and forbidden to infer. The repo explicitly warns that a zero differential must not be spun into a broad warp-advantage claim.

### Alpha Centauri mission-time question

Exact quantity being answered: a bounded target-coupled mission-time estimator that repeats the certified bounded local probe route-time schedule over a deterministic committed target-distance contract for `alpha-cen-a`. It reports coordinate and proper time separately.

Current value:

- coordinate time estimate: `137755965.9171795 s` = `4.3652231448899625 yr`
- proper time estimate: `137755965.9171795 s` = `4.3652231448899625 yr`

Artifact path supporting it: `artifacts/research/full-solve/nhm2-mission-time-estimator-latest.json`.

Non-claim boundary: this estimator explicitly does not certify max speed, viability, an unconstrained ETA for arbitrary targets, or a full route dynamic. It is a bounded repetition law over a bounded local segment schedule.

## What the "full congruent solve" currently means in this repo

### What congruence means here

In this repo's terminology, congruence is a diagnostic integrity condition: the York-family diagnostic views and the downstream transport surfaces are only allowed to proceed when the solve is the required class, for example `requireCongruentSolve=1` and for NHM2 `requireNhm2CongruentFullSolve=1` in the debug requests shown, with identity/parity checks designed to prevent proxy mismatch from being promoted into authoritative diagnostic statements.

This is not presented as theory equivalence. It is presented as: the diagnostic lane is calibrated; the evidence path is consistent; therefore a classification verdict under this diagnostic contract is permitted.

### Authoritative diagnostic lane and controls

The proof pack makes Lane A authoritative for the York diagnostic contract, with:

- observer: `eulerian_n`
- foliation: `comoving_cartesian_3p1`
- expansion definition: `theta = -trK`
- scope: `diagnostic_local_only`

Controls calibrate this lane explicitly:

- `alcubierre_control` is the strong signed expected morphology reference.
- `natario_control` is the low-expansion expected morphology reference.

NHM2 is then scored against those references and declared closest to Natario-like low-expansion in this contract, with robust stability across variants.

### Current NHM2 classification under the York diagnostic contract

The proof pack's headline verdict is `nhm2_low_expansion_family`, with the winning reference being `natario_control`, and robustness being `stable_low_expansion_like` across all evaluated contract perturbations in that sweep.

This matters for interpreting transport claims because it sets expectations about what should and should not appear in the 3+1 decomposition: a low-expansion / Natario-like morphology is consistent with regimes where the lapse remains flat and time-dilation differentials do not become a primary signal, even while the shift descriptor can vary locally. The repo explicitly uses that separation when explaining why `dtau_dt` can stay flat while `||beta_eff||` varies, and why that does not become a speed claim.

### Why this is morphology, not identity

The repo explicitly states that the York verdict is diagnostic-local only, and additionally notes that cross-lane promotion is disabled by policy. Lane B is reference-only for advisory comparison. It also documents a source/mechanism parity gap, direct vs reconstructed and proxy vs metric term gap, that prevents promoting proxy equivalences into authoritative claims.

Allowed conclusion: NHM2 is classified as low-expansion / Natario-like under the York diagnostic contract and its calibrated lanes.

Forbidden stronger conclusion: NHM2 is Natario in an identity sense, or the underlying mechanism is promoted to authoritative equivalence. The repo explicitly blocks that by scope, cross-lane policy, and the direct-vs-proxy formula mismatch status.

## The actual solve chain from metric to published answers

This section intentionally separates: solve-backed metric/geometry outputs, observer-defined quantities derived from them, and certified publication surfaces.

### Solve-backed state and metric source

The certified transport surfaces identify their source surface as `nhm2_metric_local_comoving_transport_cross`, with producer `server/energy-pipeline.ts`, provenance class `solve_backed`, and `metricT00Ref = warp.metric.T00.natario_sdf.shift`, with `metricT00Source = metric`.

Status classification at this stage: metric-derived and solve-backed, but not yet route time or mission time. Those are separate contracts.

### Metric adapter and GR brick

For the in-hull proper-acceleration surface, the artifact states:

- brick channel source: `gr_evolve_brick`
- acceleration field: `eulerian_accel_geom_*`
- `brickStatus` and `brickSolverStatus`: `CERTIFIED`

This positions the GR brick as the geometry-resolution stage producing 3+1 and Eulerian fields, lapse gradients and related quantities, that later become observer quantities. It is geometry-derived and solve-backed in certified mode.

### Worldline contract

The warp worldline surface, as summarized inside the proof pack, is a certified bounded solve-backed worldline contract over a centerline-plus-shell-cross family in the `comoving_cartesian` chart, with `dtau_dt` reported as flat, equal to `1`, and with transport interpretation explicitly descriptor, not speed.

Classification at this step: observer-defined descriptor extraction from a solve-backed metric, a certified bounded transport contract, but explicitly not a mission, route-map, or speed claim.

### Cruise-envelope preflight

Preflight certifies an admissible support band for `||beta_eff||` across the worldline family, marks above-support probes as rejected, and explicitly states: fixed-chart local descriptor support only, not a ship speed.

Classification: certified bounded support surface, still not route time or mission time.

### Route-time worldline extension

Route-time adds a deterministic progression, `lambda`, down the local probe segment, `shell_aft -> shell_fore`, and publishes bounded coordinate time and proper time schedules for that segment, explicitly describing coordinate time as `bounded_local_probe_light_crossing_coordinate_time`.

Classification: solve-backed plus observer-defined plus certified bounded route-time for a local probe segment, explicitly not target-coupled and not route ETA.

### Mission-time estimator

Mission-time estimator consumes worldline, preflight, route-time, and a committed target-distance contract and publishes coordinate/proper time estimates to a specific target. It is explicitly bounded translational repetition, not a full route dynamic.

Classification: certified bounded estimator, target-coupled, assumption-bearing, explicitly not speed or full mission dynamics.

### Mission-time comparison

Comparison is paired, but only against `classical_no_time_dilation_reference` on the same estimator basis, explicitly no speed-based SR/NR comparator yet.

Classification: certified bounded comparison surface, explicitly not a broad SR/NR comparison.

### Cruise envelope

Cruise envelope strengthens preflight by requiring consistency with route-time and mission layers, but remains on the same fixed-chart descriptor quantity and retains the not-`vmax` boundary.

Classification: certified bounded descriptor envelope, not a speed certificate.

### In-hull proper acceleration

In-hull proper-acceleration publishes an observer-defined cabin-cross profile for Eulerian cabin observers, explicitly derived from the brick-resolved Eulerian acceleration channel and converted to SI via `c^2`.

Classification: certified bounded observer-defined experienced acceleration, not curvature gravity.

### Manifest and proof pack publication layer

The proof-surface manifest is a certified publication/provenance artifact that enumerates eight proof surfaces, their paths, and SHA256 checksums, and declares the publication mode and evidence-state label.

Classification: certified bounded publication registry, not a physics surface itself.

## The Casimir tile mechanism itself

This repo deliberately treats the Casimir tile mechanism as a modeled mechanism layer with its own guardrails and provenance controls, and does not allow it to be silently conflated with the solve-backed transport contracts.

### What a Casimir tile is in repo terms

Repo definition on the mechanism side: a tile is modeled as a parallel-plate Casimir cavity with:

- plate separation, gap, `a`, set by `gap_nm`, converted to meters
- plate area, `A_tile`, set by `tileArea_cm2`, converted to `m^2`
- per-tile static energy computed either by the canonical ideal formula or by a Lifshitz/material-corrected path

### Lab coupon tile vs system/hull tiling mechanism

The repo explicitly distinguishes maturity classes:

- A lab coupon tile is a single cavity you can build and measure, including patch-voltage and stiffness guardrails and an API that exposes intermediate values.
- A system/hull tiling mechanism is a modeled extrapolation: per-tile energy times tile census, hull area integration plus packing plus layers, to hull static budget, then amplification ladder, then mass proxy.

Allowed conclusion: the repo provides an implementation-backed tile model and a modeled scaling story.

Forbidden stronger conclusion: that this mechanism is already promoted to an authoritative, first-principles closure of the warp metric source term. The proof pack explicitly blocks promotion beyond bounded advisory subsets.

### The exact static Casimir formula used per tile

The repo uses the canonical perfect-conductor parallel-plate result, energy per area:

\[
\frac{E}{A} = -\frac{\pi^2 \hbar c}{720\,a^3}.
\]

Symbol-to-repo binding:

- \(E\): Casimir interaction energy, Joules
- \(A\): plate area, `area_m2 = tileArea_cm2 * 1e-4` in the pipeline model
- \(\pi\): mathematical constant
- \(\hbar c\): `PHYSICS_CONSTANTS.HBAR_C` in `modules/core/physics-constants.ts`, using CODATA 2018-based values
- \(a\): plate separation in meters, `gap_m = gap_nm * 1e-9`

The guarded code-mapped doc shows the exact analytic code shape used in the pipeline's static fallback:

```ts
const gap_m = gap_nm * 1e-9;
const E_overA = -(Math.PI * Math.PI * HBAR_C) / (720 * Math.pow(gap_m, 3)); // J/m^2
return E_overA * area_m2; // J per tile
```

The static module implementation carries the same formula via `PHYSICS_CONSTANTS.PARALLEL_PLATE_PREFACTOR = pi^2/720` and `PHYSICS_CONSTANTS.HBAR_C`, with a geometry branch for `parallel_plate` that constructs `energyTotal` proportional to `-(pi^2/720) hbar c A/a^3`.

Non-claim boundary: the ideal formula is the baseline. The repo also implements Lifshitz-like corrections and a material band, but none of that is, by itself, a certified warp transport output.

### Hull tile census logic and static budget

Mechanism-side modeling, not a transport contract: the Casimir mechanism doc states that the Needle hull is modeled as a triaxial ellipsoid; surface area is computed via a metric/first-fundamental-form integration; then packing and layer assumptions are applied to obtain a tile count, \(N\). The doc reports a canonical \(N \approx 1.97\times 10^9\) for its default ellipsoid and packing/layer model, and then defines static budget as \(U_{\rm static} = N E_{\rm tile}\).

Allowed conclusion: the repo provides a concrete tile census and budget model.

Forbidden stronger conclusion: that the hull census/budget implies feasibility or that it is automatically the authoritative source term for the metric used in certified NHM2 transport surfaces.

### Amplification ladder, mass proxy chain, and `massMode`

The mechanism doc makes the mass-proxy chain explicit, converting energy to mass via \(E/c^2\) after applying ladder gains:

\[
M = \frac{|U_{\rm static}| \gamma_{\rm geo}^{3} Q_{\rm burst} \gamma_{\rm VdB} d_{\rm eff} N}{c^2}.
\]

Repo binding for key terms on the mechanism layer:

- \(\gamma_{\rm geo}\): concave-geometry gain, applied as a cube
- \(Q_{\rm burst}\): burst or Q factor gain
- \(\gamma_{\rm VdB}\): Van den Broeck pocket compression knob
- \(d_{\rm eff}\): duty clamp, Ford-Roman / QI motivated
- \(c\): speed of light constant from physics constants

`massMode` governs provenance and interpretation:

- `MODEL_DERIVED`: treat `gamma_VdB` as a hypothesis knob and compute mass from the chain without retuning
- `TARGET_CALIBRATED`: retune `gamma_VdB` to hit a target exotic mass, explicitly legacy behavior
- `MEASURED_FORCE_INFERRED`: scale from experimental Casimir force datasets, mechanism-side measurement coupling

Non-claim boundary: the mass proxy chain is a mechanism-side ladder and provenance model. It is not the same as the solve-backed, certified transport outputs unless explicitly promoted by contract, and the York proof pack explicitly describes promotion blockers and formula equivalence equal to false in the source/mechanism parity route.

## Dynamic Casimir, strobing, and duty-cycle explanation

### What dynamic modulation means in this repo

Dynamic modulation is modeled as a strobing/drive regime where the tile/hull energy is not treated as a static continuous field, but as a high-frequency modulation whose cycle-averaged effect is the operative quantity for the GR-facing story. The Casimir mechanism doc describes this as a time-sliced proxy, with telemetry such as `TS_ratio` and an `isHomogenized`-style badge, explicitly invoking the idea that GR responds to averaged stress-energy in that regime.

The guarded tile doc similarly frames the dynamic ladder as an add-on atop `U_static`, with duty and Q telemetry exposed, and explicitly labels this as optional and separable from the static cavity falsification target.

### Sector strobing, duty cycle, and `d_eff`

The guarded doc describes an effective duty factor, `d_eff`, as a product of burst-local duty and sector activation fraction, a sectors-live over sectors-total form, used to scale cycle-averaged power/energy in the dynamic ladder.

Mechanism-side meaning: `d_eff` is a clamp representing how long negative-energy-like support is on in a cycle, and it is explicitly motivated as a quantum-inequality guardrail in the mechanism narrative.

### Q, burst amplification, and why this is not a certified mission result

Both Casimir docs treat Q and burst factors as model knobs in a mechanism-side ladder. Even if internally consistent, this does not become a certified mission result because the certified transport chain is framed as solve-backed metric/geometry evidence, while the source/mechanism layer is documented in the York proof pack as non-authoritative with blocked parity promotion beyond bounded advisory subsets.

Allowed conclusion: the repo provides a modeled dynamic ladder with explicit duty/Q knobs and guardrails.

Forbidden stronger conclusion: duty/Q modeling alone certifies transport, speed, ETA, or viability. Those require downstream certified contracts and/or promotion policies the repo explicitly does not grant today.

## How the Casimir mechanism connects to warp profiles

### Explicit separation enforced by the repo

The repo's strongest current practice is that it does not allow the mechanism-side Casimir ladder to be conflated with the solve-backed transport surfaces. The York proof pack's source/mechanism maturity section explicitly classifies the source/mechanism layer as reduced-order advisory and lists promotion blockers, including direct vs reconstructed non-parity and proxy vs metric term gap, while stating Lane A remains authoritative.

This means any connection must be written as two distinct layers.

Modeled mechanism layer, Casimir tiles, budgets, ladder, mass proxy:

- per-tile `E/A` and `U_static` model
- hull tiling and amplification ladder producing a mass proxy
- `massMode` provenance policy and possible measured normalization inputs

Certified solve-backed layer, transport, mission time, in-hull acceleration:

- transport descriptor surfaces are explicitly solve-backed from `metricT00Ref=warp.metric.T00.natario_sdf.shift` with `metricT00Source=metric`
- in-hull acceleration is explicitly derived from GR brick Eulerian acceleration channels

### What is the modeled bridge vs what is certified

Modeled bridge, non-promoted: Casimir budget to mass proxy to some stress-energy narrative to metric source. This remains bounded advisory unless and until the repo's promotion contracts and parity routes are closed.

Certified output: metric/solve-backed transport descriptor and derived observer quantities, published under explicit contracts that define their meanings and their non-claims.

Allowed conclusion: the repo can publish certified transport results without promoting mechanism equivalence, because certification is attached to solve-backed downstream surfaces, not to mechanism parity.

Forbidden stronger conclusion: the Casimir mechanism is now certified as the authoritative physical source of NHM2. The proof pack explicitly blocks that via maturity tier and parity-route feasibility.

## The mathematical meaning of the transport stack

### The 3+1 quantities the repo relies on

The transport and in-hull surfaces are written in 3+1 language:

- lapse, `alpha`: governs local proper-time rate vs coordinate time for Eulerian observers
- shift, `beta^i`: encodes how spatial coordinates shift between slices; in this repo it is used to define an effective local transport descriptor
- spatial metric, `gamma_ij`: geometry on the spatial slice, implicit in brick evolution and diagnostics

The repo's transport contracts focus on a descriptor called `||beta_eff||`, dimensionless, explicitly refusing to label it a certified ship speed.

### Why `||beta_eff||` is the key bounded descriptor

Preflight and cruise-envelope contracts define their primary quantity as the dimensionless norm `||beta_eff||` of the certified local-comoving effective transport descriptor, and explicitly state: fixed-chart local descriptor support only, not a ship speed.

The route-time contract then uses a longitudinal probe segment and publishes a schedule with `betaCoord` and `localDescriptorValue` at progression samples, while keeping `dtau_dt` flat, equal to `1`, in the current low-g regime.

### Why `dtau/dt` can remain flat while the descriptor varies

The preflight artifact explicitly labels the regime `descriptor_varied_dtau_flat`, and interprets it as solve-backed local shift variation with numerically flat `dtau_dt` in the low-g bounded regime, emphasizing that this is informative for bounded transport differentiation only.

This is mathematically coherent in 3+1: shift behavior can vary while lapse remains constant or near-constant, so a time-dilation differential is not automatically the primary observable signal. The repo treats that as a feature of the bounded regime, not a hidden failure.

### Stack semantics: worldline, preflight, route-time, mission-time, comparison, cruise-envelope

Worldline meaning: bounded local-comoving transport contract over a sample family, explicitly not mission time or speed.

Cruise-preflight meaning: admissible bounded local descriptor support band for `||beta_eff||`, with fail-closed above-support probes.

Route-time `lambda` meaning: `lambda` is normalized bounded route progress along the local `shell_aft -> shell_fore` probe segment in the fixed chart. Coordinate time is parameterized by a local light-crossing horizon, explicitly not a target ETA.

Mission-time estimator meaning: repeated use of the certified bounded local probe schedule over a committed target distance, explicitly not full route dynamics and not a speed proof.

Comparison meaning: compare the mission estimator's coordinate/proper time to a classical `tau=t` reference on the same basis, explicitly not a speed-based SR/NR comparison.

Cruise-envelope meaning: certify a bounded descriptor band that is consistent across preflight, route-time, mission-time, and comparison, while explicitly retaining the not-`vmax` boundary.

## The mathematical meaning of the hull-gravity answer

### Observer family and certified channel path

The in-hull surface is defined for:

- chart: `comoving_cartesian`
- observer family: `eulerian_comoving_cabin`

The acceleration field is explicitly identified as `eulerian_accel_geom_*`, with meaning given in the artifact:

> brick-resolved `eulerian_accel_geom_i = partial_i alpha / alpha` converted to SI via `c^2`

This is an observer-defined experienced proper acceleration, Eulerian observers fixed at cabin points, not a curvature invariant.

### Bounded cabin sampling geometry

Sampling is a deterministic cabin-cross family: center, fore, aft, port/starboard, dorsal/ventral, with specific offsets and positions in meters published in the artifact. `sampleCount = 7`.

This matters because the repo's claim is bounded to:

1. that sample family
2. that observer definition
3. that current brick/resolution adequacy rule

### Why `fallbackUsed = false` matters

The artifact explicitly sets `fallbackUsed: false` and declares a certified-mode criterion: certified mode samples direct `gr_evolve_brick` channels only, and analytic fallback requested for certified mode is listed as a falsifier condition.

So zero here is not "we had no data." It is "direct brick channels are zero across the sampled region and the adequacy policy allows zero profiles when the whole sampled brick extrema are also zero."

### Why a current zero-profile result is mathematically allowed

The artifact gives an explicit adequacy note:

- `wholeBrickAccelerationAbsMax_per_m = 0`
- `wholeBrickGradientAbsMax_per_m = 0`
- `allSampleMagnitudesZero = true`
- `expectedZeroProfileByModel = true`

It then records an interpretation label: `observer_defined_zero_profile_in_constant_lapse_regime`.

Allowed conclusion: the repo can certify experienced proper acceleration equal to `0` for the declared Eulerian cabin observers in this bounded regime.

Forbidden stronger conclusion: gravity is zero in the curvature sense, or spacetime is flat in a global sense. The repo explicitly labels this as observer acceleration, not curvature.

## Why the exciting answers are allowed, and why stronger ones are not

This section stays strictly within the repo's own boundaries and explains the mathematical non-implications.

### Proper acceleration does not imply curvature gravity

Allowed conclusion: Eulerian cabin observers experience zero proper acceleration in the sampled interior points, per `a_i = partial_i alpha / alpha` and the certified brick channels.

Forbidden stronger conclusion: curvature gravity is absent or no tidal/curvature effects exist. Reason: the certified quantity is an observer acceleration derived from lapse gradients, not a curvature invariant. Curvature requires analyzing curvature tensors/invariants, which this in-hull contract explicitly does not do.

### Descriptor envelope does not imply scalar max speed

Allowed conclusion: the repo certifies a bounded descriptor envelope for `||beta_eff||` in a fixed chart, with a published admissible band.

Forbidden stronger conclusion: NHM2 has a certified `vmax`. Reason: the contract defines `||beta_eff||` as a local transport descriptor and explicitly refuses a speed mapping. Without an additional certified semantics layer that maps descriptor to speed, and defines observer and operational meaning, max speed is not defined in-contract.

### Bounded mission estimator does not imply full route dynamic or unconstrained ETA

Allowed conclusion: for target `alpha-cen-a`, the bounded estimator reports coordinate and proper mission time on a specific repeated-local-probe basis.

Forbidden stronger conclusion: this is the full mission trajectory ETA, or it works for arbitrary targets and controls. Reason: the estimator is explicitly an assumption-bearing repetition of a bounded local segment schedule and explicitly disclaims braking, capture, and route dynamics. It is coupled to a deterministic committed target-distance snapshot, not a general mission plan.

### Classical no-time-dilation comparison does not imply SR/NR comparison closure

Allowed conclusion: on the current basis, proper and coordinate time estimates match the `tau=t` reference within the declared comparison surface, a zero differential.

Forbidden stronger conclusion: SR vs NR advantage is certified, or relativistic effects are absent in any broader sense. Reason: the comparator is explicitly not a speed-based SR/NR comparator. It is a same-basis `tau=t` reference. Speed-based comparators are listed as deferred.

### Zero differential does not imply warp advantage, and does not imply nothing happened

Allowed conclusion: the comparison surface honestly reports no certified relativistic differential on the declared basis.

Forbidden stronger conclusions, two opposite errors:

- therefore NHM2 yields a hidden advantage. Reason: advantage would require a certified route-map/speed/ETA semantics layer. The stack explicitly refuses that promotion.
- therefore nothing happened. Reason: the repo's bounded transport descriptor varies while `dtau_dt` remains flat, `descriptor_varied_dtau_flat`, so the system can still be transport-informative local-only without generating a time-dilation differential signal.

## Publication and provenance status

### What the proof-surface manifest is

The manifest is a certified artifact, `nhm2_proof_surface_manifest/v1`, whose explicit function is to bind:

- the eight proof surfaces, worldline, cruise-preflight, route-time, mission estimator, mission comparison, cruise envelope, in-hull acceleration, and the proof-pack summary itself
- their JSON/MD paths
- their SHA256 checksums

under a declared publication mode.

It is explicitly not a physics surface and explicitly does not widen any transport, gravity, or viability claim.

### Publication mode and evidence-state semantics

The publication mode is `bounded_stack_latest_sequential_single_writer`.

The certification-path audit defines evidence-state labels precisely:

- `repo_trackable_latest_evidence`: not ignored, but not fully git-tracked
- `repo_tracked_latest_evidence`: git-tracked, but the critical set still has index/worktree delta
- `repo_landed_clean_latest_evidence`: tracked and clean-landed, no critical-set git delta after publish

The manifest's current emitted state is `trackedRepoEvidenceStatus = repo_tracked_latest_evidence`.

So the repo has closed the publisher mechanics gap, deterministic publication plus checksums plus tracked latest artifacts, but it does not overstate closure as clean landed while there is still git delta in the critical bounded set.

Non-claim boundary: provenance hardening does not, by itself, widen physics scope. It only makes what was certified reproducible.

## Final conclusion

NHM2 is now answered in bounded form for the core mission-question family as the repo defines those questions today: hull gravity as experienced proper acceleration for Eulerian cabin observers, cruise as a descriptor envelope over `||beta_eff||`, bounded local route-time progression, bounded target-coupled mission-time estimation, bounded mission-time comparison against a classical `tau=t` reference, and the hardened publication manifest that ties the latest certified surfaces together.

The strongest honest current claim is narrow but real: within the declared bounded regime and contracts, NHM2 is classified as low-expansion / Natario-like under the York diagnostic contract, and the certified transport stack currently produces an extremely small descriptor band, `||beta_eff|| ~ 10^-15`, with flat `dtau_dt` and a target-coupled Alpha Centauri A estimator of about `4.365223` years, coordinate and proper time equal on this basis, while in-hull Eulerian cabin observers experience `0 m/s^2` proper acceleration across the bounded cabin-cross samples.

The narrowest remaining unresolved issue, semantic closure, is twofold and explicitly documented:

- provenance/evidence-state is not yet claimed as the strongest clean-landed state, `repo_landed_clean_latest_evidence` is still not emitted, meaning the repo refuses to overstate publication closure
- speed semantics, route-map ETA, and speed-based SR/NR comparators remain deferred by contract, and the repo explicitly forbids promoting descriptor/estimator surfaces into those stronger claims without new certified layers
