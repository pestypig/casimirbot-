# NHM2 Spherical Boson-Star v2 G2-D Tail Parameter/Source Chart Audit

Program gate: G2 — classical branch proof and terminal state

Workstream: exact proof-definition implementation

Capability or component: exact `[lambda,nu,m,c]` to regular-cell source inputs

Current maturity: locally frozen algebraic integration rule and one-point native
physical-chart/source-DAG canary; complete parameter-model cover and endpoint
derivative integration remain pending

Target maturity: one directed degree-32 parameter model feeding the exact source
DAG on every fixed radial-cover ordinal, including the continuous `lambda=0`
endpoint

Required frozen inputs: Volterra/remainder proposal, source-envelope calculus,
endpoint sparse algebra v1, generated scalar and quotient wires, and the fixed
radial cover

Required evidence: removable-zero identities, analytic-series margins,
parameter-coordinate chronology, exact scalar-jet consumption, all 7/28 AD
slots, regular/endpoint agreement, and independent replay

Stop/fail criteria: numerical division by `s`; an unversioned alternative
continuation; a sampled radial maximum; an input direction not equal to the
frozen `[lambda,nu,m,c]` order; a source/jet wire mismatch; or any singularity
or analytic-series margin failure

Explicit non-goals: proof or branch execution, candidate admission, runtime or
persistence issuance, adaptive subdivision, Theory Graph lamps, and physical,
propulsion, or transport authority

Downstream gate unlocked: actual parameter-model radial assembly and its
independent audit

## Finding

The calculation-only native canary now consumes the frozen endpoint quotient,
traverses the endpoint cap plus all 255 regular cells, and exercises all seven
first-order and 28 symmetric second-order source-jet slots. Its receipt correctly
keeps `parameterCoordinateRelationsFrozen=false`: the four canary directions
are synthetic probes, not yet the physical `[lambda,nu,m,c]` map.

The frozen Volterra proposal determines that map, but the source calculus did
not state the two removable logarithmic divided differences needed to evaluate
the Schwarzschild background at `s=lambda^2=0` without dividing by `s`.
Implementing a raw `log(...)/s` branch or silently choosing a numerical epsilon
would therefore be an unreviewed proof choice.

This audit closes that choice with the exact formulas below. It changes no
candidate, radius, norm, subdivision, or authority.

## Frozen parameter chronology

The ordered independent parameter coordinates are exactly

```text
p = [lambda,nu,m,c].
```

Every cell supplies the already-frozen degree-32 directed Chebyshev models for
`nu,m,c`; `lambda` is the exact affine cell model. Derive, in this order,

```text
s = lambda^2,
k = sqrt(-2*nu),
w2 = 1+2*s*nu,
sigma = m*(1+4*s*nu)/k-1,
d = c*exp(-64*k)*exp(sigma*log(64)).
```

Require the existing strict directed margins `k>0`, `w2>0`, and every frozen
real/complex Schwarzschild and analytic-series separation before continuing.
No derived quantity is accepted from a manifest as an independent caller value.

The primitive `log(64)` is one MPFR256 directed interval obtained by applying
the frozen positive-log primitive to exact integer 64. It is not a decimal
constant.

## Removable logarithmic primitives

Freeze

```text
Lp(x) = log(1+x)/x,  Lp(0)=1,
Lm(x) = log(1-x)/x,  Lm(0)=-1.
```

For a projected model with `q=norm(x)<1`, use exactly order `K=512`:

```text
Lp(x) = sum_(n=0)^K (-1)^n*x^n/(n+1) + R_Lp,
Lm(x) = -sum_(n=0)^K x^n/(n+1) + R_Lm,
abs(R_Lp),abs(R_Lm)
  <= q^(K+1)/((K+2)*(1-q)).
```

The displayed remainder is added outward once to the correlated model
residual. At literal exact zero the returned models are exact `+1` and `-1`.
Failure of `q<1` is terminal; the order may not be increased and the primitive
may not fall back to numerical division.

