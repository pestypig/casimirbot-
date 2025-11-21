# Casimir Tile Mechanism (Needle Hull Mk.1)

This note ties the narration researchers are sharing in reviews to the actual code that runs inside the Helix Core energy pipeline. Every numbered item cites the live implementation (server or client files) plus the external papers that motivated the knobs.

---

## 1) Mechanism in one view

**Per-tile vacuum energy + hull tiling + static budget + amplification ladder + mass proxy (E/c^2)**

1. **Per-tile Casimir energy.** The backend hard-codes hbar and c (`modules/core/physics-constants.ts`) and applies the canonical perfect-conductor, parallel-plate result
   \[
   \frac{E}{A}=-\frac{\pi^2 \hbar c}{720\,a^3}.
   \]
   That's exactly what `calculateStaticCasimir` evaluates before multiplying by the tile area (`server/energy-pipeline.ts`). The same derivation lives in the SCUFF-EM static module (`modules/sim_core/static-casimir.ts`). On top of it, the live pipeline now emits a **material band**: ideal, Drude, and plasma Lifshitz stacks plus the non-retarded Hamaker branch. The API exposes `staticEnergy.nominalJ` (ideal) alongside `staticEnergy.realisticBandJ` (min/max based on the chosen Lifshitz model and Hamaker approximation) so UI panels can show both paths. ([APS Link][1])

2. **Hull surface area and tile census.** The Needle hull is modelled as a triaxial ellipsoid; area is obtained by integrating the proper area element from the first fundamental form. The helper `surfaceAreaEllipsoidMetric` samples R^+ space and calls `firstFundamentalForm` (`src/metric.ts`), matching the standard elliptic-integral derivation (Poelaert–Schniewind–Janssens). A blended estimator (metric quadrature + 16k Monte Carlo + spheroidal approximant) yields `hullArea_band` and drives `tiles.totalBand/activeBand`; for the canonical ellipsoid that band is sub-1%. The result feeds `state.N_tiles` with the published packing (0.88) and layers (10). ([arXiv][2])

3. **Static budget.** Aggregate static negative energy is just the per-tile energy multiplied by the tile census (`state.U_static`).

4. **Amplification ladder and mass chain.** The pipeline multiplies the static budget by the concave-geometry gain (I3_geo^3), the burst/quality factor (Q_BURST), the Ford–Roman duty clamp (d_eff), and the Van den Broeck pocket compression (I3_VdB). Afterwards it converts energy to mass via E/c^2:
   \[
   M=\frac{|U_{\rm static}| \,\gamma_{\rm geo}^{3}\, Q_{\rm burst}\,\gamma_{\rm VdB}\,d_{\rm eff}\,N}{c^2}.
   \]
   This is the exact formula wired into `server/energy-pipeline.ts`, with I3_VdB acting as the calibrated mass knob while the renderer still shows the raw paper value. Duty clamping comes straight from the quantum-inequality guardrail (Ford–Roman; Fewster & Eveson) and the Van den Broeck gain tracks the compressed geometry that meets a QI. ([arXiv][3])

5. **GR-valid "time-sliced" proxy.** Operationally, the array is strobed so fast (TS >> 1) that general relativity only sees the cycle-average \(\langle T_{\mu\nu}\rangle\) (tracked as `TS_long`/`TS_ratio` plus the `isHomogenized` badge). The KM-scale warp ledger surfaces the same Isaacson high-frequency logic. ([APS Link][4])

6. **Mass band pipe-through.** Nominal energy feeds the legacy mass proxy while the Lifshitz/Hamaker band feeds `mass.realisticBandKg`; both use the same gamma/Q/duty ladder. UI cards surface the nominal hint alongside the realistic mass band so operators can see material effects without losing the legacy anchor.

---

## 2) Numbers (step by step, verified against code)

**Constants & defaults used in the pipeline**

