# NHM2 Spherical Boson-Star v2 G2-D Tail Endpoint Sparse Algebra v1

Program gate: G2 — classical branch proof and terminal state

Workstream: exact proof-definition implementation

Capability or component: canonical descaled endpoint recurrence, cancellation,
and quotient wire

Current maturity: locally frozen calculation-only definition; independent audit
and native calculation-only integration remain pending

Target maturity: independently audited exact quotient consumed by the native
endpoint/radial-cover assembler

Required frozen inputs: final branch-selection policy, G2-D desingularized
operator, tail Volterra replacement, source-envelope calculus, endpoint-algebra
audit, and authority-neutral physical boundary recurrence

Required evidence: canonical Laurent arithmetic, exact chart bridge, recurrence
through `C_8`, raw cancellation through order nine, domain-separated wire
identities, independent symbolic replay, and authority-lock checks

Stop/fail criteria: negative `s` or `m` exponent; an unlisted algebraic
relation; division by `s`; a noncanonical or duplicate term; a nonzero raw
coefficient below order ten; a wire/hash mismatch; or an independent replay
disagreement

Explicit non-goals: vacuum or branch proof execution, candidate admission,
runtime issuance, radii-polynomial bounds, Theory Graph lamps, or physical,
propulsion, and transport authority

Downstream gate unlocked: native endpoint quotient evaluation followed by the
fixed 256-ordinal radial-cover assembly

## Frozen implementation closure

The calculation-only generator, focused independent-form oracle, deterministic
C++ projection generator, and generated table are:

- `tools/nhm2-spherical-boson-star-v2-branch-proof/tail_endpoint_sparse_algebra.py`,
  raw SHA-256
  `b5bf0fabfe46f7e47eb200ee12d2d2d7189418dcedb311848ab519b4eb2e841e`
  / 18,226 bytes;
- `tools/nhm2-spherical-boson-star-v2-branch-proof/test_tail_endpoint_sparse_algebra.py`,
  raw SHA-256
  `68997203c492b2d1fde16e0c15b30812fd954d4639e61a578de6e6a0dc15895d`
  / 11,963 bytes;
- `tools/nhm2-spherical-boson-star-v2-branch-proof/generate_tail_endpoint_sparse_algebra_header.py`,
  raw SHA-256
  `5231517cb691f931693ec21e6d97486beeaa08b219cfd1af3de3a388ce0fff8c`
  / 6,602 bytes;
- `tools/nhm2-spherical-boson-star-v2-branch-proof/tail_endpoint_sparse_algebra_generated.hpp`,
  raw SHA-256
  `dee0e4ce1aabaa376eeb3cf004b1aef9d5a7cedfb59c81e6f7f7c098138798fb`
  / 184,649 bytes.

The production source is standard-library only. Its public API is deliberately
blocked until independent audit; the private marker-gated path is test-only and
grants no proof or candidate authority. The focused suite is 10/10 PASS and
proves byte-for-byte regeneration of all 516 scalar-jet plus 3,053 endpoint-
quotient C++ Laurent terms.

## Canonical coefficient algebra

The coefficient ring is exactly

```text
R = Q[s,m,k,k^-1].
```

A monomial is the signed integer triple `(sExponent,mExponent,kExponent)`.
The `s` and `m` exponents must be nonnegative; the `k` exponent may be any
integer. A coefficient is a reduced rational with positive denominator.
Zero terms are absent. Terms are sorted by the ordinary lexicographic order of
the exponent triple, strictly increasing, with no duplicate monomial.

No relation among `s`, `m`, and `k` is admitted. In particular, the generator
does not introduce `lambda`, `nu`, `w`, `kappa`, `M`, square roots, or numerical
division by `s`. Exact Laurent shifts may lower only the `k` exponent.

Each polynomial wire is a JSON array of terms

```text
[sExponent,mExponent,kExponent,numeratorDecimal,denominatorDecimal]
```

where the numerator and denominator are base-ten strings. A series wire is a
JSON array in increasing `z` ordinal. Canonical bytes are ASCII JSON with no
whitespace, `ensure_ascii=true`, and sorted object keys; the frozen wires
contain arrays only.

