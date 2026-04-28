# NHM2 Phase-Topology Follow-Up Patch Instructions

## Goal

Extend the NHM2 phase-topology audit from a first-pass sidecar into a research-cited, claim-safe diagnostic layer. The patch must improve evidence quality without changing Casimir energy, Ford-Roman/QI math, metric `T00`, source-closure tensors, or viability certificate policy.

The topology artifact is an audit of sector strobe behavior only. It may limit or annotate claims about strobe-pattern admissibility, but it must not become a metric source term or an energy transport claim.

## Research Claim Policy

Every new scientific claim introduced by this patch must be backed by a primary or high-quality source. Do not rely on model memory for experimental or mathematical physics claims. When uncertain, phrase the claim as a diagnostic analogy or hypothesis, not as established physical equivalence.

Required source classes:

- Phase singularities and apparent superluminal defect motion: cite Bucher et al., "Superluminal Correlations in Ensembles of Optical Phase Singularities", arXiv:2509.17675 and/or the Nature article.
- Quantum inequality guardrails: cite Ford, Pfenning, and Roman, "Quantum Inequalities and Singular Energy Densities", arXiv:gr-qc/9711030 / Phys. Rev. D 57, 4839.
- Dynamic or near-field Casimir context: cite Dalvit, Maia Neto, and Mazzitelli, "Fluctuations, dissipation and the dynamical Casimir effect", arXiv:1006.4790; Juarez-Aubry and Weder, "A short review of the Casimir effect with emphasis on dynamical boundary conditions", arXiv:2112.06824; and, where near-field modulation is discussed, Yu and Fan, "Near-Field Dynamical Casimir Effect", Phys. Rev. Lett. 135, 116901 (2025).

Recommended references:

- https://arxiv.org/abs/2509.17675
- https://www.nature.com/articles/s41586-026-10209-z
- https://arxiv.org/abs/gr-qc/9711030
- https://arxiv.org/abs/1006.4790
- https://arxiv.org/abs/2112.06824
- https://doi.org/10.1103/y261-8r5s

## Non-Negotiable Boundaries

The follow-up patch must preserve these invariants:

- `nhm2PhaseTopology` is diagnostic/audit output only.
- No topology field may feed `metricT00`, `stressEnergyTensor`, `metricStressEnergy`, `tileEffectiveStressEnergy`, `zeta`, `qiGuardrail`, QI duty, Casimir energy, or GR source terms.
- Superluminal defect velocity must always be labeled as pattern motion, not energy transport, signal transport, propulsion, or causal communication.
- `NHM2_PHASE_TOPOLOGY_GATE=0` remains the default behavior.
- Strict mode may downgrade certified strobe-pattern claims, but it must not rewrite physical pass/fail evidence from unrelated gates.

## Patch Scope

### 1. Add Citation Metadata To The Artifact

Extend `shared/contracts/nhm2-phase-topology.v1.ts` with a citation block:

```ts
researchBasis: {
  phaseSingularityRefs: string[];
  qiGuardrailRefs: string[];
  casimirContextRefs: string[];
  claimLimitations: string[];
};
```

Populate it in `server/energy/phase-topology.ts`. Use stable URLs or DOI strings. The citation block should explain that topology is being used by analogy as a phase-field diagnostic, not as proof of NHM2 physical equivalence to an hBN polariton experiment.

### 2. Add A Claim-Limitation Summary

Add a compact summary field:

```ts
claimLimit: {
  metricSourceAdmitted: false;
  energyTransportAdmitted: false;
  signalTransportAdmitted: false;
  strobePatternDiagnosticAdmitted: true;
  uncertainty: "experimental_analogy_not_validated_metric_source";
};
```

This should be surfaced wherever `nhm2PhaseTopology` is shown in runtime payloads or future UI badges.

### 3. Improve Defect Tracking, But Keep It Conservative

Replace the current count-only creation/annihilation estimate with nearest-neighbor or linear-assignment matching across previous/current defects.

Minimum acceptable version:

- Match only same-charge defects.
- Use wrapped azimuth distance for `phi01`.
- Require a configurable max match distance.
- Count unmatched current defects as creations.
- Count unmatched previous defects as annihilations.
- Compute velocity only for matched defects.

Preferred later version:

- Use Hungarian/linear assignment if a small local dependency already exists or can be added without broad dependency risk.
- Emit speed and distance histograms into `phaseSpace`.

### 4. Add Seam-Concentration Metrics

Add metrics that distinguish "defects exist" from "defects cluster at sector seams":

```ts
seams: {
  seamBand01: number;
  defectsNearSeams: number;
  seamConcentration: number;
  maxSectorPhaseJump_rad: number;
};
```

Do not treat seam concentration as an automatic failure until baseline distributions exist. Default status should be `review` unless density is already in hard-fail territory.

### 5. Add Baseline Capture Tests

Add tests proving:

- Citation metadata is present and includes the phase-singularity, QI, and Casimir reference classes.
- Claim limitations remain false for metric source, energy transport, and signal transport.
- Superluminal pattern velocity never creates `status: "fail"` by itself.
- Strict gate downgrades only topology strobe claim status and does not mutate `qiGuardrail`, `metricT00`, or tile stress-energy.
- Smoothing remains opt-in and changes only phase offsets used for scheduled pulses.

### 6. Add Runtime/Helix Badge Later

Add a compact UI badge only after backend payload tests are stable:

```txt
Phase topology: PASS | REVIEW | FAIL
Defects: total, net charge
Close +/- pairs
Seam concentration
Pattern velocity: Nc, pattern-only
Transport claim: not admitted
Metric source: not admitted
```

Keep the badge operational and dense. Do not add hero text, explanatory banners, or speculative copy.

## Suggested Status Semantics

Use these semantics unless evidence later justifies different thresholds:

- `pass`: low defect density, low seam jump, no close-pair concentration.
- `review`: hard seams, close opposite-charge pairs, seam concentration, or superluminal pattern velocity.
- `fail`: defect density above hard threshold or tracker evidence that the strobe field is too unstable for a certified strobe-pattern claim.
- `unavailable`: missing schedule or invalid grid inputs.

Superluminal pattern velocity may add a reason code, but it must not be a hard-fail trigger by itself.

## Required Verification

Run:

```bash
npx vitest run tests/nhm2-phase-topology.spec.ts
npx vitest run tests/theory-checks.spec.ts tests/stress-energy-brick.spec.ts tests/york-time.spec.ts tests/gr-agent-loop.spec.ts tests/gr-agent-loop-baseline.spec.ts tests/gr-constraint-gate.spec.ts tests/gr-constraint-network.spec.ts tests/stress-energy-matter.spec.ts
npm run math:report
npm run math:validate
npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl --url <adapter-url>
```

If the adapter URL is unavailable, report that the Casimir verification gate was blocked before adapter checks and do not claim full verification.

## Delivery Standard

The final patch summary must distinguish:

- Implemented diagnostic behavior.
- What claims are supported by cited research.
- What claims remain explicitly not admitted.
- Which verification commands passed.
- Which verification commands were blocked and why.

