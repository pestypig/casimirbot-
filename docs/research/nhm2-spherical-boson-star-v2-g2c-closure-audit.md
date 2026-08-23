Program gate: G2C — replacement-candidate research and preregistration
Workstream: classical control-candidate selection
Capability or component: closure evidence and authority audit
Current maturity: verified G2C closure; no candidate execution
Target maturity: immutable handoff to active G2D preregistration
Required frozen inputs: protocol, selection result, audit code and G2D packet
Required evidence: hashes, deterministic replay and required repository gates
Stop/fail criteria: hash drift, replay disagreement, failed gate or authority promotion
Explicit non-goals: candidate solve, quantum acceptance, lane/lamp/physical claim
Downstream gate unlocked: G2D preregistration only

# G2C closure audit

## Bound files

| File | SHA-256 |
|---|---|
| `nhm2-spherical-boson-star-v2-g2c-evidence-and-selection-protocol.md` | `a5977ba694aa802bc79780e03d5ec8689e3927d621f0ef901ef0957076d9d679` |
| `nhm2-spherical-boson-star-v2-g2c-selection-result.md` | `fbd1424f5250e39a57199201139ee84a66e6805400fe35aa67adc99dfe3cf67e` |
| `nhm2-spherical-boson-star-v2-g2d-fluid-star-proof-attempt.md` | `a347bdfb9c9f06f1020e7e02c300c00fcad6fa265163566407540a7b289029d2` |
| `g2c_selection_independent_audit.py` | `a00f8c21636c682640f4ed326693de1ebbd0bb8b55181af9779e625cc7365092` |
| `test_g2c_selection_independent_audit.py` | `b10fe9523a0ff316947a0d2156b9673817c4c29d4bb2aad537c173e5ef42231e` |
| `training-trace-g2c-selection-2026-08-23.jsonl` | `944f3025773944b48e1a008729cc79eb8f809b42888e0bce41178dfa54c7d226` |

The trace export is `4,718,252` bytes. Repository head at verification time was
`718bb7d7697e3e0266e7e5821ba6116c64f80c90`.

## Replay and repository gates

| Gate | Result |
|---|---|
| Independent G2C selection replay | `PASS`, 1/1 |
| Math report/validation | `PASS`, 318 entries |
| Required WARP tests | `PASS`, 18/18 files, 179/179 tests |
| Casimir repo-convergence | run `2450`, `PASS` / `GREEN` |
| Certificate integrity | `true` |
| Certificate SHA-256 | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` |

## Authority audit

- Candidate parameters frozen: `false`.
- Candidate execution authorized or performed: `false`.
- Candidate admitted: `false`; total admitted candidates remain `0`.
- Classical G2D proof established: `false`.
- Joint geometry/state accepted: `false`.
- Complete 68-file lanes: `0`.
- Replay/pair agreement: `false`.
- Theory Graph diagnostic lamp: `false`.
- Physical, propulsion, transport, launch, and empirical authority: `false`.

G2C closes only the research choice. The sole next work is the active G2D
preregistration packet; it must freeze one exact low-compactness member before
any evaluation or request for one-shot execution authority.
