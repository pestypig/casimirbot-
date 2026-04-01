# NHM2 Source-to-York Bridge Audit

## Purpose

This audit traces the actual repo path from NHM2 source assumptions to the qualified York result.

The question is not whether the York classification currently works. It does.
The question is whether the repo has a single defensible mechanism chain for:

`strobed support -> homogenized / averaged source -> reduced-order curvature source -> solved metric -> York morphology`

## Scope

This is a repo audit, not a literature memo.

Primary local evidence:

- `shared/clocking.ts`
- `docs/knowledge/ts-ratio.md`
- `docs/casimir-tile-mechanism.md`
- `docs/qi-homogenization-addendum.md`
- `shared/warp-promoted-profile.ts`
- `configs/needle-hull-mark2-cavity-contract.v1.json`
- `shared/needle-hull-mark2-cavity-contract.ts`
- `server/energy-pipeline.ts`
- `configs/york-diagnostic-contract.v1.json`
- `scripts/warp-york-control-family-proof-pack.ts`
- `artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json`
- `docs/audits/research/warp-york-control-family-proof-pack-latest.md`
- `artifacts/research/full-solve/warp-york-control-family-rodc-latest.json`

## Executive finding

The repo currently has **two strong halves** and **one weak bridge**.

Strong half 1:
- NHM2 tile/strobe timing, duty, and amplification assumptions are explicitly represented in the energy pipeline and cavity contract.

Strong half 2:
- Once a reduced-order metric brick exists, the York proof-pack closes parity, identity, render congruence, and family classification.

Weak bridge:
- The repo does **not yet** demonstrate that the NHM2 tile/strobe mechanism is what generated the exact reduced-order brick that the York proof-pack classifies.
- Instead, the proof-pack loads or constructs fixed `gr-evolve-brick` metric references with a separate reduced-order parameter set.

That means the current chain is best described as:

`tile/strobe mechanism docs + reduced-order source proxy + qualified York classifier`

not yet as:

`fully audited source-to-York causal bridge`

## Step-by-step trace

### 1. Tile and amplification layer exists directly in the repo

The mass / support ladder is explicit in `docs/casimir-tile-mechanism.md` and implemented in `server/energy-pipeline.ts`.

Repo claims wired into the pipeline:
- static Casimir energy per tile,
- hull tile census,
- `U_static`,
- geometry gain `gammaGeo^3`,
- `q` / spoiling gain,
- Van den Broeck compression,
- effective duty `d_eff`,
- mass proxy `M_exotic`.

The pipeline exposes that chain in `server/energy-pipeline.ts` through:
- `state.gammaChain` with note `rho_avg = rho0 * gamma_geo^3 * sqrt(Q/1e9) * gamma_VdB * q_spoil * d_eff`
- `state.M_exotic`
- `state.U_static`
- `state.dutyEffective_FR`

Audit verdict for this step:
- **directly present in repo code**
- **not yet tied directly to proof-pack York inputs**

### 2. Timing / homogenization gate exists directly in the repo

The repo has an explicit timing proxy layer.

`shared/clocking.ts` computes:
- `tauLC_ms`
- `tauPulse_ms`
- `epsilon = tauPulse / tauLC`
- `TS = tauLC / tauPulse`
- regime labels with `cycle-average valid` when `TS >= okTS` and `epsilon <= okEpsilon`

`docs/knowledge/ts-ratio.md` defines `TS_ratio` as `T_long / T_m`.

`server/energy-pipeline.ts` also computes a second TS path from hull dimensions:
- `TS_long = T_long / T_m`
- `TS_geom = T_geom / T_m`
- `TS_ratio = TS_long`
- `isHomogenized = TS_long > 1e3`

`docs/casimir-tile-mechanism.md` and `docs/qi-homogenization-addendum.md` elevate that into a physics statement:
- `TS >> 1` means GR sees cycle-averaged stress-energy
- sector strobing and variance suppression are used to stabilize tile-level `T00`

Audit verdict for this step:
- **directly implemented as repo policy / telemetry**
- **physics interpretation is asserted, not derived in-repo**

### 3. NHM2 contract and promoted profile define one mechanism posture

The promoted profile and cavity contract define an NHM2 mechanism posture with specific values.

From `shared/warp-promoted-profile.ts` and `configs/needle-hull-mark2-cavity-contract.v1.json`:
- `warpFieldType = natario_sdf`
- `sectorCount = 80`
- `concurrentSectors = 2`
- `dutyCycle = 0.12`
- `dutyShip = 0.12`
- `qCavity = 100000`
- `qSpoilingFactor = 3`
- `gammaGeo = 1`
- `gammaVanDenBroeck = 500`
- `modulationFreq_GHz = 15`
- `readout.zeta = 5`

`shared/needle-hull-mark2-cavity-contract.ts` then builds simulation parameters from that contract, including:
- `burstLengthUs = 10`
- `cycleLengthUs = 1000`
- `sectorCount`
- `sectorDuty`
- `lightCrossingTimeNs`
- `warpFieldType`

Audit verdict for this step:
- **direct NHM2 mechanism contract exists**
- **this contract is not the same parameter bundle used by the York proof-pack brick requests**

### 4. Reduced-order warp source payload exists in the pipeline

