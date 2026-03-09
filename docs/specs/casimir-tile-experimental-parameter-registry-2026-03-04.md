# Casimir Tile Experimental Parameter Registry (2026-03-04)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Strict extraction registry for linked timing, nanogap, Casimir sign-control, Q-spoiling, worldline-QEI, provenance, exploratory QCD-analog papers, and Core-4 warp-family geometry comparison anchors.

Extraction policy:
- Only values directly read from paper/standard text surfaces.
- No image OCR extraction used in this pass.
- If value not directly extractable from accessible text, mark `UNKNOWN`.
- `source_class` follows `primary|standard|preprint|secondary` from the citation pack.

## Columns
- `entry_id`
- `source_id`
- `parameter`
- `value`
- `unit`
- `uncertainty`
- `conditions`
- `paper_ref` (page/section/figure)
- `extraction_method` (`full_text`, `abstract`, `metadata`)
- `source_class`
- `maps_to_spec`
- `derivation_chain_id`
- `status` (`extracted`, `partial`, `unknown`)

## Derivation Chain Mapping

Equation provenance contract:
- `docs/specs/casimir-tile-equation-provenance-contract-v1.md`
Per-paper equation trace:
- `docs/specs/casimir-tile-paper-equation-trace-2026-03-04.md`

| entry scope | derivation_chain_id | recompute_ready | note |
|---|---|---|---|
| `EXP-T-*` | `CH-T-001` | true | timing equations are fully specified in timing protocol |
| `EXP-NG-*` | `CH-NG-001` | true | nanogap uncertainty equations are fully specified in uncertainty protocol |
| `EXP-Q-*` | `CH-Q-001` | true | q-extraction and spoil-factor equations are fully specified in q protocol |
| `EXP-CS-*` | `CH-CS-001` | partial | sign-transition derivation is defined; several rows still abstract-level in this pass |
| `EXP-SE-*` | `CH-SE-001` | partial | sem/ellipsometry equations are defined; full dual-instrument datasets are pending |
| `EXP-QEI-*` | `CH-QEI-001` | partial | worldline-QEI equation forms and sampler checks are defined; implementation-level sweep traces are pending |
| `EXP-QCD-*` | `CH-QCD-001` | partial | QCD analog extraction and multi-table replay (`t3+t4+t5`) are captured (`qcd-analog-replay-2026-03-07`); full event-level reconstruction remains out of scope in this wave |
| `EXP-GR-001..EXP-GR-005` | `CH-GR-001` | partial | Mercury perihelion observable replay is extracted and deterministic at equation level; remains reference-only and non-blocking for warp canonical policy |
| `EXP-GR-006..EXP-GR-010` | `CH-GR-002` | partial | Lensing deflection observable anchors are extracted for historical+modern replay; strict-source covariance is still partial |
| `EXP-GR-011..EXP-GR-015` | `CH-GR-003` | partial | Frame-dragging observable anchors are extracted from LAGEOS/GP-B/LARES sources; replay remains reference-only |
| `EXP-GR-016..EXP-GR-019` | `CH-GR-004` | partial | Shapiro-delay observable anchors are extracted from proposal + Cassini precision test; replay is deterministic and non-blocking |
| `EXP-WARP-001..EXP-WARP-012` | `CH-WARP-001` | partial | Core-4 warp-family geometry-first comparison anchors are extracted; conditional/non-comparable domains remain explicitly blocked in this wave |
| `EXP-WARP-013..EXP-WARP-020` | `CH-WARP-002` | partial | Core-4 energetics/QEI comparison anchors are extracted for reference-only method replay; explicit worldline-QEI and assumption-domain blockers remain non-promotable in this wave |

## Timing Extraction

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-T-001 | SRC-031 | WR demo chain length | 15 | km | UNKNOWN | Four-switch daisy chain, 5 km fiber each | NIM A 2013, Measurements section, Fig. 5/6 | full_text | primary | `sigma_t_ps`,`TIE_pp_ps`,`PDV_pp_ps` | extracted |
| EXP-T-002 | SRC-031 | WR accumulated skew | < 1 | ns | UNKNOWN | Same setup as EXP-T-001 | NIM A 2013, Measurements section | full_text | primary | `sigma_t_ps`,`TIE_pp_ps` | extracted |
| EXP-T-003 | SRC-031 | WR offset standard deviation | ~6 | ps | ~6 ps (reported 1sigma spread; strict-lane uncertainty proxy) | Histogram of master-slave offsets | NIM A 2013, Measurements section, Fig. 6 | full_text | primary | `sigma_t_ps` | extracted |
| EXP-T-004 | SRC-031 | WR node sync target accuracy | < 1 | ns | UNKNOWN | Intro/design goal statement | NIM A 2013, Introduction | full_text | primary | timing acceptance profile | extracted |
| EXP-T-005 | SRC-032 | Unrepeated WR span length | 300 | km | UNKNOWN | Single-span fiber link | arXiv:2511.23254, p.1 abstract | full_text | preprint | long-haul exploratory lane | extracted |
| EXP-T-006 | SRC-032 | One-way link loss | 51.34 | dB | UNKNOWN | 300 km link configuration | arXiv:2511.23254, p.1 abstract and Fig. 1 caption | full_text | preprint | long-haul exploratory lane | extracted |
| EXP-T-007 | SRC-032 | Uptime | 99.86 | % | UNKNOWN | ~20 h operation, six dropouts | arXiv:2511.23254, p.1 abstract and p.4 results | full_text | preprint | reliability/timing governance | extracted |
| EXP-T-008 | SRC-032 | Dropout recovery time | <=18 | s | UNKNOWN | WR re-established without intervention | arXiv:2511.23254, p.4 results | full_text | preprint | timing fail-safe | extracted |
| EXP-T-009 | SRC-032 | TDC jitter | 3 | ps RMS | UNKNOWN | PPS timestamps from two WR-LEN devices | arXiv:2511.23254, p.2 methods | full_text | preprint | `sigma_t_ps` | extracted |
| EXP-T-010 | SRC-032 | Min time deviation (300 km) | 4.00 | ps | +/-0.02 ps | averaging time tau=400 s | arXiv:2511.23254, p.4 results | full_text | preprint | `sigma_t_ps` | extracted |
| EXP-T-011 | SRC-032 | Min time deviation (150 km duplex) | 1.16 | ps | +/-0.01 ps | tau=200 s | arXiv:2511.23254, p.4 results | full_text | preprint | `sigma_t_ps` | extracted |
| EXP-T-012 | SRC-032 | Min time deviation (150 km simplex) | 1.69 | ps | +/-0.01 ps | tau=100 s | arXiv:2511.23254, p.4 results | full_text | preprint | `sigma_t_ps` | extracted |
| EXP-T-013 | SRC-032 | Min time deviation (7 km simplex) | 344 | fs | +/-2 fs | tau=4000 s | arXiv:2511.23254, p.4 results | full_text | preprint | `sigma_t_ps` | extracted |
| EXP-T-014 | SRC-029 | IEEE 1588 numeric experimental bound | UNKNOWN | UNKNOWN | UNKNOWN | Standard text not fully accessible in this pass | IEEE 1588-2019 metadata/landing page | metadata | standard | timing governance only | partial |
| EXP-T-015 | SRC-030 | WR ISPCS 2009 numeric bound set | UNKNOWN | UNKNOWN | UNKNOWN | DOI metadata accessible; no full numeric table in this pass | ISPCS 2009 metadata | metadata | primary | timing governance only | partial |
| EXP-T-016 | SRC-032 | Allan time deviation definition | `sigma_x^2(tau)=1/(6m^2(N-3m+1))*sum_{j=1}^{N-3m+1}[sum_{i=j}^{j+m-1}(x_{i+2m}-2x_{i+m}+x_i)]^2` | symbolic | UNKNOWN | `tau=m*tau0`; `x_i` is phase-error time series | arXiv:2511.23254, Eq. (1), p.4 | full_text | preprint | `sigma_t_ps` | extracted |
| EXP-T-017 | SRC-032 | Maximum time interval error definition | `MTIE(tau)=max_{1<=k<=N-n}(max_{k<=i<=k+n}(x_i)-min_{k<=i<=k+n}(x_i))` | symbolic | UNKNOWN | `tau=n*tau0`; `x_i` in time units | arXiv:2511.23254, Eq. (2), p.5 | full_text | preprint | `TIE_pp_ps` | extracted |
| EXP-T-018 | SRC-032 | 300 km MTIE acceptance anchor | <100 | ps | UNKNOWN | Longest no-dropout interval; holds through averaging times <=100 s | arXiv:2511.23254, p.5 results | full_text | preprint | `TIE_pp_ps` acceptance profile | extracted |
| EXP-T-019 | SRC-067 | WR design scalability target | 1000 | nodes | UNKNOWN | Deterministic transfer and synchronization scope target for WR network design | ICALEPCS2009 TUC004, abstract/intro | full_text | primary | timing topology class | extracted |
| EXP-T-020 | SRC-067 | WR automatic compensation path scale | ~10 | km | UNKNOWN | Auto-compensated optical-fiber paths of order 10 km in design statement | ICALEPCS2009 TUC004, intro | full_text | primary | timing topology class | extracted |
| EXP-T-021 | SRC-067 | WR single-link skew bound | <1 | ns | UNKNOWN | Per-link skew statement in multi-switch validation setup | ICALEPCS2009 TUC004, results section | full_text | primary | `TIE_pp_ps` | extracted |
| EXP-T-022 | SRC-067 | WR last-slave skew bound in multi-switch chain | <200 | ps | UNKNOWN | Three-switch setup; reported last-slave skew versus master | ICALEPCS2009 TUC004, results section | full_text | primary | `sigma_t_ps`,`TIE_pp_ps` | extracted |
| EXP-T-023 | SRC-067 | WR accumulated skew across chain | <0.5 | ns | UNKNOWN | Three-switch daisy chain timing accumulation | ICALEPCS2009 TUC004, results section | full_text | primary | `TIE_pp_ps` acceptance profile | extracted |
| EXP-T-024 | SRC-068 | WR clock subsystem timing precision target | <50 | ps | UNKNOWN | Stated subsystem objective for timing precision | ISPCS 2016 (clock characteristics), abstract | full_text | primary | `sigma_t_ps` acceptance profile | extracted |
| EXP-T-025 | SRC-068 | WR DDMTD phase-tagging resolution | 0.977 | ps | UNKNOWN | PLL+DDMTD phase-tagging implementation detail | ISPCS 2016 (clock characteristics), timing architecture section | full_text | primary | timestamping precision lane | extracted |
| EXP-T-026 | SRC-068 | WR SoftPLL update bandwidth | 30 | Hz | UNKNOWN | SoftPLL update path in timing architecture | ISPCS 2016 (clock characteristics), timing architecture section | full_text | primary | clock-mode conditions | extracted |
| EXP-T-027 | SRC-068 | WR max measured frequency offset in G.8262 setup | 4.256 | ppm | UNKNOWN | 24 h run under G.8262 setup | ISPCS 2016 (clock characteristics), G.8262 experiment section | full_text | primary | frequency stability lane | extracted |
| EXP-T-028 | SRC-068 | WR frequency-offset bound over 1000 s windows | <20 | ppb | UNKNOWN | Same run as EXP-T-027; all windows below bound | ISPCS 2016 (clock characteristics), G.8262 experiment section | full_text | primary | frequency stability lane | extracted |
| EXP-T-029 | SRC-031 | WR strict-scope long-haul topology/uncertainty anchor | 15 | km | ~6 ps (offset spread over chain run) | Four-switch daisy chain (`3x5 km` fiber); long-haul class anchor for strict timing lane admissibility | NIM A 2013, measurements section (chain + offset histogram) | full_text | primary | long-haul admissibility, `sigma_t_ps` | extracted |
| EXP-T-030 | SRC-031 | WR strict-scope sigma uncertainty anchor | 6 | ps | k=1 (`1sigma` offset spread from chain histogram) | Same run as `EXP-T-003`; explicit uncertainty anchor for `u_sigma_t_ps` in strict timing packs | NIM A 2013, measurements section, Fig. 6 offset histogram | full_text | primary | `u_sigma_t_ps` | extracted |
| EXP-T-031 | SRC-031 | WR strict-scope tie uncertainty anchor (conservative from measured spread) | 12 | ps | k=1 conservative (`2x` `EXP-T-030` sigma anchor under same chain conditions) | Same run as `EXP-T-003`; used for `u_tie_pp_ps` when strict-scope tie uncertainty is not directly tabulated | NIM A 2013, measurements section, Fig. 6 offset histogram | full_text | primary | `u_tie_pp_ps` | extracted |

