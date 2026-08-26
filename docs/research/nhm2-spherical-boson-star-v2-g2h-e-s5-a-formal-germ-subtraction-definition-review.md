Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: authenticated classical and quantum control branch
Capability or component: S5-A/C08 formal-germ subtraction and finite-tail definition review
Current maturity: carrier values, envelopes and full-state parameter jets are candidate-neutrally implemented; the formal-germ truncation/tail semantics are not bound
Target maturity: one additive, independently acknowledged definition that permits candidate-neutral implementation without changing any frozen R2 equation, grid, threshold or authority
Required frozen inputs: R2 selected identity and coordinate `6/5`; S4 definition seal `728d8c9a...025ca`; state/grid v2 `cd98fb11...013c`; positive-tail contract `363818f5...68bf`; flat-carrier contract `09ca71e9...5103`; checkpoint ABI `6fbf6cdb...911ca`
Required evidence: exact resolution of finite truncation versus infinite formal germ; directed positive/vacuum formal-tail bounds with first/second state derivatives; fixed pre-result selector; independent definition audit; zero candidate ingress
Stop/fail criteria: inventing an order in code, calling a finite polynomial subtraction flat, omitting the infinite formal tail, adapting the order after a result, evaluating the selected member, or promoting proof/physical authority
Explicit non-goals: selecting or sealing an order in this review, evaluating a candidate or positive continuation sample, implementing C08 before acknowledgement, changing R2/S4 frozen semantics, beginning G3, or promoting any authority
Downstream gate unlocked: an acknowledged additive successor may unblock the formal-subtraction and `F_flat` implementation portion of S5-A; this review alone unlocks nothing

# G2H-E-S5-A formal-germ subtraction definition review

## Decision status

`UNRESOLVED_DEFINITION_REVIEW_NO_SELECTOR_NO_SEAL_NO_EXECUTION_AUTHORITY`

This review records a real missing definition. It does not amend the immutable
S4 contracts, select a numerical value, authorize implementation, or establish
mathematical proof.

## Exact conflict found

The frozen sources jointly require all of the following:

1. The positive and vacuum tail variables decompose as an **infinite** formal
   triangular germ plus a smooth flat remainder.
2. Every Taylor coefficient of the true flat remainder at infinity is exactly
   zero.
3. The C08 record contains a finite `formal-germ truncation order`.
4. The positive-tail contract says that the finite truncation order was **not
   selected**.
5. No successor contract supplies the missing order, convergence majorant, or
   bound for the omitted infinite formal tail.
6. An exact candidate-neutral recurrence audit finds that, in both charts, the
   `h_(n+1)` coefficient is `2*kappa*(n+1)` while the direct `h_n`
   coefficient has leading term `n^2`. The resulting direct balance scales as
   `h_(n+1)/h_n ~ -n/(2*kappa)`, so Gevrey-1/factorial growth is a real risk.

These statements do not permit a correct finite implementation by themselves.
For a nonterminating formal series

```text
X_formal(q) = sum_(n>=0) x_n q^n,
P_L(q)      = sum_(n=0)^L x_n q^n,
```

the computable difference `X-P_L` is generally **not flat**. It still contains
the formal tail `sum_(n>L) x_n q^n`. Calling `X-P_L` the flat remainder would
contradict the contract's exact-zero Taylor-coefficient requirement.

The S4 closure receipt does not resolve this: it closes fixture/preexecution
maturity and explicitly does not establish a mathematical proof. Inclusion of
the draft flat-carrier file in the S4 definition inventory preserves its
unbound field; it does not choose that field.

## Required additive successor definition

Before implementation resumes, one versioned successor must bind all of these
items without using selected-member output:

1. A fixed finite jet order `L`, chosen before candidate ingress and shared by
   both producer definitions unless a separately justified chart-specific pair
   is frozen.
2. The exact three-part decomposition

   ```text
   X = P_L + T_formal,L + R_flat,
   ```

   for each of `D,S,H,K` and `Dbar,Sbar,Hbar,Kbar`.
3. A constructive directed realization of the infinite formal jet on the full
   frozen tail interval—either a validated Gevrey/Borel-Laplace sum or a fixed
   quantitative Whitney/Borel extension—with order-8, order-6 and order-4
   coefficient norms and all first/second state derivatives required by `Y`,
   `Z1` and `Z2`.
4. A theorem appropriate to the chosen realization. Ordinary power-series
   convergence may not be assumed: the exact recurrence has factorial-growth
   risk. A Borel-Laplace route must prove Gevrey bounds, analytic continuation
   and exponential type on the frozen Laplace ray; a cutoff extension route
   must prove convergence, exact jets and quantitative norm bounds for its
   fixed extension operator.
