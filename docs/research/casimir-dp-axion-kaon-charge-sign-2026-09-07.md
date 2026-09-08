# Kaon charge-asymmetry sign test

September 7, 2026. Exploratory conditional screen. The preceding signed-branch packet was progress: it exposed a magnitude ambiguity requiring an additional observable. This packet finds that the reflected branch fails that additional sign test under the stated decay assumptions.

## Authenticated observable and assumptions

[PDG 2025 CP review](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-cp-violation.pdf), section 13.4, defines A_L with the positive-lepton rate first and reports A_L=+0.00332±0.00006. Equations 13.45 and the following paragraph relate it to |q/p| assuming equal magnitudes of CP-conjugate right-sign semileptonic amplitudes and vanishing wrong-sign amplitudes. The review distinguishes convention-dependent mixing epsilon from the decay-defined quantity; its approximate relation to Im M12 requires specified weak phases. These conditions are essential here. [KTeV's original measurement](https://arxiv.org/abs/hep-ex/0202016) independently reports a positive electron-mode asymmetry, 0.003322±0.000058(stat)±0.000047(sys). Do not combine this with the average as independent data.

## Calculation and its limits

In a reference convention with the neglected decay phase set to zero, map the previous signed amplitude z to epsilon_tilde=z exp(i phi), and set q/p=(1-epsilon_tilde)/(1+epsilon_tilde). Then

```
A_mix = (1-|q/p|^2)/(1+|q/p|^2)
      = 2 Re(epsilon_tilde)/(1+|epsilon_tilde|^2).
```

This is an exact identity for the constructed q/p, not a full calculation of M12 and Gamma12 from the messenger model. Use phi=43.5 degrees as a reference and 45 degrees as an alternative. These are diagnostic phase choices, not a fitted phase prediction or an uncertainty band. The previous positive SM reference and its opposing new amplitude are mapped together; a bare sign of a CKM kernel must never be inserted without this convention matching.

At yL=0.4173600, the magnitude-reflected central solution has z=-0.002228. It yields A_mix=-0.00323225 at 43.5 degrees, or -0.00315085 at 45 degrees. Both have the opposite sign from observation. An arbitrary flavor rephasing multiplies q/p by a unit phase and cannot change this result. A physical reflection epsilon_tilde to -epsilon_tilde instead inverts |q/p| and reverses A_mix. Thus the loophole in an absolute-value-only calculation is not automatically a viable physical branch.

For scale, allow unequal right-sign rates while retaining zero wrong-sign amplitudes. Define a=(|A+|^2-|Abar-|^2)/(|A+|^2+|Abar-|^2). The exact rate sum gives

```
A_L=(A_mix+a)/(1+A_mix*a),
a_required=(A_observed-A_mix)/(1-A_observed*A_mix).
```

The reflected reference requires a=0.00655218 (43.5 degrees), or 0.00647078 (45 degrees). This is a required compensating effect, not a generated prediction or permission to introduce an independent coupling. Wrong-sign amplitudes, absorptive changes or decay phases require their own calculation and constraints; the one-parameter reflection does not supply them. No significance is quoted because the reference mixing prediction lacks a full theory error and fit.

The reduced yL=0.0991678 reference gives A_mix=0.00277382 at 43.5 degrees. Its positive sign survives this particular sign screen, but its central magnitude is not a fit. The original yL=0.2 gives 0.00167051. Full signed CKM/QCD work remains necessary for either point.

## Decision for the shared-scattering goal

Deprioritize the reflected branch **under unchanged decay and absorptive assumptions**. Do not treat it as a rescue based on its kaon magnitude or favorable mediator correction. Reopening it requires an explicit same-model DeltaS=1/absorptive calculation that changes the invariant charge-asymmetry prediction while satisfying other kaon data. This is not an exclusion theorem for every flavor completion.

Continue the small-yL fixed-gu family with signed CKM constraints and heavy-scale QCD matching. Its increasing yR-dependent mass correction must be tracked. Neither branch changes the frozen apparatus or turns the very small local-scattering prediction into an explanation of the DP forecast. No full shared model is admitted.

## Replay

Run `C:\Python313\python.exe docs/research/casimir-dp-axion-kaon-charge-sign-2026-09-07.py`. The script SHA-authenticates the previous JSON. Four checks verify the epsilon identity, flavor-rephasing invariance, physical sign reflection, and reconstruction from the required decay asymmetry. The sibling JSON records the numerical results. Physics root-leaf documentation validation is separate from this conditional physical screen; no certificate claim applies.
