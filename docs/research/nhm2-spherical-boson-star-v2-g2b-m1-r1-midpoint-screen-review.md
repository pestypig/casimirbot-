# NHM2 Spherical Boson-Star v2 G2B-M1-R1 Midpoint-Screen Review

Program gate: G2B-M1-R1 — encoded midpoint-screen consistency review

Workstream: versioned classical-branch repair review

Capability or component: determine whether the failed global binary64
cubic-Hermite midpoint screen is a valid numerical requirement

Current maturity: failed M1 receipt plus an independent analytic quadratic
counterexample

Target maturity: one frozen `REPAIR` or `NO_REPAIR` decision before any new
center execution

Required frozen inputs: M1 receipt
`e2b1080103f2fe3b9d35e6c5f00bc4bf243b3d48409d649dbe3581c1191f105b`;
M1 runner raw
`550f35b86c62c634e84a5a693e4394f42e403f25cc890dcbb45d93b30322a2b7`;
unchanged 8,193-node mesh and `1e-10` midpoint limit; analytic polynomials of
degree at most three with exact derivatives

Required evidence: exact source/spec; polynomial corpus; per-interval errors;
first failing interval; conditioning bound; content-addressed decision; no
candidate solve or state access

Stop/fail criteria: reading or recreating the failed center state; changing the
mesh or limit during diagnosis; using a candidate result as the counterexample;
unbounded corpus; missing receipt; any authority promotion

Explicit non-goals: rerunning M1; choosing a replacement screen from candidate
data; changing MPFR integration/Newton/refinement; changing the core rail,
point, projection, or mode count; proof, candidate, lamp, physical, propulsion,
or transport authority

Downstream gate unlocked: a versioned M1-R2 runner with only an independently
justified screen repair, or terminal rejection of the MPFR lead

Change class: synthetic numerical-consistency diagnosis; no authority

## Frozen decision rule

Evaluate the existing binary64 midpoint function on the same 8,193-node mesh
for the exact corpus:

```text
y=1,       y'=0,       y''=0
y=x,       y'=1,       y''=0
y=x^2,     y'=2x,      y''=2
y=x^3,     y'=3x^2,    y''=6x
```

For every interval, encode `x`, `y(x)`, and `y'(x)` as binary64 exactly as the
failed screen does. Record the observed midpoint value/first/second derivative
errors. The decision is:

```text
if any algebraically exact corpus member exceeds 1e-10:
  REPAIR_GLOBAL_BINARY64_MIDPOINT_SCREEN
else:
  NO_REPAIR_M1_NUMERICAL_CONSTRUCTION_FAILED
```

If `REPAIR`, the only initially eligible correction is to remove this newly
introduced global encoded-midpoint screen. The unchanged cross-refinement,
Richardson, matching, boundary/sign, exact-rational center duty at `x=1/128`,
and frozen 128-mode classifier remain. A separate versioned proposal must bind
that sole deletion before any re-execution.
