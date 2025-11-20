# Casimir Tile Mechanism (Needle Hull Mk.1)

This note ties the narration researchers are sharing in reviews to the actual code that runs inside the Helix Core energy pipeline. Every numbered item cites the live implementation (server or client files) plus the external papers that motivated the knobs.

---

## 1) Mechanism in one view

**Per‑tile vacuum energy → hull tiling → static budget → amplification ladder → mass proxy (E/c²)**

1. **Per‑tile Casimir energy.** The backend hard‑codes ℏ and c (`modules/core/physics-constants.ts`) and applies the canonical perfect‑conductor, parallel‑plate result
   \[
   \frac{E}{A}=-\frac{\pi^2 \hbar c}{720\,a^3}.
   \]
   That’s exactly what `calculateStaticCasimir` evaluates before multiplying by the tile area (`server/energy-pipeline.ts`). The same derivation lives in the SCUFF-EM static module (`modules/sim_core/static-casimir.ts`). ([APS Link][1])

2. **Hull surface area and tile census.** The Needle hull is modelled as a triaxial ellipsoid; area is obtained by integrating the proper area element from the first fundamental form. The helper `surfaceAreaEllipsoidMetric` samples θ–φ space and calls `firstFundamentalForm` (`src/metric.ts`), matching the standard elliptic-integral derivation (Poelaert–Schniewind–Janssens). The result feeds `state.N_tiles` with the published packing (0.88) and layers (10). ([arXiv][2])

3. **Static budget.** Aggregate static negative energy is just the per‑tile energy multiplied by the tile census (`state.U_static`).

4. **Amplification ladder and mass chain.** The pipeline multiplies the static budget by the concave-geometry gain (γ_geo³), the burst/quality factor (Q_BURST), the Ford–Roman duty clamp (d_eff), and the Van den Broeck pocket compression (γ_VdB). Afterwards it converts energy to mass via E/c²:
   \[
   M=\frac{|U_{\rm static}| \,\gamma_{\rm geo}^{3}\, Q_{\rm burst}\,\gamma_{\rm VdB}\,d_{\rm eff}\,N}{c^2}.
   \]
   This is the exact formula wired into `server/energy-pipeline.ts`, with γ_VdB acting as the calibrated mass knob while the renderer still shows the raw paper value. Duty clamping comes straight from the quantum-inequality guardrail (Ford–Roman; Fewster & Eveson) and the Van den Broeck gain tracks the compressed geometry that meets a QI. ([arXiv][3])

5. **GR-valid “time-sliced” proxy.** Operationally, the array is strobed so fast (TS ≫ 1) that general relativity only sees the cycle-average \(\langle T_{\mu\nu}\rangle\) (tracked as `TS_long`/`TS_ratio` plus the `isHomogenized` badge). The KM-scale warp ledger surfaces the same Isaacson high-frequency logic. ([APS Link][4])

---

## 2) Numbers (step by step, verified against code)

**Constants & defaults used in the pipeline**

* \(\hbar c = 3.1615\times10^{-26}\,\mathrm{J\,m}\) (see `PHYSICS_CONSTANTS.HBAR_C`)
* Gap \(a = 1\,\mathrm{nm} = 1.0\times10^{-9}\,\mathrm{m}\) (`state.gap_nm`)
* Tile footprint \(A_{\rm tile} = 25\,\mathrm{cm^2}=2.5\times10^{-3}\,\mathrm{m^2}\)
* Packing \(p=0.88\); radial layers \(L=10\); γ_geo = 26
* Reported tile count \(N \approx 1.97\times10^9\) (from `surfaceAreaEllipsoidMetric`)

**(i) Per-area and per-tile energy**

\[
\frac{E}{A}=-\frac{\pi^2\hbar c}{720a^3}.
\]

Compute carefully:

* \(\pi^2/720 \approx 0.01370778\).
* Multiply: \(0.01370778\times 3.1615\times10^{-26}=4.333\times10^{-28}\,\mathrm{J\,m}\).
* Divide by \(a^3=10^{-27}\,\mathrm{m^3}\Rightarrow |E/A|\approx 0.433\,\mathrm{J/m^2}\).

> **Note:** The original doc listed \(|E/A|\approx 4.32\times10^{-3}\,\mathrm{J/m^2}\). The implementation already uses the corrected \(0.433\,\mathrm{J/m^2}\), which reproduces the same per-tile energy when multiplied by \(A_{\rm tile}\).

So \(E_{\rm tile}\approx-1.08\times10^{-3}\,\mathrm{J}\) — the value `calculateStaticCasimir` emits and the telemetry exposes through `/api/helix/pipeline`.

**(ii) Static budget**

\[
U_{\rm static}=N\,E_{\rm tile}\approx (1.97\times10^9)\times(-1.08\times10^{-3})\approx -2.13\times10^6\,\mathrm{J}
\]

That’s the ~−2.13 MJ shown in the Helix Casimir Amplifier card.

**(iii) Geometry gain (concave, cube)**

\[
U_{\rm geo}=U_{\rm static}\,\gamma_{\rm geo}^3 = (-2.13\times10^6)\times 26^3 \approx -3.75\times10^{10}\,\mathrm{J}
\]

**(iv) Illustrative mass-chain solve (~1405 kg)**

