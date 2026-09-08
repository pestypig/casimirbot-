# Baryonic mixing: predictive gap and a testable benchmark

Exploratory snapshot, September 7, 2026. This resolves what the current mediator specification does and does not predict; no new UV completion is asserted.

The baryonic scattering coefficient fixes gchi gB/MV². It does not fix the coefficient of the gauge-allowed photon/vector kinetic-mixing operator. A renormalized boundary, anomaly-canceling matter and threshold matching are required. Setting this coefficient to zero at one scale is an additional model assumption, not a consequence of specifying equal nucleon couplings.

[Ilten et al., Table 1](https://arxiv.org/html/1801.04847v2) use an illustrative baryonic-vector electron charge -e²/(4pi)² relative to gB. In magnitude this corresponds to r=alpha/(4pi)=5.80705e-4. This is a published benchmark, not a universal lower bound or a prediction for our unspecified UV completion. Their table neglects the small corresponding quark electromagnetic corrections; a complete calculation must restore the proton shift alongside the electron coupling.

The [script](casimir-dp-baryonic-mixing-benchmark-2026-09-07.py) compares this choice with the preceding no-replenishment maximum at initial excited fraction one. To recover the chosen present strength sigma_b f*=1e-45 cm², the electron-pair phase-space factor must satisfy:

| Mass | Required F, at most | r / critical value if F=1 |
|---|---|---|
| 10 GeV | 8.44e-4 | 34.4 |
| 15 GeV | 5.33e-3 | 13.7 |

These conditions inherit the approximate lifetime scale. No value for F is assumed, and neither point is excluded by this comparison alone. [JSON](casimir-dp-baryonic-mixing-benchmark-2026-09-07.json) records the source, values and exact charge-trace check.

For illustration of the threshold issue, the quark charge trace sum Nc Bq Qq is zero for u,d,s but 2/3, 1/3 and 1 for four, five and six active quark flavors. These are algebraic traces only. Their cancellation in the three-flavor sum does not establish vanishing physical photon mixing: nondegenerate thresholds, finite matching, hadronic polarization and the UV boundary remain. Conversely a nonzero trace is not a model-independent lower bound on the finite mixing.

Next calculate the electron-pair phase-space factor for the stated off-diagonal vector operator and compare it with these ceilings. That gives a definite assessment of this illustrative mixing choice while the full UV prediction remains open. If it fails, do not silently tune a mixing counterterm to retain the benchmark; record the failure and compare a separately specified alternative, including the pair-closed mass regime.

Frozen target inputs and the existing conditional rates are unchanged. Root-leaf validation and the exact trace check pass. Research goal remains active.