## Frozen chart and recurrence

The endpoint chart is

```text
s = lambda^2,
y = lambda*x,
k = sqrt(-2*nu) > 0,
w^2 = 1-s*k^2,
M = lambda*m,
kappa = lambda*k,
z = 1/(k*y) = 1/(kappa*x),
q = s*m*k/2,
sigma = m/k-2*s*m*k-1.
```

The metric series are the exact Schwarzschild expressions

```text
V0 = s^-1 log((1-qz)/(1+qz)),
V1 = 2 s^-1 log(1+qz),
```

represented only after their removable `s` factors have been cancelled, so
every stored coefficient lies in `R`.

For `S(z)=sum(C_n z^n)` with `C_0=1`, the frozen descaled scalar equation is

```text
exp(-2sV1) k^2 [
  L_sigma^2 S + (2z-s z^2(V0'+V1')) L_sigma S
]
+ [Q0(s,V0)-k^2 exp(-2sV0)] S = 0,
```

with `L_sigma = sigma-z*d/dz` and

```text
Q0(s,V0) = (exp(-2sV0)-1)/s.
```

The compatibility rows at orders zero and one vanish identically. For each
`n=1,...,8`, the new-coefficient diagonal is exactly `2*k^2*n`; `C_n` is solved
only after all lower coefficients have been fixed. The generated scalar jet
contains exactly `C_0,...,C_8`.

## Raw source and quotient

The scalar source `S_U` is expanded through raw order 26. Every raw coefficient
at ordinals 0 through 9 must be the literal empty canonical polynomial. The
endpoint quotient is defined without division by `s` as

```text
quotient[j] = raw[j+10],  j=0,...,16.
```

Thus the raw graded residual order 27 becomes quotient graded order 17. This
shift is the only quotient reduction. Native consumers must reject rather than
infer any additional simplification.

## Frozen wire identities

For canonical wire bytes `B`, each semantic wire identity is

```text
SHA256(domain_utf8 || u64le(len(B)) || B).
```

| Wire | LF-terminated domain | Semantic SHA-256 | Plain SHA-256 | Bytes |
|---|---|---:|---:|---:|
| scalar jet | `nhm2-spherical-boson-star-v2/g2-d-tail-endpoint-scalar-jet/v1\n` | `858e83405870b2a6bb170b42f9b85817f7cfd9413e6206faba1fbbd1ae27826d` | `bfac6a3d3e9a81dfbea8c38dddf5ea945d54d385964bcf401656dd486536aa10` | 12,234 |
| raw source | `nhm2-spherical-boson-star-v2/g2-d-tail-endpoint-raw-source/v1\n` | `4c90e133cdbbc06bea501e88a12ce2e324caef68eb951331addb6255cbc3044c` | `f5bda3a1efba08ed3000fe1a2018b3952b78bf76aac4ab2eac2d1a58e20c317d` | 99,897 |
| quotient | `nhm2-spherical-boson-star-v2/g2-d-tail-endpoint-quotient/v1\n` | `c19b4795d314597d72d18ab8ad6e8dbfe55d16f58f31472402fff548417022a7` | `fab6a26868075cf6dfd63f04aa1e52f3e7e7f6811181b3ebfcd97924509a08e3` | 99,867 |

The scalar coefficient term counts are
`[1,5,13,27,44,65,90,119,152]`. These counts are structural diagnostics, not a
substitute for byte equality.

## Audit boundary

The focused oracle independently constructs the equation in SymPy only inside
the test process, evaluates all 27 raw coefficients at the exact admissible
bridge fixture, and compares them to the standard-library generator. It also
checks the eight physical-to-descaled diagonals, canonical ordering, illegal
division rejection, zero orders, quotient shift, wire identities, and all-false
authority locks.

This local freeze is not the independent audit required for proof-manifest
issuance. Calculation-only native integration may proceed against these exact
bytes, but any mismatch must stop, and the integrated result cannot become a
proof input until a fresh audit is recorded. Until then,
`independent_audit_clear`, proof authority, candidate execution, Theory Graph
authority, and all physical claim fields remain false.
