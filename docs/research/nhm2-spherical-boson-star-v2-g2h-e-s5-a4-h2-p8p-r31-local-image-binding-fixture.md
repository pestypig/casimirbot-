Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R31 clean-daemon local-image digest-resolution fixture
Current maturity: inert fixture and retained-VM execution proposal; no Docker fixture or numerical execution performed
Target maturity: one authenticated clean-daemon build proving the immutable P8P executable can be reproduced from the two archive-restored local image tags
Required frozen inputs: R30 result, immutable P8P Dockerfile, pinned base-image archive, two accepted manifest/config identities, and required P8P executable SHA-256
Required evidence: initially absent local tags and target image, exact archive and Dockerfile hashes, empty restored RepoDigests, accepted image config identity, no-pull/no-network build, unchanged base identities, exact executable hash, and independent audit
Stop/fail criteria: any pre-existing tag, hash or identity mismatch, nonempty/unexpected RepoDigests, registry/network access, build failure, base-identity drift, executable mismatch, numerical invocation, candidate ingress, cloud mutation, retry, retune, or authority promotion
Explicit non-goals: P=1024 calibration, P8Q decision, P=65,536 observation, frozen-candidate evaluation, positive sampling, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: exactly one separately authorized P8P-R31 fixture execution; only its PASS may make a corrected P=1024 calibration proposal eligible

# H2-P8P-R31 local-image binding fixture

Status date: September 4, 2026.

Status: **FROZEN INERT / FIXTURE EXECUTION NOT AUTHORIZED**.

R30 localized R29's terminal condition to the offline build. The archive restored
the expected image tags with empty `RepoDigests`; Docker then treated the
digest-qualified `FROM` value as a registry reference and failed before
compilation. No container or numerical process ran.

R31 applies the already proven P5A-R2/P8J-R11 repair pattern without changing
the immutable P8P Dockerfile or any scientific source. The fixture supplies the
two authenticated local tags through Docker build arguments, while requiring
the restored image IDs to equal one of each image's frozen manifest/config
identities. Pulling and build networking are disabled.

The fixture is build-only. It may load the pinned base archive, build the P8P
image, and run only `/usr/bin/sha256sum` inside the built image. It contains no
panel count, thread count, timeout wrapper, calibration invocation, candidate
input, Google Cloud command, or resource mutation.

## Frozen scientific and runtime bindings

- immutable P8P Dockerfile SHA-256:
  `1159828fb3a7b69f9b75ecde002b27e6c1442e4c28630c05433559bc8986b570`;
- pinned base-image archive SHA-256:
  `4645ef9f0028a4ae58601a73d8d7cf7cb8f2316578a318ce6ce2257b103624f1`;
- builder manifest/config identities:
  `9e94d19f...5221a1` / `540d7039...c304c`;
- runtime manifest/config identities:
  `8334e977...159ab` / `17043e9f...2057e`;
- required executable SHA-256:
  `7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718`.
- 4,024-byte fixture SHA-256:
  `97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79`;
- 2,905-byte clean-daemon guest wrapper SHA-256:
  `cbb2b99cc3242861dbc3e4eec1caaa81c64a640b89a5ed8f4d95b2293cbe8441`.

## Decision rule

- `PASS`: clean-daemon archive restore, local-tag build, identity stability and
  executable identity all pass exactly. A separately versioned corrected
  P=1024 calibration proposal may then be prepared.
- `FAIL`: preserve the first fixture failure and return to the smallest
  candidate-neutral environment/build diagnosis. No calibration is eligible.

Preparation creates no cloud resource and grants no execution authority. All
candidate, proof, geometry/state, lane, lamp, physical, propulsion and transport
authority remains false.

## Frozen retained-VM execution proposal

The smallest executable fixture reuses only stopped VM
`nhm2-h2-p8p-r26-c2d-32-20260903`, instance ID
`4290604153416687194`, in `us-east1-c`. It permits exactly one restart under a
1,800-second aggregate runtime ceiling and a `$1.00` total compute/storage
ceiling. Its attached 30 GB `pd-standard` disk ID
`8031354852430290522` must remain attached and unchanged. It uploads only the
exact 4,024-byte fixture and 2,905-byte guest wrapper named above, starts one isolated
clean Docker daemon with a new data root/socket, performs the build-only fixture,
exports its deterministic evidence, and stops the VM. It does not use or change
the retained R29/R30 evidence directories.

The proposal authorizes no P=1024 or P=65,536 execution. First failure is
terminal: no retry, fallback, resource substitution, alternate VM, retuning,
candidate evaluation, evidence deletion or authority promotion is implied.