The same forward-AD node uses its series derivatives, never finite differences
or a raw quotient. With `j=0,...,K`, freeze

```text
d^r Lp/dx^r
  = sum_j (-1)^(j+r) * (j+r)!/j! * x^j/(j+r+1) + R_Lp_r,
d^r Lm/dx^r
  = -sum_j (j+r)!/j! * x^j/(j+r+1) + R_Lm_r,
r in {1,2}.
```

For either sign, the outward remainder bounds are exactly

```text
r=1: q^(K+1)/(1-q),
r=2: q^(K+1)*(K+2)/(1-q)^2.
```

These intentionally conservative bounds are consumed once at their derivative
order. A derivative residual may not be reused as both a retained coefficient
error and a separate tail contribution.

## Exact regular-cell Schwarzschild source inputs

On regular cell `eta in [i/256,(i+1)/256]`, `i=1,...,255`, define

```text
y_inverse = eta/64,
a = m*y_inverse/2,
r = s*a,
r2 = r^2,
V1_S = 2*a*Lp(r),
H_S = s*a^2*Lm(r2),
V1_S_y = -2*a*y_inverse/(1+r),
H_S_y = 2*s*a^2*y_inverse/(1-r2).
```

These are exactly the frozen Schwarzschild expressions

```text
V1_S = 2*log(1+r)/s,
H_S = log(1-r^2)/s
```

with their unique continuous `s=0` extensions. They must be evaluated in the
divided-difference form above. The denominators `1+r` and `1-r^2` use the
already-required directed nonzero margins.

Next derive

```text
b = -k+sigma*y_inverse,
z = y_inverse/k,
log_B = -64*k*(1/eta-1)-sigma*log(eta),
B = exp(log_B),
D = (d*B)^2.
```

Regular cells are separated from `eta=0`, so `1/eta` and `log(eta)` are allowed
only there. The endpoint cap continues to use the frozen flat-moment calculus
and may not form either operation.

## Frozen scalar jet and graph coordinates

The native table generator must project both frozen wires:

- scalar jet `C_0,...,C_8`, semantic SHA-256
  `858e83405870b2a6bb170b42f9b85817f7cfd9413e6206faba1fbbd1ae27826d`
  / 12,234 canonical bytes;
- endpoint quotient, semantic SHA-256
  `c19b4795d314597d72d18ab8ad6e8dbfe55d16f58f31472402fff548417022a7`
  / 99,867 canonical bytes.

Evaluate

```text
P8(z) = sum_(n=0)^8 C_n*z^n,
P8_z(z) = sum_(n=1)^8 n*C_n*z^(n-1),
P8_y = -k*z^2*P8_z.
```

The ordered independent graph coordinates remain

```text
X = [h_hat,v_hat,Delta_U].
```

Inject them only through

```text
H = H_S+D*h_hat,
V1 = V1_S+D*v_hat,
F = P8+Delta_U,
```

and the exact graph-envelope combinations already frozen in the source
calculus. Automatic differentiation then runs once over ordered coordinates

```text
[h_hat,v_hat,Delta_U,lambda,nu,m,c]
```

using the existing 7-first/28-symmetric-second layout. A synthetic replacement
direction, independently supplied `s,k,sigma,d,b,z,H_S,V1_S`, or separately
simplified derivative expression is forbidden.

## Endpoint agreement and authority boundary

The endpoint cap uses the frozen Laurent scalar/quotient wires and flat-moment
rules. The regular-cell and endpoint implementations must agree on their shared
boundary `eta=2^-8` by directed overlap for every source value and first/second
coordinate and parameter derivative. Failure stops the assembler.

The current 14/14 native suite proves the physical parameter/source chart at one
regular point against independent symbolic and exact-rational oracles, while
the synthetic fixture still traverses all radial cells and derivative slots.
It does not yet establish the physical parameter model on all 256 ordinals,
endpoint derivative agreement, a proof manifest, or a radii inequality. All
proof, candidate, lamp, and physical authority remains false.