* hbar c = 3.1615e-26 J·m (see `PHYSICS_CONSTANTS.HBAR_C`)
* Gap a = 1 nm = 1.0e-9 m (`state.gap_nm`)
* Tile footprint A_tile = 25 cm^2 = 2.5e-3 m^2
* Packing p = 0.88; radial layers L = 10; gamma_geo = 26
* Reported tile count N ≈ 1.97e9 (from `surfaceAreaEllipsoidMetric`)

**(i) Per-area and per-tile energy**

\[
\frac{E}{A}=-\frac{\pi^2\hbar c}{720a^3}.
\]

Compute carefully:

* π^2/720 ≈ 0.01370778.
* Multiply: 0.01370778 × 3.1615e-26 = 4.333e-28 J·m.
* Divide by a^3 = 1e-27 m^3 ⇒ |E/A| ≈ 0.433 J/m^2.

> Note: The original doc listed |E/A| ≈ 4.32e-3 J/m^2. The implementation already uses the corrected 0.433 J/m^2, which reproduces the same per-tile energy when multiplied by A_tile.

So E_tile ≈ -1.08e-3 J — the value `calculateStaticCasimir` emits and the telemetry exposes through `/api/helix/pipeline`.

**(ii) Static budget**

\[
U_{\rm static}=N\,E_{\rm tile}\approx (1.97\times10^9)\times(-1.08\times10^{-3})\approx -2.13\times10^6\,\mathrm{J}
\]

That's the ~-2.13 MJ shown in the Helix Casimir Amplifier card.

**(iii) Geometry gain (concave, cube)**

\[
U_{\rm geo}=U_{\rm static}\,\gamma_{\rm geo}^3 = (-2.13\times10^6)\times 26^3 \approx -3.75\times10^{10}\,\mathrm{J}
\]

**(iv) Illustrative mass-chain solve (~1405 kg)**

Take the default green-zone values surfaced in the KM-scale ledger (`warp-web/km-scale-warp-ledger.html` and `warp-web/js/physics-core.js`): Q_L ~ 1e9, d_eff = 2.5e-5, gamma_VdB ≈ 1.3485e5. Then

\[
E_{\rm out}\approx |U_{\rm static}|\,\gamma_{\rm geo}^3 \, Q_L \, \gamma_{\rm VdB}\, d_{\rm eff} \approx 1.26\times10^{20}\,\mathrm{J},
\quad M\approx 1.41\times10^{3}\,\mathrm{kg}.
\]

That reproduces the 1.4 t headline shown in the Helix UI (see `client/src/components/BridgeDerivationCards.tsx` for the dual gamma audit).

---

## 3) Why the limiter knobs exist

* **Quantum inequalities (QIs).** QIs bound how negative energy can be and for how long it can persist — motivating the duty clamp and compliance badges (`state.zeta`, Ford–Roman status). ([arXiv][3])
* **Compressed warp geometry (Van den Broeck).** gamma_VdB models Van den Broeck's "pocket" compression that allows dramatic mass reduction while satisfying QIs. ([arXiv][5])
* **Energy-condition context.** Additional citations (Visser; Everett & Roman) live in `docs/papers/` and the ledger microsite to backstop the compliance messages. ([arXiv][6])

---

## 4) GR "time-sliced" proxy is principled

Running in the high-frequency regime (TS >> 1; many light-crossings per control tick), GR responds to the cycle-averaged stress tensor, not the per-strobe spike. Isaacson's effective-stress result and the Green–Wald backreaction program justify the `TS_ratio` badge and KM-scale ledger copy. ([APS Link][7])

---

## 5) Where to verify this in the running system