Take the default green-zone values surfaced in the KM-scale ledger (`warp-web/km-scale-warp-ledger.html` and `warp-web/js/physics-core.js`): \(Q_L\sim10^9\), \(d_{\rm eff}=2.5\times10^{-5}\), \(\gamma_{\rm VdB}\approx 1.3485\times10^{5}\). Then

\[
E_{\rm out}\approx |U_{\rm static}|\,\gamma_{\rm geo}^3 \, Q_L \, \gamma_{\rm VdB}\, d_{\rm eff} \approx 1.26\times10^{20}\,\mathrm{J},
\quad M\approx 1.41\times10^{3}\,\mathrm{kg}.
\]

That reproduces the 1.4 t headline shown in the Helix UI (see `client/src/components/BridgeDerivationCards.tsx` for the dual θ audit).

---

## 3) Why the limiter knobs exist

* **Quantum inequalities (QIs).** QIs bound how negative energy can be and for how long it can persist — motivating the duty clamp and compliance badges (`state.zeta`, Ford–Roman status). ([arXiv][3])
* **Compressed warp geometry (Van den Broeck).** γ_VdB models Van den Broeck’s “pocket” compression that allows dramatic mass reduction while satisfying QIs. ([arXiv][5])
* **Energy-condition context.** Additional citations (Visser; Everett & Roman) live in `docs/papers/` and the ledger microsite to backstop the compliance messages. ([arXiv][6])

---

## 4) GR “time-sliced” proxy is principled

Running in the high-frequency regime (TS ≫ 1; many light-crossings per control tick), GR responds to the cycle-averaged stress tensor, not the per-strobe spike. Isaacson’s effective-stress result and the Green–Wald backreaction program justify the `TS_ratio` badge and KM-scale ledger copy. ([APS Link][7])

---

## 5) Where to verify this in the running system

* **Pipeline state (`GET /api/helix/pipeline`).** Returns the live ladder seeds (gap, tile area, γ_geo, d_eff, γ_VdB) plus derived values like `tiles.count`, `perTileEnergyJ`, `U_static`, `U_geo`, and `M_exotic`. These populate `useEnergyPipeline` and every dashboard card referencing the Casimir chain.
* **Warp ledger microsite (`warp-web/km-scale-warp-ledger.html`).** Shows the same bounds (Q_L, γ_VdB, d_eff) along with falsifiability scalings and the GR badges.
* **Docs/papers feed (`docs/papers/*.md`).** Source PDFs and annotations for the citations referenced here.

---

## 6) Caveats (acknowledged in the code/comments)

* The canonical Casimir expression assumes perfect conductors at zero temperature. Real-material/finite‑T corrections (Lifshitz theory, nonlocal response, PFA breakdowns on micro-textures) live on the roadmap — see the placeholders inside `modules/sim_core/static-casimir.ts`. ([APS Link][1])
* Even with γ_VdB compression, required energy densities remain beyond current technology; the guardrails are genuine (borrow-and-repay character of QIs, per Pfenning & Ford). ([arXiv][8])

---

## 7) One-page verification checklist

1. **Casimir tile math (static).**
   * Confirm constants: `PHYSICS_CONSTANTS.HBAR_C`, `state.gap_nm=1`, `state.tileArea_cm2=25`.
   * Compute \(E/A\) yourself (~0.433 J m⁻²); cross-check `/api/helix/pipeline` → `perTileEnergyJ`.
   * Verify `tiles.staticJ` ≈ −2.13 MJ and `tiles.count` ≈ 1.97×10⁹.
2. **Geometry gain.**
   * Ensure `gammaGeo=26`; check `ladder.geoJ` ≈ −3.75×10¹⁰ J.
3. **Green-zone bounds.**
   * From the KM ledger: \(Q_L\in[5\times10^8,10^9]\), \(d_{\rm eff}\le 3\times10^{-5}\), \(\gamma_{\rm VdB}\in[10^5,10^6]\); TS badge shows “valid.”
4. **Mass proxy spot-check.**
   * Plug greens into
     \[
     M=\frac{|U_{\rm static}| \gamma_{\rm geo}^{3} Q_L \gamma_{\rm VdB} d_{\rm eff} N}{c^2}
     \]
     and confirm \(M\approx 1.4\times10^3\,\mathrm{kg}\).
5. **Literature provenance.**
   * Casimir plates: Klimchitskaya–Mohideen–Mostepanenko Rev. Mod. Phys. 81 (2009). ([APS Link][1])
   * Ellipsoid area via first fundamental form: Poelaert et al., *arXiv:1104.5145*. ([arXiv][2])
   * QIs and warp audits: Pfenning & Ford; Fewster & Eveson; Van den Broeck. ([arXiv][3], [5])

---

### Bottom line

* Mechanism: canonical Casimir tiles → ellipsoid area integration → packed tile census → γ_geo³ ladder → QI-clamped duty + \(Q_L\) + γ_VdB → E/c² mass proxy.
* Numbers: \(E_{\rm tile}\approx-1.08\,\mathrm{mJ}\); \(U_{\rm static}\approx-2.13\,\mathrm{MJ}\); \(U_{\rm geo}\approx-37.5\,\mathrm{GJ}\); green-zone knobs land at \(M\approx1.4\,\mathrm{t}\).
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
