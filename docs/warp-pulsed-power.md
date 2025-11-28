# Warp Pulsed Power Design Note

> Hardware grounding for warp / coil-drive experiments: how we excite coils, limit risk, and tie it into the Helix pipeline.

## 1. Scope

This note covers **how** we generate high-current, precisely timed pulses for warp-relevant coils and panels, and **how** those choices plug into:

- `server/energy-pipeline.ts`
- `modules/warp/*`
- Live telemetry / drive guards

If your experiment uses:

- fast coils (MIDI/actuator, kA pulses)
- sector/array panels
- launcher / rail / staged HV shots

then you should be using one of the pulsed-power patterns here.

---

## 2. Load matrix (tie theory to our hardware)

Fill this table for each real load; this is what makes the doc non-academic. Planner should treat any TODO or blank as a block for firing.

| Load ID           | Location / module          | L (uH) | R (mOhm) | V_bus (V) | I_peak (A) | Pulse width (us/ms) | Rep rate (Hz) | Ripple allowed | Notes |
|-------------------|----------------------------|--------|----------|-----------|------------|---------------------|---------------|----------------|-------|
| midi_coil_12V_*   | `modules/warp/midi/*`      | TODO   | TODO     | 12        | TODO       | TODO                | TODO          | e.g. <5%       | Replace TODO with measured |
| sector_panel_A    | `modules/warp/panel/A`     | TODO   | TODO     | TODO      | TODO       | TODO                | TODO          | TODO           | Phase alignment target? |
| launcher_stage_1  | `modules/warp/launcher/*`  | TODO   | TODO     | TODO      | TODO       | TODO                | TODO          | TODO           | Stage number, dump path |

Rule of thumb: every time you add a coil or panel spec, add a row here and remove all TODOs before enabling a pipeline step that touches that hardware.

---

## 3. Design picks (what to actually use)

### 3.1 12 V MIDI coils / small actuators

**Goal:** crisp, repeatable pulses, high cycle count, minimal EMI drama.

**Recommended pattern**

- Energy store: supercap bank sized for N pulses at I_peak
- Topology: H-bridge (MOSFET / IGBT) with current-limited PFN
- Control: PWM or single-shot pulse from `energy-pipeline` step
- Protection:
  - TVS + SCR crowbar across each coil
  - RCD snubber per leg
  - Sense resistor + overcurrent cutout

**Helix gates (`midi_coil_pulse` in `energy-pipeline.ts`)**

- Telemetry channels present: `I_sense`, `V_bus`, and `coil_temp`, sampled > 50 kHz for kA pulses.
- Interlocks true: door/cover, coolant/air, dump path closed.
- Crowbar armed and dump resistor measured in-range before arming.
- Bus pre-charged within +/- 2% of target; ripple < 5% in last 100 ms before fire.
- If any check fails, the pipeline step must refuse to issue the pulse.

**Maps to repo**

- Control: `server/energy-pipeline.ts` -> `midi_coil_pulse` step
- Hardware config: `modules/warp/midi/*` + row in Section 2
- Planner grounding: this doc for switch/protection choices

---

### 3.2 Sector panels / warp arrays

**Goal:** many coils, phase-aligned, flat-top currents.

**Recommended pattern**

- Source: modular PFN or Blumlein per sector, Z0 near panel impedance
- Switching: triggered SCR or IGBT, fiber-isolated
- Sync: plan-driven triggers (one per sector) from Helix

**Helix gates (`panel_discharge` in `energy-pipeline.ts`)**

- Telemetry channels: `I_sector_*`, `V_bus`, `panel_temp` per sector; > 20 kHz during flat-top.
- Sync budget: sector-to-sector jitter < 500 ns referenced to Helix timing source; skew correction applied before arming.
- Triggers tested at reduced voltage for dv/dt immunity before full-power fire.
- Ripple/flat-top tolerance declared in Section 2; reject if measured droop > spec.
- Crowbar/dump paths verified per sector; manual reset procedure recorded if crowbar is latching.

**Maps to repo**

