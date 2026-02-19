# Time Dilation Curvature Visualization

## Scope

This document defines the canonical Nat�rio runtime alignment contract for the Time Dilation Lattice panel, with explicit separation of:

- **Truth**: metrics derived from GR brick fields.
- **Visual-only**: rendering choices (normalization, colormap, caps, weights).

Use this as the canonical reference for curvature-congruence research rounds.

## 1) Canonical viewer contract (MUST for strict mode)

A run is admissible for strict Nat�rio analysis only when all conditions are true:

- `diagnostics.strict.strictCongruence == true`
- `diagnostics.strict.latticeMetricOnly == true`
- `diagnostics.strict.anyProxy == false`
- `diagnostics.strict.grCertified == true`
- `diagnostics.gate.banner == "CERTIFIED"`
- `diagnostics.render_plan.mode == "natario"`
- `diagnostics.render_plan.chart == "comoving_cartesian"`
- `diagnostics.render_plan.observer == "eulerian_n"`
- `diagnostics.render_plan.normalization == "si_stress"`
- `diagnostics.render_plan.thetaWarpWeight == 0`
- `diagnostics.render_plan.sourceForAlpha == "gr-brick"`
- `diagnostics.render_plan.sourceForBeta == "gr-brick"`
- `diagnostics.render_plan.sourceForTheta == "gr-brick"`
- `diagnostics.render_plan.sourceForClockRate == "gr-brick"`

If any item fails, treat panel output as non-admissible for canonical comparison.

If present, prefer nested payload locations first:

- `diagnostics.payload.strict`
- `diagnostics.payload.gate`
- `diagnostics.payload.render_plan`

## 2) Primary references for all claims (keep and cite)

```text
Alcubierre (1994/2000), ADM split + line element
https://arxiv.org/pdf/gr-qc/0009013

Gourgoulhon (3+1 formalism)
https://arxiv.org/pdf/gr-qc/0703035

Baumgarte & Shapiro (1998), BSSN conformal split
https://arxiv.org/pdf/gr-qc/9810065

Nat�rio (2002), Nat�rio warp construction
https://arxiv.org/pdf/gr-qc/0110086

Van Den Broeck (1999), two-shape warp metric
https://arxiv.org/pdf/gr-qc/9905084
```

## 3) Exact math-to-runtime mapping

### 3.1 Equations and observer/chart assumptions

1. **ADM split / g_tt reconstruction**

   - `ds^2 = -(alpha^2 - beta_i beta^i) dt^2 + 2 beta_i dx^i dt + gamma_ij dx^i dx^j`
   - `g_tt = -alpha^2 + gamma_phys_ij * beta^i beta^j`
   - Use **physical** `gamma_phys_ij` (not conformal `tilde_gamma_ij`) in reconstructions.

2. **BSSN conformal map (if variables are BSSN)**

   - `gamma_phys_ij = exp(4 phi) * tilde_gamma_ij`

3. **Expansion / trace relation (Eulerian normal congruence)**

   - Canonical contract requires theta definition to be explicit.
   - For strict comparison: `theta_metric` should equal `-Ktrace` under the runtime sign convention.

4. **Clocking semantics**

   - Eulerian: `dTau/dt = alpha`
   - Coordinate-stationary grid: `dTau/dt = sqrt(-g_tt)` only where `g_tt < 0`.

### 3.2 Required provenance tags (payload-facing)

Add or preserve per-field provenance so claims can be proven, not inferred:

- `fieldProvenance[channel] = { source, observer, chart, units, definitionId, derivedFrom }`
- `theta_definition` (example `"-Ktrace_eulerian"`)
- `kij_sign_convention` (example `"K_ij = -(1/2N) L_n gamma_ij"`)
- `gamma_field_naming` (`gamma_phys_ij` OR `phi + tilde_gamma_ij`)
- `curvature_definitions` with explicit 4D/3D dimensionality and formula IDs
- `proofPack`/`fieldProvenance` entries for every channel used in truth reconstruction.

### 3.3 Truth vs VISUAL-ONLY

Treat as **VISUAL-ONLY** only when explicitly labeled:

- normalization/scale targets
- log/percentile mappings
- warp/softening/breath/phi scales
- renderer mode and lookup table choices
- any theta displacement (`thetaWarpWeight`) in strict mode

### 3.4 Enforceable channel mapping