## Nanogap Extraction

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-NG-001 | SRC-035 | Ridge tip-characterizer calibration uncertainty floor | >=5 | nm | k=1 implied in source context | Commercial sharp-ridge tip characterizers | NIST publication abstract | full_text | standard | `u_g_mean_nm`,`u_g_sigma_nm` | extracted |
| EXP-NG-002 | SRC-035 | SCCDRM tip-width calibration uncertainty | ~1 | nm | standard uncertainty (k=1) | SCCDRM calibration on (110) silicon | NIST publication abstract | full_text | standard | nanogap profile gate | extracted |
| EXP-NG-003 | SRC-035 | Compared CCDS nominal widths | 45, 70 | nm | UNKNOWN | Compared against SCCDRM calibration | NIST publication abstract | full_text | standard | nanogap benchmark lane | extracted |
| EXP-NG-004 | SRC-037 | HS-AFM lateral spatial resolution | ~2 | nm | UNKNOWN | Current HS-AFM instruments | Sci Rep 2022, introduction | full_text | primary | `u_g_mean_nm` context | extracted |
| EXP-NG-005 | SRC-037 | HS-AFM vertical spatial resolution | ~0.15 | nm | UNKNOWN | Current HS-AFM instruments | Sci Rep 2022, introduction | full_text | primary | `u_g_mean_nm` context | extracted |
| EXP-NG-006 | SRC-037 | Typical image noise sigma | 0.3 | nm | std dev | Gaussian noise level in experiments | Sci Rep 2022, methods/results | full_text | primary | `u_algo`,`u_meas` | extracted |
| EXP-NG-007 | SRC-037 | Stress-test noise sigma | 1.2 | nm | std dev | High-noise robustness test | Sci Rep 2022, methods/results | full_text | primary | `u_algo` robustness | extracted |
| EXP-NG-008 | SRC-037 | HS-AFM dataset frame count | 30 | frames | UNKNOWN | Myosin V data set | Sci Rep 2022, HS-AFM data section | full_text | primary | protocol reproducibility | extracted |
| EXP-NG-009 | SRC-037 | HS-AFM image grid | 80x40 | pixels | UNKNOWN | Myosin V data set | Sci Rep 2022, HS-AFM data section | full_text | primary | protocol reproducibility | extracted |
| EXP-NG-010 | SRC-037 | Pixel size | 1.875 x 1.875 | nm | UNKNOWN | HS-AFM data analysis setup | Sci Rep 2022, HS-AFM data section | full_text | primary | measurement conditions | extracted |
| EXP-NG-011 | SRC-038 | Fiducial height coverage | 2 to 18 | nm | UNKNOWN | DNA origami fiducial structure | Nano Lett/PMC, text and Fig. 1 context | full_text | primary | nanogap calibration lane | extracted |
| EXP-NG-012 | SRC-038 | Minimum fiducials for stable tip estimate | >=10 | count | UNKNOWN | 1x1 um image example at ~1 nM concentration | Nano Lett/PMC, Fig. 3 discussion | full_text | primary | BTR stability gate | extracted |
| EXP-NG-013 | SRC-038 | Width correction example (fiducial) | 32.3 to 23.3 | nm | 32.3 +/-1.6 to 23.3 +/-1.4 | Finite tip-size correction | Nano Lett/PMC, Fig. 2e | full_text | primary | `u_tip`,`u_algo` | extracted |
| EXP-NG-014 | SRC-038 | Design/TEM width comparator | ~22.5; 23.0 | nm | TEM +/-1.2 | Same fiducial context | Nano Lett/PMC, Fig. 2 and supporting | full_text | primary | benchmark parity | extracted |
| EXP-NG-015 | SRC-038 | 24-HB width correction | 22.1 to 16.3 | nm | +/-1.8 to +/-1.6 | Compared with design width 15.5 +/-1.0 | Nano Lett/PMC, Fig. 4f | full_text | primary | BTR correction gate | extracted |
| EXP-NG-016 | SRC-038 | DNA apparent width pre-correction | 5.1 | nm | UNKNOWN | Expected DNA width ~2 nm | Nano Lett/PMC, Fig. 5b | full_text | primary | BTR correction gate | extracted |
| EXP-NG-017 | SRC-038 | SiO2 width correction | 25.6 to 15.5 | nm | +/-3.7 to +/-2.1 | Compared with AFM height 12.6 +/-1.4 and TEM width 11.5 +/-1.2 | Nano Lett/PMC, Fig. 5f and text | full_text | primary | BTR correction gate | extracted |
| EXP-NG-018 | SRC-038 | Imaging resolution examples | 0.4, 1.0, 1.4, 2.0 | pixel/nm | UNKNOWN | Different sample panels and modes | Nano Lett/PMC, Figs. 5 and 4 captions/text | full_text | primary | measurement conditions | extracted |
| EXP-NG-019 | SRC-036 | Blind-tip reconstruction simulation relief scale | 100 | nm | UNKNOWN | Back-of-envelope sizing example for reconstruction aperture selection | J. Res. NIST 102(4):425-454, Sec. 5.3.4 and Fig. 6 discussion | full_text | primary | `u_algo`,`u_tip` method anchor | extracted |
| EXP-NG-020 | SRC-036 | Added Gaussian noise used in certainty-map stress test | 1 | nm | standard deviation | Noisy-image reconstruction comparison | J. Res. NIST 102(4):425-454, Sec. 6.2 and Fig. 10 | full_text | primary | `u_algo` robustness | extracted |
| EXP-NG-021 | SRC-036 | Correlation coefficient (noisy vs ideal certainty maps) | 0.2 | coefficient | UNKNOWN | Same conditions as EXP-NG-020 | J. Res. NIST 102(4):425-454, Sec. 6.2 and Fig. 10 | full_text | primary | algorithm stability guard | extracted |
| EXP-NG-022 | SRC-039 | Power-law exponent for AC240 mode-2 stiffness ratio | 1.72 | dimensionless | +/-0.01 | LDV-calibrated batch statistics | Rev. Sci. Instrum. 87, 073705 (2016), Table 1 and Fig. 6 | full_text | primary | multimode calibration lane | extracted |
| EXP-NG-023 | SRC-039 | Power-law exponent for AC240 mode-3 stiffness ratio | 1.68 | dimensionless | +/-0.01 | LDV-calibrated batch statistics | Rev. Sci. Instrum. 87, 073705 (2016), Table 1 and Fig. 6 | full_text | primary | multimode calibration lane | extracted |
| EXP-NG-024 | SRC-039 | AC240 nominal first-mode resonance | 70 | kHz | UNKNOWN | Table reference values for cantilever class | Rev. Sci. Instrum. 87, 073705 (2016), Table 1 | full_text | primary | multimode calibration lane | extracted |
| EXP-NG-025 | SRC-039 | AC240 nominal first-mode stiffness | 2 | N/m | UNKNOWN | Table reference values for cantilever class | Rev. Sci. Instrum. 87, 073705 (2016), Table 1 | full_text | primary | multimode calibration lane | extracted |
| EXP-NG-026 | SRC-039 | AC240 batch size / wafer spread | 19 / 11 | count | UNKNOWN | Number of cantilevers and wafers used in calibration batch | Rev. Sci. Instrum. 87, 073705 (2016), Table 1 | full_text | primary | reproducibility lane | extracted |
| EXP-NG-027 | SRC-039 | Normalized first-mode stiffness error in Qf^1.3 scaling | 5.3 | % | UNKNOWN | Error context for AC240 discussion | Rev. Sci. Instrum. 87, 073705 (2016), Sec. 5(c) discussion | full_text | primary | `u_modecal` | extracted |
| EXP-NG-028 | SRC-042 | Mixed-model uncertainty equation for AFM nanoparticle dimensioning | `Y[r]ijkl=mu[r]+mu[r]i+mu[r]ij+mu[r]ijk+sum_{m=1}^M delta_m[r]X_m[r]ijkl+epsilon[r]ijkl` | symbolic | UNKNOWN | Intermediate precision design with day/position/image effects | arXiv:1812.09157, Eq. (1), pp.6-7 | full_text | preprint | `u_algo`,`u_model_form` | extracted |
| EXP-NG-029 | SRC-042 | Balanced-design standard uncertainty (no probe term) | `SD[mu_m[r]]=(u_day^2/I + u_pos^2/(IJ) + u_im^2/(IJK) + u_res^2/n)^(1/2)` | symbolic | UNKNOWN | Balanced design assumptions; n is total observation count | arXiv:1812.09157, p.7 | full_text | preprint | `u_g_mean_nm`,`u_g_sigma_nm` | extracted |
| EXP-NG-030 | SRC-042 | Balanced-design standard uncertainty (with probe term) | `SD[mu_m[r]]=(u_day^2/I + u_pos^2/(IJ) + u_im^2/(IJK) + u_res^2/n + u_probe^2)^(1/2)` | symbolic | UNKNOWN | Same as EXP-NG-029 with explicit probe contribution | arXiv:1812.09157, p.7 | full_text | preprint | `u_tip`,`u_g_sigma_nm` | extracted |
| EXP-NG-031 | SRC-042 | AFM nanoparticle mean height estimate | 23.40 | nm | SD=1.19 nm | Gold nanoparticle sample, measured mean `mu_m` | arXiv:1812.09157, Table 8, p.10 | full_text | preprint | `u_g_mean_nm` | extracted |
| EXP-NG-032 | SRC-042 | AFM nanoparticle calibrated-height estimate | 23.39 | nm | SD=3.18 nm | Gold nanoparticle sample, calibrated/propagated `h_m` | arXiv:1812.09157, Table 8, p.10 | full_text | preprint | `u_g_mean_nm`,`u_g_sigma_nm` | extracted |

