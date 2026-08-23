# NHM2 spherical-boson-star v2 G2B-B3 runtime admission result

Program gate: G2B — replacement classical proof attempt  
Workstream: frozen four-grid classical branch  
Capability or component: authenticated integrated-runner Linux runtime  
Current maturity: one immutable runtime-admission PASS  
Target maturity: admitted runtime evidence for runner preexecution sealing  
Required frozen inputs: B3 packet/checkpoint and immutable image identity  
Required evidence: exclusive canonical manifest and loaded-byte readback  
Stop/fail criteria: preserve the first result without retry or mutation  
Explicit non-goals: candidate solve, initializer evaluation, retune, replay or authority  
Downstream gate unlocked: integrated four-grid preexecution sealing  

Date: 2026-08-22  
Result: **PASS**

The sole authorized B3 command completed once. It executed no initializer,
candidate solver, grid, continuation stage, cross-grid evaluator, registry, or
Casimir action.

## Admitted runtime identity

- immutable image:
  `sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1`;
- platform/architecture/pointer ABI: Linux, `x86_64`, 8 bytes;
- CPython: 3.12.11, executable raw SHA-256
  `4dbf3143240288fb2170257ffaa7bd030cdda5d2703d1f5f30b627042267e2e3`;
- glibc: 2.36, loaded libc raw SHA-256
  `bff8750fe719e6000791b88b11747dce8772c37118d0b2348044b70819d13835`;
- ELF loader raw SHA-256:
  `593bb1d5355658e645f36e6b1f49832691b24e177209765914e4cce51499dbb4`;
- gmpy2/GMP/MPFR/MPC: 2.2.1 / 6.3.0 / 4.2.1 / 1.3.1;
- loaded gmpy2 extension raw SHA-256:
  `b2562707227352725881374b9d4eba870a53f848d4e8b118a74701f4754ad9df`;
- loaded GMP raw SHA-256:
  `a22bc8cab9f4fbc5cfadec6c83aacaf5dce6ea85f6b5b1bd15f751153a332275`;
- loaded MPFR raw SHA-256:
  `0e7d7194f75c163475e1fd7e019ae7e2205f4e153aceb7658a261b3add2f2219`;
- all six required glibc fenv symbols present and `fegetround()==0`.

## Receipt

Path:
`artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b3-linux-runtime-v1/runtime-manifest.json`.

- canonical manifest self hash:
  `f8770ea5e438e5f56388fe69457f0031c1e145fd44cf627ad4b07582bac718f6`;
- raw SHA-256:
  `98cb6d63f94e3faf038621465f2417373b579b99e68d8f29473c9c3b79ee14c0`;
- raw size: 2,220 bytes.

The loaded-byte runtime prerequisite named by B2 is closed. Candidate, proof,
execution, replay, pair agreement, diagnostic lamp, Theory Graph, physical,
propulsion, and transport authority remain false.
