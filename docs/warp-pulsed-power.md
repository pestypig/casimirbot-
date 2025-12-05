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
| midi_coil_12V_*   | `modules/warp/midi/*`      | 10 (bench) | <=0.1 (SC path) | 31_623 (31.6 kV step) | 31_623 (~31.6 kA) | 10 us (Blumlein) | 1000 (policy cadence) | <=5% | 5 kJ burst; worksheet row (E=5 kJ, L=10 uH, t_rise=10 us) -> iPeakMaxMidi_A cap ~32 kA. Bracket: 14.1 kA @ 50 uH if the coil L comes in high. |
| sector_panel_A    | `modules/warp/panel/A`     | 1 (tile bank straps) | <=0.05 (SC strap) | 31_623 (31.6 kV step) | 31_623 (~31.6 kA) | 1 us (Blumlein) | 1000 (policy cadence) | flat-top <= droop spec | 0.5 kJ per active sector; worksheet row (E=0.5 kJ, L=1 uH, t_rise=1 us); mirrors into iPeakMaxSector_A=32 kA. |
| launcher_stage_1  | `modules/warp/launcher/*`  | 100 (bench) | <=0.1 (SC path) | 70_711 (70.7 kV step) | 14_142 (~14.1 kA) | 20 us (Blumlein) | <=10 (stage) | <=5% if flat-top | 10 kJ stage burst; worksheet row (E=10 kJ, L=100 uH, t_rise=20 us); cap iPeakMaxLauncher_A=15 kA; stage-specific exemptions only. |

Rule of thumb: every time you add a coil or panel spec, add a row here and remove all TODOs before enabling a pipeline step that touches that hardware.

---

### 2.1 Electrical anchors (keep the repo's guardrails)

- Ship average power (P_avg) is fixed at 83.3 MW (hover/taxi/near-zero/cruise); emergency can raise it but treat 83.3 MW as the budgeting baseline.
- Sectorization: 400 sectors, one live at a time -> d_eff = 0.01 / 400 = 2.5e-5 (Ford-Roman ship-wide duty). Green-zone check: d_eff <= 3e-5 and Q_L in [5e8, 1e9].
- Burst ledger from those two: P_inst ~= P_avg / d_local ~= 8.33 GW, and with a 10 us ON window that is ~83 kJ per live sector. Split across M parallel sticks and a measured L_ch to get the current per stick: I_peak,ch = sqrt(2*(83 kJ / M) / L_ch); that is the kA knob you size before swapping in the bench L.
- Power-energy-Q relation: P_avg = |U_Q| * omega / Q * N_tiles * d_eff. Use this in reverse to size how much energy a sector can spend per burst without violating P_avg or d_eff.
- Keep Q spoil and duty fields in lock-step with the pipeline; UI shows the live d_eff and provenance already.

### 2.2 Amp sizing worksheet (per pulsed load)

1. Pick sector cadence (burst/dwell) and confirm d_eff = burstLocal * S_live / S_total.
2. Energy per pulse: U_pulse = (P_avg / f_sector) * (d_eff / eta_path). Include PFN->coupler->load efficiency (eta_path).
3. Stored-energy current: I_peak = sqrt(2 * U_pulse / L) using measured L (include leads).
4. Slew voltage: V_bus ~ L * dI/dt with dI/dt ~ I_peak / t_r. Add margin for stray L and coupling.
5. Superconductor limits: J = I_peak / A_sc with J/J_c(T,B) <= 0.5; check peak surface field B_pk against material limits.
6. Enforce in software: add per-load ceilings (`iPeakMaxMidi_A`, `iPeakMaxSector_A`, `iPeakMaxLauncher_A`), instrument I_sense/V_bus/temps, and refuse any command that would exceed limits (include `load` + `i_peak_A` in pulse requests so guards can trip).

> If you override d_eff in the UI, reuse the same fields the pipeline uses (dutyEffectiveFR) when you recompute U_pulse.

### 2.3 Bench numbers (replace the TBDs above)

For each load, record:
- L (uH), R (mOhm), U_pulse (J), t_r (us/ms), V_bus (V), I_peak (A)
- J/Jc at peak (<= 0.5 target) and B_pk vs material limit
- Rep rate (Hz) and ripple spec (keep sector-tied loads at 1 kHz cadence unless hardware dictates otherwise)

