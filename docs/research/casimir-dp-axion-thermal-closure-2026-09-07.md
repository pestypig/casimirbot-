# Equilibrium thermal extension of the scalar closure screen

Exploratory calculation, September 7, 2026. This extends the [any-orientation screen](casimir-dp-axion-direction-envelope-2026-09-07.md) to include energy released by a canonical thermal target at 4 K. The scalar point-density Born/contact envelope and specified halo remain assumptions. A nominal temperature does not prove that the actual apparatus is in canonical equilibrium.

## Detailed balance and the negative-energy bound

Define S(q,omega) with positive omega denoting target energy gain. For a Gibbs state, exchanging initial and final states in its spectral sum gives

`S(q,-epsilon) = exp[-epsilon/(kBT)] S(-q,+epsilon)` for epsilon>0.

This follows directly from the ratio of Gibbs weights and rho(q)†=rho(-q); it does not require crystal inversion symmetry. The angular integral supplied by the isotropic halo majorant includes both q directions. The relation applies to the target Hamiltonian in equilibrium, not to a driven boundary or metastable energy reservoir.

Let F(v) be the unnormalized incident majorant from the preceding packet and etaF(0)=integral 4pi v F(v) dv. For any energy transfer its mean-inverse-speed kernel is at most etaF(0). A transition releasing epsilon is kinematically possible only if

`epsilon >= max(0, q²/(2m_chi) - q vmax)`

when q exceeds the nonnegative-energy domain. Detailed balance and the density norm/closure inequality therefore bound the negative-energy contribution by replacing its integrated spectral weight with

`Aabs² exp[-max(0,q²/(2m_chi)-q vmax)/(kBT)]`,

where Aabs=sum_j |c_j|. This is deliberately generous below q0=2m_chi vmax, where the exponential envelope is one. The positive-energy bound is retained separately; using closure independently for both signs overcounts available weight and remains conservative.

Writing T_E=kBT in energy units, the resulting q² integral is `q0²+Jtail`, with

`Jtail = 2m_chi T_E + q0 sqrt(pi m_chi T_E/2) erfcx[q0/sqrt(8m_chi T_E)]`.

The bound on negative-energy rate divided by the preceding positive-energy rate bound is

`Bminus = c_km² etaF(0) (q0²+Jtail)/(4m_chi² MF)`,

where MF=integral 4pi v³ F(v) dv and c_km converts the stored km/s velocities to natural units. The total exponent bound is `(1+Bminus) Dplus_bound`. The finite limit of this loose bound as T approaches zero is not a predicted zero-temperature de-excitation rate: replacing all sub-q0 Boltzmann factors by one discarded that information.

## Benchmark result and limitation

At 4 K, T_E=3.44693330e-13 GeV. For the central halo and portal quartic 0.03:

| Quantity | Value |
|---|---:|
| Previous nonnegative-energy exponent bound | 3.36943e-15 |
| Negative/positive bound ratio | 4.38152 |
| Total equilibrium exponent bound | 1.81327e-14 |
| Jtail/q0² | 1.22788e-10 |

The total remains about 1.63e12 below the DP comparator. It is not an estimate of the actual thermal enhancement and is not added to the independent-nucleus forecast. It replaces the preceding conservative scalar bound under the extra equilibrium assumption. It does not introduce a four-cell boundary contrast.

This removes equilibrium energy release as an obvious loophole inside the scalar contact model, while retaining the high-momentum envelope caveat. The tail formally extends to infinite momentum under that envelope; the calculation is not proof that the physical relativistic/UV amplitude obeys it there. Non-equilibrium preparation, drive power, different operators and full UV matching still need their own treatment.

The [script](casimir-dp-axion-thermal-closure-2026-09-07.py) authenticates the halo/closure parents and records [24 results](casimir-dp-axion-thermal-closure-2026-09-07.json). Four checks pass: analytic tail against independently rescaled quadrature, a finite Gibbs transition-pair check, inclusion of the positive bound, and positivity of the tail. The largest tail-integral disagreement is 5.56e-16 relative. Root/leaf validation passes. These are consistency checks of this derivation, not proof of actual apparatus equilibrium or full model admission.