## SEM + Ellipsometry Extraction

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-SE-001 | SRC-040 | SEM method standard edition | 2021 | year | UNKNOWN | ISO SEM particle-size/shape image analysis standard | ISO 19749 catalog entry | metadata | standard | protocol governance anchor | extracted |
| EXP-SE-002 | SRC-043 | SEM magnification calibration standard edition | 2016 | year | UNKNOWN | ISO guidance for SEM magnification calibration | ISO 16700 catalog metadata | metadata | standard | calibration governance anchor | extracted |
| EXP-SE-003 | SRC-041 | SRM-484 validated magnification range | 1000 to 20000 | x | UNKNOWN | SEM magnification calibration with SRM-484 | J. Res. NIST 99(5) text | full_text | primary | `d_sem_corr_nm`,`u_sem_nm` | extracted |
| EXP-SE-004 | SRC-041 | SEM detector Au coating thickness (sample prep) | <=200 | nm | UNKNOWN | Gold-coated SRM-484 sample in study setup | J. Res. NIST 99(5) sample prep description | full_text | primary | SEM setup conditions | extracted |
| EXP-SE-005 | SRC-041 | Automated edge-pair collection count | 2000 | pairs | UNKNOWN | Calibrated magnification procedure run | J. Res. NIST 99(5) methods/results | full_text | primary | SEM repeatability lane | extracted |
| EXP-SE-006 | SRC-041 | Acquisition time per 2000-pair run | 48 | s | UNKNOWN | Automated edge-detection run | J. Res. NIST 99(5) methods/results | full_text | primary | SEM repeatability lane | extracted |
| EXP-SE-007 | SRC-041 | Sampling interval in edge acquisition | 25 | ms | UNKNOWN | Interval during automated SEM data capture | J. Res. NIST 99(5) methods/results | full_text | primary | SEM repeatability lane | extracted |
| EXP-SE-008 | SRC-041 | Validity span around calibration mark | +/-15 | um | UNKNOWN | Local region around center mark for pitch validity | J. Res. NIST 99(5) measurement constraints | full_text | primary | SEM locality constraint | extracted |
| EXP-SE-009 | SRC-041 | Expanded uncertainty relation used | U=2*uc=2*st | symbolic | k=2 | Expanded uncertainty definition in SEM calibration analysis | J. Res. NIST 99(5) uncertainty section | full_text | primary | uncertainty reporting contract | extracted |
| EXP-SE-010 | SRC-042 | Data-modelling UQ method availability | BAYESIAN_MIXED_MODEL_PLUS_MONTE_CARLO | categorical | UNKNOWN | AFM dimensional metrology uncertainty framework without full physical measurement equation | arXiv:1812.09157, Sec. 4.5-5.2 | full_text | preprint | exploratory UQ overlay | extracted |
| EXP-SE-011 | SRC-040 | Mandatory SEM performance qualification before PSD use | PERFORMANCE_VERIFICATION_REQUIRED | categorical | UNKNOWN | Standard emphasizes SEM verification before distribution estimation | ISO 19749 summary scope text | metadata | standard | SEM acceptance precondition | partial |
| EXP-SE-012 | SRC-050 | Ellipsometry reference-procedure validated thickness range | 0.1 to 10000 | nm | UNKNOWN | Testing range strongly sample-dependent (`0.1 nm` to `10 um`) | BAM Reference Procedure 53 PDF, Testing range block | full_text | standard | `d_ellip_nm` | extracted |
| EXP-SE-013 | SRC-050 | Ellipsometry expanded uncertainty target | 0.5 | nm | k=2; best case 0.1 nm absolute; up to 10% relative | Expanded measurement uncertainty for layer thickness in reference procedure | BAM Reference Procedure 53 PDF, Expanded uncertainty block | full_text | standard | `u_ellip_nm`,`U_fused_nm` | extracted |
| EXP-SE-014 | SRC-050 | Independent measurements per sample in reference procedure | 5 | count | UNKNOWN | Same conditions as EXP-SE-012 | BAM Reference Procedure 53 summary page | metadata | standard | repeatability lane | extracted |
| EXP-SE-015 | SRC-042 | Quadratic calibration model used for dimensional traceability | `q_c = alpha + beta*q_m + gamma*q_m^2 + epsilon` | symbolic | UNKNOWN | Bayesian/Monte-Carlo propagation on calibration curve | arXiv:1812.09157, Eq. (3), p.10 | full_text | preprint | `d_fused`,`U_fused_nm` exploratory lane | extracted |
| EXP-SE-016 | SRC-041 | Line-scale interferometer uncertainty anchor (3sigma) | 10 | nm | 3sigma estimate in source | Master magnification sample measured with NIST line-scale interferometer (`0.01 um` converted to `10 nm`) | J. Res. NIST 99(2), Sec. 5 text near uncertainty discussion | full_text | primary | `u_sem_nm` | extracted |
| EXP-SE-017 | SRC-041 | SEM vs line-scale difference uncertainty anchor (3sigma) | 100 | nm | 3sigma estimate in source | Measured SEM vs line-scale differences (`0.1 um` converted to `100 nm`) | J. Res. NIST 99(2), Sec. 5 text near uncertainty discussion | full_text | primary | `u_sem_nm`,`delta_se_nm` | extracted |
| EXP-SE-018 | SRC-041 | Maximum observed SEM vs line-scale difference (issue 484f) | 46 | nm | UNKNOWN | Maximum reported difference for 10 um spacing (`0.046 um` converted to `46 nm`) | J. Res. NIST 99(2), Sec. 5 systematic-difference discussion | full_text | primary | `delta_se_nm` | extracted |
| EXP-SE-019 | SRC-041 | SRM+measurement-system relative uncertainty anchor (small spacing) | 5 | % | approximate | Reported uncertainty at `0.5 um` spacing in conclusion | J. Res. NIST 99(2), conclusion uncertainty statement | full_text | primary | SEM scale-governance anchor | extracted |
| EXP-SE-020 | SRC-041 | SRM+measurement-system relative uncertainty anchor (large spacing) | 1 | % | approximate | Reported uncertainty at `50 um` spacing in conclusion | J. Res. NIST 99(2), conclusion uncertainty statement | full_text | primary | SEM scale-governance anchor | extracted |
| EXP-SE-021 | SRC-085 | SRM-2530 certified ellipsometric measurands | Psi and Delta | symbolic | model/instrument/fit contributions included per certification procedure | Si/SiO2 ellipsometric SRM certification workflow | NIST SP 260-109, certification methodology | full_text | standard | `d_ellip_nm`,`u_ellip_nm`,`U_fused_nm` | extracted |
| EXP-SE-022 | SRC-086 | SRM-2530 ellipsometric wavelength anchor | 632.8 | nm | equivalent vacuum wavelength reported as ~633.0 nm in certificate context | He-Ne ellipsometer wavelength anchor for certificate transfer checks | SRM-2530 certificate archive surface | full_text | primary | `d_ellip_nm`,`u_ellip_nm` | extracted |
| EXP-SE-023 | SRC-086 | SRM-2530 thickness-class family anchor | 50, 100, 200 | nm | serial-specific certified tables are not populated in accessible archive surfaces; nominal class only | 2530 family includes multiple nominal oxide classes | SRM-2530-x certificate archive surface, p.1 | full_text_ocr | primary | `d_ellip_nm`,`u_ellip_nm` | partial |
| EXP-SE-024 | SRC-085 | SRM-2530 model-selection uncertainty anchor | one-layer and two-layer interface models documented | categorical | model choice contributes to derived thickness/index uncertainty | one-layer vs two-layer interface treatment in certification method | NIST SP 260-109 model discussion | full_text | standard | `U_fused_nm` | extracted |
| EXP-SE-025 | SRC-087 | SRM 2531 nominal oxide thickness anchor | 50 | nm | serial-specific certified thickness and uncertainty are not populated on accessible archive surfaces | Si/SiO2 thickness-transfer calibration coupon | NIST certificate 2531 archive, p.1 | full_text_ocr | primary | `d_ellip_nm`,`u_ellip_nm`,`U_fused_nm` | partial |
| EXP-SE-026 | SRC-088 | SRM 2532 nominal oxide thickness anchor | 100 | nm | serial-specific certified thickness and uncertainty are not populated on accessible archive surfaces | Si/SiO2 thickness-transfer calibration coupon | NIST certificate 2532 archive, p.1 | full_text_ocr | primary | `d_ellip_nm`,`u_ellip_nm`,`U_fused_nm` | partial |
| EXP-SE-027 | SRC-089 | SRM 2533 nominal oxide thickness anchor | 200 | nm | serial-specific certified thickness and uncertainty are not populated on accessible archive surfaces | Si/SiO2 thickness-transfer calibration coupon | NIST certificate 2533 archive, p.1 | full_text_ocr | primary | `d_ellip_nm`,`u_ellip_nm`,`U_fused_nm` | partial |
| EXP-SE-028 | SRC-090 | SRM 2534 nominal oxide thickness anchor | 25 | nm | serial-specific certified thickness and uncertainty are not populated on accessible archive surfaces | Si/SiO2 thickness-transfer calibration coupon | NIST certificate 2534 archive, p.1 | full_text_ocr | primary | `d_ellip_nm`,`u_ellip_nm`,`U_fused_nm` | partial |
| EXP-SE-029 | SRC-091 | SRM 2535 nominal oxide thickness anchor | 14 | nm | serial-specific certified thickness and uncertainty are not populated on accessible archive surfaces | Si/SiO2 thickness-transfer calibration coupon | NIST certificate 2535 archive, p.1 | full_text_ocr | primary | `d_ellip_nm`,`u_ellip_nm`,`U_fused_nm` | partial |
| EXP-SE-030 | SRC-092 | SRM 2536 nominal oxide thickness anchor | 10 | nm | serial-specific certified thickness and uncertainty are not populated on accessible archive surfaces | Si/SiO2 thickness-transfer calibration coupon | NIST certificate 2536 archive, p.1 | full_text_ocr | primary | `d_ellip_nm`,`u_ellip_nm`,`U_fused_nm` | partial |
| EXP-SE-031 | SRC-093 | SRM archive family enumeration anchor | 10, 14, 25, 50, 100, 200 | nm | UNKNOWN | NIST archive listing for 2531-2536 transfer standards | NIST SRM archive listing | metadata | standard | SE profile planning and calibration coverage checks | extracted |
| EXP-SE-032 | SRC-086 | SRM-2530 certified wavelength anchor | 632.8 | nm | UNKNOWN | 2530-x certificate reports ellipsometric certification wavelength at 632.8 nm | SRM 2530-1 archive certificate, p.1 | full_text_ocr | primary | `d_ellip_nm`,`u_ellip_nm` | extracted |
| EXP-SE-033 | SRC-086 | SRM-2530 uncertainty convention for plus/minus values | one-standard-deviation limits | categorical | k=1 statement in source surface; not expanded k=2 | Plus/minus values in 2530-x are stated as random+systematic one-sigma limits | SRM 2530-1 archive certificate, p.2 | full_text_ocr | primary | `u_ellip_nm`,`U_fused_nm` | extracted |
| EXP-SE-034 | SRC-086 | SRM-2530 supplementary incidence-angle set | 50, 55, 60, 65, 70, 75 | deg | UNKNOWN | Supplemental Δ/Ψ values are listed across fixed incidence-angle set | SRM 2531/2532/2535 archive certificates, p.1 | full_text_ocr | primary | ellipsometry-measurement-congruence | extracted |
| EXP-SE-035 | SRC-086 | SRM-2530 addendum center certification area | 5 | mm diameter | UNKNOWN | Certified thickness is mean of two center measurements over 5-mm-diameter center region | SRM 2531 addendum, p.3 | full_text_ocr | primary | measurement-congruence and transfer conditions | extracted |
| EXP-SE-036 | SRC-086 | SRM-2530 addendum dual-orientation rejection threshold | 0.10 | nm | UNKNOWN | Wafer rejected if two orientation measurements differ by more than threshold | SRM 2531 addendum, p.3 | full_text_ocr | primary | repeatability gate and measurement-congruence | extracted |
| EXP-SE-037 | SRC-086 | SRM-2530 interlayer-aware oxide-thickness relation | `t0 = tf + ti/2 ± sqrt(sigma_f^2 + sigma_i^2/4 + delta_i^2)` | symbolic | UNKNOWN | Relation provided for applications not sensitive to interlayer in same way as ellipsometry | SRM 2531 addendum, p.3 | full_text_ocr | primary | `d_ellip_nm`,`U_fused_nm` | extracted |
| EXP-SE-038 | SRC-086 | SRM-2530 addendum TEM thickness cross-check | 102.8 | nm | UNKNOWN | TEM-measured oxide-thickness cross-check on specimen SRM | SRM 2531 addendum, p.3 | full_text_ocr | primary | cross-instrument congruence | extracted |
| EXP-SE-039 | SRC-086 | SRM-2530 addendum corresponding certified thickness example | 103.7 | nm | ±1.2 nm (same expression style as certificate) | Certified value corresponding to EXP-SE-038 comparison example | SRM 2531 addendum, p.3 | full_text_ocr | primary | `d_ellip_nm`,`u_ellip_nm`,`delta_se_nm` | extracted |
| EXP-SE-040 | SRC-086 | SRM-2530 addendum profilometer uncertainty anchor | 3.8 | nm | ±3.8 nm stated as estimated uncertainty | NIST Precision Engineering Division unpublished-data uncertainty cited in addendum | SRM 2533/2535 addendum page, p.3/4 | full_text_ocr | primary | cross-instrument uncertainty anchor | extracted |
| EXP-SE-041 | SRC-086 | SRM-2530 addendum profilometer-vs-ellipsometry agreement | <=3 | nm | UNKNOWN | Agreement reported for nominal 50-nm specimen SRMs | SRM 2533/2535 addendum page, p.3/4 | full_text_ocr | primary | `delta_se_nm` congruence anchor | extracted |

