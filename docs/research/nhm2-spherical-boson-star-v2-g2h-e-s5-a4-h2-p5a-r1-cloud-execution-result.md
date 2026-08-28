Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P5A-R1 representative-width cloud execution result and offline base-image binding blocker
Current maturity: immutable `BLOCKED_PREEXECUTION_BUILD_BINDING`; zero numerical runs
Target maturity: separately versioned clean-daemon offline image-binding repair, independently audited before any new execution decision
Required frozen inputs: proposal `73fd408f...36d1`, archive `a8b66052...6422`, manifest `dc33dec0...de91`, builder digest `9e94d19f...21a1`, runtime digest `8334e977...19ab`, and required binary `aa37562f...13b7`
Required evidence: exact cloud resource identity, upload and VM-side archive replay, loaded-image identities, first build failure, zero-run proof, immutable evidence bundle, independent audit, stopped VM, and false authority locks
Stop/fail criteria: any archive drift, base-image identity ambiguity, build or binary mismatch, numerical invocation after preexecution failure, retry/retune, evidence deletion, resource substitution, or authority promotion
Explicit non-goals: changing arithmetic, equations, width, run sequence, threshold, candidate, selector, executing a calibration after the blocker, frozen-candidate evaluation, roots, handlers, G3, SI/metric, lanes, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: one bounded H2-P5A-R2 candidate-neutral offline image-binding repair only; no cloud or numerical execution

# H2-P5A-R1 cloud execution result

Status date: August 27, 2026.

Status: **BLOCKED PREEXECUTION / ZERO CALIBRATION RUNS**.

This result changes receipt and program status only. It changes no mathematical
semantics, runtime authority, candidate identity, numerical parameter, proof
maturity, or scientific or physical claim.

## Authorized boundary

The sole R1 VM was created under proposal SHA-256
`73fd408fd4d30f843c445e3930ddc7843eac3ac2594948bc714871e39e5936d1`:

- name: `nhm2-h2-p5a-r1-c4-16-20260827`;
- zone: `us-central1-a`;
- machine: `c4-standard-16`, standard provisioning;
- boot disk: exactly 30 GB `hyperdisk-balanced`;
- source upload: only `h2-p5a-r1-upload-v1.tar`.

Before creation, the R1 instance and disk were absent and the exhausted
predecessor `nhm2-h2-p5a-c4-16-20260827` was `TERMINATED`. The cloud-side and
VM-side archive checks both reproduced:

- SHA-256 `a8b660522087c820aa23f7e11737aa55b944b7f6a048f867cabdeb4d8ccb6422`;
- exactly 37 members;
- exactly 236,257,280 bytes.

## First preexecution failure

Docker loaded both bundled base images by their frozen local tags:

```text
Loaded image: nhm2-g2h-s4-primary-fixture-builder:v2
Loaded image: nhm2-g2h-primary-proof:v2
```

The frozen Dockerfile then reached its first `FROM` instruction and stopped:

```text
Step 3/43 : FROM ${BUILDER_IMAGE} AS builder
pull access denied for nhm2-g2h-s4-primary-fixture-builder ...
```

Independent inspection explains the failure. The loaded archive restores the
tags and image configuration IDs, but both images have empty `RepoDigests`:

```text
builder ID = sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c
runtime ID = sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e
RepoDigests = []
```

The Dockerfile requires local resolution of `name@repository-manifest-digest`.
Because the clean daemon has no corresponding repository-digest metadata, the
classic builder attempts a registry pull for a repository that is not
available. This reveals that the earlier 28/28 offline-build audit did not
isolate daemon image metadata strongly enough: it used a fresh extracted build
context, but not a clean Docker daemon.

No build override, alternate Dockerfile, registry pull, retry, or retune was
used. The required binary SHA-256 was therefore not reachable and none of the
five authorized calibration processes was invoked.

## Immutable evidence and audit

The preserved cloud evidence bundle is:

`artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r1-cloud-execution-v1-20260827/h2-p5a-r1-preexecution-evidence.tgz`

Its SHA-256 is:

`e9b0dcce67d756c3b53833437b8d7bf3c86d4f1f72eff498c49cc70639c75f4d`.

The independent local audit passes **22/22** at SHA-256:

`fdbcad3df61e2f1c98498b66e38d83215adcc62ead23504cd91d21889f23e6be`.

It independently derives `BLOCKED_PREEXECUTION_BUILD_BINDING` from the archive,
image-inspection, load, and build logs. The remote `h2-p5a-r1-outcome.json` is
preserved byte-for-byte but is malformed non-JSON text because of shell
quoting. The audit detects that representation defect and does not use the file
as classification authority.

## Resource closure

The VM creation timestamp was `2026-08-27T19:03:43.702Z`; the stop request was
issued at `2026-08-27T19:19:37Z`. That is about 15 minutes 53 seconds, or about
`$0.21` at the planning compute rate before billing granularity and storage.

Final cloud state:

- R1 VM: `TERMINATED`;
- R1 disk: `READY`, preserved and not deleted;
- predecessor VM: still `TERMINATED`;
- numerical runs: 0 of 5;
- binary-hash check: not reached;
- runtime-turnaround decision: not reached.

## Disposition

Current-head verification passes:

- independent result audit: 22/22;
- math registry and validation: 323/323;
- required WARP battery: 18/18 files and 179/179 tests;
- Casimir adapter run `2551`: `PASS/GREEN`, `firstFail=null`;
- certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

The temporary local adapter was stopped after verification. These checks bind
repository and receipt integrity only; they do not turn the preexecution block
into a scientific result.

R1 is exhausted as immutable preexecution evidence. The next eligible work is
not another cloud run. It is a versioned, candidate-neutral H2-P5A-R2 repair
that must bind the two archive-restored image configuration IDs in a genuinely
clean Docker daemon, reproduce the required binary offline, and independently
audit that clean-daemon property. Any future cloud execution would require a
new frozen packet and separate exact authorization.

Candidate, proof, geometry/state, lane, lamp, physical, propulsion, and
transport authority remain false.
