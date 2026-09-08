# Vector electron-pair phase space and benchmark failure

Exploratory snapshot, September 7, 2026. Computes the previously unspecified electron-pair suppression and assesses the published illustrative mixing choice. The conclusion is specific to that benchmark and population history, not an experimental exclusion of exothermic dark matter.

## Derivation and checks

For `Ce (chi_bar gamma_mu chi_star)(e_bar gamma^mu e)` and splitting Delta much smaller than the dark mass, the heavy current is predominantly temporal. The angular-averaged electron trace is proportional to Eminus Eplus-me². With z=me/Delta and x=Eminus/Delta, the mass-normalized factor is

`F=30 integral[z,1-z] dx sqrt(x²-z²) sqrt((1-x)²-z²) [x(1-x)-z²]`.

An independent pair-invariant-mass representation is

`F=(5/2) integral[4z²,1] du (1-u)^(3/2) sqrt(1-4z²/u) (1+2z²/u)`.

Both vanish when 2me>=Delta and give F=1 at me=0. The width is `Gamma=Ce² Delta^5 F/(60 pi³)`. Its massless normalization agrees with the vector-portal expression in [the primary fixed-target calculation, appendix A](https://lss.fnal.gov/archive/2018/pub/fermilab-pub-18-148-a.pdf), after Ce=gD epsilon e/MV². This replaces the preceding approximate 4e9-second normalization with the coefficient and reduced-mass convention used by our contact benchmark.

The [script](casimir-dp-exothermic-vector-phase-space-2026-09-07.py) authenticates the rate ledger and evaluates both forms. Their agreement is better than 1e-14 absolutely for the tested open channels. Heavy recoil corrections of order Delta/mchi, momentum-dependent mixing and other decay modes remain omitted.

## Result at r=alpha/(4pi)

| Dark mass | F | Lifetime at sigma_b=1e-45 cm² | Maximum present strength / chosen benchmark |
|---|---|---|---|
| 10 GeV | 0.69648 | 1.25e15 s | 0.00106 |
| 15 GeV | 0.45827 | 1.27e16 s | 0.01074 |

The last column optimizes the cross section while keeping r fixed, initial excited fraction at most one, and elapsed time 4.35e17 s without replenishment. It uses the previously derived maximum tau_reference/(e t). It is not merely the surviving fraction at the reference cross section. [JSON](casimir-dp-exothermic-vector-phase-space-2026-09-07.json) retains all results.

Thus this illustrative mixing choice cannot reproduce the selected present strength for either light point within the stated history. The discrepancy is roughly factors 946 and 93, far beyond the percent-scale normalization refinement. A small proton electromagnetic correction cannot bridge it. The prior common xenon/carbon rates assumed the undepleted benchmark product and must not be retained as viable predictions for this specific mixing choice.

At the 40 and 100 GeV points electron-pair decay is closed; null lifetime fields mean this calculation does not assess their survival. Radiative channels, quark-level completion and other constraints remain open. The next comparison should examine that pair-closed regime or a separately specified suppressed-mixing completion, rather than silently reducing r after observing this failure.

The shared-rate framework and frozen apparatus are preserved. Script checks and root-leaf documentation validation pass. Goal remains active; no model is admitted.
