Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R39 authenticated file transport and retained-R32 build-only fixture
Current maturity: immutable one-shot result; transport reached the guest; build-only fixture returned exit 101; detailed guest evidence remains on the stopped disk
Target maturity: authenticated classification of the fixture failure and one evidence-selected minimal successor
Required frozen inputs: R39 proposal/controller, local staged files, retained R32 VM/disk, immutable R39 local evidence and guest evidence archive identity
Required evidence: controller chronology, transport receipts, guest terminal marker, stopped resource identity, read-only recovery of exact guest logs, and independent result audit
Stop/fail criteria: R39 retry, original VM restart, evidence mutation/deletion, unbounded or writable recovery, numerical execution, candidate ingress, retune, or authority promotion
Explicit non-goals: interpreting exit 101 without its logs, changing the fixture or build, P=1024/P=65,536 execution, frozen-candidate evaluation, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: only read-only evidence recovery; no build or calibration successor is yet justified

# H2-P8P-R39 build-only fixture result

Status date: September 4, 2026.

Status: **R39 CONSUMED / TRANSPORT REACHED GUEST / FIXTURE FAILED / DETAIL RECOVERY REQUIRED**.

The exact authorized R39 controller ran once. It authenticated proposal and
input identities, authenticated the retained instance, restarted it once, and
completed its fixed wait. The first absence probe returned exit `1`, but its
captured output shows that Plink was asking about a previously uncached host
key rather than proving remote path absence. The controller incorrectly treated
any exit `1` as the expected `test -e` negative result. This weakens the
non-clobbering proof for the uploaded guard path and must not be described as a
successful absence check.

Subsequent transport did reach the guest:

- the guard SCP completed;
- `bash /home/pestypig/h2_p8p_r39_remote_guard_v1.sh` returned exit `0` and
  printed exact marker `R39_REMOTE_GUARD_PASS`;
- the unchanged 236,640,768-byte archive SCP completed;
- the launcher SCP completed; and
- the launcher reached the unchanged R32 wrapper.

The wrapper emitted:

```text
R32_GUEST_TERMINAL phase=fixture exit=101
R32_EVIDENCE bytes=5155 sha256=de12d097b90def46b8d94a8426d8398f7596feb013806d9d8427d4a615c55dcd
```

Thus the file-based transport correction crossed the Windows/gcloud boundary
and reached the build-only fixture. The unchanged fixture itself returned
nonzero. Exit `101` is the wrapper's `fixture` classification, not a numerical
or candidate result. The specific Docker/image/binary predicate that failed is
not present in the local R39 capture and must not be inferred.

The controller observed the VM `TERMINATED`, then its one serial-output request
returned Google API error `resource is not ready`. Later read-only serial
requests returned the same state. Under the frozen rule the R39 execution is
consumed and is not retried. Its local evidence root records procedure exit
`1`; the exact VM remains `TERMINATED`, and its attached 30 GB source disk
remains `READY`.

The sole evidence-supported successor is a separately authorized stopped-disk
snapshot rescue that mounts only a derivative clone read-only and retrieves the
existing 5,155-byte guest evidence export plus its bounded source directory.
No build correction or P=1024 calibration is eligible until that evidence is
authenticated and classified.

No numerical executable, frozen candidate, positive sample, P=1024 or
P=65,536 calibration ran. Candidate, proof, geometry/state, lane, lamp,
physical, propulsion and transport authority remain false.
