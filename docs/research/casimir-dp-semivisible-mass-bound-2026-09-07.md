# Semivisible lifetime envelope across the light-mass family

Exploratory S1 analytic screen, September 7, 2026. Same vector transition
and fixed coupling product as the preceding lifetime packet.

## Width inequality

Let 0<=m1<m2, m2-m1>2me and m1+m2<mA. At fixed m2 and pair invariant
mass s, the numerator in the previous width integral decreases with m1.
To see this, write u=m1/m2, y=s/m2² and differentiate its logarithm:

    -3(1-u)/[(1-u)²-y] + (1+u)/[(1+u)²-y]
      + 2(1+u)/[(1+u)²+2y] <= 0.

Each positive term is bounded by its corresponding multiple of
(1-u)/[(1-u)²-y]. This follows because t/(t²-y) decreases for t>sqrt(y),
and the last denominator is still larger. Removing electron mass also
increases phase space. Hence the m1=me=0 integrand is an upper envelope.

For s<=m2²<=mA²,

    mA²-s >= (mA²/m2²)(m2²-s).

Inserting this into the massless-daughter integrand and integrating gives

    Gamma <= alpha_eff² m2^5 / (6 pi mA^4).

This is an upper bound, not an approximation assigning every mass the
endpoint rate. It follows from the declared tree vector amplitude; new
decay channels or different transition couplings are outside its scope.

## Boost and flight-length inequality

For on-shell A -> eta1 eta2, E2*+p2*<=mA. Consequently E2*-p2*>=m2²/mA,
and for any rest-frame emission direction the lab energy obeys
E2_lab >= EA m2²/mA². Combining with the width bound yields

    L_lab >= [6 pi hbar c mA^4/(alpha_eff² m2^5)]
             sqrt[(EA m2/mA²)²-1].

This expression decreases with m2 when (EA m2/mA²)²>5/4, which holds over
the electron-pair-open domain at the chosen EA=50 GeV and mA=10 MeV.
Its infimum at m2 approaching mA therefore provides a uniform bound:

    L_lab >= [6 pi hbar c/(alpha_eff² mA)] sqrt[(EA/mA)²-1]
          = 211.944 m.

The corresponding probability to decay within a chosen 10 m path is at
most 0.0460865. The limiting point need not have appreciable parent decay
phase space; relaxing that constraint makes the envelope conservative.

## Consequence and validation

Changing the two light masses alone cannot make most daughters decay within
that path at this parent energy and coupling product. This strengthens the
earlier single-benchmark screen without claiming a full NA64 exclusion.
Parent production branching, actual energy/geometry distribution, detector
response and other channels still matter. Larger transition charge or a
different mediator is a new model requiring matching and constraints.

The companion script tests the analytic inequalities against 100 reproducible
allowed mass pairs using the full previous electron-mass width. The numerical
checks support the derivation; a scan alone is not the proof. Source hash,
domain and diagnostic choices are stored in JSON. No measurable shared
prediction or experimental validation is established.
