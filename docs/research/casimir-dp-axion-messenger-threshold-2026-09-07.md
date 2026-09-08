Program gate: S1 — axion messenger matching.
Workstream: Explicit symmetry-breaking scalar threshold.
Capability or component: Leading finite A-squared/Higgs potential coefficient.
Current maturity: Conditional one-loop threshold, vanishing SM up Yukawa approximation.
Target maturity: Complete renormalized matching and two-target prediction.
Required frozen inputs: Published messenger parameters; previous scalar/triangle conventions.
Required evidence: Mass-eigenvalue expansion and independent high-precision potential evaluation.
Stop/fail criteria: No finite threshold identified with the full renormalized coupling without a boundary condition.
Explicit non-goals: Full beta functions, wavefunction matching, boxes, RG or protected cancellation claim.
Downstream gate unlocked: Boundary-conditioned matching refinement; S1 remains open.

# Heavy-messenger contribution to the missing scalar portal

The [axion proposal](https://arxiv.org/html/2609.04186v1), equations 8–9, supplies a vector-like up-quark messenger with couplings yL and yR. This packet derives its leading finite contribution to the additional operator identified in the potential-closure audit. No parameter is adjusted after observing the result.

## Derivation

In a real neutral Higgs background h, temporarily neglect the small Standard Model up-quark Yukawa. The Dirac mass matrix connecting (uL,UL) to (uR,UR) is

    M = [[0, b], [i c, MU]],
    b=yL h/sqrt(2), c=yR A.

Let t+ and t- be the eigenvalues of MdagM. They obey t++t-=MU^2+b^2+c^2 and t+t-=b^2c^2. The fermion contribution to the MS-bar Coleman-Weinberg potential is

    V1 = -Nc/(16 pi^2) sum_(+,-) t^2 [log(t/muR^2)-3/2].

This uses four degrees of freedom per colored Dirac mass eigenstate. The standard fermionic sign and multiplicity are also displayed in the effective-potential treatment of [Ghorbani, EPJC 2025](https://doi.org/10.1140/epjc/s10052-025-14841-3); its specific model and renormalization conditions are not imported here.

To fourth order in the backgrounds,

    t+ = MU^2+b^2+c^2-b^2c^2/MU^2+...,
    t- = b^2c^2/MU^2+... .

The light eigenvalue contributes to V1 only at eighth order. If F(t)=t^2[log(t/muR^2)-3/2], the heavy eigenvalue's mixed coefficient is

    F''(MU^2)-F'(MU^2)/MU^2 = 2.

Hence the finite quartic threshold is

    delta V = -Nc/(8 pi^2) b^2 c^2
            = -Nc yL^2 yR^2/(8 pi^2) A^2 HdagH,
    delta kappaA = -Nc yL^2 yR^2/(4 pi^2),

where V contains kappaA A^2 HdagH/2. It can be rewritten in the prior mass-subtracted convention by shifting the A mass counterterm. Holding the renormalized physical ma fixed is a matching condition, not evidence that the messenger gives no mass correction.

There is no logarithmic mixed quartic at this order in the yu=0 limit: tr[(MdagM)^2]=(MU^2+b^2+c^2)^2-2b^2c^2 has no b^2c^2 term. An arbitrary estimate proportional to yL^2 yR^2 log(MU/muR) would miss this cancellation. Finite matching can still generate the allowed operator. With the SM up Yukawa restored, additional terms and their running require separate treatment.

The absence of explicit MU suppression for this dimensionless threshold at fixed yL,yR is consistent with a renormalizable quartic. If gu is held fixed while MU is varied, the messenger Yukawas cannot both remain fixed; that different parameter trajectory must be declared.

## Numerical evidence and impact

For Nc=3, yL=0.20 and yR=0.0032,

    delta kappaA = -3.11259e-8.

The source messenger relation gives gu=5.57087e-5 at MU=2 TeV and v=246.2 GeV, within one percent of the rounded 5.6e-5 used in earlier tree packets. The calculation records that rounding explicitly.

A 65-digit Decimal evaluation of the complete two-eigenvalue potential independently extracts the mixed coefficient by four background evaluations. With b^2/MU^2=c^2/MU^2 decreasing from 1e-4 to 1e-6, the coefficient approaches 2, with final relative deviation 1.0e-6. Results agree for renormalization scales MU/2, MU and 2MU. No floating-point cancellation is hidden by clipping.

Under the additional diagnostic boundary condition that the independent renormalized kappaA just above matching contributes zero, insert this threshold into the earlier finite triangle subset. At lambdaP=0.03, its triangle/tree ratio is -1.374e-8 at Q=0 and +8.409e-9 at Q=246 MeV. The threshold lies near the prior subset-cancellation value -3.00001e-8. That numerical proximity depends on the chosen ma, lambdaP and other parameters; it is not symmetry protected, statistically inferred, or a newly fitted point. It neither cancels all momenta nor eliminates other loop topologies.

A one-loop-generated quartic inserted into a one-loop triangle represents a selected contribution at two-loop order in the full theory. Its comparison with the suppressed minimal triangle is informative, but cannot be called a complete two-loop prediction. Full matching also includes other threshold diagrams and parameter/field renormalization.

## Remaining authority gap

The low-energy coupling is an independent renormalized boundary contribution plus threshold corrections and running. This finite threshold does not prove that the full coupling equals it. Wavefunction matching can also rescale pre-existing quartics; this packet isolates the yL^2 yR^2 potential term, rather than all terms involving lambdaP. Other explicit-breaking scalar operators, the nonzero up Yukawa, electroweak/QCD corrections and matching at the physical vacuum remain outside the calculation.

The next useful model work is to retain this derived threshold in the common parameter ledger, complete the other loop operators and state boundary assumptions. It does not justify spending effort tuning this accidental partial cancellation to match a local target. The existing two-target calculations still predict tiny local independent-nuclear signals, with full material and detector completion open.

Replay `C:\Python313\python.exe docs/research/casimir-dp-axion-messenger-threshold-2026-09-07.py`. Four checks pass: potential-coefficient convergence, scale cancellation, agreement with the rounded messenger coupling and vanishing threshold when a required coupling is absent. The previous triangle script is hash-authenticated and loaded without rerunning its outputs. Physics root/leaf documentation validation passes. The broader goal remains active.
