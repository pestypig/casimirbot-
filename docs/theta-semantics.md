Theta semantics (short)

Purpose
- Make the difference between the engine-facing canonical theta (linear duty) and the historical Natário "core" diagnostic (sqrt-duty) explicit for contributors.

Definitions
- theta (engine-facing, canonical): θ = γ_geo^3 · q · γ_VdB · duty_FR
  - Uses ship-wide Ford–Roman duty (duty_FR). Linear in duty.
  - Includes the visual/mass-split calibrated γ_VdB. Emitted by server `helix-core.ts` as `thetaScale`.
  - This value is authoritative for renderer/engine uniforms.

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