## Q-Factor + Spoiling Extraction

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-Q-001 | SRC-023 | Post-treatment high-field cavity quality factor | >2e10 | Q0 | UNKNOWN | Fine-grain electropolished cavity after 120C bake; around 100 mT peak field and 2 K | Supercond. Sci. Technol. 26(10) 102001 abstract | abstract | primary | `q0_baseline`,`q0_acceptance_min` | extracted |
| EXP-Q-002 | SRC-023 | Q disease degraded quality factor | ~1e9 | Q0 | UNKNOWN | Same cavity after 100 K hold for 2 h | Supercond. Sci. Technol. 26(10) 102001 abstract | abstract | primary | `q_spoil_factor` | extracted |
| EXP-Q-003 | SRC-028 | Cavity Q0 at 22 MV/m (no added field) | 1.8e10 | Q0 | UNKNOWN | TESLA-shape cavity; no external DC field applied | IPAC2012 WEPPC002, p.2 | full_text | secondary | `q0_baseline` | extracted |
| EXP-Q-004 | SRC-028 | Trapped-flux sensitivity (low expulsion) | ~0.9 | nOhm/mG | UNKNOWN | 1400 C/3 h furnace treatment; poor flux expulsion case | IPAC2012 WEPPC002, p.2 | full_text | secondary | `q_spoil_flux_sensitivity` | extracted |
| EXP-Q-005 | SRC-028 | Trapped-flux sensitivity (high gradient) | ~3.9 | nOhm/mG | UNKNOWN | 1400 C/3 h + additional 1000 C/4 h + N2 treatment; high-sensitivity case | IPAC2012 WEPPC002, p.2 | full_text | secondary | `q_spoil_flux_sensitivity` | extracted |
| EXP-Q-006 | SRC-028 | Loaded Q for quadrupole cavity operation point | 9.7e3 | QL | UNKNOWN | Nominal operation point cited in cavity design context | IPAC2012 WEPPC002, p.1 | full_text | secondary | `q_loaded_profile` | extracted |
| EXP-Q-007 | SRC-021 | Low-field Q-slope onset scale | ~0.1 | MV/m | UNKNOWN | Reported field scale where low-field Q slope observed in Nb resonators | Phys. Rev. Lett. 119, 264801 accessible summary snippets | metadata | primary | `q_spoil_low_field_onset` | partial |
| EXP-Q-008 | SRC-025 | Normal-conducting copper cavity Q order-of-magnitude | ~1e5 | Q | UNKNOWN | Context-only intake claim from non-admissible secondary source | Wikipedia intake lead | metadata | secondary | contextual intake only | partial |
| EXP-Q-009 | SRC-062 | LFQS saturation onset field | ~0.1 | MV/m | UNKNOWN | 1.3 GHz niobium elliptical cavities at 1.5-1.6 K | arXiv:1705.05982, abstract and Fig. 2 discussion | full_text | preprint | `q_spoil_low_field_onset` | extracted |
| EXP-Q-010 | SRC-062 | Lowest field reached in extended Q(E) sweep | <1e-5 | MV/m | UNKNOWN | Extended low-field CW/single-shot measurement methods | arXiv:1705.05982, text around Fig. 2/4 | full_text | preprint | low-field robustness lane | extracted |
| EXP-Q-011 | SRC-062 | Native Nb2O5 thickness on cavity surface | 3 to 5 | nm | UNKNOWN | Modern SRF surface preparation baseline | arXiv:1705.05982, discussion section | full_text | preprint | oxide-control lane | extracted |
| EXP-Q-012 | SRC-062 | Anodized oxide thickness used for stress test | ~100 | nm | UNKNOWN | 48 V anodizing in ammonia solution | arXiv:1705.05982, experiment description | full_text | preprint | oxide-control lane | extracted |
| EXP-Q-013 | SRC-062 | Added low-field residual resistance after anodizing | up to 12 | nOhm | UNKNOWN | Eacc <= 0.01 MV/m relative to 5 MV/m baseline | arXiv:1705.05982, Fig. 4 and Table I discussion | full_text | preprint | `q_spoil_factor` | extracted |
| EXP-Q-014 | SRC-062 | TLS fit saturation field range from cavity set | 0.02 to 0.26 | MV/m | UNKNOWN | Table I Ec fit values across treatments | arXiv:1705.05982, Table I | full_text | preprint | `q_spoil_tls_Ec` | extracted |
| EXP-Q-015 | SRC-062 | TLS fit exponent range from cavity set | 0.25 to 0.42 | dimensionless | UNKNOWN | Table I beta fit values across treatments | arXiv:1705.05982, Table I | full_text | preprint | `q_spoil_tls_beta` | extracted |
| EXP-Q-016 | SRC-062 | Electric-field filling factor (5 nm oxide) | ~3e-9 | dimensionless | UNKNOWN | TM010 simulation with epsilon~33 | arXiv:1705.05982, Eq. (4) discussion | full_text | preprint | oxide-participation lane | extracted |
| EXP-Q-017 | SRC-062 | Electric-field filling factor (100 nm oxide) | ~6e-8 | dimensionless | UNKNOWN | TM010 simulation with epsilon~33 | arXiv:1705.05982, Eq. (4) discussion | full_text | preprint | oxide-participation lane | extracted |
| EXP-Q-018 | SRC-062 | Inferred TLS loss tangent from saturated-Q estimate | ~1e-2 | dimensionless | UNKNOWN | Uses Q~3e10 and F*delta_TLS~1/Q relation | arXiv:1705.05982, Eq. (3) fit discussion | full_text | preprint | `q_spoil_tls_delta` | extracted |
| EXP-Q-019 | SRC-062 | Nitrogen pressure used in condensed-gas low-field test | 1e-4 | Torr | UNKNOWN | Cooldown in nitrogen; no observable LFQS change | arXiv:1705.05982, experiment notes | full_text | preprint | contamination-control lane | extracted |
| EXP-Q-020 | SRC-023 | Hydride/Q-disease spoil-factor relative uncertainty (measured-ratio spread) | 0.053 | relative | k=1 (half-range/mean over measured ratio pair {20,18}) | Derived from measured spoil-factor ratios `EXP-Q-001/EXP-Q-002=20` and corroborating SRF run `EXP-Q-003/EXP-Q-002=18` | Supercond. Sci. Technol. 26(10) 102001 + corroborating SRF proceedings lane | full_text | primary | `u_q0_rel:hydride`,`u_f_rel:hydride` | extracted |
| EXP-Q-021 | SRC-022 | Trapped-flux lane relative uncertainty anchor (measured sensitivity spread) | 0.625 | relative | k=1 (half-range/mean over 0.9 to 3.9 nOhm/mG) | Derived from trapped-flux sensitivity spread in the trapped-flux mechanism lane | Phys. Rev. ST Accel. Beams 17, 012001 trapped-flux sensitivity lane | full_text | primary | `u_q0_rel:trapped_flux`,`u_f_rel:trapped_flux` | extracted |
| EXP-Q-022 | SRC-021 | TLS/oxide lane relative uncertainty anchor (measured fit-range spread) | 0.857 | relative | k=1 (half-range/mean over Ec range 0.02 to 0.26 MV/m) | Derived from low-field TLS fit spread (`EXP-Q-014`) with journal-companion SRF low-field Q-slope semantics | Phys. Rev. Lett. 119, 264801 + companion full-text fit lane | full_text | primary | `u_q0_rel:tls_oxide`,`u_f_rel:tls_oxide` | extracted |

