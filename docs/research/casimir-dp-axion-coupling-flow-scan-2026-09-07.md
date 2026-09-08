# Messenger-coupling scan at fixed leading dark interaction

Exploratory snapshot, September 7, 2026. This is a family of conditional alternatives to the frozen reference point, not a retuning of that point or an allowed-region determination. The canonical apparatus remains unchanged.

## Reproducible calculation

The [script](casimir-dp-axion-coupling-flow-scan-2026-09-07.py) rebuilds the declared UV boundary independently at four yL values. It includes quadratic tree currents, quartic current corrections, pure-heavy and mixed hard boxes. Each boundary passes through the implemented full one-loop gauge/Higgs/top SM trajectory, all non-SM coefficient evolution, and linearized finite VLL matching. This retains the restricted UV boundary and top-only Yukawa approximation; it does not complete missing UV operators or input-scheme conversion.

Matching uses symmetric positive/negative coefficient insertions at two amplification factors. The reference coefficient is reproduced, and the endpoint-derived polynomial is checked against both independently evolved interior points. Its maximum relative residual is 5.33e-12:

`Im H = (6.94203607417e-14) yL^2 - (1.41888773609e-15) yL^4 GeV^-2`.

This polynomial describes the implemented truncation, not unknown higher-order terms. QCD evolution is common to these fixed mass/SM-input points. The authenticated FLAG24 proxy ledger converts the coefficient to the conditional NP magnitude. Results are recorded in [JSON](casimir-dp-axion-coupling-flow-scan-2026-09-07.json).

| yL | yR maintaining gu | Conditional epsilon NP magnitude | Fraction of dated measured magnitude |
|---|---|---|---|
| 0.05 | 0.0127982 | 5.65675e-5 | 2.54% |
| 0.10 | 0.00639927 | 2.26235e-4 | 10.15% |
| 0.15 | 0.00426638 | 5.08899e-4 | 22.84% |
| 0.20 | 0.00320000 | 9.04386e-4 | 40.59% |

These percentages do not express allowed NP fractions. A consistent signed SM combination and uncertainty treatment are still required.

## Connection to both targets

For the same massless-up mixing approximation used at the reference point, `D=(yL v/sqrt(2))^2/[M^2+(yL v/sqrt(2))^2]` and `yR=gu/sqrt(D)`, with M=2000 GeV, v=246.2 GeV and gu=5.5700260688158226e-5. This preserves the leading pseudoscalar dark interaction at both xenon and carbon targets with fixed dark masses and population. Consequently their previously computed leading responses are unchanged within that approximation. It does not create a larger local coherence signal.

Crucially, yR increases as yL decreases. Scalar self-energy and other yR-dependent loop terms therefore change; preserving gu is not proof that the completed model's predictions remain unchanged. The next substantive calculation is the loop/scalar and remaining-constraint audit of this family, followed by the joint response update. No acceptable common model is admitted by this scan alone.

Validation: reference reproduction, matching-amplification stability, and two held-out full evolutions check the polynomial; root-leaf documentation check is separate. Research goal remains active.
