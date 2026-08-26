Program gate: G2H-E — Tolman-VII proof execution
Workstream: authenticated classical and quantum control branch
Capability or component: sole primary G2H-E invocation and immutable first-failure attribution
Current maturity: authorized invocation complete; immutable pre-mathematics partial result
Target maturity: authenticated primary Tolman-VII mathematical decision
Required frozen inputs: proposal bab85c21...b46e, checkpoint 531fe27b...4e61, current G2G contract, seven sources and primary image d074caaa...03ae92
Required evidence: authorization record, invocation/log/result ledger, retained container, exclusive-root chronology and producer-independent audit
Stop/fail criteria: any persisted invocation, partial output or first failure; no retry, retune, smoothing, deletion or alternate root
Explicit non-goals: reinterpretation as a star failure, same-proposal retry, independent execution, G3, SI, lanes, lamp or physical claims
Downstream gate unlocked: versioned candidate-neutral self-identity diagnosis/repair proposal only

# G2H-E primary result: immutable pre-math partial execution

## Decision

`PARTIAL_EXECUTION_PRE_MATH_SELF_IDENTITY_FAIL`.

The user authorized exactly one primary invocation under proposal SHA-256
`bab85c219be9245b77b6a353b9aa47cebe13153107f7d46e0d0e699071feb46e`.
The checkpoint persisted its invocation marker and ran the exact primary image
once. The retained container exited `66`; the checkpoint persisted both logs and
its terminal process result. The proposal is exhausted and no retry is eligible.

This is not a Tolman-VII mathematical `FAIL`. The program stopped before the
contract, seven scientific sources, authorization values, surface-germ gate or
any G2G duty could be evaluated.

## Immutable evidence

| Evidence | Identity |
| --- | --- |
| Authorization record | 380 bytes, `348dc0f0...e87f3` |
| Invocation record | 515 bytes, `06406232...b5c8` |
| Process result | 290 bytes, `44ab716d...3b0f` |
| Standard error | 60 bytes, `8a51fa06...2643` |
| Standard output | empty, `e3b0c442...b855` |
| Retained container | `ed7ed5fd6415...00270c`, exited 66, not OOM-killed |
| Result manifest | `89084492...0df36` |

The invocation record binds the exact proof build binding, image, authorization
digest, token digest and exclusive primary root. The result record fixes
`retry_allowed=false`, return code `66`, the two log digests and
`output_root_exists=false`. The container retains the exact argument vector,
read-only scientific mounts, read-only root filesystem, no network, dropped
capabilities, process/memory bounds and no restart policy.

## First failure

The frozen C source calls:

```text
primary_hash_file("/proc/self/exe", ...)
```

as the first operand of its identity/input/authorization condition. The shared
file-hash function opens every path with:

```text
O_RDONLY | O_CLOEXEC | O_NOFOLLOW
```

Linux exposes `/proc/self/exe` as a procfs symbolic link. On the exact image
runtime, a non-candidate diagnostic confirmed `is_symlink=true` and that
`open(..., O_NOFOLLOW)` returns errno 40, `ELOOP`. Because the failed
self-executable hash is the first operand of a short-circuiting `||` expression,
the program emits `digest, source, runtime or authorization preflight rejected`
and exits 66 without reading the later scientific or authorization inputs.

Typed attribution:

```text
SELF_EXECUTABLE_PROCFS_NOFOLLOW_ELOOP
```

## Chronology and claim boundary

- verification receipt: `65aa480a...f508d`, binding math 318, WARP
  179/179 and Casimir run 2462 `PASS`/`GREEN` with certificate integrity true;
- primary candidate-capable entrypoint invocations: exactly 1;
- candidate evaluations: 0;
- primary output root and proof manifest: absent;
- surface theorem-assumption gate: not reached;
- expected `B''` comparison: not evaluated and not evidence;
- independent authorization, invocation, root and replay: absent;
- candidate admission, classical proof, G3 geometry/state acceptance, SI,
  68-file lanes, lamp, physical viability, propulsion and transport authority:
  all false.

The Rust lane is ineligible both because the user did not authorize it and
because no primary manifest exists to bind. A future action may only begin as a
new versioned, candidate-neutral self-identity repair/preexecution proposal. It
must preserve this container and ledger, may not reuse this proposal as a retry,
and may not reinterpret the partial result as evidence for or against the star.