## Casimir Sign-Control Extraction

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-CS-001 | SRC-017 | Distance band where sign behavior differs (off-stoichiometric lane) | 3 to 100 | nm | UNKNOWN | Attraction predicted in this interval under selected model assumptions | Phys. Lett. A 531 (2025) 130162 abstract/introduction surfaces | full_text | primary | `casimir_sign_window_nm` | extracted |
| EXP-CS-002 | SRC-017 | Distance band with repulsive behavior reported by model lane | >=100 | nm | UNKNOWN | Repulsion predicted above this separation in same lane | Phys. Lett. A 531 (2025) 130162 abstract/introduction surfaces | full_text | primary | `casimir_sign_window_nm` | extracted |
| EXP-CS-003 | SRC-016 | Measured force sign change (dissimilar materials in fluid) | SIGN_CHANGE_OBSERVED | categorical | UNKNOWN | Gold-coated sphere + silica plate in bromobenzene | Nature 457, 170-173; arXiv:0705.3793 intro/results context | full_text | primary | `casimir_sign_gate` | partial |
| EXP-CS-004 | SRC-018 | Predicted sign transition in magnetic-fluid setup | SIGN_CHANGE_PREDICTED | categorical | UNKNOWN | PTFE/polystyrene configuration in ferrofluid lane | arXiv:2601.00483 abstract/introduction | full_text | preprint | exploratory sign-control lane | partial |
| EXP-CS-005 | SRC-016 | Sphere diameter in fluid-force measurement setup | 42.7 | um | +/-0.2 um | Gold-coated polystyrene sphere in ethanol setup | arXiv:0705.3793, experiment description | full_text | primary | measurement conditions | extracted |
| EXP-CS-006 | SRC-016 | Gold coating thickness on sphere and plate | 100 | nm | UNKNOWN | Additional 10 nm on sidewalls for continuity | arXiv:0705.3793, experiment description | full_text | primary | materials stack lane | extracted |
| EXP-CS-007 | SRC-016 | Ethanol dielectric reduction factor used for electrostatic screening | 24.3 | dimensionless | UNKNOWN | Electrostatic calibration in ethanol | arXiv:0705.3793, calibration section | full_text | primary | control-force lane | extracted |
| EXP-CS-008 | SRC-016 | Hydrodynamic calibration velocity | 4.5 | um/s | UNKNOWN | Fast approach used for force-constant and contact-offset fit | arXiv:0705.3793, calibration section | full_text | primary | measurement conditions | extracted |
| EXP-CS-009 | SRC-016 | Casimir-Lifshitz measurement velocity | 45 | nm/s | UNKNOWN | Slow approach used for Casimir-Lifshitz force data | arXiv:0705.3793, force-measurement section | full_text | primary | measurement conditions | extracted |
| EXP-CS-010 | SRC-016 | Casimir-Lifshitz force at 40 nm separation | -260 | pN | UNKNOWN | Gold sphere-gold plate in ethanol | arXiv:0705.3793, force comparison section | full_text | primary | force-magnitude lane | extracted |
| EXP-CS-011 | SRC-016 | Predicted repulsive force example (Au sphere over silica in ethanol) | 135 | pN | UNKNOWN | 100 um radius sphere at 50 nm separation | arXiv:0705.3793, discussion section | full_text | primary | repulsive-branch lane | extracted |
| EXP-CS-012 | SRC-018 | Magnetite nanoparticle diameter used in baseline ferrofluid model | 20 | nm | UNKNOWN | Toluene ferrofluid baseline | arXiv:2601.00483, Fig. 1-4 captions and setup text | full_text | preprint | `casimir_sign_window_nm` | extracted |
| EXP-CS-013 | SRC-018 | Magnetite volume fractions explored | 1, 5, 10, 15 | % | UNKNOWN | PTFE-coated-metal / polystyrene across ferrofluid | arXiv:2601.00483, Fig. 4 caption and setup text | full_text | preprint | parametric sign-control lane | extracted |
| EXP-CS-014 | SRC-018 | Teflon thickness sweep in modeled transition study | 5, 10, 15, 20 | nm | UNKNOWN | Thickness effect on transition windows | arXiv:2601.00483, Fig. 3 caption and discussion | full_text | preprint | geometry-control lane | extracted |
| EXP-CS-015 | SRC-018 | Transition/trapping windows reported for modeled systems | 10 to 200; 30 to 300 | nm | UNKNOWN | Distance bands for sign changes and trapping regimes | arXiv:2601.00483, main text and appendix discussion | full_text | preprint | `casimir_sign_window_nm` | extracted |
| EXP-CS-016 | SRC-063 | Lifshitz free-energy equation used in off-stoichiometry model | `F(d)=sum_{m=0}^{infty} g(xi_m)=(k_B T/2pi) sum_m' integral dq q sum_sigma ln(1-r_21^sigma r_23^sigma e^{-2kappa_2 d})` | symbolic | UNKNOWN | Three-layer Ca6-xAl7O16 - methanol - PTFE lane | arXiv:2406.08058, Eq. (2), p.5 | full_text | preprint | `casimir_sign_gate` equation lane | extracted |
| EXP-CS-017 | SRC-063 | Fresnel-coefficient definition used for sign analysis | `r_TE^{ij}=(kappa_i-kappa_j)/(kappa_i+kappa_j); r_TM^{ij}=(epsilon_j kappa_i-epsilon_i kappa_j)/(epsilon_j kappa_i+epsilon_i kappa_j)` | symbolic | UNKNOWN | Matsubara-frequency decomposition with `kappa_i=sqrt(q^2+epsilon_i xi_m^2/c^2)` | arXiv:2406.08058, Eq. (3), p.5 | full_text | preprint | `casimir_sign_gate` equation lane | extracted |
| EXP-CS-018 | SRC-063 | Retarded sign-reversal distances (metallic phases) | 2.0; 5.9 | nm | UNKNOWN | Ca6Al7O16 and Ca5.75Al7O16 in methanol/PTFE lane | arXiv:2406.08058, Fig. 5 discussion | full_text | preprint | `casimir_sign_window_nm` | extracted |
| EXP-CS-019 | SRC-063 | Free-energy extrema around sign-transition | 2.9; 9.49 | nm | UNKNOWN | Maxima positions for Ca6Al7O16 and Ca5.75Al7O16 | arXiv:2406.08058, Fig. 5 caption | full_text | preprint | trap-location lane | extracted |
| EXP-CS-020 | SRC-063 | Long-range sign-reversal scale in iodobenzene lane | ~75 | nm | UNKNOWN | Insulating-phase case with retardation crossover | arXiv:2406.08058, Fig. 7/9 discussion | full_text | preprint | long-range sign-control lane | extracted |
| EXP-CS-021 | SRC-063 | Predicted long-range equilibrium minimum | ~0.11 | um | UNKNOWN | Mainly zero-frequency-driven minimum in insulating-phase lane | arXiv:2406.08058, Fig. 9 inset discussion | full_text | preprint | trap-location lane | extracted |
| EXP-CS-022 | SRC-063 | Dielectric ordering criterion for repulsive branch | `epsilon_1 > epsilon_2 > epsilon_3` | symbolic | UNKNOWN | Liquid-mediated repulsive Casimir-Lifshitz condition statement | arXiv:2406.08058, theory discussion section | full_text | preprint | material-ordering gate | extracted |
| EXP-CS-023 | SRC-018 | Static ferrofluid permeability relation used in sign-control model | `mu_tilde_m(0)=1 + (2*pi^2*Phi*Ms^2*D^3)/(9*k_B*T)` | symbolic | UNKNOWN | Magnetite nanoparticle ferrofluid effective-medium model | arXiv:2601.00483, Eq. (2), p.3 | full_text | preprint | magnetic-coupling lane | extracted |

