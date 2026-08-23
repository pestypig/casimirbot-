Program gate: G2D — fresh replacement-candidate proof attempt
Workstream: authenticated classical control branch
Capability or component: G2D-R1 evaluator implementation/preexecution checkpoint
Current maturity: independently audited execution-ready bytes; execution unauthorized
Target maturity: one separately authorized immutable classical proof attempt
Required frozen inputs: G2D definition, evaluator sources, runtimes and orchestrator
Required evidence: 12-file inventory, image/binary identity, token, tests, absent root
Stop/fail criteria: any hash/runtime/root/command drift or execution evidence
Explicit non-goals: execution now, candidate admission, G3, lanes, lamp, physical claims
Downstream gate unlocked: separate user authorization of exactly one G2D attempt

# G2D-R1 execution checkpoint

Execution is not authorized by this checkpoint. It binds the only source,
runtime, root, command and token identities eligible for a later one-shot user
decision. The token is an identity capability, not authority.

```text checkpoint-inventory
e39c602925a47caecb2600cd178e664ff53fb6b7900818aad2b8b4ec890afa40  docs/research/nhm2-spherical-boson-star-v2-g2d-fluid-star-preregistration.v1.json
b588546a97b7c9384dfd682f4fad485194d6468f06e724d5f9af9679610d6313  docs/research/nhm2-spherical-boson-star-v2-g2d-fluid-star-preregistration-checkpoint.md
01542bcf501f1f66c4098323ba042d0782e9d233c2dacf1f30f526c0a0680d7a  docs/research/nhm2-spherical-boson-star-v2-g2d-r1-implementation-preexecution.md
21e20f53f33f7517322a1a9d3c2e4290e8cf000617efe445cbebf349bacf81e5  docs/research/nhm2-spherical-boson-star-v2-g2d-implementation.v1.json
1d102cc521035cec2d67a6acf7d41a5f44ea40fd22bb099f1d210be7efdbf758  docs/research/nhm2-spherical-boson-star-v2-g2d-primary-runtime.v1.json
59f8040bf61eb9fdeebe1c84b5b0dd48110b3e62742d19a8558a2eb2107b324a  docs/research/nhm2-spherical-boson-star-v2-g2d-independent-runtime.v1.json
e7254a85e7871ebb814d20c97f129fe781a06e66e369a4976262fa358b44a4e1  tools/nhm2-spherical-boson-star-v2-branch-proof/g2d_fluid_star_primary.py
2f18f981d7ed55966d7174266eb6b646c0a8ec11339f2663403a1f807d077ee4  tools/nhm2-spherical-boson-star-v2-branch-proof/g2d_fluid_star_independent.c
208edddcf87e225fd452c6a1cb03455fc237df9a3dbbed89b11ed52fcd0afe79  tools/nhm2-spherical-boson-star-v2-branch-proof/g2d_fluid_star_orchestrator.py
8eda8c19a6677692a82b35dd52eea8f95e0c9561bc3740ba30d8198f415762d3  tools/nhm2-spherical-boson-star-v2-branch-proof/Dockerfile.g2d-fluid-star-independent
558d271be8f2dee70c26ce00c973aedbf3525fdeaf744bb2146566b34e7b10fe  tools/nhm2-spherical-boson-star-v2-branch-proof/test_g2d_fluid_star_implementation_preexecution.py
094cc1e05c8eac4b758fca321a25670fa1c81a1993825bd5592b67f712487984  tools/nhm2-spherical-boson-star-v2-branch-proof/test_g2d_fluid_star_implementation_independent_audit.py
```

## Runtime identities

- Primary executable:
  `d932e5e2f324d57f392e8fd063dcf6d0185be8a664c57c6d24e7762ed02c28ca`.
- Independent image:
  `sha256:c4c437edf2ae480445f2ec9c1a551e6d88d264947d6238e023d5368b4a7c158a`.
- Independent native binary:
  `ff56a59d33e2e450986aadb81769c1a141677fb830d75c0f960bf163a96a6713`.

Both inert entrypoints were observed without `--execute`. The Windows primary
uses `Fraction`/`Decimal`; the Linux native binary uses GMP/MPFR and does not
link CPython. Candidate data was not evaluated.

## Unauthorized token and exact command

Token:

```text
359cdf5d87e865dc3721b99bd79c3453046f5e489d51f67676dbc1c48167d034
```

Exact future command:

```powershell
$env:NHM2_G2D_EXECUTION_TOKEN='359cdf5d87e865dc3721b99bd79c3453046f5e489d51f67676dbc1c48167d034'; python -I -B tools/nhm2-spherical-boson-star-v2-branch-proof/g2d_fluid_star_orchestrator.py --execute --implementation-manifest docs/research/nhm2-spherical-boson-star-v2-g2d-implementation.v1.json
```

No current statement authorizes this command. A later authorization must permit
exactly one attempt and acknowledge that any PASS, FAIL or partial prefix is
immutable evidence with no retry, retune, deletion or alternate output root.

## Preexecution verdict

- Focused/source-independent implementation tests: `13/13 PASS`, including the
  source-independent checkpoint inventory rehash.
- Candidate evaluator executions: `0`.
- Future root: absent as file, directory and symlink.
- Execution and candidate admission: `false`.
- Quantum state, SI, metric, lane, replay, pair agreement, lamp, physical,
  propulsion and transport authority: `false`.

## Current-tree verification

- Math-stage validation: `PASS`, 318 entries.
- Required WARP battery: `PASS`, 18/18 files and 179/179 tests.
- Casimir adapter run: `2453`, `PASS / GREEN`, `firstFail=null`.
- Certificate hash:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
- Certificate integrity: `true`.

These results certify repository gate integrity and the no-execution
precheckpoint. They are not a fluid-star candidate proof or execution receipt.