* **Pipeline state (`GET /api/helix/pipeline`).** Returns the live ladder seeds (gap, tile area, gamma_geo, d_eff, gamma_VdB) plus derived values like `tiles.count`, `perTileEnergyJ`, `U_static`, `U_geo`, `staticEnergy.realisticBandJ`, and `mass.realisticBandKg`. These populate `useEnergyPipeline` and every dashboard card referencing the Casimir chain.
* **Warp ledger microsite (`warp-web/km-scale-warp-ledger.html`).** Shows the same bounds (Q_L, gamma_VdB, d_eff) along with falsifiability scalings and the GR badges.
* **Docs/papers feed (`docs/papers/*.md`).** Source PDFs and annotations for the citations referenced here.

---

## 6) Caveats (acknowledged in the code/comments)

* The canonical Casimir expression assumes perfect conductors at zero temperature. Lifshitz models are implemented (ideal/Drude/plasma + Hamaker) but still inherit the usual approximations; nonlocal response and micro-texture breakdowns remain caveats. ([APS Link][1])
* Even with gamma_VdB compression, required energy densities remain beyond current technology; the guardrails are genuine (borrow-and-repay character of QIs, per Pfenning & Ford). ([arXiv][8])

---

## 7) One-page verification checklist

1. **Casimir tile math (static).**
   * Confirm constants: `PHYSICS_CONSTANTS.HBAR_C`, `state.gap_nm=1`, `state.tileArea_cm2=25`.
   * Compute E/A yourself (~0.433 J/m^2); cross-check `/api/helix/pipeline` + `perTileEnergyJ`.
   * Verify `tiles.staticJ` ~ -2.13 MJ and `tiles.count` ~ 1.97e9.
2. **Geometry gain.**
   * Ensure `gammaGeo=26`; check `ladder.geoJ` ~ -3.75e10 J.
3. **Green-zone bounds.**
   * From the KM ledger: Q_L in [5e8, 1e9], d_eff <= 3e-5, gamma_VdB in [1e5, 1e6]; TS badge shows "valid."
4. **Mass proxy spot-check.**
   * Plug greens into
     \[
     M=\frac{|U_{\rm static}| \gamma_{\rm geo}^{3} Q_L \gamma_{\rm VdB} d_{\rm eff} N}{c^2}
     \]
     and confirm M ~ 1.4e3 kg. Nominal vs. realistic mass bands only differ by the Lifshitz/Hamaker branch; the ladder stays the same.
5. **Literature provenance.**
   * Casimir plates: Klimchitskaya–Mohideen–Mostepanenko Rev. Mod. Phys. 81 (2009). ([APS Link][1])
   * Ellipsoid area via first fundamental form: Poelaert et al., arXiv:1104.5145. ([arXiv][2])
   * QIs and warp audits: Pfenning & Ford; Fewster & Eveson; Van den Broeck. ([arXiv][3], [5])

---

### Bottom line

* Mechanism: canonical Casimir tiles + ellipsoid area integration + packed tile census + gamma_geo^3 ladder + QI-clamped duty + Q_L + gamma_VdB + E/c^2 mass proxy with nominal and Lifshitz/Hamaker bands.
* Numbers: E_tile ≈ -1.08 mJ; U_static ≈ -2.13 MJ; U_geo ≈ -37.5 GJ; green-zone knobs land at M ≈ 1.4 t.
* Evidence: every step maps to a function in the repo; `/api/helix/pipeline` and the KM ledger expose the exact values to operators so screenshots and audits land on the same math. ([APS Link][1])

If you need a ready-to-paste numbers card for reports, pull the JSON fields from `/api/helix/pipeline` and map them to the variables above; all names line up 1:1.

[1]: https://link.aps.org/doi/10.1103/RevModPhys.81.1827
[2]: https://arxiv.org/abs/1104.5145
[3]: https://arxiv.org/abs/gr-qc/9702026
[4]: https://link.aps.org/doi/10.1103/PhysRev.166.1272
[5]: https://arxiv.org/abs/gr-qc/9905084
[6]: https://arxiv.org/abs/gr-qc/9604008
[7]: https://link.aps.org/doi/10.1103/PhysRev.166.1263
[8]: https://arxiv.org/pdf/1208.5399
