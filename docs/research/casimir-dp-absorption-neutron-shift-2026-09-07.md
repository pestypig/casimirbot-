Program gate: S1 — common-interaction screening.
Workstream: Conditional neutron mapping and detector-acceptance target.
Capability or component: Shifted primary spectrum and raw-count screen.
Current maturity: Exploratory approximation.
Target maturity: Quantitative acceptance requirement for subsequent transport work.
Required frozen inputs: Archived projected-current convolution, shared coupling and raw KamLAND count.
Required evidence: Explicit mapping assumptions, single nucleon-count normalization and Poisson inversion.
Stop/fail criteria: No measured neutron-spectrum claim or exclusion without an authenticated acceptance.
Explicit non-goals: No current completion, detector simulation, background-subtracted likelihood or baseline retuning.
Downstream gate unlocked: Transport must be compared with an explicit conditional acceptance ceiling.

# Neutron energy-shift diagnostic

The previous convolution produced a conditional proton spectrum. This packet tests rigid removal-energy shifts while retaining its momentum/removal-energy correlations, spectator recoil and hard Pauli prescription. It also derives a raw-count screening condition that avoids the previously identified residual-count likelihood problem.

The primary [Furmanski and Sobczyk paper](https://harvest.aps.org/v2/journals/articles/10.1103/PhysRevC.95.065501/fulltext), table II, supplies a carbon neutron shell-model comparison with distinct energy and width parameters; it is not a full neutron spectral function. A preliminary manuscript search suggested a 2.76 MeV proton/neutron shift, but that statement was not recovered in the published text. Accordingly **2.76 MeV is a declared diagnostic shift here**, not an authenticated conversion formula. The zero and 5 MeV rows are comparison assumptions, not confidence endpoints. The model retains M=939 MeV specifically to isolate the shift; an exact neutron-mass and residual-level calculation remains outstanding.

## Conditional spectrum and normalization

Use `Sn(p,E)=Sp(p,E-delta)` normalized per nucleon on the shifted tabulated support. This is a rigid isospin ansatz, not a measured neutron response, and does not preserve known mirror-state splittings or independently determine correlated strength. No extra normalization factor is introduced by translation.

[The absorption paper](https://arxiv.org/html/2609.01592v1), equations 12–15, supplies carbon-number exposure 9.09e39 s and six neutrons per nucleus. Applying those stated factors once, with the same 247 MeV mass, 11.5 TeV scale and 0.3 GeV/cm^3 density, gives:

| Shift, MeV | Rate/sigma0 | Mean primary T, MeV | Conditional primary count |
|---:|---:|---:|---:|
| 0 | 0.300046 | 42.5746 | 64,404 |
| 2.76 | 0.287669 | 42.3047 | 61,747 |
| 5 | 0.277861 | 42.0876 | 59,642 |

The 2.76 MeV shift lowers this conditional rate by about 4.1%. This is a sensitivity result within the chosen ansatz, not evidence that all neutron-model uncertainty is small. Primary counts omit final-state interactions, subsequent emission, quenching, capture and selection. Exposure/livetime conventions inherited from the absorption paper still need independent reconciliation. These factors are not hidden in the nuclear rate.

## A detector-response target from raw counts

[KamLAND's original paper](https://arxiv.org/pdf/2108.08527) reports 18 raw candidates. For a single Poisson count, the one-sided classical 90% upper mean solves `Pr(N<=18 | mu90)=0.1`, giving mu90=24.75629. Treating all candidates as potential signal supplies a conservative signal-mean screen when backgrounds are nonnegative. This is not the absorption paper's CLs recast or a shape fit.

For the 2.76 MeV diagnostic, the mean acceptance would therefore have to satisfy

`acceptance <= 24.75629 / 61747.32 = 0.000400929`,

approximately **0.0401%**, to remain below that screen. Across the three diagnostic shifts the values are 0.0384–0.0415%. Acceptance here means the fraction of the same primary population entering the original selected sample, including its energy window and every relevant efficiency exactly once. The statement is conditional on the spectral model and stated primary normalization. Uncertain signal normalization and an unknown response prevent a physical exclusion. A mean neutron energy alone cannot establish a lower bound on acceptance.

This provides a substantive next test: authenticate whether transport and selection can place even a small fraction of these events in the selected window. If a defensible lower bound on that fraction exceeds the conditional ceiling after accounting for nuclear and normalization uncertainty, the benchmark fails this raw-count screen. Until then, do not promote the quoted 80 TeV recast bound or the calculation above to an independently established exclusion.

The [script](casimir-dp-absorption-neutron-shift-2026-09-07.py) and [JSON](casimir-dp-absorption-neutron-shift-2026-09-07.json) pass four checks: zero shift reproduces the archived rate; each binned spectrum integrates to the total; the Poisson CDF verifies the upper-mean inversion; count times derived acceptance reproduces that mean. `npm run validate:physics:root-leaf` passes. No physical-validation or certificate claim applies.