Update the table cells (replace `TBD_bench`) with measured values and mirror the ceiling into `iPeakMax_*` in the pipeline. After you set the ceilings, include the corresponding load + `i_peak_A` in any pulse request so the guardrails can reject over-limit commands.

### 2.4 CLI helper (keeps P_avg/Q/d_eff in view)

- Use `tools/pulsed-power-calculator.ts` to compute I_peak, V_bus, and J margins quickly:
  - `npx tsx tools/pulsed-power-calculator.ts --label midi --L-uH 0.5 --U 25 --tr-us 20 --area-mm2 40 --jc 2e9`
  - `npx tsx tools/pulsed-power-calculator.ts --label sector --L-nH 50 --U 5 --tr-us 1 --eta 0.85`
  - `npx tsx tools/pulsed-power-calculator.ts --label launcher --L-uH 2 --U 200 --tr-us 100 --area-mm2 120 --jc 1.4e9 --json`
- For the Needle Hull Mk.1 fast-coil sweep (10 us window, 83.3 MW baseline), generate the I_peak worksheet CSV and bus-current table: `npx tsx tools/needle-ipeak-worksheet.ts` (outputs to `data/needle_Ipeak_worksheet.csv` and `data/needle_bus_current_examples.csv`; overwrite the E_kJ/L_uH columns with measured values when you have them).
- Need quick bracket rows for MIDI/panel/launcher without editing the whole grid? Run `python tools/needle_ipeak_candidates.py` (writes to `data/needle_Ipeak_candidates.csv` + `/mnt/data/needle_Ipeak_candidates.csv`; bus snapshot lands in `data/needle_bus_current_candidates.csv`).
- After you have measured L/E/t_r/di/dt/V_max and conductor geometry, fill the worksheet with the same logic as the UI: `python tools/needle_ipeak_fill.py` (defaults to `data/needle_Ipeak_template.csv`, writes to `data/needle_Ipeak_filled.csv` and `/mnt/data/needle_Ipeak_filled.csv`). Add `-o my_out.csv` to direct output elsewhere. The filled file includes `I_peak`, `V_required`, `J/Jc`, and a `needs` column listing any missing inputs; quick text check: `python tools/needle_ipeak_preview.py --csv data/needle_Ipeak_filled.csv --no-plot`.
- Defaults: P_avg = 83.3 MW, d_eff = 2.5e-5, sector cadence = 1 kHz, eta_path = 1. Override with flags if your cadence or efficiency differs.

### 2.5 Superconductor & cavity refresher (what the amps mean here)

- **Zero DC resistance, not zero everything.** Below critical temperature/field, current flows via Cooper pairs; DC has essentially zero resistive drop, so the only voltage across a coil is the inductive term (L * dI/dt). At RF/AC there is still a tiny surface resistance (BCS + residual), so there are finite (but low) losses. If you exceed T_c, B_c, or J_c you trigger a normal zone (quench).

- **Current-density limits still bind:** superconductors have a critical current density J_c(T,B) set by pair-breaking/flux pinning. Practical rule for the fast hardware is to keep J <= 0.5 * J_c in steady portions of the pulse, with transient headroom.

- **Reactance is the knob you drive:** coils and cavities are inductive (and at RF also capacitive). Stored energy is U = 1/2 * L * I^2. In SRF-like resonators, currents are surface currents that scale with field; Q keeps ohmic loss tiny, but peak surface B must stay below the material limit. The code paths assume Q_0 ~ 10^9 as a materials-limited baseline and take the actual cavity Q from that unless you spoil it; the panel also shows the sector math (duty, sectors) explicitly.

- **Why the cycle-average is legitimate:** the drive is designed so the strobes are much shorter than the wall light-crossing time, so the metric sees the cycle-averaged stress-energy; the green-zone solver keeps us in that regime.

### 2.6 Worked examples (overwrite on first bench test)

> These are illustrative brackets to size instrumentation; replace with measured L/U/t_r once characterized.

