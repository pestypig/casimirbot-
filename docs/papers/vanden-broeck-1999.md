---
id: vanden-broeck-1999
title: Van den Broeck Warp Pocket Compression
why_it_matters: Shrinks exotic-energy demand by compressing the ship’s interior volume, captured in γ_VdB multipliers.
used_by:
  - modules/dynamic/stress-energy-equations.ts:77
  - modules/warp/warp-module.ts:130
  - client/src/components/AlcubierrePanel.tsx:332
  - client/src/components/HelixCasimirAmplifier.tsx:118
key_results:
  - "The exterior warp bubble can enclose a subluminal pocket whose proper volume is reduced by γ_VdB ≫ 1."
  - "Mass/energy requirements scale with γ_VdB; higher compression trims energy at the cost of extreme curvature."
checklist:
  - [ ] Mapping between exterior radius and pocket radius documented and unit-tested.
  - [ ] Continuity across the pocket mouth verified in renderer (θ, T⁰⁰ smooth to within tolerance).
  - [ ] UI displays γ_VdB provenance and warns if requested value exceeds pipeline clamps.
equations:
  - name: Pocket radius relation
    ref: Eq.(2)
    notes: Guides the γ_VdB multiplier inside amplifier chain (γ_geo³·q·γ_VdB·duty).
citations:
  - "Van den Broeck, C. A ‘Warp Drive’ with More Reasonable Energy Requirements. Class. Quantum Grav. 16 (1999)."
---

# Summary (≤200 words)
Van den Broeck showed that by embedding an Alcubierre bubble inside a microscopic “pocket,” one can dramatically lower the total exotic energy needed. Our pipeline represents that compression with γ_VdB: a gain factor that multiplies the amplifier chain alongside γ_geo and q_spoil. γ_VdB determines how pocket area maps to exterior surface area and, in turn, how much negative energy the Casimir stages must deliver. Extreme γ_VdB values amplify curvature gradients, so we clamp the field and surface the current value prominently in the UI. The renderer and stress-energy helpers both rely on it to keep the geometry continuous.

# Engineering Notes
- `stress-energy-equations.ts` pulls γ_VdB into the amplification product before computing θ and T⁰⁰.
- `warp-module.ts` normalizes γ_VdB inputs so both server-provided and UI overrides stay within safe bounds.
- `HelixCasimirAmplifier` and `AlcubierrePanel` expose γ_VdB, making them ideal spots for a `TheoryBadge`.
