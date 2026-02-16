# Natário Conical Panel Congruence Remediation Audit (latest available bundle set)

## One-line verdict
BLOCKED

## Severity ordered findings

### Blocking
1. **Geometry identities not strict-pass**
   - `primary.checks[name=gttResidual].status = WARN`
   - `primary.checks[name=thetaK].status = WARN`
   - `primary.checks[name=invariantAvailability].status = WARN`
   - Blocking reason: strict publication criteria require these to PASS.

2. **Strict provenance keys missing for strict claim**
   - `primary.checks[name=thetaDefinition].status = FAIL`
   - `primary.checks[name=kijSignConvention].status = FAIL`
   - `primary.checks[name=gammaFieldNaming].status = FAIL`
   - `primary.checks[name=provenanceMissingKeys].status = FAIL`
   - `primary.raw.strict.thetaDefinition = ""`
   - `primary.raw.strict.kijSignConvention = ""`
   - `primary.raw.strict.gammaFieldNaming = ""`
   - `primary.raw.strict.provenanceSchema = ""`

3. **Strict checker raw sample counts are still zero**
   - `primary.raw.samples.alphaCount = 0`
   - `primary.raw.samples.betaCount = 0`
   - `primary.raw.samples.gammaCount = 0`
   - `primary.raw.samples.thetaCount = 0`
   - `primary.raw.samples.kTraceCount = 0`
   - `primary.raw.samples.gttSampleCount = 0`
   - Earliest likely break in chain (provenance -> emitter -> checker sampling):
     - Provenance intent exists (`primary.raw.strict.sourceForAlpha/Beta/Theta/ClockRate = gr-brick`),
     - but checker sees no sampled truth arrays (`primary.raw.samples.* = 0`),
     - and `gr-evolve-brick.json` is **not available in provided artifacts**,
     - so the earliest likely missing stage is GR-brick payload capture/emission (`/api/helix/gr-evolve-brick?format=json&includeExtra=1&includeMatter=1&includeKij=1`) before checker input sampling.

4. **Mechanism traceability incomplete for strict causality claim**
   - Present: `values.duty_effective`, `values.duty_burst`, `values.sectors_live`, `values.sectors_total`.
   - Missing for strict lobe/phase lineage: explicit lobe/phase telemetry keys are **not available in provided artifacts**.
   - Missing artifacts for direct linkage are **not available in provided artifacts**:
     - `time-dilation-lattice-debug.json`
     - `time-dilation-activate-response.json`

5. **Bundle/seed parity cannot be validated end-to-end**
   - `config.bundlePath = docs/curvature-studies/2026-02-12-201141` (checker)
   - proofs file provided from `docs/curvature-studies/20260212T202140/pipeline-proofs.json` (different bundle directory)
   - `primary.metrics.renderingSeed = "n/a"`
   - `primary.raw.strict.renderingSeed = ""`
   - `training_trace_id = null`
   - `training-trace-export.jsonl` is **not available in provided artifacts**.

### Non-blocking
1. **Strict gate booleans and banner are internally consistent**
   - `strict.strictCongruence = true`
   - `strict.latticeMetricOnly = true`
   - `strict.anyProxy = false`
   - `strict.grCertified = true`
   - `strict.banner = "CERTIFIED"`
   - `gate.banner = "CERTIFIED"`

2. **Canonical routing metadata matches Natário strict expectations**
   - `primary.raw.strict.mode = "natario"`
   - `primary.raw.strict.chart = "comoving_cartesian"`
   - `primary.raw.strict.observer = "eulerian_n"`
   - `primary.raw.strict.normalization = "si_stress"`

### Informational
1. **Causality evidence classification is mixed**
   - Static checker snapshot (`curvature-congruence-report.json`) + cycle-averaged mechanism controls (`pipeline-proofs.json` duty/sectors).
   - Therefore output is **mixed**, not a single-mode causality proof stream.

## PASS/WARN/FAIL matrix (strict publication criteria)