| Channel | Contracted truth source | Strict requirement |
| --- | --- | --- |
| Lapse (`alpha`) | gr-brick | sourced from gr-brick; no proxy in strict |
| Shift (`beta`) | gr-brick | sourced from gr-brick; contravariant/covariant convention declared |
| Physical metric (`gamma_phys_ij`) | gr-brick | explicit `gamma_phys_ij` OR `phi + tilde_gamma_ij` |
| Extrinsic curvature (`Kij`, `Ktrace`) | gr-brick | includes `kij_sign_convention` |
| Theta | gr-brick | diagnostic-only in strict; `thetaWarpWeight == 0` |
| Curvature invariants (`kretschmann`, `ricciSq`, `weylSq`) | gr-brick | explicit formula + 4D/3D tag |
| Clock rate | gr-brick | observer label shown (`eulerian` vs `coordinate-stationary`) |

## 4) Runtime comparison protocol (v2)

### 4.1 Reproducible capture

```bash
BASE="http://127.0.0.1:5000"
TS=$(date +%Y%m%dT%H%M%S)
OUT="docs/curvature-studies/$TS"
mkdir -p "$OUT"

curl -sS "$BASE/api/helix/time-dilation/diagnostics" > "$OUT/time-dilation-diagnostics.json"
curl -sS "$BASE/api/helix/pipeline/proofs" > "$OUT/pipeline-proofs.json"
curl -sS "$BASE/api/helix/gr-evolve-brick?format=json&includeExtra=1&includeMatter=1&includeKij=1" > "$OUT/gr-evolve-brick.json"
curl -sS "$BASE/api/helix/gr-evolve-brick?format=json&includeExtra=1&includeMatter=1&includeKij=1&includeCurvature=1" > "$OUT/gr-evolve-brick-curvature.json" || true
```

### 4.2 PASS/WARN/FAIL gate (required)

**FAIL** if any is false:

- `strictCongruence`, `latticeMetricOnly`, `grCertified`
- `anyProxy == false`
- `gate.banner == CERTIFIED`
- `mode == natario`
- `thetaWarpWeight == 0`
- source fields for alpha/beta/theta/clock rate are `gr-brick`

### 4.3 Scalar identity checks

1. **g_tt identity**

- expected `g_tt = -alpha^2 + gamma_phys_ij * beta^i beta^j`
- `rel_resid = max|g_tt_expected - g_tt_sampled| / (p98(|g_tt_expected|)+eps)`
- PASS <= `1e-4`, WARN `1e-4..1e-2`, FAIL > `1e-2`

2. **theta-K identity**

- `rel_resid = max|theta + Ktrace| / (p98(|Ktrace|)+eps)`
- PASS <= `1e-6`, WARN `1e-6..1e-3`, FAIL > `1e-3`

3. **Timelike coverage for grid clock mode**

- `timelike_frac = mean(g_tt < 0)`
- WARN if `< 0.95`
- FAIL only if unmasked invalid use of `sqrt(-g_tt)` where `g_tt >= 0`

### 4.4 Curvature shape checks (research recommendations)

For each invariant channel available:

- Spearman rank correlation (shape similarity)
- Jaccard overlap at p ? {90,95,99}
- contour-axis drift checks on hull-normal slice/range

Suggested thresholds:

- repeated run: Spearman = 0.995 and Jaccard(p95) = 0.90
- small perturbation: warn if Spearman < 0.95 or Jaccard(p95) < 0.50

### 4.5 Rendering-only invariance test

Run a second rendering pass changing only visual knobs. Truth arrays must remain unchanged (within float noise).

```bash
node scripts/curvature-congruence-check.ts --bundle "docs/curvature-studies/BASELINE" --compare "docs/curvature-studies/RENDER_PASS" --out "artifacts/curvature-congruence-render.json"
```

The check fails if sampled truth-channel hashes differ between bundles for the same run inputs.

## 5) Acceptance criteria

### PASS

- Canonical gate true
- `thetaWarpWeight == 0`
- theta+K and g_tt residuals inside PASS bounds
- at least one curvature invariant present and sourced from `gr-brick`
- required provenance fields present:
  - `theta_definition`
  - `kij_sign_convention`
  - explicit gamma naming (`gamma_phys_ij` or `phi + tilde_gamma_ij`)

### WARN

- missing optional invariant (`weylSq`)
- coordinate-stationary timelike coverage `< 0.95`

### FAIL

- any proxy in strict mode
- theta displacement enabled (`thetaWarpWeight > 0`) in strict Nat�rio
- any truth-layer metric channel sourced from proxy
- missing physical gamma inputs when computing g_tt

## 6) Prompt to send to GPT Pro (copy/paste)