## Worldline QEI Extraction

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-QEI-001 | SRC-051 | Inertial timelike Lorentzian scaling exponent (d=4) | -4 | exponent | UNKNOWN | 4D Minkowski timelike worldline average | arXiv:gr-qc/9410043 (Eq. 64/65 lane; lines 1498-1532) | full_text | primary | `scaling_ok` | extracted |
| EXP-QEI-002 | SRC-051 | Canonical Lorentzian prefactor (massless scalar lane) | 3/(32*pi^2) | dimensionless prefactor | UNKNOWN | Inertial timelike worldline inequality form | arXiv:gr-qc/9410043 (Eq. 64/65 lane; lines 1498-1532) | full_text | primary | `KDerivation` | extracted |
| EXP-QEI-018 | SRC-051 | Characteristic sampling width symbol in inertial Lorentzian bound | `tau0 > 0` | s | UNKNOWN | Worldline averaging window uses explicit `tau0` in the bound denominator power law | arXiv:gr-qc/9410043 (Eq. 64/65 lane; lines 1498-1532) | full_text | primary | `tau_s_ms`,`scaling_ok` | extracted |
| EXP-QEI-003 | SRC-052 | FE generalized smooth-sampler worldline QEI family | GENERAL_SMOOTH_SAMPLER_CLASS | categorical | UNKNOWN | Flat-space free scalar setting with smooth sampler assumptions | arXiv:gr-qc/9805024 (abstract and Eq. 1.7 lane; lines 10-17, 123-137) | full_text | primary | `samplingKernelIdentity`,`samplingKernelNormalization` | extracted |
| EXP-QEI-004 | SRC-052 | FE admissibility assumptions | smooth, even, nonnegative, normalized | categorical | UNKNOWN | Required sampler regularity conditions for parity claims | arXiv:gr-qc/9805024 (lines 237-240, 825-830) | full_text | primary | `normalize_ok`,`smoothness_ok` | extracted |
| EXP-QEI-005 | SRC-053 | Static-space-time QEI applicability context present | SHORT_SAMPLING_REQUIRED | categorical | UNKNOWN | Curved/static extensions require applicability window evidence | arXiv:gr-qc/9812032 (lines 90-95 and 1545-1548) | full_text | primary | `qei_worldline_applicability` | extracted |
| EXP-QEI-006 | SRC-054 | Stationary-worldline QEI lane available | STATIONARY_WORLDLINE_QEI | categorical | UNKNOWN | Constants/expressions can differ from inertial baseline | arXiv:2301.01698 (lines 27-32 and 272-275) | full_text | primary | worldline class guard | extracted |
| EXP-QEI-007 | SRC-055 | QEI review anchor for Hadamard/microlocal caveats | REVIEW_ANCHOR_PRESENT | categorical | UNKNOWN | Methodological caveat source for semantic governance | arXiv:math-ph/0501073 (review scope and assumptions sections) | full_text | primary | semantic governance lane | extracted |
| EXP-QEI-008 | SRC-056 | Spatially averaged QI non-existence in 4D | NO_SPATIAL_QI_4D | categorical | UNKNOWN | Timelike worldline averaging cannot be replaced by spatial averaging | arXiv:gr-qc/0208045 (lines 989-992) | full_text | primary | worldline class guard | extracted |
| EXP-QEI-009 | SRC-058 | Hadamard point-splitting formal expectation definition | STATE_DEPENDENT_LIMIT_FORM | symbolic | UNKNOWN | Stress tensor expectation as point-split limit in Hadamard state | arXiv:gr-qc/0512118 (Eq. 60; lines 1036-1049) | full_text | primary | `qeiOperatorMapping`,`qeiRenormalizationScheme` | extracted |
| EXP-QEI-010 | SRC-058 | Renormalized expectation value with conserved state-independent tensor | HADAMARD_REN_T_WITH_THETA | symbolic | UNKNOWN | Renormalized expression adds state-independent geometric tensor | arXiv:gr-qc/0512118 (Eq. 64; lines 1121-1127) | full_text | primary | `qeiOperatorMapping`,`qeiRenormalizationScheme` | extracted |
| EXP-QEI-011 | SRC-058 | Conservation constraint on renormalized stress tensor lane | CONSERVATION_CONSTRAINT_PRESENT | symbolic | UNKNOWN | Conservation requirement and dimensional branch conditions | arXiv:gr-qc/0512118 (Eq. 68 and odd-D branch; lines 1194-1206) | full_text | primary | `qeiOperatorMapping` | extracted |
| EXP-QEI-012 | SRC-058 | Trace anomaly branch in even dimensions | TRACE_ANOMALY_EVEN_D | categorical | UNKNOWN | Even-D anomaly present; odd-D conformal branch reports no anomaly | arXiv:gr-qc/0512118 (Eq. 83/84; lines 1442-1459) | full_text | primary | `qeiRenormalizationScheme`,`qeiStateClass` | extracted |
| EXP-QEI-013 | SRC-064 | Smearing normalization condition (2D canonical lane) | `integral_{-infty}^{infty} rho(xi) dxi = 1` | symbolic | UNKNOWN | Flanagan notation for smooth positive smearing function | arXiv:gr-qc/9706006, Eq. (1.1), p.1 | full_text | primary | `samplingKernelNormalization`,`normalize_ok` | extracted |
| EXP-QEI-014 | SRC-064 | Optimal 2D lower-bound form for averaged stress-energy | `min <E_T[rho]> = -(1/(24*pi)) integral (rho'(v)^2 / rho(v)) dv` | symbolic | UNKNOWN | 2D massless Minkowski worldline setting | arXiv:gr-qc/9706006, Eq. (1.8)/(2.5), pp.2-3 | full_text | primary | `KDerivation`,`samplingKernelConvention` | extracted |
| EXP-QEI-015 | SRC-064 | Smoothness/positivity extension note for compact support | `rho` smooth on all reals; compact-support-with-zero-elsewhere case allowed with interpreted `rho'^2/rho` at `rho=0` | categorical | UNKNOWN | Strictly positive and compact-support extension discussion | arXiv:gr-qc/9706006, discussion around Eq. (1.8), p.2 | full_text | primary | `smoothness_ok`,`samplingKernelConvention` | extracted |
| EXP-QEI-016 | SRC-052 | FE derivation convention bridge between weighting and helper function | `g(omega)=fhat^(1/2)(omega)/sqrt(2*pi)` with `g * g = fhat` | symbolic | UNKNOWN | Establishes explicit `f`-weight vs helper-`g` mapping in FE derivation | arXiv:gr-qc/9805024, Eq. (3.1)/(3.2), p.5 | full_text | primary | `samplingKernelConvention`,`samplingKernelNormalization` | extracted |
| EXP-QEI-017 | SRC-065 | Adaptive Gauss-Kronrod integrator contract for normalization checks | `dqag` uses globally adaptive Gauss-Kronrod with target `abs(I-result) <= max(epsabs, epsrel*abs(I))`; selectable 15/21/31/41/51/61-point pairs | symbolic | UNKNOWN | Numerical integration implementation for 1D oscillatory/non-oscillatory integrands | QUADPACK `dqag.f` prologue + `dqk15..dqk61` headers | full_text | standard | `normalize_ok`,`u_rho_bar`,`integrationErrorEstimate` | extracted |

## QCD Analog Extraction

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-QCD-001 | SRC-069 | Collision centre-of-mass energy | 200 | GeV | UNKNOWN | Proton-proton collisions at STAR/RHIC | Nature 650 (2026), Experiment section | full_text | primary | `qcd_collision_energy_gev`,`qcd_relative_polarization` | extracted |
| EXP-QCD-002 | SRC-069 | Selected minimum-bias event count | ~600000000 | events | UNKNOWN | Primary vertex within 60 cm from detector center along beam axis | Nature 650 (2026), Data analysis section | full_text | primary | `qcd_event_count` | extracted |
| EXP-QCD-003 | SRC-069 | Beam speed context for vacuum-excitation step | 99.996 | % c | UNKNOWN | Method step describing proton acceleration before collision | Nature 650 (2026), Analysis method step 1 | full_text | primary | `qcd_collision_kinematics` | extracted |
| EXP-QCD-004 | SRC-069 | Relative polarization signal (short-range Lambda-Lambda_bar pairs) | 0.181 | dimensionless | +/-0.035 (stat), +/-0.022 (syst) | Relative polarization reported by STAR from Lambda-Lambda_bar pair analysis | Nature 650 (2026), Results/main text and abstract summary | full_text | primary | `qcd_relative_polarization` | extracted |
| EXP-QCD-005 | SRC-069 | Relative polarization significance | 4.4 | sigma | UNKNOWN | Significance of non-zero relative polarization signal | Nature 650 (2026), Results/main text summary | full_text | primary | `qcd_significance_sigma` | extracted |
| EXP-QCD-006 | SRC-069 | Dataset collection year | 2012 | year | UNKNOWN | STAR detector data-taking context for the p+p run | Nature 650 (2026), Experiment section | full_text | primary | `qcd_run_context_year` | extracted |
| EXP-QCD-007 | SRC-070 | HEPData collection DOI anchor | `10.17182/hepdata.159491` | DOI | UNKNOWN | STAR HEPData collection linked to the Nature publication | HEPData record 159491, citation panel | full_text | primary | `qcd_dataset_anchor` | extracted |
| EXP-QCD-008 | SRC-070 | HEPData versioned DOI anchor | `10.17182/hepdata.159491.v1` | DOI | UNKNOWN | Versioned collection DOI for reproducible table references | HEPData record 159491, citation panel | full_text | primary | `qcd_dataset_anchor` | extracted |
| EXP-QCD-009 | SRC-070 | HEPData table count for released dataset bundle | 6 | tables | UNKNOWN | Figure datasets `t1..t6` published for the analysis | HEPData record 159491, Data tables section | full_text | primary | `qcd_dataset_tables` | extracted |
| EXP-QCD-010 | SRC-070 | Long-range relative polarization signal (Lambda-Lambda_bar pairs) | 0.020 | dimensionless | +/-0.023 (stat), +/-0.022 (syst) | Long-range pair species row (`x=1`) from Fig. 3b table | HEPData table `10.17182/hepdata.159491.v1/t4`, Data from Figure 3 b) | full_text | primary | `qcd_relative_polarization_long`,`qcd_decoherence_contrast` | extracted |
| EXP-QCD-011 | SRC-070 | Short-vs-long polarization contrast magnitude | 0.161 | dimensionless | derived from table rows | `|P_short|-|P_long|` using short-range `t3/x=1` and long-range `t4/x=1` rows | HEPData tables `t3` and `t4`, replay derivation | full_text | primary | `qcd_decoherence_contrast` | extracted |
| EXP-QCD-012 | SRC-070 | Delta-R near-window mean absolute polarization (`DeltaR<=1.0`) | 0.1405 | dimensionless | table-level mean, no covariance published | Mean of absolute `P` over bins `[0,0.5]` and `[0.5,1.0]` | HEPData table `10.17182/hepdata.159491.v1/t5`, Data from Figure 4 | full_text | primary | `qcd_decoherence_vs_separation` | extracted |
| EXP-QCD-013 | SRC-070 | Delta-R far-window mean absolute polarization (`DeltaR>=1.5`) | 0.0045 | dimensionless | table-level mean, no covariance published | Mean of absolute `P` over bins `[1.5,2.0]` and `[2.0,3.0]` | HEPData table `10.17182/hepdata.159491.v1/t5`, Data from Figure 4 | full_text | primary | `qcd_decoherence_vs_separation` | extracted |
| EXP-QCD-014 | SRC-070 | Delta-R near/far polarization ratio | 31.222222 | ratio | derived from EXP-QCD-012/013 | `mean_abs_near/mean_abs_far` for decoherence-trend bookkeeping | HEPData table `t5`, replay derivation | full_text | primary | `qcd_decoherence_vs_separation` | extracted |

