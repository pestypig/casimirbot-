# NHM2 spherical-boson-star v2 G2B-B1-R1 origin-barrier diagnosis

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: initializer origin-representation admission  
Current maturity: B1 exact-MPFR endpoint-equality failure preserved  
Target maturity: versioned representation repair and fresh one-shot result  
Required frozen inputs: immutable B1 result, M5-R1/M5, initializer-evaluator v1  
Required evidence: contract comparison, unchanged payload derivation, fresh result  
Stop/fail criteria: first unchanged mismatch or repaired terminal-barrier mismatch  
Explicit non-goals: tolerance selection, coefficient change, rerun of M5, candidate solve or authority  
Downstream gate unlocked: G2B four-grid execution review

## Diagnosis

B1 required the MPFR sum of the binary64 coefficient payload at `rho=0` to be
exactly one. That requirement is not present in the frozen initializer-evaluator
v1 contract. The contract treats payload coefficients as binary64 values,
performs the fixed MPFR recurrence, and creates initializer fields only at its
terminal binary64 RNDN barriers. It expressly labels the result a
non-authoritative initial guess and requires the relativistic BVP to resolve the
frequency again.

The failed B1 result is:

```text
exact MPFR u_payload(0)-1
  = 10445944158304557
    / 324518553658426726783156020576256
terminal binary64 RNDN u_payload(0)
  = 0x1.0000000000000p+0
```

The exact-equality requirement was therefore an overconstraint introduced by
B1 at the wrong representation boundary. Removing it does not alter a frozen
coefficient, mode count, grid, initializer formula, solver tolerance, candidate
parameter, or observed mathematical rail.

## Sole versioned repair

Replace only:

```text
require exact_MPFR_sum(u_payload,rho=0) == 1
```

with:

```text
require get_d_RNDN(exact_MPFR_sum(u_payload,rho=0))
        has the exact positive binary64 word 3ff0000000000000
```

The exact rational deviation remains persisted as diagnostic evidence. It is
not compared with a newly selected tolerance. Every other B1 input, arithmetic
operation, payload conversion, domain condition, join derivation, tail rule,
failure precedence and authority lock remains byte-for-byte or semantically
unchanged.

This repair is falsified if the terminal word differs from positive binary64
one, if the exact deviation cannot be reproduced, or if any earlier B1 check
fails. It authorizes one fresh in-memory B1-R1 invocation only; it does not
authorize a branch solve.
