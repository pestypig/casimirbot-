# Heavy-box overlap and normalization check

September 7, 2026. Exploratory electroweak matching subset, no QCD or full-model admission. The preceding representation audit was progress: it located an applicable singlet source. This packet verifies one overlap with the archived full-theory calculation.

[Crivellin et al., 2204.05962v2](https://arxiv.org/pdf/2204.05962), supplementary equations S.3.3–S.3.5, gives equal Cqq^(1) and Cqq^(3) coefficients for U. Writing B_ij=xi_i*xi_j and Y_ij=(Yu Yu-dagger)_ij, each is

```
Cqq^(1,3)_ijij = -B_ij²/(256 pi² M²)
                 + B_ij Y_ij [3/2+log(mu²/M²)]/(128 pi² M²).
```

The source retains selected Yukawa terms and explicitly omits several gauge and small-Yukawa terms. Its SMEFT subtraction includes current-operator mixing into four-quark operators; the hard coefficient alone is not the full mixed box.

## Pure-heavy comparison

For Q_LL=(sbar_L gamma_mu d_L)², the down-component coefficient is Cqq^(1)+Cqq^(3). Converting from Lagrangian to Hamiltonian changes the sign. With the aligned B_sd=yL² lambda_u, the pure-heavy Hamiltonian coefficient is therefore

```
H_EFT = yL^4 lambda_u²/(128 pi² M²).
H_full = GF² MW²/(4 pi²) (D lambda_u)² S0(mT²/MW²).
```

Here D=b²/(M²+b²), b=yL v/sqrt(2). The normalization uses left-handed currents; replacing them with (1-gamma5) currents would introduce a factor of four. Use GF=1/(sqrt(2)v²) consistently at tree level for this comparison, rather than mixing rounded electroweak inputs. Since S0(X) approaches X/4, the expressions agree at leading order in 1/M².

At yL=0.2, M=2 TeV, H_full=1.58723025e-14 GeV^-2 and H_EFT=1.51497296e-14 GeV^-2. Their ratio is 1.0476954. It approaches 1.0104428 at 5 TeV, 1.0009209 at 20 TeV and 1.00001367 at 200 TeV. The finite-mass difference is a difference within this selected contribution, not a 4.8% uncertainty on the total kaon prediction. Lambda_u is real here, so this term has zero imaginary part and does not resolve the CP-violation constraint.

This verifies that the pure-heavy coefficient is already contained in the previous full-theory box. Adding both would double count it.

## Mixed term: controlled next step

For fixed x=mt²/MW² and X large, the archived loop gives

```
S(x,X)=x [log(X)/4-h(x)+3/(4(1-x))]+O(log(X)/X),
h(x)=log(x)(1-2x+x²/4)/(1-x)².
```

The numerical ratio of the full loop to this expression at X=1e10 is 0.999999999842. The mixed hard Hamiltonian term has the opposite sign to the source's Lagrangian coefficient and retains its matching-scale logarithm. Completing the comparison requires current-operator evolution and electroweak matrix elements so that the arbitrary matching scale cancels and the finite x dependence is recovered. This packet does not infer those missing terms by fitting the known full result.

Next perform that mixed-term comparison before assigning a heavy-scale QCD factor. Keep the light pseudoscalar in the lower-energy theory and avoid adding already-counted diagrams. The small-yL family remains conditional and the frozen local baseline is unchanged.

## Replay

Run `C:\Python313\python.exe docs/research/casimir-dp-axion-heavy-box-overlap-2026-09-07.py`. It SHA-authenticates the archived loop script and imports definitions only. Four checks cover asymptotic normalization, convergence, absence of a pure-heavy CP phase, and the mixed-loop expansion. The sibling JSON records results. Root-leaf documentation validation is separate from physical matching; no certificate claim applies.
