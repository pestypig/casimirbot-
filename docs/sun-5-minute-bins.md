# 5-Minute Sun Bins as the Coherence Clock
> Status: Reference guide for the star coherence loop  
> Scope: How to treat 300 s SunPy bins as the macroscopic 3.3 mHz driver and collapse modulator

---

## 1) Why 300 s bins matter

- **P-mode leak to the corona:** Global 3.3 mHz (5-minute) p-modes are visible in EUV/X-ray irradiance (SDO/EVE/ESP). Amplitudes drift with coronal topology, so modest variation in `align` and `entropy` is expected even in quiet intervals.
- **Granules as the gear teeth:** Typical granule lifetime is about 5.7 minutes at roughly 1 Mm scale; below about 600 km mini-granules form a multifractal, intermittent population. The 300 s window matches the natural granule overturn time.
- **Nanoflares as local collapses:** Reconnection in braided loop strands produces intermittent, super-hot pockets; in downsampled bins this shows up as added variance or complexity rather than discrete HEK events.
- **Time-crystal framing:** In the CSL/DP picture, p-mode phase near 3.3 mHz suppresses collapse; phase slips and turbulent complexity accelerate collapse.

---

## 2) How to read the existing bin fields

- `frames`: Count of SunPy images in the 300 s window (baseline mass or bytes proxy).
- `phase_5min` (derive): `2 * PI * (t_mid - t0) / 300` radians; the p-mode clock angle for the bin.
- `align`: Disk-wide coherence strength in [0, 1]; higher when the scene is more phase-locked.
- `entropy`: Downsampled disk complexity in [0, 1]; higher when multi-scale structure and variance increase.
- HEK events: Discrete collapses layered on top of the continuous p-mode and granulation background.

---

## 3) Wire the bins into the star coherence loop

### 3.1 P-mode driver

```ts
const driver = align * Math.cos(phase_5min); // [-align, +align]
global_coherence += k_coh * driver;
phase_dispersion = stddev(lastN(driver));    // low when bins are phase-locked
```

- Positive near crest, negative near trough; magnitude set by coherence.
- Low dispersion over several bins means the star is in a resonant, protected mode.

### 3.2 Edge-of-chaos gain from entropy

```ts
const ENTROPY_TARGET = 0.5; // tune
const edge_of_chaos =
  1 - Math.abs(entropy - ENTROPY_TARGET) / ENTROPY_TARGET; // 0..1
```

- Peaks near mid-entropy where multifractal granulation is strongest.
- Downweights bins that are too ordered or too noisy.

### 3.3 Collapse pressure modulator

```ts
const resonant = Math.abs(driver);      // strong p-mode locking
const off_resonant = 1 - resonant;
const g_collapse = off_resonant * edge_of_chaos;

collapse_pressure += k_collapse * g_collapse;
// dp_tau_estimate_ms can depend on global_coherence and collapse_pressure
```

- High driver plus low dispersion -> protected state (slow collapse).
- Dropping driver with healthy entropy -> rising collapse pressure.

### 3.4 HEK weighting inside bins

```ts
const w_event =
  base_mass(event) * f_rho(mu) *
  (1 + alpha_align * driver) *
  (1 + alpha_entropy * edge_of_chaos);
```

- `base_mass(event)`: GOES class, AR or CH area, etc.
- `f_rho(mu)`: Disk-center weighting.
- `alpha_align`, `alpha_entropy`: Tunable couplings.

Emit per-bin information alongside per-event weights:

```ts
handleInformationEvent({
  host_mode: "sun_like",
  bytes: frame_count,
  mass: sum(w_event) * beta + gamma * frame_count,
  alignment: align,          // or driver if sign matters
  complexity_score: entropy,
  phase_5min: phase_5min,
});
```

---

## 4) Sanity checks and tuning

- **Quiet-Sun baseline:** Long HEK-empty runs should show `align` ~0.2-0.4, `entropy` ~0.2-0.5, and low `phase_dispersion`.
- **Active intervals:** Known flare days (for example 2017-09-06 X9.3) should show entropy lifts or driver changes near onset; HEK weights should jump in those bins.
- **Knobs:** Tune `ENTROPY_TARGET`, `k_coh`, `k_collapse`, `alpha_align`, and `alpha_entropy` to yield long coherence plateaus punctuated by sharp collapse spikes and a flare-like event size distribution.

---

## 5) One-liner

Each 300 s bin is a time-crystal tick: `align` plus `phase_5min` tell you how tightly the Sun is locked to its 3.3 mHz p-mode clock, `entropy` tells you how close the surface or corona is to a multifractal edge-of-chaos regime, and together they should modulate global coherence and collapse pressure, with HEK events riding as discrete collapses on that background.

---

## 6) Where the dashboard gauges come from (and why early runs saturate)

