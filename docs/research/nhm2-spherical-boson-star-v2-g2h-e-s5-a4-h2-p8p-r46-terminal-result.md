Program gate: G2H-E-S5-A4 / P8P; P8Q STOP
Workstream: Candidate-neutral R39 build-fixture evidence recovery
Capability or component: R46 one-shot stopped-disk retrieval result
Current maturity: R46_FAILED before helper creation; R40 archive not recovered locally
Target maturity: Preserved terminal evidence and a separately reviewed infrastructure successor
Required frozen inputs: Approved proposal SHA-256 `3bb11b0223f7833da319c0907c1d193e80478fd0a19456b09884c396f05f05b9`; command-ledger SHA-256 `828157c0e74d53501cf5c45d6a75fbd14a2c642c062c742982259cc06344450d`
Required evidence: Claimed host anchor, source-disjoint journal replay, failed SDK receipt, final safety and Compute/Storage readbacks
Stop/fail criteria: First helper-create error consumes R46; no retry, resource substitution, or evidence deletion
Explicit non-goals: Docker, build, P=1024 or P=65,536, candidate evaluation, retuning, G3/SI/metric/lane work, authority promotion
Downstream gate unlocked: Candidate-neutral scope correction proposal only; not a build PASS or P8Q GO

# P8P-R46 terminal result

The approved R46 command was invoked exactly once on September 20, 2026 for
attempt `c030704b62757d8f0e2994dafcb87550de3ef9be2d3bf5b35a6612e4cbbceb0e`.
Its controller ended `R46_FAILED`, `scientificAuthority:false`. Source preflight,
the regional snapshot, and the snapshot-derived clone completed and passed their
readbacks. The sole helper-create request failed with Google's exact error:
`One or more of the service account scopes are invalid: 'devstorage.read_write'`.
The frozen command had used `--scopes=devstorage.read_write`. [Google's Compute
CLI reference](https://docs.cloud.google.com/sdk/gcloud/reference/compute/instances/create)
lists `storage-rw` or the full
`https://www.googleapis.com/auth/devstorage.read_write` URI, not that bare
suffix, as the accepted spelling. This is an infrastructure-command defect, not
a numerical result. The R46 command was not altered or retried.

The source-disjoint host-claim audit found the claim/reservation consistent:
anchor SHA-256 `b0b9b9fbe18768395f058c06b16a04908dd89657ab591c5ea22cf055ced6a159`;
reservation SHA-256 `2c005a0c80c507a20140405043c6a37176e0de8eb81e216cadf71f213dc93467`.
Independent workload-journal replay verified 123 records, 55 binary files, a
valid chain, terminal `R46_FAILED`, and final SHA-256
`5108517b3c40213a7478fcb0d2e2e6942dc83a0a8835a74a80fb4da56f8f2235`.
Safety-journal replay verified 191 records, 95 binary files, a valid chain and
final SHA-256 `4a576ce74684d856741a74eedf07de361cf8f5c51811bff5`.
Its classification is `PARTIAL` because the safety channel has no terminal
status entry. All 95 safety HTTP observations were GET/404 and all 95 steps
reported `ABSENT`; no STOP POST was needed. The final absence observation was
at `2026-09-20T18:12:10Z`, beyond the frozen provider STOP timestamp.

A separate post-run Compute read again found the proposed R46 helper absent.
The original R32 VM ID `1893159507643031574` and R39 helper ID
`7129462452423922626` remained `TERMINATED`. The retained standard snapshot
ID `29969082222486286` was `READY` in `us-east1`, sourced from exact R39 boot
disk ID `1064813028101755842`. The retained 10 GB `pd-standard` clone ID
`966464393055150283` was `READY`, derived from that snapshot. The exact R46
Storage object remained absent (404). No guest, Docker, build, numerical
process, or local archive capture occurred.

Raw anchor, reservation, SDK stderr, workload/safety journals and binaries are
retained under
`C:\NHM2-P8P-Workflow-Review\r46-c030704b62757d8f0e2994dafcb87550de3ef9be2d3bf5b35a6612e4cbbceb0e`.
The separate terminal evidence note is
`C:\NHM2-P8P-Workflow-Review\P8P-R46-TERMINAL-EVIDENCE-20260920.md`,
SHA-256 `a16dd81374aeccfe33f0dd3ce4d9422e24cf15875a34830f912303dc023b63ad`.
Snapshot, clone, source disks and evidence remain retained; cloud storage may
continue to incur charges. A corrected successor must be independently
specified and authorized. The R39 fixture failure remains unclassified, no
authenticated P=1024 turnaround result exists, and P8Q remains
`P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` with all scientific and physical
authority locked.
