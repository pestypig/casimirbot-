Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P5A-R2 clean-daemon base-image binding and storage-safe offline build
Current maturity: repaired 39-entry archive producer-audited 11/11 and independently audited 28/28 with a clean-daemon binary-hash replay; no cloud or numerical execution authorized
Target maturity: one separately frozen and authorized representative-width cloud timing decision under the unchanged 1/4/8/16/16 sequence
Required frozen inputs: immutable R1 archive `a8b66052...6422`, manifest `dc33dec0...de91`, base archive `4645ef9f...24f1`, R2 Dockerfile `1c736033...5826`, guard `6386d0c3...931f`, and binary `aa37562f...13b7`
Required evidence: byte-identical R1 preservation, exact archive-restored manifest/config identities, absent target tags before load, no-pull/no-network build, identity stability across build, binary-hash reproduction, independent audit, and false authority locks
Stop/fail criteria: any R1-byte drift, pre-existing target tag, unrecognized restored identity, registry pull, networked build, base identity change, binary mismatch, calibration/candidate invocation, cloud action, retune/retry, or authority promotion
Explicit non-goals: representative timing, full selector, frozen-candidate evaluation, positive sampling, root/token/authorization creation, handler linkage, G3, SI/metric, lanes, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: completed by the separately frozen and independently audited H2-P5A-R2 cloud proposal `34a5af86...84bb`; execution still requires separate exact authorization

# H2-P5A-R2 clean-daemon binding repair

Status date: August 27, 2026.

Status: **PASS INERT / CLEAN-DAEMON BUILD BLOCKER CLOSED**.

R2 repairs the representational failure observed by the exhausted R1 cloud
attempt. It changes no arithmetic, equations, source bytes, candidate identity,
width, thread sequence, timing threshold, or authority state.

## Repair

R1 used `name@repository-manifest-digest` in each `FROM`. A classic clean
daemon restored the archive's tags and config identities but no `RepoDigests`,
so Docker attempted a registry resolution before compilation. R2 instead:

1. requires both target tags to be absent before archive load;
2. loads the exact frozen base-image archive;
3. accepts only the archive's known manifest or config identity for each tag;
4. builds from the restored local tags with `--pull=false --network=none`;
5. verifies both identities are unchanged after the build; and
6. invokes only `/usr/bin/sha256sum` to verify the frozen binary.

The R2 Dockerfile also replaces 35 source-by-source `COPY` layers with one
source-directory `COPY`. This is a storage-layout correction for classic
`vfs` daemons, not a scientific or runtime optimization. The compiler command,
source inventory and produced binary remain exact.

## Frozen identities

- R2 Dockerfile SHA-256: `1c736033402e8628f2ba47d534759b9917807b9039c648619912ea2515b55826`;
- offline build guard SHA-256: `6386d0c342b66cf2c05cecde873575b43a73193cfc637b3f9e190be344ac931f`;
- source manifest SHA-256: `2a48f796d10e4dd048838eb50f307c066db3cf5dd5a29fc5098509a27c91ccce`;
- 39-entry upload archive SHA-256: `e9a2d9ee23fac2c1ef8a5b2d128ee5690014f96dd0cf781af6a8546404f37d87`;
- upload archive size: `236267520` bytes;
- producer preflight SHA-256: `032b9227553ef0a90d52db44a38f0467d24e5ca419a93c03eabaf82deb24e7a6`;
- clean replay log SHA-256: `161f8b544658c9d654bc715f8c82de4af8ca9ccd0e8552bb06e1868c9026292a`;
- independent audit SHA-256: `d01ec55934a4be929952799c2a91fed2b423c278ba2e92e967ce42a5097c852c`;
- required and reproduced binary SHA-256: `aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7`.

All 37 R1 members retain their exact order and bytes. R2 appends only its
Dockerfile and offline guard.

## Clean-daemon evidence

The first local isolation harness correctly reproduced the cloud identities,
but its 43-layer classic-`vfs` build exhausted the host disk and stopped at
Dockerfile step 29 with `SIGBUS`. That harness failure is preserved and is not
a numerical or H2 mathematical result. No binary or calibration ran.

After the storage-layout repair, a new empty classic Docker 20.10.24 daemon
loaded the same archive and reported:

- builder config: `sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c`;
- runtime config: `sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e`.

The offline build completed in 9 steps with empty stderr and reproduced the
required binary exactly. Producer preflight passes **11/11** and the independent
audit passes **28/28**. Both temporary isolation containers were removed after
their logs were preserved.

Current-head verification passes math **323/323**, the required 18-file WARP
battery **179/179**, and Casimir adapter run **2552** `PASS/GREEN` with first
failure `null`, certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
and integrity true. This verifies gate integrity only.

## Authority state

- cloud uploads or VM actions: 0;
- representative calibrations: 0;
- frozen-candidate evaluations or positive samples: 0;
- execution proposal, authorization record or token: absent;
- candidate/output roots and scientific handlers: absent;
- proof, geometry/state, lane, lamp, physical, propulsion and transport
  authority: false.

R2 closes only the clean-daemon build blocker. Its separate
[representative-width cloud proposal](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p5a-r2-cloud-proposal.md)
is now frozen at `34a5af86...84bb`, with producer preflight 20/20 and independent
audit 26/26. It created no VM, upload or numerical run. Any `P=1024`
calibration still requires the packet's separate exact authorization.