5. Exact expression-tree identities defining which terms enter `F_formal`,
   `F_formal_tail` and `F_flat` before interval ingress.
6. Positive- and vacuum-chart recurrence coefficient ranges, denominator
   exclusions, state-jet ingress, overflow/resource limits and first-failure
   ordering.
7. Canonical C08 fields for `L`, the formal-tail bound, four true flat-remainder
   bounds, and each contribution to `Y`, `Z1` and `Z2`.

## Bounded resolution options

### Option A — finite executable jet plus validated Borel-Laplace realization

Prove uniform Gevrey-1 bounds, form the factorially divided Borel transforms,
validate analytic continuation and exponential growth along the fixed positive
Laplace ray, and evaluate a directed Laplace sum. Retain a fixed finite
recurrence jet only for executable bookkeeping and bound the remaining Borel
integral separately. This can preserve the current formal-germ/flat-remainder
distinction if the required summability and same-asymptotic-solution theorem
close.

The order still requires an independently justified preregistered choice. The
existing derivative order `12` is not automatically the germ order; numerical
coincidence is not a proof of suitability.

### Option B — fixed quantitative Whitney/Borel extension

Freeze an explicit coefficient-dependent cutoff construction that maps every
admissible infinite formal jet to one actual smooth function with exactly that
jet. Prove convergence and directed coefficient-norm bounds for the extension
and its first two state derivatives. This avoids assuming summability but the
extension choice and every cutoff scale become proof semantics and must be
identical across the two producer definitions.

### Option C — revise the residual split

Define and bound a different full-tail remainder that does not claim flatness.
This would be a broader semantic revision to the S4 remainder contract and
therefore is not eligible as an implementation convenience inside S5.

### Rejected option — subtract a finite polynomial and label the result flat

This is mathematically false unless the formal recurrence terminates or the
omitted coefficients vanish, neither of which is defined or proved.

## Corrected recommendation after exact recurrence audit

Do not advance an ordinary convergent-tail proposal. First produce a
candidate-independent Gevrey feasibility packet that proves or disproves a
uniform coefficient bound of the form `|x_n| <= C*A^n*n!` for both charts and
all required state derivatives. If it also proves positive-ray Borel
summability, advance Option A. Otherwise, assess the fixed quantitative
extension in Option B. Only if both preservation paths are impracticable may a
separately authorized semantic-repair proposal consider Option C.

That feasibility work is now tracked in
[`nhm2-spherical-boson-star-v2-g2h-e-s5-a-gevrey-borel-feasibility.md`](./nhm2-spherical-boson-star-v2-g2h-e-s5-a-gevrey-borel-feasibility.md).
It currently establishes a parameterized Gevrey induction route only; it does
not establish positive-ray continuation or select a summation prescription.

No finite order is selected by this recommendation. Orders may later be
compared by proof cost only, never by selected-candidate outcome. Until a
preservation path is independently acknowledged, S5-A remains active and C08
remains `partial`.

## Exact recurrence audit evidence

The candidate-neutral audit is
[`scripts/nhm2_g2h_e_s5_formal_germ_growth_audit.py`](../../scripts/nhm2_g2h_e_s5_formal_germ_growth_audit.py).
It independently reconstructs the positive and vacuum scalar operators from
the frozen formulas, clears only the displayed vacuum denominators, and checks:

- positive `coefficient(h_(n+1)) = 2*kappa*(n+1)`;
- vacuum `coefficient(h_(n+1)) = 2*kappa_bar*(n+1)`;
- in each chart `coefficient(h_n)/n^2 -> 1`;
- the quadratic shifted-coefficient pattern is respectively
  `[1,-4*M,4*M^2]` and `[1,-4*eta*Mbar_infinity,4*eta^2*Mbar_infinity^2]`;
- the scalar Borel principal coefficient is `t*(t+2*kappa)`, which has no
  positive-ray zero when the chart's strict-kappa condition holds;
- the direct recurrence balance therefore carries factorial-growth risk;
- no ordinary convergent formal tail is established;
- candidate evaluations/samples and protected roots remain zero/absent.

The audit does not claim a complete divergence theorem and does not select a
summation prescription. Its role is narrower: ordinary Taylor convergence is
not an admissible hidden assumption.

## Authority and chronology

- Frozen selected-member evaluations: `0`.
- Positive candidate samples: `0`.
- Candidate roots: absent.
- Authorization, token and execution ledgers: absent.
- C08 handler: absent.
- Candidate, proof, geometry/state, lane, lamp, physical, propulsion and
  transport authority: all false.