- Sector definition: `modules/warp/panel/*`
- Pipeline: `panel_discharge` step in `server/energy-pipeline.ts`
- Planner: uses this doc when it needs "flat-top, N us, I_peak" hardware guidance

---

### 3.3 Staged HV / launcher experiments

**Goal:** large energy, staged shots, safe abort path.

**Recommended pattern**

- Front-end: flywheel or compulsator to avoid brutal line draws
- Pulse shaping: PFN per stage, or Marx for high-voltage steps
- Protection:
  - mandatory dump path sized for full stored energy
  - interlocks on enclosure, speed, coolant, vacuum, etc.

**Helix gates (`launcher_stage_*` steps)**

- Telemetry: `I_stage_*`, `V_stage_*`, `vacuum`, `rpm` (if flywheel), `coolant_temp`.
- Abort: default to dump-on-fault within 100 ms unless stage demands faster; document timing here if different.
- Crowbar reset: note whether it auto-resets; if manual, require human clear/ack before re-arm.
- dv/dt immunity target: trigger chain qualified at 2x expected dv/dt at reduced voltage before first live shot.
- Stage-to-stage sync: jitter budget < 1 us; stage N+1 inhibited until stage N dump path is confirmed closed.

**Maps to repo**

- Topology metadata: `modules/warp/launcher/*`
- Control: `launcher_stage_*` pipeline steps
- Planner: this doc + launcher module specs as grounding

---

### 3.4 Telemetry and sampling (minimums)

- Current: Rogowski or Pearson per major loop, bandwidth > 5x highest harmonic of pulse edge; calibrate zero before each run.
- Voltage: HV probe for each PFN/stage node; bandwidth > edge rate; range above expected dump/clamp voltage.
- Naming: use the channel names above (`I_sense`, `V_bus`, `I_sector_*`, etc.) so `energy-pipeline` guards can subscribe without remap.
- Data quality: drop or refuse the step if any required channel is missing or stale (> 50 ms) at arm time.

---

## 4. Protection checklist (scoped to this hardware)

Before you energize any warp coil / panel:

1. **Dump resistor sizing**
   - For any L > L_min or SMES:
     - Ensure `E = 1/2 L I^2` can be safely turned into heat in the dump
     - Peak dump voltage < insulation spec + margin
2. **Crowbars**
   - SCR/thyristor or equivalent across:
     - Each PFN output
     - Sensitive bus segments
   - Note reset mode (auto vs manual) and enforce the matching clear behavior in the pipeline.
3. **Snubbers**
   - R-C or R-C-D on:
     - Each high-side switch leg
     - Transformer / PFN terminations
4. **Triggers**
   - Fiber-isolated where possible
   - dv/dt and common-mode tests run at reduced voltage first; record pass/fail before arming.
5. **Layout**
   - Low-inductance bus bars for kA paths
   - Single-point return for measurement and control grounds
6. **Instrumentation**
   - Current: Rogowski or Pearson per major loop
   - Voltage: HV probe for each PFN / stage node
7. **Interlocks**
   - Door / cover closed
   - Coolant / vacuum / overspeed OK
   - Dump path verified closed when required
8. **Pre-shot soak**
   - Reduced-voltage dv/dt soak on the trigger chain and switching stack before first full-power shot of the day.
9. **Post-shot dump confirmation**
   - Verify dump path actually absorbed expected energy (temp rise or coulomb count) and that crowbar/dump are ready for the next arm.

If any of these are false, the pipeline should not advance to a step that can energize that hardware.

---

## 5. How this integrates with Helix / AGI pipeline

### 5.1 Grounding for /plan

This file is part of the warp grounding set. When a plan asks for "warp_physics + implementation", the planner can use:

- Section 2: to understand allowed pulse envelopes for each coil/panel
- Sections 3-4: to pick safe source + protection patterns and required guards

### 5.2 Links to code

- `server/energy-pipeline.ts` - maps named steps to hardware operations
- `modules/warp/*` - defines which loads exist
- `docs/alcubierre-alignment.md`, `docs/qi-homogenization-addendum.md` - field theory backing

For details on where the planner discovers this doc, see `server/services/planner/grounding.ts` and `chat-b.ts`.