## GR Observable Extraction (Mercury Perihelion)

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-GR-001 | SRC-075 | Einstein Mercury anomalous perihelion advance benchmark | 43 | arcsec/century | UNKNOWN | Residual perihelion advance beyond Newtonian perturbation model in the 1915 GR explanation context | Einstein (1915) archival record (`Erklarung der Perihelbewegung des Merkur ...`) | full_text | primary | `gr_observables.mercury_perihelion.observed_arcsec_per_century` | extracted |
| EXP-GR-002 | SRC-076 | Weak-field GR perihelion advance per-orbit expression | `Delta_varpi_per_orbit = 6*pi*G*M_sun/(a*(1-e^2)*c^2)` | symbolic | UNKNOWN | Schwarzschild weak-field solar-system approximation for Mercury perihelion advance | Will (2014), perihelion-advance test context | full_text | primary | `gr_observables.mercury_perihelion.formula`, `gr_observables.mercury_perihelion.predicted_arcsec_per_century` | extracted |
| EXP-GR-003 | SRC-076 | Orbit-to-century conversion expression for perihelion advance | `arcsec_per_century = Delta_varpi_per_orbit * arcsec_per_rad * (36525/orbital_period_days)` | symbolic | UNKNOWN | Conversion from per-orbit radians to arcseconds per Julian century | Will (2014), observational-test conversion context | full_text | primary | `gr_observables.mercury_perihelion.predicted_arcsec_per_century` | extracted |
| EXP-GR-004 | SRC-076 | Mercury perihelion test role in post-Newtonian validation program | CLASSIC_SOLAR_SYSTEM_TEST | categorical | UNKNOWN | Source classifies perihelion advance as a canonical GR weak-field test observable | Will (2014), Living Reviews test-summary scope | full_text | primary | `gr_observables.mercury_perihelion.status`, `comparison_result.status` | extracted |
| EXP-GR-005 | SRC-076 | Source-surface explicit uncertainty anchor for observed perihelion benchmark | UNKNOWN | arcsec/century | UNKNOWN | No explicit uncertainty value extracted in this pass from the source text surface; replay keeps tolerance in snapshot acceptance block | Will (2014), test-summary scope | full_text | primary | `gr_observables.mercury_perihelion.observed_uncertainty_arcsec_per_century` | partial |

## GR Observable Extraction (Lensing Deflection)

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-GR-006 | SRC-077 | Einstein weak-field light-deflection formula at impact parameter `b` | `alpha_limb_rad = 4*G*M_sun/(c^2*b)` | symbolic | UNKNOWN | Solar-limb deflection in weak-field GR | Einstein 1916 field-equation paper, weak-field light-path derivation context | full_text | primary | `gr_observables.lensing_deflection.formula` | extracted |
| EXP-GR-007 | SRC-077 | Einstein solar-limb deflection benchmark | 1.75 | arcsec | UNKNOWN | Predicted deflection for ray grazing the solar limb | Einstein 1916, solar-limb estimate context | full_text | primary | `gr_observables.lensing_deflection.predicted_limb_arcsec` | extracted |
| EXP-GR-008 | SRC-078 | Eclipse reduction starlight deflection estimate (solar-limb class) | 1.98 | arcsec | +/-0.16 | Historical eclipse reduction aggregate used as observational anchor | Dyson/Eddington/Davidson 1920 eclipse reductions | full_text | primary | `gr_observables.lensing_deflection.historical_observed_arcsec`,`gr_observables.lensing_deflection.historical_uncertainty_arcsec` | extracted |
| EXP-GR-009 | SRC-079 | Modern deflection PPN gamma estimate | 0.9998 | dimensionless | +/-0.0003 | VLBI/planetary deflection precision test context | Shapiro et al. PRL 2004 deflection test | full_text | primary | `gr_observables.lensing_deflection.modern_gamma_measured`,`gr_observables.lensing_deflection.modern_gamma_uncertainty` | extracted |
| EXP-GR-010 | SRC-079 | Modern gamma residual definition | `gamma_residual = gamma_measured - 1` | symbolic | UNKNOWN | PPN residual lane used for replay tolerance checks | Shapiro et al. PRL 2004, PPN comparison context | full_text | primary | `gr_observables.lensing_deflection.modern_gamma_residual` | extracted |

## GR Observable Extraction (Frame Dragging)

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-GR-011 | SRC-081 | GP-B GR frame-dragging prediction | 39.2 | mas/year | UNKNOWN | Earth-orbit frame-dragging channel for gyro precession | Everitt et al. PRL 2011 final results | full_text | primary | `gr_observables.frame_dragging.gpb_predicted_mas_per_year` | extracted |
| EXP-GR-012 | SRC-081 | GP-B measured frame-dragging precession | 37.2 | mas/year | +/-7.2 | Same channel and analysis as EXP-GR-011 | Everitt et al. PRL 2011 final results | full_text | primary | `gr_observables.frame_dragging.gpb_observed_mas_per_year`,`gr_observables.frame_dragging.gpb_uncertainty_mas_per_year` | extracted |
| EXP-GR-013 | SRC-080 | LAGEOS frame-dragging measurement ratio | 0.99 | ratio | +/-0.10 | Ratio form relative to GR prediction in Ciufolini-Pavlis analysis | Ciufolini & Pavlis Nature 2004 | full_text | primary | `gr_observables.frame_dragging.lageos_observed_ratio`,`gr_observables.frame_dragging.lageos_uncertainty` | extracted |
| EXP-GR-014 | SRC-080 | LAGEOS expected GR ratio baseline | 1.00 | ratio | UNKNOWN | Baseline expected ratio lane used for residual comparison | Ciufolini & Pavlis Nature 2004 | full_text | primary | `gr_observables.frame_dragging.lageos_expected_ratio` | extracted |
| EXP-GR-015 | SRC-082 | LARES frame-dragging accuracy context | 0.6 | % | UNKNOWN | LARES confirmation context used as supplementary accuracy anchor | LARES confirmation analysis (`EPJ C 2019`) | full_text | primary | `gr_observables.frame_dragging.lares_accuracy_percent_reported` | extracted |

## GR Observable Extraction (Shapiro Delay)

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-GR-016 | SRC-083 | Shapiro delay formula anchor | `Delta_t_shapiro = (1+gamma)*(2*G*M_sun/c^3)*ln((r_E+r_R+R)/(r_E+r_R-R))` | symbolic | UNKNOWN | Radar echo-time delay in weak-field solar-system geometry | Shapiro 1964 PRL proposal | full_text | primary | `gr_observables.shapiro_delay.formula` | extracted |
| EXP-GR-017 | SRC-084 | Cassini PPN gamma-minus-one estimate | 2.1e-5 | dimensionless | +/-2.3e-5 | Cassini radio-science delay test | Bertotti et al. Nature 2003 | full_text | primary | `gr_observables.shapiro_delay.gamma_minus_one_measured`,`gr_observables.shapiro_delay.gamma_minus_one_uncertainty` | extracted |
| EXP-GR-018 | SRC-084 | Gamma reconstruction from gamma-minus-one | `gamma_estimated = 1 + (gamma_minus_one)` | symbolic | UNKNOWN | Deterministic replay mapping from measured `gamma-1` | Bertotti et al. Nature 2003, PPN gamma lane | full_text | primary | `gr_observables.shapiro_delay.gamma_estimated` | extracted |
| EXP-GR-019 | SRC-084 | Three-sigma absolute gamma-minus-one envelope (derived) | 6.9e-5 | dimensionless | derived (`3*2.3e-5`) | Conservative replay tolerance anchor when strict-source covariance is unavailable | Derived from Bertotti et al. 2003 reported uncertainty | full_text | primary | `gr_observables.shapiro_delay.max_abs_gamma_minus_one` | extracted |

## Warp-Family Geometry Extraction (Core-4)

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-WARP-001 | SRC-071 | Alcubierre ADM shift-only line element | `ds^2 = -dt^2 + (dx - v_s f(r_s) dt)^2 + dy^2 + dz^2` | symbolic | UNKNOWN | Standard Alcubierre chart with `alpha=1`, `gamma_ij=delta_ij` | Alcubierre 1994, Eq. (1)/(5) form in CQG paper | full_text | primary | `warp_metric_form`, `metric_form_alignment` | extracted |
| EXP-WARP-002 | SRC-071 | Alcubierre shift mapping anchor | `beta^x = -v_s f(r_s), beta^y=beta^z=0` | symbolic | UNKNOWN | Same chart as EXP-WARP-001 | Alcubierre 1994, shift definition lane | full_text | primary | `warp_shift_mapping`, `shift_mapping` | extracted |
| EXP-WARP-003 | SRC-071 | Alcubierre expansion/sign parity anchor | `theta_beta = D_i beta^i = -theta_Alc` | symbolic | UNKNOWN | Sign convention depends on `theta` definition (`div(beta)` vs `-TrK`) | Alcubierre 1994 + ADM convention mapping | full_text | primary | `warp_york_time_sign_parity`, `york_time_sign_parity` | extracted |
| EXP-WARP-004 | SRC-071 | Alcubierre wall-localized Eulerian energy density anchor | `rho_E <= 0` in wall region where `f'(r_s) != 0` | categorical | UNKNOWN | Flat-slice Alcubierre wall terms | Alcubierre 1994 stress-energy discussion | full_text | primary | `warp_metric_derived_t00_path`, `metric_derived_t00_path` | extracted |
| EXP-WARP-005 | SRC-072 | Natario metric definition anchor | `ds^2 = -dt^2 + sum_i (dx^i - X^i dt)^2` | symbolic | UNKNOWN | Def. 1.1 chart with spatial vector field `X` | Natario 2002, Def. 1.1 | full_text | primary | `warp_metric_form`, `metric_form_alignment` | extracted |
| EXP-WARP-006 | SRC-072 | Natario zero-expansion control condition | `div X = 0` | symbolic | UNKNOWN | Warp class constrained to zero expansion lane | Natario 2002, Cor. 1.5 | full_text | primary | `warp_natario_control_behavior`, `natario_control_behavior` | extracted |
| EXP-WARP-007 | SRC-072 | Natario geometry-derived stress identity anchor | `rho_E` tied to geometric terms (`TrK`, `K_ij K^ij`, spatial curvature) | symbolic | UNKNOWN | Geometry-first stress mapping, not free `T00` injection | Natario 2002, Thm. 1.7 | full_text | primary | `warp_metric_derived_t00_path`, `metric_derived_t00_path` | extracted |
| EXP-WARP-008 | SRC-073 | Van den Broeck conformal spatial metric anchor | `gamma_ij = B(r)^2 delta_ij` | symbolic | UNKNOWN | Pocket-compression geometry modifies spatial metric | Van Den Broeck 1999, geometry construction | full_text | primary | `warp_metric_form`, `metric_form_alignment` | extracted |
| EXP-WARP-009 | SRC-073 | Van den Broeck conditional Alcubierre reduction region | `B(r)=1` exterior region admits Alcubierre-like reduction | categorical | UNKNOWN | Conditional equivalence only in declared region | Van Den Broeck 1999, region construction | full_text | primary | `warp_conditional_comparability`, `metric_form_alignment` | extracted |
| EXP-WARP-010 | SRC-073 | Van den Broeck derivative-support requirement | `B'(r), B''(r)` required for full stress/curvature closure | symbolic | UNKNOWN | Region-II derivative support required for geometry-derived closure | Van Den Broeck 1999, pocket-support analysis | full_text | primary | `warp_metric_derived_t00_path`, `metric_derived_t00_path` | extracted |
| EXP-WARP-011 | SRC-074 | Lentz model-domain anchor | EINSTEIN_MAXWELL_PLASMA | categorical | UNKNOWN | Model assumptions differ from vacuum/ADM-only baseline | Lentz 2021, model statement | full_text | primary | `warp_assumption_domain` | extracted |
| EXP-WARP-012 | SRC-074 | Lentz geometry-first direct comparability status | NON_COMPARABLE_IN_CORE4_GEOMETRY_WAVE | categorical | UNKNOWN | Marked non-comparable for this geometry-first Core-4 wave without full EM-plasma closure mapping | Lentz 2021, scope mapping to local baseline | full_text | primary | `warp_comparison_blocker` | extracted |