- SunPy export (AIA frames + HEK events) is binned into 300 s windows. For each bin we compute `align = globalCoherence0 * (1 + 0.25 * cos(phase_5min))`, plus entropy/energy heuristics.
- Each bin is emitted as an `InformationEvent` into the star model (`session_id=solar-hek`), along with individual HEK events.
- In the star model: `driver = |align * cos(phase_5min)|` (or `|align|` if the phase is missing). `phase_dispersion` is the normalized stddev of recent `driver` values vs quiet baselines (med ~0.15, p90 ~0.35). `p_mode_driver` is `|driver|` scaled to a rolling p90 (fallback 0.3). `global_coherence` drifts via an SDE, boosted by driver/mass and damped by dispersion.
- The UI reads `/api/star/telemetry?session_id=solar-hek&session_type=solar` and displays: `Coherence <- global_coherence`, `Phase dispersion <- phase_dispersion`, `Band power <- p_mode_driver`, `Regime <- thresholds on coherence/dispersion`.

### Spin-up artifacts to expect

- Very low history (1-2 bins) makes `phase_dispersion` collapse to 0% and `p_mode_driver` saturate at 100% because the rolling p90 fallback (0.3) is all it has.
- Early bins with small mass/coverage yield low `global_coherence` (e.g., 10-20%) simply because the SDE has not been driven upward yet.
- These gauges are therefore "model coherence" during warm-up; they do not yet claim a physical p-mode measurement.

### Hardening the gauges

- Gate `phase_dispersion` and `p_mode_driver` until you have N >= 8 bins; the service now exposes ready flags and history counts so the UI can show "warming up" instead of 0%/100% during spin-up.
- Calibrate quiet baselines (driver median/p90, dispersion med/p90) from long quiet-Sun runs instead of the current guesses.
- Optionally add a simple spectral check around 3.3 mHz (bandpass + Hilbert) to anchor the heuristics with measured phase/amplitude before feeding the star model.

## Appendix: Calibrating the live gauges (coherence, phase dispersion, p-mode power)

Short version: your three live gauges are almost the right abstractions, but the current scaling is making them lie to you. If you tune them so they behave like what helioseismology and turbulence papers say the Sun actually does, they become a clean quasi-state classifier for the coherence environment your star model sits in.

### 1) What the field says (relevant bits)

- **5-minute p-modes are real but messy:** ESP/SDO shows a 2-4 mHz bump and ~67 uHz spacing. In the corona the signal is variable; phases wander with magnetic structure and flows.
- **Granulation sets the 5-minute metronome, mini-granules are multifractal:** Regular granules (~1050 km) are Gaussian-like; below ~600 km mini-granules follow ~d^-1.8 and form multifractal chains. Lifetimes cluster near 5-10 minutes.
- **Coronal/solar-wind response is multifractal:** Turbulence shows multifractal scaling; coronal 3 mHz peaks wander with inhomogeneities.
- **Impulsive events are collapses on top of the driver:** Transition-region brightenings and nanoflares are intermittent, not phase-locked, sitting on the 5-minute environment.

### 2) Map to the gauges you have

- `global_coherence` (C): how phase-locked the coronal response is to the 5-minute driver across the disk and recent bins.
- `phase_dispersion` (sigma_phi = std(driver)): how scattered the local 5-minute driver is across time/space. Low = locked; high = mixed/turbulent.
- `Pp = |driver| = |align * cos(phase_5min)|`: instantaneous band power in the 3.3 mHz mode. High with low dispersion = clean p-mode; high with high dispersion = scrambled power; low = off-band/turbulent.
- Co-rotating motion stats: low motion + high C + low dispersion -> organized oscillation; high motion + low C + high dispersion -> multifractal/reconnection regime.

Healthy behavior: C and sigma_phi anti-correlate. Seeing both at 100% means normalization is wrong, not physics.

### 3) Concrete next steps

1) **Rolling windows:** Compute C and sigma_phi over a rolling window of N bins (e.g., 12-24 bins = 1-2 hours), not just the current bin.

2) **Quiet-Sun baseline:** Pick quiet intervals; measure medians and 90th percentiles for sigma_phi_qs, C_qs, Pp_qs.

3) **Normalize gauges:**

```ts
disp_norm = clamp((sigma_phi - sigma_phi_qs_med) / (sigma_phi_qs_p90 - sigma_phi_qs_med), 0, 1);
C_effective = (1 - disp_norm) * C_spatial_raw;          // fold in spatial coherence
Pp_norm = clamp(Pp / Pp_qs_p90, 0, 1);                   // relative band power
```

Expose:
- `global_coherence = C_effective`
- `phase_dispersion = disp_norm`
- `Pp = Pp_norm`

Expectations:
- Quiet Sun -> C ~0.5-0.8, sigma_phi ~0-0.3, Pp ~0.3-0.7
- Decohered regime -> C low, sigma_phi near 1

4) **UI coupling:** Label regimes (locked, mixed, turbulent) and visually tie C and sigma_phi so their anti-correlation is obvious.

5) **Anchor Pp to real band power:** For a reference set, compute true 2-4 mHz band power on the co-rotating grid; fit a mapping so `Pp_norm=1` is top-decile band power, clamp visually at 1.

6) **Use motion for turbulence tagging:** Compute motion mean/dispersion; define a turbulence index `T = clamp(sigma_v / sigma_v_qs_p90, 0, 1)`. High T + high sigma_phi + low C -> multifractal/nanoflare regime; optionally downweight coherence there.

7) **Sanity checks:** On quiet intervals you should see a clean 3 mHz bump and ~67 uHz spacing when C is high. As sigma_phi and T rise, peaks broaden/jump, matching coronal variability in the literature.

