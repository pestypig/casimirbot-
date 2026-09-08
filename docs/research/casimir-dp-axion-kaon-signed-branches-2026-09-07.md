# Signed kaon sensitivity and the magnitude ambiguity

September 7, 2026. Exploratory diagnostic. No confidence region, global fit, or model admission.

The previous turn made progress by converting the archived loop kernel to epsilon_K units. This packet changes the next action: a magnitude-only constraint has two branches, so reducing yL is not the only mathematical way to reproduce that magnitude. Phase-sensitive kaon observables are required before treating the second branch as physical.

## Conditional calculation

Let S denote a positive reference Standard Model amplitude in a fixed convention, and E(yL)>0 the opposing contribution from the authenticated conversion packet. The magnitude observable is |S-E|. For a target interval [O-w,O+w], the two nonnegative E intervals are

```
[max(0,S-O-w), S-O+w] and [S+O-w, S+O+w].
```

The first exists only if its upper endpoint is nonnegative. This calculation uses S=0.00216, O=0.002228 and w=1.96 sqrt(0.00018^2+0.000011^2), from the dated estimates discussed in [Botella et al., equations 21–28](https://link.springer.com/article/10.1140/epjc/s10052-022-10299-9). The Gaussian width is an illustrative sensitivity convention. The external SM estimate and the fixed-angle new kernel do not constitute a consistent joint fit; correlations and heavy-scale QCD uncertainty remain missing. These ranges must not be labeled 95% allowed regions.

| Algebraic branch | New contribution E | yL at M=2 TeV |
|---|---:|---:|
| Total keeps reference sign | 0 to 0.000285458 | 0 to 0.106394 |
| Total reverses reference sign | 0.00403454 to 0.00474146 | 0.400179 to 0.433864 |

At fixed nonzero gu, yL=0 is not a family member: yR=gu/sL diverges as yL tends to zero. A lower endpoint requires perturbativity and the other model constraints, not the kaon magnitude alone.

The earlier yL=0.0991678 point gives a reference total of 0.001912; its required same-sign SM amplitude to hit the measured central value is 0.002476. The original yL=0.2 requires 0.00323652. These required amplitudes are a more useful target for a refit than an unsigned NP allowance.

The reversed-sign central solution is yL=0.4173600, yR=0.001534227 at the same tree gu. Its illustrative total is -0.002228. Its first-row deficit is consistent with a small residual in the separately archived row-sum screen (0.403 standard deviations using that dated input alone), and its leading yR-squared mass correction is 0.22987 times the reference. This numerical coincidence does not qualify the model: the same CKM data cannot be silently reused as independent tests, and agreement in |epsilon| loses information about its phase relative to decay amplitudes.

## Consequences for the shared model

1. Retain both branches when checking magnitude constraints. Do not reject the entire aligned completion solely by imposing a small |epsilon_NP| allowance.
2. Next authenticate phase-sensitive kaon observables, including the semileptonic charge asymmetry and interference phases. Compute the rephasing-invariant mixing/decay predictions with the same CKM convention. The sign of Im M12 by itself is not an observable. Include absorptive mixing and decay amplitudes before asserting that the reversed-sign branch is excluded.
3. For any surviving branch, perform the consistent CKM and heavy-scale QCD calculation and update radiative scattering predictions. The conserved gu maintains only the leading pseudoscalar interaction; changes in yL and yR change other contributions.

The frozen apparatus, the extremely small predicted local scattering loss, and four-cell cancellation for homogeneous scattering are unchanged. Neither branch provides evidence of a gravitational cause or explains the DP forecast.

## Reproducibility

Run `C:\Python313\python.exe docs/research/casimir-dp-axion-kaon-signed-branches-2026-09-07.py`. It SHA-authenticates and imports only the previous script's definitions. The sibling JSON records both branches and their couplings. Checks verify magnitude-band endpoints, the reflected central solution, and the exclusion of zero mixing from the fixed-gu family. The repository physics root-leaf documentation check is separate from physical validation.
