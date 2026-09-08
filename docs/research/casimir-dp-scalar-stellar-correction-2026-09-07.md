# Corrected stellar constraint intake and scalar dipole test

Program gate: S1. Exploratory external-constraint correction; no full-model exclusion.

## Source correction

[Bottaro, Caputo, Raffelt and Vitagliano, 2303.00778v2](https://arxiv.org/html/2303.00778v2), introduction and section 4.4, challenge the strong nuclear-bremsstrahlung limits in earlier work, including [2205.01669](https://arxiv.org/html/2205.01669v2). They recover a heavy-emitter squared-mass suppression and treat electron degeneracy and ion correlations. Their Higgs-portal weak-coupling bound is approximately sin(theta)<2e-10 for masses below about 1 keV; below roughly 0.5 eV, force measurements become more restrictive. This supersedes treating the earlier spectacularly small mixing limits as an uncontested improvement. It does not justify applying one weak-coupling bound to every trapping or screened completion.

The previous dated packets cautiously flagged 2205.01669 as constraint intake only. Preserve those snapshots, but use this correction in subsequent decisions. The original 3e-10 diagnostic was close to the corrected scale; it was never a claim of allowed parameter space. [Multi-field scalar production, 2407.17192](https://arxiv.org/abs/2407.17192), is a further lead for checking medium-dependent cancellations, not an imported numerical exclusion.

## Consequence for our fixed pilot

Applying sin(theta)=2e-10 to the authenticated 1 eV sphere coefficient gives D=3.33909e-16 (40 GeV) and 4.00914e-17 (100 GeV), within the same Born sphere momentum interval and halo assumptions. This merely changes the old reference by a factor 4/9. Formal target mixings are 9.40 million and 27.13 million times larger in sin(theta). These ratios are not a global stellar exclusion: production, absorption and escape at large coupling must be evaluated explicitly before asserting one. The branch remains a poor forecast-sized lead because its existing coherence, companion-spectrum and boundary problems persist independently of the disputed very strong bound.

## Independent elementary dipole check

For two nonrelativistic particles with scalar charges g1,g2, use center-of-mass coordinates r1=m2 r/(m1+m2), r2=-m1 r/(m1+m2). Their scalar dipole is

D_scalar=(g1 m2-g2 m1) r/(m1+m2)
        =mu (g1/m1-g2/m2) r.

For equal scalar charges, switching radiation from the electron to a nucleon gives the squared-mass suppression (me/mN)²=2.96148e-7 with mN=0.939 GeV. This explains why an unqualified heavy-emitter enhancement requires scrutiny. It is a dipole-limit check, not a full plasma emission calculation.

There is a possible cancellation when scalar charge/mass is equal for both partners. In our Higgs proxy, ge/me=sin(theta)/v and gN/mN=0.3 sin(theta)/v, so the difference is 0.7 sin(theta)/v. Its squared dipole coefficient relative to electron-only emission is 0.49, not zero. This toy two-body ratio must not be multiplied into a published stellar limit without accounting for the same interference and medium conventions already used there. Composition, nuclear binding, higher multipoles, multiple ions and plasma mixing can change the full rate.

Next-lead criterion: a scalar model claiming a stellar cancellation must specify its electron, proton and neutron couplings and demonstrate that cancellation across relevant media, while retaining the xenon and diamond amplitudes. The existing Higgs proxy does not satisfy even the elementary equal-charge/mass condition. Avoid introducing an independent electron coupling solely to evade a bound without a consistent interaction model.

## Reproduction

The companion JSON records the arithmetic. Reproduce the sphere numbers using K from `casimir-dp-dark-scalar-sphere-2026-09-07.json` at scalar_mass_GeV=1e-9 and D=K*(2e-10)**2*(1-(2e-10)**2). Divide sin(formal_theta_for_target) by 2e-10 for the mixing ratios. Use (0.00051099895/0.939)**2 and (1-0.3)**2 for the two dipole diagnostics. The input JSON SHA256 is f09759040f9a9b2e3b87fef034cb7e7ccc292e9974561b9a79e1d0f1080740d3.

