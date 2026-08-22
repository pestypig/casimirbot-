# NHM2 spherical-boson-star v2 G2B-B1 entry binding and initializer closure

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: M5-R1 entry binding and six-payload initializer successor  
Current maturity: independently admitted lambda-zero representation; candidate initializer absent  
Target maturity: content-addressed authority-neutral initializer instance for all four frozen grids  
Required frozen inputs: M5-R1 and M5 receipts, final branch policy, initializer-evaluator v1 semantics  
Required evidence: exact input rehash, deterministic six-payload bytes, join identities, immutable receipt  
Stop/fail criteria: first hash, schema, arithmetic, domain, payload, or invariant mismatch  
Explicit non-goals: candidate solve, tolerance change, retry, vacuum proof, candidate admission, lamp or physical authority  
Downstream gate unlocked: G2B four-grid one-shot execution review

## Scope and reason

The independently admitted M5-R1 result closes the failed lambda-zero core duty,
but it is not itself the `3N+1` caller state required by the frozen radial
continuation solver. The final branch policy consequently still records
`initializerInstance:null` and `integratedCandidateSolverProgram:null`.

This packet freezes the smallest causal successor: convert the already selected
M5 128-mode representation into the six exact payload roles required by the
initializer-evaluator ABI. It does not rerun the M5 projection, solve a branch,
or reinterpret the failed predecessor center.

## Exact frozen inputs

| Input | SHA-256 | Bytes / semantic size |
| --- | --- | ---: |
| M5-R1 admission receipt raw | `41b1fcd261f17b722197ccfd3bcc2e116c1941194c63c52712a28d7f5cd80d83` | 12,888 |
| M5-R1 admission receipt self hash | `c37c0a329765c558c99e559bfede6aed815244f372d289085953f7aed097d1a8` | receipt field |
| M5 projection receipt raw | `0996c9178bd25b71ce1ee26d2cc03b76bff71013ba5a4ff1e0d13179d2430cdf` | 309,486 |
| M5 projection receipt self hash | `646e41b4cad522fb3aecb1d9e6413a4c7f627732b1a9fd8cac606d6796dc8e0d` | receipt field |
| final branch-selection contract raw | `d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82` | 44,912 |
| final branch-selection semantic seal | `221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa` | 41,280 |
| initializer-evaluator v1 contract raw | `05d0c327090a30065a453941ad4612f518818dd88f230864d4ef257c9e8a2be4` | 60,627 |
| initializer-evaluator v1 semantic seal | `2253cea43e7b0abc99aaebd19ced18994eba4605b65fe674febb03d9945cdbc5` | 24,711 |

The selected representation is exactly mode count 128. Its coefficient arrays
are read only from the M5 receipt, after the M5-R1 receipt has independently
bound the same M5 self hash, exact `nu`, all coefficient wires, all projected
residuals, and the lowest-eligible selection.

## Frozen materialization

All arithmetic below uses one isolated GNU MPFR 4.2.2 context at 256-bit
precision, round-to-nearest/ties-to-even, `emin=-1073741823`,
`emax=1073741823`, with forbidden flags checked after each primitive and the
ambient context restored exactly. Runtime identity remains diagnostic unless a
later authenticated runtime owner binds it.

Let `u_n,V_n`, `n=0..127`, be the selected canonical exact dyadics. Convert each
coefficient once to IEEE-754 binary64 RNDN. All subsequent initializer payload
semantics operate on those frozen binary64 words introduced into MPFR with
`set_d`; no MPFR-only coefficient may bypass the payload boundary.

Use the Chebyshev convention

```text
q(rho) = sum_{n=0}^{127} q_n T_n(2*rho-1)
rho = x/(1+x)
```

with no implicit endpoint halves. Evaluate values and first `rho` derivatives
in increasing coefficient order under the fixed Chebyshev recurrence. At
`R=32`, `rho_R=32/33` and `d rho/dx=1/1089`, define

```text
U  = u(rho_R)
U1 = u_rho(rho_R)/1089
V  = V(rho_R)
V1 = V_rho(rho_R)/1089
Vc = V(0)
M  = R^2 * V1
nu0 = exact fine-refinement nu bound by M5-R1
kappa = sqrt(-2*nu0)
sigma = M/kappa - 1
C = U * exp(kappa*R) / R^sigma
N0 = 4*pi*C
lambda = 1/32
nu_star = lambda^2*nu0
wSeed = sqrt(1+2*nu_star)
```

Required domain checks are `nu0<0`, `U>0`, `C>0`, `kappa>0`, `M>0`,
`-1/2<nu_star<0`, and `0<wSeed<1`. The origin checks are `u(0)=1` and
finite `Vc`. Every final scalar and join value is converted once with RNDN and
must be finite and not negative zero.

The six output payloads, in exact order, are:

1. `scalars.f64le`: `[nu0,Vc,N0,C,kappa,sigma,lambda,nu_star,wSeed]`, 72 bytes.
2. `coefficients/core_L2_u.f64le`: 128 RNDN words, 1,024 bytes.
3. `coefficients/core_L2_V.f64le`: 128 RNDN words, 1,024 bytes.
4. `coefficients/tail_H.f64le`: 32 positive-zero correction words, 256 bytes.
5. `coefficients/tail_Q.f64le`: 32 positive-zero correction words, 256 bytes.
6. `initializer/core_L2_join_barrier.f64le`: `[U,U1,V,V1]`, 32 bytes.

The tail correction payloads are exactly positive zero because the admitted M5
profile uses the frozen leading analytic tail without an additional correction
series. They are not copied from the failed predecessor proof center.

## Receipt and chronology

The successor first:

1. verifies every frozen raw hash, size, self hash, schema, selected mode and
   cross-binding without importing an execution provider;
2. materializes all six payloads in memory and recomputes their raw hashes;
3. independently re-evaluates origin, join and scalar identities from the
   frozen payload words;
4. emits one canonical calculation receipt binding every input and payload;
5. persists nothing until the receipt and focused hostile tests pass;
6. when separately authorized, writes a new empty output directory with
   exclusive creation, readback and exact rehash.

The receipt and every intermediate return keep candidate, proof, execution,
replay, pair-agreement, diagnostic-lamp, Theory Graph, physical, propulsion and
transport authority false. Passing B1 only makes the initializer bytes eligible
for a separately preregistered four-grid execution packet.

## Terminal classifications

- `BLOCKED`: missing/drifted input, runtime identity unavailable, unsupported
  primitive, cleanup failure, or implementation defect before valid bytes.
- `FAIL`: a frozen mathematical/domain/payload invariant evaluates false.
- `PASS`: all six payloads and the receipt independently reproduce exactly.

No result in this packet authorizes changing the selected mode, M5 center,
coefficient rounding, tail model, grid schedule, continuation schedule,
tolerances, or failure precedence.