| Area | Field path(s) | Status | Blocking |
|---|---|---|---|
| gttResidual | `primary.checks[name=gttResidual].status` | WARN | Yes |
| thetaK | `primary.checks[name=thetaK].status` | WARN | Yes |
| invariantAvailability | `primary.checks[name=invariantAvailability].status` | WARN | Yes |
| strict gate core | `strict.strictCongruence`, `strict.latticeMetricOnly`, `strict.anyProxy`, `strict.grCertified` | PASS | No |
| strict/gate banner | `strict.banner`, `gate.banner` | PASS | No |
| strict provenance required keys | `primary.checks[name=thetaDefinition|kijSignConvention|gammaFieldNaming|provenanceMissingKeys].status`; `primary.raw.strict.thetaDefinition/kijSignConvention/gammaFieldNaming/provenanceSchema` | FAIL | Yes |
| mechanism duty/burst/sectors | `values.duty_effective`, `values.duty_burst`, `values.sectors_live`, `values.sectors_total` | PASS | No |
| mechanism phase/lobe telemetry | explicit phase/lobe key paths | WARN (`not available in provided artifacts`) | Yes |
| run-id / seeding linkage | `primary.metrics.renderingSeed`, `primary.raw.strict.renderingSeed`, `training_trace_id`, cross-artifact bundle id parity | WARN | Yes |

## Ready for publication?
No. The run is blocked because strict geometry checks are WARN, strict provenance keys are FAIL, checker truth sampling is zero, and phase/lobe + seed/trace parity telemetry needed for strict mechanism causality is incomplete.

## Exact next action list

### MUST-FIX (publication blocking)
1. **Rebuild one single run bundle and keep all outputs in one directory.**
   - Target files: `time-dilation-diagnostics.json`, `curvature-congruence-report.json`, `pipeline-proofs.json`, `gr-evolve-brick.json`, `time-dilation-lattice-debug.json`, `time-dilation-activate-response.json`, `adapter-verification.json`, `training-trace-export.jsonl`.
   - Expected keys to align: bundle id, `renderingSeed`, `training_trace_id` (or equivalent trace/run id fields) across all files.

2. **Populate strict provenance schema keys used by checker hard requirements.**
   - Target file keys: `theta_definition`, `kij_sign_convention`, `gamma_field_naming`, `field_provenance_schema`.
   - Target artifacts: diagnostics + checker report should show PASS for these checks.

3. **Fix truth sampling path so strict arrays are non-empty at checker input.**
   - Collector/emitter route that should produce source payload: `/api/helix/gr-evolve-brick?format=json&includeExtra=1&includeMatter=1&includeKij=1`.
   - Expected key groups in `gr-evolve-brick.json`: truth arrays for `alpha`, `beta` (or components), `gamma`, `theta`, `Ktrace`, `g_tt` with non-zero sample lengths.
   - Expected checker deltas: `primary.raw.samples.*Count > 0` and `gttResidual/thetaK` move from WARN to PASS.

4. **Add explicit lobe/phase telemetry and bind it to metric/residual outputs.**
   - Missing keys: phase/lobe telemetry keys are **not available in provided artifacts**.
   - Collector routes expected to carry this: `/api/helix/pipeline/proofs` plus optional lattice debug capture.
   - Expected fields: phase id/phase fraction, lobe id/mask/envelope, and explicit reference linkage to residual summaries.

5. **Capture and store verifier + trace export in the same bundle.**
   - Collector routes: `POST /api/agi/adapter/run`, `GET /api/agi/training-trace/export`.
   - Expected artifact keys: `verdict`, `firstFail`, `deltas`, `certificate.certificateHash`, `certificate.integrityOk`, trace id linkage.

### OPTIONAL cleanup
1. Label visualization-only transforms as non-truth evidence in diagnostics metadata (`geomWarpScale`, `betaWarpWeight`, `metricBlend`, normalization blocks).
2. Split static-residual and cycle-averaged-residual reporting into separate named fields.

## Command-level next-step list (fresh run closure)
1. Start pipeline and capture a single new run id/seed.
2. Export diagnostics: `GET /api/helix/time-dilation/diagnostics` -> `time-dilation-diagnostics.json`.
3. Export proofs: `GET /api/helix/pipeline/proofs` -> `pipeline-proofs.json`.
4. Export GR brick: `GET /api/helix/gr-evolve-brick?format=json&includeExtra=1&includeMatter=1&includeKij=1` -> `gr-evolve-brick.json`.
5. Capture panel parity artifacts: lattice debug + activate response.
6. Run checker and write `curvature-congruence-report.json`.
7. Run adapter verify and save `adapter-verification.json`.
8. Export training trace JSONL and save `training-trace-export.jsonl`.
9. Re-evaluate strict matrix only after all files are from the same bundle id/seed.
