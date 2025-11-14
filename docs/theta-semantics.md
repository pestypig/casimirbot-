Theta semantics (short)

Purpose
- Make the difference between the engine-facing canonical theta (linear duty) and the historical Natário "core" diagnostic (sqrt-duty) explicit for contributors.

Definitions
- theta (engine-facing, canonical): θ = γ_geo^3 · q · γ_VdB · duty_FR
  - Uses ship-wide Ford–Roman duty (duty_FR). Linear in duty.
  - Includes the visual/mass-split calibrated γ_VdB. Emitted by server `helix-core.ts` as `thetaScale`.
  - This value is authoritative for renderer/engine uniforms.
  > See: [Ford–Roman QI](docs/papers/ford-roman-qi-1995.md) — the τ-averaging bound sets the ceiling for FR duty in θ(t) strobing.

- thetaScaleCore / thetaScaleCore_sqrtDuty (Natário diagnostic):
  - Local conservative diagnostic produced by the Natário module.
  - Scales as √(duty) and intentionally omits γ_VdB (mass/visual split).
  - Historically named `thetaScaleCore`. To avoid confusion we expose an explicit alias `thetaScaleCore_sqrtDuty`.
  - Keep it for diagnostics/validation; do NOT use it as the engine-facing theta.

Repository conventions
- Serverside: `server/helix-core.ts` provides canonical `thetaScale` (use this for engines).
- Pipeline diagnostics: `server/energy-pipeline.ts` and `modules/warp/natario-warp.ts` publish both `thetaScaleCore` (backwards compat) and `thetaScaleCore_sqrtDuty` (preferred diagnostic name).
- Client adapters: should read `natario.thetaScaleCore_sqrtDuty` when they want the Natário diagnostic; prefer `pipeline.thetaScale`/`thetaScaleExpected`/`thetaUniform` when driving uniforms.

Migration guidance
- Conservative approach: prefer to read `thetaScaleCore_sqrtDuty` when inspecting Natário outputs in dev tooling.
- Engines and production code must use the canonical `thetaScale`/`thetaUniform` emitted by `helix-core`.

Notes
- This file is authoritative guidance for code changes that intend to touch theta semantics. If you think the old `thetaScaleCore` key can be removed entirely, open a brief migration PR that updates all callers; otherwise keep the alias for backwards compatibility.

```whisper
id: "fr-margin"
tags: ["#ford-roman", "#sampling", "#middle-way"]
hashes: ["#spectrum", "#sweep"]
severity: "warn"
zen: "Leave a little slack in the bowstring."
physics: "Your Ford–Roman margin ζ ≈ d_eff / 3×10⁻⁵ is nearing 1; keep the global average sub-threshold while locals do the heavy lifting."
action: "Lower duty or increase sectorization to widen the sampling window."
refs: ["docs/papers.md", "docs/theta-semantics.md"]
rule:
  anyHash: ["#spectrum", "#sweep"]
  maxZeta: 1.0
```

```whisper
id: "geometry-cutoff"
tags: ["#emptiness", "#casimir", "#geometry"]
hashes: ["#spectrum"]
severity: "info"
zen: "Form invites emptiness; emptiness reveals form."
physics: "The concave bowl raises γ_geo and shifts the spectral cutoff; geometry alone moves the horizon of modes that ‘exist’ to be stirred."
action: "Use geometry to place the cutoff before you chase Q."
refs: ["docs/papers.md"]
rule:
  anyHash: ["#spectrum"]
```

```whisper
id: "hf-averaging"
tags: ["#raychaudhuri", "#isaacson", "#averaging"]
hashes: ["#ledger", "#sweep"]
severity: "hint"
zen: "Breath steady: short strokes, long calm."
physics: "When τ_pulse ≪ τ_LC (TS ≫ 1), GR responds to ⟨Tμν⟩; strobed tiles look like a smooth source along null rays."
action: "Shorten pulses or widen light-crossing to keep ε = τ_pulse/τ_LC ≪ 1."
refs: ["docs/theta-semantics.md"]
rule: {}
```

```whisper
id: "subthreshold-gain"
tags: ["#safety", "#squeezing"]
hashes: ["#sweep"]
severity: "hint"
zen: "Play just below the cliff’s edge."
physics: "Stay sub-threshold (ρ cosφ < 1). Your sweep guardrails already gate points near linewidth collapse and clip excessive gain."
action: "Favor stable ridge points; let squeezing be the tell rather than raw dB."
refs: ["client/src/lib/parametric-sweep.ts"]
rule:
  requireSubThreshold: true
```