| Load (example)          | Assumed L | Target rise (t_r) | Example (U_pulse) | (I_peak = sqrt(2U/L)) | (V ~ L * I / t_r) | Notes |
| ----------------------- | --------: | ----------------: | ----------------: | --------------------: | ----------------: | ----- |
| MIDI coil (shaping)     | 0.5 uH    | 20 us             | 25 J              | ~10 kA                | ~250 V            | Typical small shaping coil; cross-section sized for J <= 0.5 J_c. |
| Sector PFN -> panel bus | 50 nH     | 1 us              | 5 J               | ~14 kA                | ~700 V            | Low-L straps; flat-top via Blumlein. |
| Launcher coil (slow)    | 2 uH      | 100 us            | 200 J             | ~14 kA                | ~280 V            | Bigger energy, gentler dI/dt. |

Use the pipeline formula P_avg = |U_Q| * omega / Q * N_tiles * d_eff to check energy budgets. Smaller L -> higher I_peak for the same energy; shorter t_r -> higher bus voltage.

### 2.7 Starter pulsed-power rows (replace with bench measurements)

These mirror the worksheet in `data/needle_Ipeak_recommended_with_J.csv` and are ready to drop into limits/UI. "Flat" = Blumlein step (triangular current), "half-sine" = PFN discharge.

| Load                         | E_burst (kJ) | L_total (uH) | t_rise (us) | I_peak (kA) | dI/dt (kA/us, flat) | V_blumlein (kV, flat) | V0_PFN (kV, half-sine) | C_PFN (uF) |
|-----------------------------|--------------:|-------------:|------------:|------------:|--------------------:|----------------------:|------------------------:|-----------:|
| MIDI coil (conservative)    |          5.00 |        50.00 |       10.00 |     14.142  |               1.414 |               70.711 |                 222.144 |     0.2026 |
| MIDI coil (aggressive)      |          5.00 |        10.00 |       10.00 |     31.623  |               3.162 |               31.623 |                  99.346 |     1.0132 |
| MIDI coil (high energy)     |         10.00 |        20.00 |       10.00 |     31.623  |               3.162 |               63.246 |                 198.692 |     0.5066 |
| Sector panel PFN (tile bank)|          0.50 |         1.00 |        1.00 |     31.623  |              31.623 |               31.623 |                  99.346 |     0.1013 |
| Launcher (LF)               |         10.00 |       100.00 |       20.00 |     14.142  |               0.707 |               70.711 |                 222.144 |     0.4053 |

Notes:
- Replace E_burst and L_total with bench values; recompute I_peak, dI/dt, and voltages with the same formulas (I_peak = sqrt(2E/L); V_flat = L * I_peak / t_rise; V0_PFN ~= pi * V_flat; E ~= 0.5 * C * V0^2).
- Engineering conductor areas at 300/500/1000 A/mm^2 are in `data/needle_Ipeak_recommended_with_J.csv`; pick a J_e cap, size A_eng = I_peak / J_e, then confirm J/J_c(B, T) <= 0.5 with your magnet model.
- These rows set the planning guardrails: `iPeakMaxMidi_A` = 32 kA, `iPeakMaxSector_A` = 32 kA, `iPeakMaxLauncher_A` = 15 kA until superseded by measured numbers.

Average charger draw at P_avg = 83.3 MW (bus sees this, PFN sees the peak):

| V_bus (kV) | I_bus,avg (A) |
|-----------:|--------------:|
|       40.0 |       2,082.5 |
|       20.0 |       4,165.0 |
|       10.0 |       8,330.0 |
|        5.0 |      16,660.0 |

### 2.8 What to put in this doc (to unblock Helix)

1. Fill the I_peak (A) cells with bench-measured values for MIDI coils, sector panel PFN, and launcher after you determine L, U_pulse, and t_r using the worksheet above.
2. Record margins alongside each row: J/J_c, B_pk/B_crit, V_bus, and the abort thresholds you will enforce.
3. Mirror those limits into the pipeline state (`iPeakMaxMidi_A`, `iPeakMaxSector_A`, `iPeakMaxLauncher_A`) so commands that would exceed them are rejected before firing. Keep the UI in sync by emitting the limit fields with the existing duty/sector payload, and include `load` + `i_peak_A` in pulse requests so the guard can trip early.
4. Name hygiene: the pipeline now surfaces `ampFactors` (gamma_geo, gamma_VdB, qSpoilingFactor, qMechanical, qCavity); `amps` is a back-compat alias only so it does not collide with the real current ceilings above.

### 2.9 Filled worksheet snapshot (amps, voltages, guardrails)

Great -- you already have the right picture. This ties the numbers together and calls out what each column means, how the superconducting pieces behave, and what to guard-rail in hardware and software.