```text
You are auditing a Time Dilation Lattice/curvature implementation for Nat�rio canonical alignment.

Goal:
- verify strict gating and per-field provenance
- validate metric-truth math against runtime payloads
- identify any visual-only knobs being confused as physical claims

Inputs to analyze:
- diagnostics.json
- pipeline-proofs.json
- gr-evolve-brick.json
- rendered output notes (if available)

Do this:
1) Verify strict gate and source chain:
   - gate.banner==CERTIFIED, strictCongruence, latticeMetricOnly, grCertified, anyProxy==false
   - render_plan.mode/comoving_cartesian/eulerian_n/si_stress
   - sourceForAlpha/Beta/Theta/ClockRate are gr-brick
2) Compute/verify equations from primary sources:
   - g_tt = -alpha^2 + gamma_phys_ij beta^i beta^j
   - theta relation under declared convention (expected theta == -Ktrace in strict Nat�rio)
   - clocking semantics: alpha-clock vs sqrt(-g_tt) with g_tt<0 coverage
3) Run threshold checks:
   - g_tt residual (PASS<=1e-4, WARN<=1e-2)
   - theta+K residual (PASS<=1e-6, WARN<=1e-3)
   - timelike_frac and whether non-timelike masking is applied
4) Flag any mismatch:
   - gamma naming (conformal vs physical)
   - theta_definition and kij_sign_convention
   - curvature invariant definition and dimensionality (3D/4D)
   - rendering-only changes modifying raw truth arrays
5) Validate provenance:
   - `fieldProvenance` present for channels used in truth reconstruction
   - explicit `definitionId` and chart/observer tags

Primary equations to cite:
- Alcubierre (gr-qc/0009013)
- Gourgoulhon (gr-qc/0703035)
- Baumgarte & Shapiro (gr-qc/9810065)
- Nat�rio (gr-qc/0110086)

Return a PASS/WARN/FAIL matrix, exact mismatches, and concrete remediations for strict canonical mode.
```

## 7) Known limitations / next data fields needed

To complete research-grade congruence, payloads should expose:

- `theta_definition`
- explicit `kij_sign_convention`
- explicit `gamma_phys_ij` or (`phi` + `tilde_gamma_ij`)
- explicit invariant naming and formula IDs: `kretschmann`, `ricciSq`, `ricciScalar4`, `weylSq`
- per-field provenance object for every displayed runtime scalar
- `renderingProbe` and `renderingSeed` used for reproducible visual diff

## 8) Runtime payload map used by checker

Use these locations when collecting fields for automation:

- Strict/admission controls:
  - `diagnostics.payload.strict.*` and `diagnostics.payload.gate.*` if nested
  - fallback to top-level `diagnostics.strict.*` and `diagnostics.gate.*`
- Render plan:
  - `diagnostics.payload.render_plan.*` fallback to `diagnostics.render_plan.*`
- Definitions:
  - `diagnostics.payload.theta_definition`
  - `diagnostics.payload.kij_sign_convention`
  - `diagnostics.payload.curvature_definitions`
  - `diagnostics.payload.fieldProvenance`
- GR brick fields:
  - `alpha`, `beta`, `beta_i`, `beta_u`, `beta^i`
  - `gamma_phys_ij` or (`phi` + `tilde_gamma_ij`)
  - `Ktrace`, `Kij`, `theta`, optional `g_tt`
  - invariants: `kretschmann`, `riemannSq`, `ricciSq`, `ricciScalar4`, `weylSq`


## 8) Diagnostics route payload envelope (implementation note)

Current Helix route behavior for diagnostics:

- `GET /api/helix/time-dilation/diagnostics` returns an envelope with `ok`, `status`, `updatedAt`, `source`, `renderingSeed`, `seedStatus`, `reason`, and `payload`.
- `GET /api/helix/time-dilation/diagnostics?raw=1` currently returns the same envelope shape.
- `POST /api/helix/time-dilation/diagnostics` persists caller payload into `payload` and marks status `ready`.

When validating claim-bearing fields, read from `payload.<key>` first (for example `payload.observables`, `payload.strict`, `payload.gate`, `payload.natarioCanonical`).

## 9) Claim discipline quick block

**What we can claim**
- Diagnostic congruence-tagged observables when provenance and strict state are present in payload.
- Reduced-order redshift only when status is `computed`, and only with limitations/confidence attached.
- Natario check outcomes only as explicit `natarioCanonical` pass/fail fields.

**What we cannot claim**
- Physical viability/admissibility from diagnostics payload alone.
- Certified viability when HARD constraints, `ADMISSIBLE`, and certificate integrity/hash are missing or failed.
- Physical redshift when payload is `proxy` or `unavailable`.
