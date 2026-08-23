Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: B4-R10 exact one-shot authorization decision
Current maturity: independently revalidated and recommended for authorization
Target maturity: one explicitly authorized immutable four-grid attempt
Required frozen inputs: R10 checkpoint, implementation, tests, audit and image
Required evidence: exact hashes, absent root, host/Linux preflight and resources
Stop/fail criteria: any byte, image, command, root, environment or lock mismatch
Explicit non-goals: execution by this record, retry, retune or authority promotion
Downstream gate unlocked: exact user authorization of the checkpointed command

# NHM2 spherical-boson-star v2 G2B-B4-R10 authorization decision

## Decision

The evidence-backed decision is:

```text
AUTHORIZE_EXACT_ONE_SHOT_AFTER_EXPLICIT_USER_CONFIRMATION
EXECUTION_NOT_YET_AUTHORIZED
OUTPUT_ROOT_MUST_REMAIN_ABSENT_UNTIL_INVOCATION
```

This record recommends the single frozen attempt. It does not itself authorize
or execute it. The remaining authority condition is an explicit user statement
that names the exact token below and authorizes the checkpointed command.

## Revalidated identity closure

| Role | SHA-256 | Match |
|---|---|---|
| R10 implementation | `3957ebe50cf036a673547af5e32817d0cdb545b4a593ee479971539dcadd6b0a` | yes |
| Focused tests | `05d3459f2d64686112a383a49823abdc0ab130045ebc51ebd55a4acb1efd41a7` | yes |
| Independent preexecution audit | `f531f61589f22359177bf9049eda58417207fbe0b1fd78ccc533e0a73baa83b5` | yes |
| Implementation packet | `4822a669abe9dabd0c6db7aad917f9c637fbe7a0e40f9d7fc5086327dc7996da` | yes |
| Execution checkpoint | `21c214f8275787a14ae7327a0d77bb099916562ee93606966c3c74116767cc31` | yes |

The implementation's read-only preexecution closure reopens all 27 frozen R9
dependencies. Host and admitted offline Linux preflight suites pass 11/11. No
initializer, grid, Newton correction, continuation stage, Armijo trial or
candidate output was evaluated.

The admitted image exists locally with both image ID and repository digest:

```text
sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1
nhm2-g2b-runtime@sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1
```

The future root remains absent as both file and symlink:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1
```

At decision time the host reports 1.81 GiB free on `C:`, 4.41 GiB free physical
memory and 5.44 GiB free virtual memory. The admitted image is already present;
the command has `--network none` and cannot pull or install dependencies.

## Exact authority request

The required fixed token is:

```text
b1c408e2c3a3dbc48ceee5da6998ced66579bce65bc324ffb6dbc98857c36d20
```

The eligible command remains byte-for-byte the command in
`nhm2-spherical-boson-star-v2-g2b-b4-r10-execution-checkpoint.md`. The user may
authorize it with this exact statement:

```text
I authorize exactly one B4-R10 execution under token b1c408e2c3a3dbc48ceee5da6998ced66579bce65bc324ffb6dbc98857c36d20 using the checkpointed offline command. I understand that PASS, FAIL, or partial output becomes immutable evidence and there will be no retry, retune, deletion, or alternate output root.
```

Any wording that omits the token or materially changes the one-shot/no-retry
boundary is not execution authority.

## Current-tree verification

- math report: 318 entries; validation `OK`;
- R10 no-execution preflight: host 11/11 and admitted Linux 11/11;
- latest required WARP suite on unchanged code: 18/18 files, 179/179 tests;
- Casimir adapter run 2447: `PASS`, first failure `null`, deltas empty;
- certificate: `GREEN`, integrity `true`, SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.

The current authorization-decision training trace is
`artifacts/training-trace-g2b-b4-r10-authorization-decision.jsonl`.

## Authority and semantics

This decision changes planning/authorization eligibility only. It changes no
mathematical, numerical, runtime, candidate, threshold, output or receipt
semantics. Until the exact confirmation is received, execution authority,
candidate admission, vacuum connection, proof, replay, lane, pair agreement,
diagnostic lamp, Theory Graph, physical viability, propulsion and transport
authority all remain false.