#### 1) "How many amps do we use?"

**At the loads (10 us triangular ramp unless noted):**

| Load (provisional)              | (E)-(L) path | (I_{pk}) | (t_{rise}) | (dI/dt) | (V_{req} = L * dI/dt) | Headroom vs (V_{max}) | (I_{rms}) (triangular) |
| ------------------------------- | -----------: | -------: | ---------: | ------: | --------------------: | --------------------: | ---------------------: |
| MIDI coil (conservative, 50 uH) |   from (E,L) | 14.142 kA |       10 us | 1.414e9 A/s | 70.71 kV | 80 kV -> ~13% | 8.165 kA |
| MIDI coil (aggressive, 10 uH)   |   from (E,L) | 31.623 kA |       10 us | 3.162e9 A/s | 31.62 kV | 40 kV -> ~26% | 18.257 kA |
| MIDI coil (high energy, 20 uH)  |   from (E,L) | 31.623 kA |       10 us | 3.162e9 A/s | 63.25 kV | 70 kV -> ~11% | 18.257 kA |
| Sector panel PFN (1 uH)         |   from (E,L) | 31.623 kA |        1 us | 3.162e10 A/s | 31.62 kV | 36 kV -> ~14% | 18.257 kA |
| Launcher (LF, 100 uH)           |   from (E,L) | 14.142 kA |       20 us | 7.071e8 A/s | 70.71 kV | 80 kV -> ~13% | 8.165 kA |

- Where the peaks came from: (I_{pk} = sqrt(2E/L)) (worksheet logic).
- Why those voltages: with superconductors, resistance ~ 0 at DC, so the required step is inductive: (V = L * dI/dt). We set dI/dt ~ I_{pk} / t_{rise} for a linear ramp.
- Why the RMS shown: for a triangular burst, (I_{rms} ~ I_{pk} / sqrt(3)).

**On the DC bus (average):** at the fixed drive average power (P_{avg} = 83.3 MW), the bus current scales with bus voltage

I_{bus,avg} = P_{avg} / V_{bus}

so ~8.33 kA @ 10 kV, ~4.17 kA @ 20 kV, ~2.08 kA @ 40 kV. Picking 20-40 kV keeps continuous current in the 2-4 kA class while local loads still see tens of kA pulses via the PFN/Blumlein steps above.

#### 2) What each filled-sheet column means (using the provisional rows)

- Method = "E & L": the row was solved from stored energy and inductance: (I_{pk} = sqrt(2E/L)). This is more stable than guessing current first.
- (V_{req}): the minimum step required by physics to hit the chosen ramp: (V = L * dI/dt). The headroom check vs (V_{max}) (for example, 70.71 kV vs 80 kV) shows ~10-27% margin. Keep >= 10% after including stray L in leads/bus.
- (dI/dt): the slew your switch + PFN must deliver. Note how the panel bank (1 uH, 1 us) needs (3.16e10 A/s) -- that is where low-inductance buswork and clean layouts really matter.
- (J) (engineering current density): computed as (J_{pk} = I_{pk} / (n_{parallel} * area_mm2)). The examples land around 442-494 A/mm^2. Compare to vendor (J_c(B, T)) curves; plan to run with 30-50% margin (keep J_{pk} <= 0.5 * J_c at the worst-case field and temperature).
- (I_{rms}): useful for cryogenics and bus thermal design even in superconducting systems (stabilizer, joints, non-SC segments). For a 10 us triangular burst, (I_{rms} = I_{pk} / sqrt(3)).

#### 3) Superconductors here: "zero resistance" and what still bites

- DC / slow transients: below critical temperature (T_c) and field, the coils/cavities carry current via Cooper pairs -> DC resistance ~ 0. The only voltage you see is inductive: (V = L * dI/dt).
- RF / AC: at GHz-MHz the superconductor exhibits a small but finite surface resistance (R_s) (BCS + residual), so power loss scales with R_s. High-Q cavities in the UI default around (Q_0 ~ 1e9); ports/roughness spoil Q.
- Critical limits still bind even with R ~ 0: (J_c(B, T)), (B_c / B_{c2}), and temperature margin. Exceeding them seeds a normal zone (quench).
- Practical rule: design cross-section and parallels so (J_{pk} <= 0.3-0.5 * J_c) at peak self-field and coldest credible T; then verify AC loss and flux motion are acceptable at the chosen dI/dt.

