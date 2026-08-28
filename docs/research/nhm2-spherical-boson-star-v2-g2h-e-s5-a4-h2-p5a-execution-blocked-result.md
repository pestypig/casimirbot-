Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P5A corrected cloud execution and immutable preexecution stop
Current maturity: corrected C4 environment instantiated; frozen upload inventory proved incomplete before build or timing
Target maturity: immutable independently audited blocker evidence and a bounded upload-inventory repair handoff
Required frozen inputs: proposal `1eaea632...5a50`, correction `8a995bd0...1410`, source manifest `7c56923d...a907`, archive `5a4f6f98...c321d`, and required binary `aa37562f...13b7`
Required evidence: exact VM/storage identity, remote archive rehash, complete archive inventory, build/load logs, zero-run evidence, stopped VM, cost/runtime bounds, and independent audit
Stop/fail criteria: absent frozen build definition, additional upload, reconstructed Dockerfile, binary mismatch, any numerical run before binary verification, retry/retune, cost/runtime ceiling, or authority promotion
Explicit non-goals: repairing or retrying this exhausted attempt, frozen-candidate evaluation, full selector, roots, handler linkage, G3, SI/metric, lanes, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: a separately versioned candidate-neutral upload-inventory repair definition only; no VM or numerical execution

# H2-P5A corrected execution blocked result

Status date: August 27, 2026.

Status: **BLOCKED PREEXECUTION / ZERO NUMERICAL RUNS / VM STOPPED**.

This result changes receipt and planning state only. It changes no mathematical
semantics, runtime authority, proof maturity, candidate identity, or scientific
claim.

## Corrected environment result

The one authorized corrected creation attempt succeeded with the exact
environment:

- VM: `nhm2-h2-p5a-c4-16-20260827`;
- zone: `us-central1-a`;
- machine: `c4-standard-16`;
- boot disk: 30 GB `hyperdisk-balanced`;
- final state after evidence capture: `TERMINATED`.

The VM started at `2026-08-27T10:55:33.732-07:00` and stopped at
`2026-08-27T11:12:14.150-07:00`, for `1000.418` seconds of active runtime.
The conservative creation-to-stop window was `1008.085` seconds. Applying the
planning rate of `$0.79068/hour` to that larger window gives about `$0.22141`,
well below the `$2.00` ceiling; this is a rate projection, not a billing
invoice.

## Immutable first blocker

The single authorized archive transfer completed and the VM-side SHA-256
matched the already cloud-verified archive exactly:

`5a4f6f983fed9b51fb444b115df77001062f24a6d5540f96fae0dc2d101c321d`.

The archive contains exactly 36 entries. It includes the candidate-neutral
P5A C++ source and the approved pinned base-image archive. Both pinned base
images loaded. It does **not** include:

`tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p5a-width-calibration.v1`.

The cloud build therefore stopped with `no such file or directory`. Supplying,
reconstructing, or streaming that missing Dockerfile would have violated the
explicit `reuse only ... upload no additional files` boundary. The stop was
preserved rather than bypassed.

Consequently:

- required binary built: false;
- required binary SHA verified: false;
- `P=1024` calibrations executed: 0 of 5;
- full-selector and smaller-width runs: 0;
- frozen-candidate evaluations and positive samples: 0;
- candidate/output roots and scientific handlers: absent;
- every candidate, proof, geometry/state, lane, lamp, physical, propulsion,
  and transport authority: false.

This is `BLOCKED`, not a scientific `FAIL`: no mathematical calibration ran.

## Evidence and independent audit

The immutable partial evidence bundle SHA-256 is:

`5c1df7db8cedc846c9835900010acf605c9eb9e62bd73b71f48f6cd2b7e1fc92`.

The structured receipt SHA-256 is:

`1f7715b8877a8f887fe9bebd714f3ad3519949284da30b3d85006a35039f83cf`.

The independent audit passes **25/25**. Its JSON SHA-256 is:

`793f074db9abb19c0d94353278997cde6dcd9d6866b749cf4773231ddaefb2fe`.

It independently rehashes the upload and downloaded evidence, proves the exact
36-entry inventory and missing Dockerfile, confirms both base images loaded,
confirms zero run files and zero calibration invocations, recomputes runtime
and cost bounds, and checks every authority lock false.

Current-head repository verification passes: math registry `323/323`, the
required 18-file WARP battery `179/179`, and Casimir adapter run `2545`
`PASS/GREEN` with first failure `null`, certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
and integrity true. This verifies gate integrity only; it does not turn the
preexecution blocker into a proof or promote any authority.

## Resume boundary

This corrected attempt is exhausted and must not be restarted or reinterpreted
as timing evidence. The smallest legitimate successor is a versioned,
candidate-neutral upload-inventory repair that binds the already frozen
Dockerfile bytes into a new source manifest and archive, independently audits
the new inventory before any cloud action, and requests separate authority for
any new VM or numerical execution. That successor is not authorized by this
result.
