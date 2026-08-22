# NHM2 Spherical Boson-Star v2 Lambda-Zero Proof-Center Projection

Program gate: G2 — classical branch proof and terminal state

Workstream: lambda-zero limiting-ground-state proof closure

Capability or component: deterministic global-center to frozen core/tail codec

Current maturity: immutable one-shot global-center receipt; no projected proof
center or accepted global root

Target maturity: one content-addressed, authority-neutral five-payload proof
center for directed validation

Required frozen inputs: global-center raw SHA-256
`d0b0f74da5eb2512fe23e4bb049aa1d68cef6d9c9f590af993027b4af6509f30`
/ 196,505 and self-hash
`bc8269c95543a0507a1d261093e51ebb8f23199f8f406e22742fd191e4f39e9d`;
directed-proof semantic SHA-256
`c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99`
/ 42,778; directed-proof-operator source SHA-256
`084e92c9cb927293a227e076092e7b21f0cce525b92e2a0f35d0ae109e17103a`
/ 54,712

Required evidence: exact input self-rehash; deterministic interpolation and
tail extension; exact 9/128/128/32/32 payload shapes; reconstruction screens;
exclusive output root; content-addressed receipt; all authority false

Stop/fail criteria: any input drift; noncanonical or nonfinite receipt; spline,
projection, reconstruction, join, sign, shape, or output collision failure

Explicit non-goals: solving or modifying the global center; tail correction;
existence, inverse, kernel, transversality, tangent, first-tube, branch,
candidate, lamp, physical, propulsion, or transport authority

Downstream gate unlocked: directed global-profile proof ingestion only

Change class: authority-neutral deterministic representation transform

## Frozen representation transform

The transform never adjusts the center. It reconstructs the stored profile by:

1. exact even origin recurrence through index 16 for `0<=x<2^-12`;
2. one `scipy.interpolate.CubicHermiteSpline` per field on the exact stored
   mesh, using stored `u,uPrime,V,VPrime`, for `2^-12<=x<=32`;
3. the exact finite-row extension for `x>32`:

```text
u(x)=u(32)*exp(-kappa*(x-32))*(x/32)^sigma
V(x)=-C/x
kappa=sqrt(-2*nu)
sigma=C/kappa-1.
```

The compact coordinate is exactly `rho=x/(1+x)`. The 128 physical nodes are

```text
rho_j=(1-cos(pi*j/127))/2, j=0..127 increasing.
```

The core coefficients are the ordinary shifted-Chebyshev DCT-I coefficients
for `T_n(2*rho-1)`, computed by the explicit double loop `n` increasing then
`j` increasing with `math.fsum`; endpoint sample weights and coefficient
normalizations are one half. No FFT, fitting, filtering, truncation retuning,
or post-result coefficient editing is allowed.

Because the frozen extension exactly equals the exterior lift at this center,
all 32 free `H` and 32 free `Q` correction coefficients are positive zero.
This is a proposed center, not a claim that the full exterior residual is zero.

The scalar payload order is exactly

```text
nu0,Vc,N0,C,kappa,sigma,lambda,nu_star,wSeed
```

with `N0=4*pi*C`, `lambda=2^-5`, `nu_star=lambda^2*nu0`, and
`wSeed=sqrt(1+2*nu_star)`, each serialized once as binary64.

## Frozen screens

- all inputs and outputs are finite and never negative zero;
- core endpoint reconstruction is within `2^-42` absolute at both ends;
- reconstruction at all 128 transform nodes is within `2^-40` relative to
  `1+abs(value)`;
- reconstructed joins at `x=32` match stored center values within `2^-28`;
- tail corrections are exactly 64 positive-zero words;
- payload sizes are exactly 72, 1,024, 1,024, 256, and 256 bytes.

Failure is terminal for this representation packet. It does not authorize a
different interpolation, cutoff, node count, tail center, or coefficient rule.

## Authority boundary

The resulting files are calculation inputs only. A later verifier must ignore
every primary claim and recompute all joins, scalars, residuals, intervals,
radii bounds, and proof decisions from raw bytes. Every proof, execution,
candidate, replay, lamp, physical, propulsion, and transport authority remains
false.
