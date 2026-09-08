# Electroweak and Higgs running sensitivity

Exploratory snapshot, September 7, 2026. Previous turn evaluated broader qq finite matching. This packet replaces the imposed top/QCD trajectory with a coupled one-loop SM trajectory in the top-only Yukawa approximation. Frozen apparatus and microscopic couplings remain unchanged.

## Result

The partial imaginary kaon coefficient increases from **2.71679818396e-15** to **2.77451068954e-15 GeV^-2**, or **2.124284%**, with the same restricted high-energy boundary prescription and finite-matching scope. The mixed hard coefficient is recomputed using the new high-scale top Yukawa.

The trajectory includes g, gp, gs, yt, Lambda and m2. Bottom, charm, other light-quark and lepton Yukawas remain zero. These zero-Yukawa choices are preserved by this restricted one-loop SM system. Dimension-six feedback into the SM input trajectory is not included; the dimension-six coefficients evolve on the prescribed SM solution.

| Parameter | 162.6 GeV input | 2 TeV value |
|---|---:|---:|
| g | 0.652956946 | 0.639382179 |
| gp | 0.357314193 | 0.362373825 |
| gs | 1.164975548 | 1.020982149 |
| yt | 0.934001321 | 0.834165660 |
| Lambda | 0.257776860 | 0.176576333 |
| m2, GeV^2 | 7812.5 | 8309.065507 |

## Input convention

The low values are diagnostic tree-derived inputs: g=2MW/v, e=sqrt(4 pi alpha_e), gp=eg/sqrt(g^2-e^2), Lambda=125^2/v^2 and m2=125^2/2, with v=246.2 GeV, MW=80.379 GeV and the prior alpha_e ledger. The installed library uses a Higgs quartic normalization for which MH^2=Lambda v^2 at tree level, rather than MH^2=2 Lambda v^2. Its local `smpar.py` conversion confirms this convention.

These assignments are not a finite pole-to-running electroweak input conversion. The partial result must not be presented as an on-shell/MS-bar matched prediction merely because these values are used consistently within the diagnostic.

## Verification

The [script](casimir-dp-axion-ew-higgs-running-2026-09-07.py) authenticates the preceding definitions, integrates explicit scalar beta equations and independently compares them at five scales against the previously authenticated library matrix beta function with zero dimension-six inputs. Maximum relative beta difference is **3.91e-16**. The scalar Higgs equation includes both its self interaction and gauge/top contributions; its mass parameter is evolved as well.

The coefficient integration at tolerances 1e-7 and 1e-9 gives the same partial coefficient within the declared 1e-8 relative threshold. [JSON](casimir-dp-axion-ew-higgs-running-2026-09-07.json) records all values and checks. The root-leaf documentation check passes separately. Installed and archived sources remain unchanged.

## Remaining scope

The finite calculation still includes selected current/qu terms plus broader qq matching only. Electroweak evolution generates additional coefficients whose finite matching and electroweak input effects have not all been included. The high-energy boundary remains incomplete. The 2.12% change is a controlled comparison of two approximations, not a total error estimate or an updated kaon bound.

Next inventory the additional generated operators and include their relevant matching response using consistent basis and input conventions, then test scale dependence. Complete the high-energy and low-energy matching requirements before revising the joint parameter screen. The two-target xenon/coherence prediction and model-admission status remain unchanged; the goal stays active.