`server/energy-pipeline.ts` builds a reduced-order `warpParams` payload for the warp module.

That payload includes:
- `dynamicConfig.modulationFreqGHz`
- `burstLengthUs = 10`
- `cycleLengthUs = 1000`
- `cavityQ`
- `sectorCount`
- `sectorDuty = dutyEffective_FR`
- `lightCrossingTimeNs`
- `warpFieldType`
- geometry and amplification knobs

This is the closest in-repo object to a source-to-curvature handoff.

Audit verdict for this step:
- **direct reduced-order payload exists**
- **the audit trail from that payload to the exact proof-pack `metricT00Ref` brick is not yet surfaced as a single provenance object**

### 5. Metric family selection is explicit, but it is family-tag selection, not source inversion

`server/energy-pipeline.ts` resolves metric family / observer context from `metricT00Ref`.

Examples:
- `.natario_sdf.` -> `natario_sdf`
- `.natario.` -> `natario`
- `.alcubierre.` -> `alcubierre`

That means a large part of the reduced-order geometry path is keyed by the selected `metricT00Ref` family label.

Audit verdict for this step:
- **direct metric-family routing exists**
- **this is not yet a proof that the upstream strobing law uniquely determines the selected `metricT00Ref`**

### 6. The proof-pack uses a separate fixed reduced-order brick harness

The York proof-pack does not rebuild NHM2 from the cavity contract in real time.

`scripts/warp-york-control-family-proof-pack.ts` builds control metric volume references with fixed brick parameters:
- `dutyFR = 0.0015`
- `q = 3`
- `gammaGeo = 26`
- `gammaVdB = 500`
- `zeta = 0.84`
- `dims = 48x48x48`

For NHM2, the proof-pack loads a snapshot metric reference from:
- `artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json`

That snapshot points to the same reduced-order brick pattern:
- `metricT00Ref = warp.metric.T00.natario_sdf.shift`
- `dutyFR = 0.0015`
- `q = 3`
- `gammaGeo = 26`
- `gammaVdB = 500`
- `zeta = 0.84`

This is materially different from the NHM2 cavity contract / promoted profile values.

Audit verdict for this step:
- **proof-pack classification is strong once the brick exists**
- **the proof-pack brick inputs are a separate reduced-order audit harness, not a direct replay of the cavity contract's live mechanism values**

### 7. York diagnostics and classification are strong

The York contract is explicit in `configs/york-diagnostic-contract.v1.json`:
- Lane A: `theta = -trK`
- Lane B: `theta = -trK + div(beta/alpha)`
- control roles: Alcubierre = signed-lobe, Natario = low-expansion

The live proof-pack and RODC artifacts show:
- parity closed
- snapshot identity complete
- render congruence closed
- `family_label = nhm2_low_expansion_family`
- `cross_lane_status = lane_stable_low_expansion_like`

Audit verdict for this step:
- **directly supported by current artifacts**
- **this is the strongest part of the source-to-York chain**

## Direct / heuristic / missing map

| step | repo status | comment |
|---|---|---|
| tile energy and amplification ladder | direct | explicit in pipeline and docs |
| duty / sector / TS telemetry | direct | explicit in pipeline, schema, and cavity contract |
| claim that `TS >> 1` means GR sees cycle average | heuristic | asserted in docs and UI badging, not derived in-repo |
| reduced-order payload from pipeline to warp module | direct | payload exists, but provenance to proof-pack brick is not unified |
| mapping from NHM2 mechanism contract to proof-pack brick params | missing / split | proof-pack uses a separate fixed reduced-order parameter set |
| York lane computation and classification | direct | explicit contract, parity-closed artifacts |
| source-mechanism claim that NHM2 strobing causes the Natario-like York result | not yet demonstrated | current repo is stronger on classification than on mechanism proof |

## Key bridge weakness

The main weakness is not on the York side. It is the **handoff layer**.

Today the repo can show:
- a mechanism model exists,
- a reduced-order geometry audit exists,
- a York classifier exists.

But it does not yet show, in one auditable chain, that:
- the NHM2 mechanism contract,
- through its own timing/duty/sector settings,
- generates the same reduced-order source parameters,
- that generate the classified York brick.

The biggest concrete symptom is parameter drift between:
- NHM2 promoted/cavity values (`dutyShip=0.12`, `qCavity=100000`, `gammaGeo=1`, `zeta=5`), and
- York proof-pack brick values (`dutyFR=0.0015`, `q=3`, `gammaGeo=26`, `zeta=0.84`).

That difference may be intentional reduced-order modeling, but if so, it needs explicit provenance and derivation.

## Current defensible statement

The repo can currently defend this statement:

> NHM2 has a parity-closed, cross-lane-stable low-expansion York morphology under the repo's declared diagnostic contract.

The repo cannot yet defend this stronger statement without more work:

> NHM2's specific strobing, homogenization, and negative-energy support schedule has been auditablely shown to produce that York morphology through a controlled reduced-order bridge.

## Recommended next implementation target

The next useful patch should not alter the classifier first.
It should add a **source-to-York provenance artifact** that records, in one place:

- NHM2 contract inputs,
- derived timing inputs,
- derived effective source inputs,
- reduced-order brick parameters,
- metric reference hashes,
- York outputs,
- bridge assumptions used at each handoff.
