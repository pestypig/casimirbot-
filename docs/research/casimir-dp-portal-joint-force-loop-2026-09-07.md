# Joint classical-force and loop-drift screen

Program gate: S1 — same-parameter consistency.
Workstream: Restricted matched-portal family.
Capability or component: Simultaneous force and bubble-control conditions.
Current maturity: Conditional algebraic screen, not a full parameter fit.
Target maturity: A region satisfying both declared component requirements.
Required frozen inputs: Authenticated tree matching family, loop difference, common-halo kernel and canonical apparatus.
Required evidence: Matched coefficient identities, boundary solution and explicit force allowances.
Stop/fail criteria: No force improvement admitted while ignoring its loop cost; no declared tolerance called an experimental exclusion.
Explicit non-goals: Actual trap assumption, full renormalization, nonlinear combined apparatus or detection claim.
Downstream gate unlocked: Force-compatible lower-signal candidates or full one-loop matching; S1 remains open.

## Combined result

Within the restricted family with fixed heavy xenon coefficient C, matter coefficient aN, mu and heavy masses, a declared 10% limit on the two-scalar bubble's cross-scale drift gives Delta_lambda <= 0.401335. At the boundary, retaining the original leading light-scattering strength requires a large-cavity confinement threshold of 1.08731 MHz. The earlier 276.5 kHz endpoint does not meet this loop diagnostic.

A weaker light contribution can satisfy a smaller force allowance without changing C or the normalized background. At a hypothetical 100 kHz scalar-curvature allowance, the conditional common-halo rigid-vacuum envelope is D <= 2.3114e-6. At 10 kHz it is 2.3114e-10. These are component-model screens, not bounds on a fully solved chamber/material experiment or proof that either trap capability exists.

The tolerances and force allowances are parameters exposed for review. They are not fitted to an observed local residual. The frozen DP comparator, geometry, separation and hold remain unchanged.

## Exact tradeoff within the declared family

The matching identity gives achi aN = 2 Delta_lambda C. At fixed C and aN, achi is proportional to Delta_lambda. Preserving alpha = achi aN phi_vac^2/(4 pi) then makes phi_vac^2 proportional to 1/Delta_lambda. The chamber force curvature follows phi_vac^2, so

    f_force^2 Delta_lambda = constant

within this tree-level family and fixed normalized background. This identity explains why a stricter bubble diagnostic raises the confinement threshold.

The subtracted loop difference is characterized by L = 39.3471353 between the specified soft and hard scales. A declared fractional drift tolerance epsilon requires

    Delta_lambda <= 16 pi^2 epsilon/L.

The script solves the matching parameter b at this boundary for epsilon = 0.01, 0.1 and 0.3. These are calculational diagnostics rather than rigorous perturbative error bars. Passing this one bubble screen does not bound all omitted diagrams or fix an absolute one-loop contact coefficient.

## Ten-percent boundary point

| Parameter | Value |
|---|---:|
| b | 11.0881 GeV |
| kappa | 895.705 GeV |
| ychi | -0.901316 |
| achi | 8.07698e-4 GeV^-1 |
| aN | 1.79055e-7 GeV^-1, unchanged |
| CchiN | 1.80177e-10 GeV^-2, unchanged |
| Delta_lambda | 0.401335 |
| lambda_eff preserving reference light product | 7.82424e-23 |
| Large-cavity force threshold | 1.08731 MHz |
| Inherited conditional Higgs yield | 0.106950 |

The point passes the previous heuristic Yukawa/quartic domain and the same conditional Higgs-yield screen. It is not a loop-renormalized, globally allowed or experimentally admitted model. The small effective quartic and its threshold cancellation remain explicit. The heavy xenon component retains its previously calculated small high-energy expectation; it has not been fitted to one event.

## Lower-signal branch under a force allowance

At a boundary point above, increasing lambda_eff reduces alpha while preserving the normalized tree background and its fluctuation operator. Let s be the light-product ratio relative to the reference value. Since force curvature scales as s and the quadratic scattering envelope as s squared,

    s <= min[1, (f_allow/f_force)^2],
    lambda_eff >= lambda_eff(reference)/s,
    D_envelope <= D_reference s^2.

The reference envelope is the central-halo, 1 TeV, wind-perpendicular rigid-vacuum value 0.0323057. Choosing this component does not assert it bounds arbitrary chamber propagation or internal material responses. The chamber-only force condition likewise does not include a combined chamber/plate tensor. Both qualifications remain necessary when using the table.

| Assumed scalar-curvature allowance | Minimum lambda_eff | Conditional local D envelope |
|---|---:|---:|
| Diagnostic free hold, <=10% displacement growth | 1.1600e-9 | 1.4697e-28 |
| 1 kHz | 9.2501e-17 | 2.3114e-14 |
| 10 kHz | 9.2501e-19 | 2.3114e-10 |
| 100 kHz | 9.2501e-21 | 2.3114e-6 |
| 1 MHz | 9.2501e-23 | 0.023114 |

The free-hold row uses f_allow = acosh(1.1)/(2 pi times 0.25 s), an explicit diagnostic from the prior force audit. It is not an assumption that the intended apparatus operates freely. No answer to the pending hold/confinement question has been inferred.

## Decision and verification

This establishes a conditional lower-signal region satisfying both the stated loop diagnostic and specified force allowances. It does not establish an observable shared explanation. A small or inaccessible local signal is an honest possible outcome of a common mechanism, and should not be increased by separately fitting local couplings.

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-joint-force-loop-2026-09-07.py`. Four checks pass: solved loop boundary, force-loop product identity, the declared Yukawa/quartic domain and inherited Higgs-yield condition. The adjacent JSON retains all three loop tolerances and five force allowances. Inputs are hash authenticated and parent output loops are not rerun.

Next either complete one-loop matching for a candidate with an explicit trajectory contract, or compare the lower-signal branch with other leads. Full light-medium transport and xenon light-channel response remain necessary; passing this restricted screen does not close them. S1 and the user goal remain active.