## Warp-Family Energetics/QEI Extraction (Core-4)

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-WARP-013 | SRC-071 | Alcubierre wall-energy sign anchor | `rho_E <= 0` in wall support | categorical | UNKNOWN | Wall region where shaping-function gradients are non-zero | Alcubierre 1994 stress-energy discussion | full_text | primary | `warp_negative_energy_branch_policy` | extracted |
| EXP-WARP-014 | SRC-071 | Alcubierre explicit worldline-QEI anchor availability | WORLDLINE_QEI_NOT_EXPLICIT_IN_SOURCE | categorical | UNKNOWN | Source does not provide Fewster/Ford-Roman style sampler inequality derivation | Alcubierre 1994 full text scope | full_text | primary | `warp_qei_worldline_requirement` | extracted |
| EXP-WARP-015 | SRC-072 | Natario stress-source contract anchor | GEOMETRY_DERIVED_STRESS_IDENTITY_PRESENT | categorical | UNKNOWN | Stress lane tied to geometric identities in theorem context | Natario 2002, Thm. 1.7 | full_text | primary | `warp_stress_source_contract` | extracted |
| EXP-WARP-016 | SRC-072 | Natario explicit worldline-QEI anchor availability | WORLDLINE_QEI_NOT_EXPLICIT_IN_SOURCE | categorical | UNKNOWN | Source does not provide explicit worldline-QEI sampler inequality derivation | Natario 2002 full text scope | full_text | primary | `warp_qei_worldline_requirement` | extracted |
| EXP-WARP-017 | SRC-073 | Van den Broeck stress closure dependency anchor | REGION_II_DERIVATIVE_CLOSURE_REQUIRED | categorical | UNKNOWN | Full energetic closure requires derivative support (`B'`,`B''`) beyond conditional `B=1` domain | Van Den Broeck 1999, pocket-support analysis | full_text | primary | `warp_stress_source_contract`, `warp_conditional_comparability` | extracted |
| EXP-WARP-018 | SRC-073 | Van den Broeck explicit worldline-QEI anchor availability | WORLDLINE_QEI_NOT_EXPLICIT_IN_SOURCE | categorical | UNKNOWN | Source does not provide explicit worldline-QEI sampler inequality derivation | Van Den Broeck 1999 full text scope | full_text | primary | `warp_qei_worldline_requirement` | extracted |
| EXP-WARP-019 | SRC-074 | Lentz stress/energy domain anchor | POSITIVE_ENERGY_CLAIM_IN_EINSTEIN_MAXWELL_PLASMA_DOMAIN | categorical | UNKNOWN | Positive-energy claim occurs under model-specific EM-plasma assumptions | Lentz 2021 model statement | full_text | primary | `warp_negative_energy_branch_policy`, `warp_assumption_domain` | extracted |
| EXP-WARP-020 | SRC-074 | Lentz direct comparability to current local energetics/QEI baseline | NON_COMPARABLE_IN_CORE4_ENERGETICS_WAVE | categorical | UNKNOWN | Current local baseline is reduced-order ADM/vacuum lane with worldline-QEI guardrails; direct equivalence not asserted | Lentz 2021 scope mapping to local baseline | full_text | primary | `warp_comparison_blocker` | extracted |

## Provenance / Attestation Extraction

| entry_id | source_id | parameter | value | unit | uncertainty | conditions | paper_ref | extraction_method | source_class | maps_to_spec | status |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| EXP-PROV-001 | SRC-059 | Supply-chain transparency semantics | STEP_ORDER_AND_ACTOR_VERIFICATION | categorical | UNKNOWN | Verifier checks intended steps, right actor, and untampered materials between steps | in-toto spec v1.0 (lines 91-96) | full_text | standard | `provenance_step_contract` | extracted |
| EXP-PROV-002 | SRC-059 | Final-product verification requirements | LAYOUT_LINK_MATERIAL_PRODUCT_CHECKS | categorical | UNKNOWN | Verification includes signed layout, signed link metadata, and materials/products matching across steps | in-toto spec v1.0 (lines 510-523) | full_text | standard | `provenance_step_contract` | extracted |
| EXP-PROV-003 | SRC-059 | Link metadata schema fields | MATERIALS_PRODUCTS_BYPRODUCTS_SIGNED | categorical | UNKNOWN | Link metadata examples include `_type=link`, `materials`, `products`, `byproducts`, `signatures` | in-toto spec v1.0 (lines 1799-1813) | full_text | standard | `artifact_attestation_schema` | extracted |
| EXP-PROV-004 | SRC-060 | Attestation statement required fields | _TYPE_SUBJECT_PREDICATETYPE | categorical | UNKNOWN | Required fields: `_type`, `subject[*].digest`, `predicateType`; `predicate` optional | in-toto attestation statement v1.0 (Schema/Fields section) | full_text | standard | `artifact_attestation_schema` | extracted |
| EXP-PROV-005 | SRC-061 | CNCF maturity status for in-toto | CNCF_GRADUATED_2025 | categorical | UNKNOWN | Announcement states graduation and cites v1.0 specification history | CNCF announcement text (published 2025-04-23) | full_text | secondary | governance context only | extracted |

## Coverage Summary

| lane | sources attempted | extracted rows | partial rows | blocked rows |
|---|---:|---:|---:|---:|
| timing | 7 | 29 | 2 | 0 |
| nanogap | 6 | 32 | 0 | 0 |
| sem_ellipsometry | 14 | 33 | 8 | 0 |
| q_spoiling | 6 | 20 | 2 | 0 |
| casimir_sign_control | 4 | 21 | 2 | 0 |
| worldline_qei | 9 | 18 | 0 | 0 |
| qcd_analog | 2 | 14 | 0 | 0 |
| provenance_attestation | 3 | 5 | 0 | 0 |
| gr_observable_mercury | 2 | 4 | 1 | 0 |
| gr_observable_lensing | 3 | 5 | 0 | 0 |
| gr_observable_frame_dragging | 3 | 5 | 0 | 0 |
| gr_observable_shapiro | 2 | 4 | 0 | 0 |
| warp_family_geometry | 4 | 12 | 0 | 0 |
| warp_family_energetics_qei | 3 | 8 | 0 | 0 |

## Extraction Gaps (explicit)
1. Full IEEE 1588 and ISPCS 2009 numeric profiles are not extracted due access limits on full standard/proceedings text.
2. `SRC-016`, `SRC-018`, and `SRC-063` provide equation-level and quantitative anchors, but complete raw force-vs-gap traces with full covariance are still not extracted into this registry.
3. `SRC-025` remains non-admissible for normative claims and is retained only as intake context.
4. `CH-CS-001` is only partially populated with uncertainty-resolved numeric rows and remains non-promotable for hard-claim use.
5. `CH-SE-001` now has quantitative AFM uncertainty-model equations (`SRC-042`), ellipsometry reference anchors (`SRC-050`), and expanded NIST SRM Si/SiO2 transfer/addendum anchors (`SRC-085..SRC-093`) from direct PDF OCR; archive certificates still do not expose populated serial-specific certified-thickness tables in accessible surfaces, and in-house paired SEM+ellipsometry raw datasets plus numeric covariance anchors are still required to promote from `partial` to `pass`.
6. `CH-QEI-001` now has direct-source equation anchors for Ford-Roman, Fewster-Eveson, Flanagan normalization/optimal 2D bounds, Hadamard renormalization, and QUADPACK numerical-integration contracts, but still requires implementation-level sampler sweep artifacts to close `scaling_ok` and uncertainty propagation.
7. Provenance/attestation extraction is source-complete at schema level, but CI-integrated verification artifacts are still pending for promotion use.
8. `SRC-062` and `SRC-063` are preprint extraction lanes; journal-linked primary counterparts remain canonical for normative claim phrasing.
9. `SRC-065` is a numerical-methods implementation anchor and must be paired with theorem-level QEI sources when defining hard gate policy semantics.
10. `EXP-Q-020..EXP-Q-022` replace the prior policy-only uncertainty anchor with mechanism-specific measured-spread anchors and are tagged as reportable uncertainty anchors for the q-spoiling lane.
11. `CH-QCD-001` is exploratory and reference-only in this wave; multi-table replay now reproduces short-range significance (`t3`), long-range near-zero consistency (`t4`), and separation-trend decoherence metrics (`t5`) from HEPData (`artifacts/research/full-solve/qcd-analog-replay-2026-03-07.json`), while full event-level reconstruction remains pending.
12. `CH-WARP-001` is geometry-first and reference-only in this wave; Core-4 anchors are extracted, but conditional and non-comparable domains (notably VdB region support and Lentz EM-plasma assumptions) remain explicit blockers for strong cross-family equivalence claims.
13. `CH-WARP-002` is energetics/QEI reference-only in this wave; extracted anchors are categorical and assumption-domain scoped, while explicit in-paper worldline-QEI derivations remain missing and therefore non-promotable for hard equivalence claims.
14. `CH-GR-001` is reference-only in this wave; equation-level replay is deterministic, but explicit observed-uncertainty extraction from strict source text remains partial and is represented as `UNKNOWN` in the registry.
15. `CH-GR-002` and `CH-GR-003` are reference-only in this wave; observable anchors are extractable and deterministic, but full covariance/cross-instrument covariance models remain outside this replay scope.
16. `CH-GR-004` is reference-only in this wave; `gamma-1` replay is deterministic from source anchors, while acceptance tolerance remains a conservative replay band.

## Traceability
- `registry_id`: `casimir-tile-experimental-parameter-registry-2026-03-04`
- `commit_pin`: `latest`
- `owner`: `research-governance`
- `status`: `draft_v8`
- `extraction_mode`: `text-surface + PDF OCR (for scanned certificate pages)`
