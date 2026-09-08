# Mixed-nucleus scalar dipole cancellation screen

Program gate: S1. Exploratory candidate screen, not a stellar likelihood or admitted interaction.

## Question and assumptions

Can independent electron, proton and neutron scalar couplings eliminate the elementary electron-ion dipole source across multiple stellar compositions? The previous packet derived the charge/mass difference. Here nuclear charges are strictly additive, gA=Z gp+(A-Z) gn. Nuclear mass proxies retain measured isotope masses instead of assuming mA=A mN. Normalize ge/me=1 to remove the trivial zero-coupling solution. This is a new generic coupling diagnostic, not a modification of the fixed Higgs pilot.

[Multi-Field Effects on Scalar Production in Stars, v2](https://arxiv.org/html/2407.17192v2) treats several species and process-dependent plasma effects. Its equations (2.1)-(2.2) specify additive nucleon couplings with the approximation mA=A mN. We do not import its in-medium cancellations into this vacuum dipole test, or treat the test as a replacement for its thermal calculation.

Mass inputs are from [NIST hydrogen](https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=H), [helium](https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=He) and [oxygen](https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=O), with carbon-12 atomic mass 12 u by definition. The calculation subtracts Z electron rest masses. Electronic binding corrections and scalar derivatives of nuclear binding are not included; numerical precision is not a physical uncertainty estimate.

## Result

Define epsilonA=1-[Z gp+(A-Z)gn]/mA under the chosen normalization. Setting epsilonH=epsilonHe=0 uniquely gives gp=1.00727645232 u and gn=0.993476594835 u in this normalization. The remaining residuals are:

| Isotope | Dipole residual |
|---|---:|
| H1 | 0 |
| He4 | 0 |
| C12 | -0.000650992 |
| O16 | -0.000969224 |

A linear program minimizing the maximum absolute residual across these four species gives 0.000484377. This equal-weight minimax is a diagnostic choice, not a weighted stellar fit. The homogeneous constraint matrix for ge/me, gp and gn has rank three with these inputs: only the zero-coupling solution cancels every listed dipole exactly in this additive model. The normalized calculation excludes that trivial solution.

This happens because binding makes nuclear mass non-additive. With the idealization mA=A mN and equal gp=gn proportional to mN, every ratio would agree. Consequently an exact cancellation based solely on that mass approximation should not be promoted to a mixed-composition physical prediction.

## Implication for the next model

The residual is an amplitude coefficient, not a cooling luminosity or confidence limit. Its square is only one factor in a vacuum dipole rate. Stellar abundances, distributions, degeneracy, resonant mixing, screening, additional production channels and escape are still required. No exclusion of the high-mixing pilot follows from this calculation alone.

A possible stronger hypothesis is coupling to the full mass-energy response, including binding contributions, so that composite scalar charges track physical masses. That would require an explicit effective interaction and matching calculation; choosing nuclear charges independently after seeing this test would not provide one. Even a true dipole cancellation would leave higher multipoles, other channels and ordinary-force constraints to evaluate. It would also change the diamond and xenon charges consistently. This is the next specific theoretical lead if a scalar cancellation is pursued.

For now do not use a tuned hydrogen/helium cancellation to claim evasion of carbon/oxygen cooling, or vice versa. Preserve the existing Higgs pilot as a conditional null-scale reference while assessing complete alternative couplings.

## Reproduction

Run the companion Python script. It solves the two exact linear equations, verifies their residuals, runs the minimax linear program and checks its constraint residual. The JSON records coefficients, rank, residuals and sources. These checks verify this algebraic screen only; no runtime, GR, certificate or frozen-apparatus changes were made.

- `py` SHA256: `663f66023b902a7270b575b9735faa53b08abd9686d4fd7ce79b8d274077de72`
- `json` SHA256: `04f385a231d91ac1e9f7406099e075eda85021d9a755371addd7ba65ce029f54`
