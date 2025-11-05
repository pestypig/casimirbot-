---
id: ford-roman-qi-1995
title: Ford–Roman Quantum Inequality (QI)
why_it_matters: Caps how long negative energy can stay concentrated; drives FR duty ceilings and scheduler spacing.
used_by:
  - server/energy-pipeline.ts:1466
  - client/src/hooks/use-energy-pipeline.ts:84
  - modules/dynamic/dynamic-casimir.ts:429
  - client/src/components/MarginHunterPanel.tsx:306
key_results:
  - "For any smooth sampling function f(τ) of width τ, ⟨ρ⟩_τ ≥ -K/(τ⁴) (Planck units) along timelike worldlines."
  - "Duty-cycle bound: average negative energy collapses sharply as τ grows; long bursts violate the inequality."
checklist:
  - [ ] FR duty emitted by pipeline stays ≤ QI ceiling for the selected sampling width.
  - [ ] Sampling function (Lorentzian vs Gaussian) logged in `docs/papers/ford-roman-qi-1995.md`.
  - [ ] Vitest guard confirms FR duty clamp triggers before violating τ (see `tests/helix-plan.spec.ts`).
equations:
  - name: Lorentzian-sampled QI
    ref: Eq.(1)
    notes: Used to derive `dutyEffectiveFR` clamp in energy pipeline.
citations:
  - "Ford, L.H.; Roman, T.A. Restrictions on negative energy density in flat spacetime. Phys. Rev. D 51 (1995)."
---

# Summary (≤200 words)
Ford and Roman show that time-averaged energy density seen by any observer is bounded below by a term ∝ -1/τ⁴, where τ is the characteristic width of the sampling function. Our FR duty field is the engineering translation: it ensures that negative-energy “on” windows stay brief and sparse enough for the inequality to hold. If we run bursts for too long (or stack sectors without spacing), the time-averaged density dips past the QI bound. The pipeline therefore publishes a maximum duty and the UI highlights the live margin so operators can see when tighter scheduling is required.

# Engineering Notes
- `server/energy-pipeline.ts` clamps `dutyEffectiveFR` before emitting state; the clamp constant encodes K(τ) from the paper.
- `MarginHunterPanel` surfaces the live versus max FR duty so an operator sees approaching violations.
- `use-energy-pipeline` keeps a canonical FR duty so dependent panels only consume one source of truth.
