# NHM2 Spherical Boson-Star v2 G2-R1 Exact Hermite Diagnosis Proposal

Program gate: G2-R1 — global-center/core-representation diagnosis

Workstream: versioned classical-branch repair review

Capability or component: one-shot exact residual evaluation of the immutable
piecewise cubic-Hermite center at the frozen failed point

Current maturity: G2 exact polynomial counterexample; original-center cause
unresolved

Target maturity: immutable authority-neutral cause-separation receipt selecting
one successor class

Required frozen inputs: active G2-R1 packet raw
`01a811fb186120d9fa1d92faf0c1ce1630e200c0a64da7fb3c91659132fab8a0` /
3,140; global-center raw
`d0b0f74da5eb2512fe23e4bb049aa1d68cef6d9c9f590af993027b4af6509f30` /
196,505 and self-hash
`bc8269c95543a0507a1d261093e51ebb8f23199f8f406e22742fd191e4f39e9d`;
projection receipt raw
`08e0eb93a8f39f804bfa069c680bf85303ce4614aa16c3b2129c107d4527f330` /
1,841 and self-hash
`754db1dc77a39e4560607b393763d760ae8ebeb8fa4245143bb1280fc9745d14`;
admission raw
`ff07124e88673fee04f9ca7e3e7c4b6545a1ee37fb70bda43a140e56bf582645` /
2,158 and self-hash
`ff37f9eebebcaf49a5d3fd88d749c62071e33cc5f58b3af6f069700a88a530df`;
polynomial witness raw
`ad44b456c00c9644e73da27ebbe737f6fafbe99cac835e41519449c72479c691` /
6,922 and self-hash
`bde9c4ebfefade6354c8248295d5511cbc864dc23e79a7948ff976a91c2e188d`

Required evidence: bounded exact JSON admission; independent length-delimited
self-hash verification; exact binary64-to-rational decoding; strict mesh-order
and unique-interval proof; exact Hermite value/first/second derivative; exact
Schrödinger residual and normalization; comparison with the frozen polynomial
fraction; exclusive content-addressed receipt; independent arithmetic replay

Stop/fail criteria: any byte/self-hash drift; hostile/noncanonical input; wrong
state shape/order; nonfinite or negative-zero word; non-strict mesh; point on or
outside an interval boundary; arithmetic budget overflow; polynomial digest or
decision drift; output collision; any authority promotion

Explicit non-goals: replacing or rerunning the center; changing interpolation,
point, threshold, normalization, or 128-mode payload; selecting replacement
parameters; later proof duties; N=64/96/128/256 execution; candidate, lamp,
physical, propulsion, or transport authority

Downstream gate unlocked: review of exactly one versioned G2B successor class

Change class: diagnostic-only mathematics and receipt semantics; no runtime or
claim authority

## Frozen arithmetic

The diagnostic point and rail remain

```text
x = 1/128
rail = 1/10^10
```

Let `[x_0,x_1]` be the unique adjacent stored mesh interval satisfying
`x_0 < x < x_1`. For stored endpoint values `y_0,y_1` and endpoint derivatives
`m_0,m_1`, define `h=x_1-x_0` and `s=(x-x_0)/h`. The exact interpolant is

```text
H(s) = (2s^3-3s^2+1)y_0
     + (s^3-2s^2+s)h m_0
     + (-2s^3+3s^2)y_1
     + (s^3-s^2)h m_1.
```

Its first and second physical-x derivatives are obtained by differentiating
this displayed polynomial exactly and multiplying by `1/h` and `1/h^2`.
Apply it to `(u,u_x)` and independently to `(V,V_x)` from state order
`[u,u_prime,V,V_prime]`.

With the immutable binary64 parameter `nu`, evaluate

```text
R = -(u_xx + 2u_x/x)/2 + (V-nu)u
D = 1 + |u_xx/2| + |u_x/x| + |Vu| + |nu*u|
q_H = |R|/D.
```

No floating operation decides the result. Every stored word is decoded to its
exact rational value, and all subsequent arithmetic uses reduced integer
fractions. Integer numerator and denominator bit lengths are capped at 262,144;
the mesh and each state row are capped at 16,385 elements.

The frozen 128-mode result remains the already authenticated exact fraction
whose canonical `{numerator,denominator}` encoding hashes to
`0dedd3a913bd1e70c75b5b6fa74cbd7be2a358c518562f19f2dfd80fcd068706`.
It is not recomputed with new coefficients.

## Frozen decision

```text
if q_H > rail and q_P > rail:
  UPSTREAM_GLOBAL_CENTER_ACCURACY_SUCCESSOR_REQUIRED
elif q_H <= rail and q_P > rail:
  CORE_CODEC_OR_MODE_COUNT_SUCCESSOR_REQUIRED
else:
  G2_DECISION_INCONSISTENCY_STOP_AND_AUDIT
```

The receipt must preserve both exact fractions, their signs relative to the
rail, the unique mesh interval ordinals and endpoint words, all four input raw
bindings, the source raw binding, `noRetune=true`, and false authority locks.
The output path is fixed to
`artifacts/nhm2-spherical-boson-star-v2-g2/g2-r1-exact-hermite-diagnosis-v1.json`
and must be absent before its sole execution.

## Successor discipline

This result selects a successor class only. It does not authorize replacement
execution. A later proposal must freeze solver precision, mesh/order or proof
codec, tolerances, runtime, output root, comparison wire, and first-failure
rules before observing any replacement result. The failed G2 center and every
existing receipt remain immutable.
