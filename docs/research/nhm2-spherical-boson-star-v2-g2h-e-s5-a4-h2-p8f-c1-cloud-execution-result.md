Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8F-C1 cloud-observable representative execution result
Current maturity: immutable preexecution build failure with authenticated stopped-disk evidence
Target maturity: terminal C1 classification and smallest separately versioned source-inventory repair
Required frozen inputs: N2 VM `nhm2-h2-p8f-c1-n2-32-20260831`, archive `c40fda6b...24640`, controller `940ee74a...db8b2`, rescue archive `8236b3a7...f8130`
Required evidence: exact cloud chronology, controller journal, offline build log, source-manifest comparison, zero numerical/candidate actions, stopped resources and independent result audit
Stop/fail criteria: C1 retry or reinterpretation, editing immutable evidence, threshold/algorithm change, candidate ingress, numerical execution, retune or authority promotion
Explicit non-goals: treating a compiler failure as a scientific result, restarting C1, frozen-candidate evaluation, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: candidate-neutral P8F-C2 archive-inventory repair and offline build/fixture audit only; no cloud or scientific execution authority

# H2-P8F-C1 cloud execution result

## Verdict

`BLOCKED_PREEXECUTION_ARCHIVE_INVENTORY_SKEW`

The exact N2 VM was created once. The authenticated 236,391,936-byte upload
archive matched SHA-256 `c40fda6b7fca57c34a6eef1f93398bfbc5edb731c58c9b5d70a83dcdb4724640`.
The controller source matched
`940ee74a7093614bc5c5268a9871fd40a16ab1563c60a9ba5bc399f286ddb8b2`
and launched once under transient unit `nhm2-h2-p8f-c1-controller`, PID 3123.

The pinned base images loaded successfully. The offline Docker build then
failed at compilation. Persistent journal records:

```text
P8F_C1_CONTROLLER_FAIL phase=offline_build
```

The unit started at `2026-08-31T13:15:21Z`, failed at
`2026-08-31T13:15:44Z`, and automatically stopped the VM at
`2026-08-31T06:17:06.403-07:00`. No target image or executable was produced.
The controller had not yet created its evidence root, container or numerical
process.

## Causal separation

The archived selector source is the intended decomposition-aware revision:

- selector `.cpp` SHA-256 `f02eccdd773f134758a8652a348466e6b859d27765b634349766bca5d3ea456d`;
- selector `.hpp` SHA-256 `84d5ada97933a858682ce7e3d9df6316527f560207d981a0bc16961287e639d4`.

But the archive contains predecessor jet members:

- jet `.cpp`: 17,808 bytes, SHA-256
  `1982953e636bfd007d1d094aec493120e6ffda9cdca7b2d3ede171c90bdc779a`;
- jet `.hpp`: 3,477 bytes, SHA-256
  `11cfa7047639761c6bdfd84a7ed3ff919cc400741ab5e85964e4415116f1e6a9`.

The selector therefore references `kSecondJetTermCount`,
`CoefficientDecomposition` and `evaluate_prepared_decomposed`, while the two
archived jet members do not define them. The already candidate-neutrally tested
jet revision exists locally as:

- jet `.cpp`: 20,294 bytes, SHA-256
  `5cca40e060d243d7edfd977bfe35fa35bddb6319c9ba42306cb371873469d010`;
- jet `.hpp`: 4,715 bytes, SHA-256
  `907f4f42c48e7659653d458ff1bf6c46116ee751b15d37a24e088081b480ebc4`.

This proves an archive-inventory skew between selector and jet members. It is
not an N2 compiler difference and not an H2 numerical failure.

## Evidence and locks

The stopped source disk was snapshot-derived into a read-only clone. Guest
evidence records `DEVICE_RO=1`, ext4 `/dev/sdb1`, and mount options
`ro,relatime,norecovery`. The deterministic local rescue archive is exactly
5,025 bytes with SHA-256
`8236b3a7ec691555daf386e967460463a378380d22cf50e69dd84c6e995f8130`.
The original C1 VM and rescue helper are `TERMINATED`; the source disk,
snapshot, clone and local evidence are retained.

Candidate evaluations, positive samples, numerical processes, progress panels,
scientific output roots and authority promotions are all zero. C1 is exhausted
and may not be retried. The smallest justified successor is P8F-C2: replace
only the two stale jet archive members, regenerate the manifest and identities,
and require a clean offline build plus the unchanged candidate-neutral
equivalence fixture before any separately authorized cloud action.