#### 4) Cavities and coils: current-density and reactance management

- Inductive behavior dominates the pulse: the PFN/Blumlein must cover (V_{req} = L * dI/dt) including stray L. The table above shows 32-71 kV steps for the present ramps.
- Q and materials: the UI panels model materials-limited (Q_0) and a spoiling factor for ports/roughness; losses are low at Q ~ 1e9, but peak surface H and current crowding still cap you before quench.
- Guard-rails in software: the parametric sweep code carries explicit thresholds (cutoffs/clamps and floor values) to stay in a safe band. Mirror that in pulsed power: clamp requests above per-load (I_{pk,max}) and (V_{max}), and refuse too-fast slopes.
- System power context: the platform's "KM-scale ledger" and green-zone narratives assume (P_{avg} = 83.3 MW) and high-Q operation -- bus sizing and cooling should anchor to those steady-state numbers while local pulses respect the per-load headrooms above.

#### 5) Concrete guardrails / actions (recommended)

1. Freeze per-load limits in code: add (I_{pk,max}) and (V_{max}) for each load class (MIDI-conservative/aggressive, Panel PFN, Launcher). Reject pulses that exceed either or set slew caps (max dI/dt). Mirror the same values in the worksheet UI so operators see identical limits.
2. Carry area / parallels by default: seed (area_mm2) and (n_{parallel}) in the provisional rows so the filled preview always shows (J) and (J/J_c) without manual edits. Keep a global (J_c(B, T)) table (by wire/tape and temperature) to compute (J/J_c) in the UI.
3. Keep >= 10% voltage headroom after stray L: present margins (~11-27%) are good on paper. Measure lead + bus inductance; bump (V_{max}) (or soften ramps) so the measured (V_{req}) + margin stays under the insulation spec of the PFN/Blumlein and bus.
4. Quench and dump: instrument (I_{sense}), (V_{bus}), and cold-head temperatures fast enough (>= 20-50 kHz for these microsecond events) to abort on overshoot, crowbar on quench, and log the event.
5. Self-field and cavity checks: for each conductor geometry, estimate self-field at the high-current spots; verify the corresponding cavity/coil critical field margin. Smooth sharp edges in the cavity to cut surface-current hotspots.
6. Bus choice for heat and copper: operate the DC bus at 20-40 kV so (I_{bus,avg}) is 2-4 kA at 83.3 MW, then size copper (or superconducting bus + stabilizer) for the RMS and fault currents, not just average.

**Quick intuition for the five provisional rows**

- Why the panel PFN needs only ~32 kV: its (L) is tiny (1 uH), so even a brutal (dI/dt = 3.16e10 A/s) only asks for (L * dI/dt) ~ 31.6 kV, but the slew and layout must be pristine.
- Why the 50-100 uH coils land near 70-71 kV: larger (L), gentler slopes, and similar (I_{pk}) move you into the ~70 kV band.
- Why (J) is in the 0.4-0.5 kA/mm^2 band: the implicit areas are in the 30-64 mm^2 range (one or more parallels). If the vendor's (J_c(B, T)) at operating field is ~1 kA/mm^2 engineering current density, the present rows are already in a ~50%-of-(J_c) planning zone -- good.

If you want, send the cross-section (mm^2) and parallels you actually intend to use for each class; we can compute (J), an indicative (J/J_c(B, T)) margin, and a self-field estimate on top of this sheet to lock the final (I_{pk,max}), (dI/dt_{max}), and (V_{max}).

### 2.10 Immediate actions (do now)

- Populate `data/needle_Ipeak_filled.csv` with the vendor `J_c(B, T)` for the chosen conductor so `J/J_c` renders in the UI; keep the current areas/parallels unless you have updated geometry.
- Mirror the five provisional limits into runtime defaults: set `IPEAK_MAX_MIDI_A=31623`, `IPEAK_MAX_SECTOR_A=31623`, `IPEAK_MAX_LAUNCHER_A=14142` in deploy manifests and reject requests above those caps; clamp any requested slew/voltage to the table bands (dI/dt rows above; 32-71 kV).
- Surface the same per-load caps beside the pulse controls in the UI and show calculated `V_req` vs `V_max` headroom so operators see the ~11-27% margin before arming.

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
