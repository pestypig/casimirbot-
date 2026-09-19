Program gate: G1 — real calibrated solar baseline
Workstream: structural source binding and non-evolving input validation
Capability or component: inversion observation manifest and pinned MESA input dependencies
Current maturity: reduced_order_diagnostic
Target maturity: reduced_order_diagnostic; validated preparation only
Required frozen inputs: G1 preparation v1, model-design v1, acceptance-design v1, immutable MESA image
Required evidence: primary numerical inversion tables, resolution/reference metadata, input semantics and dependency hashes
Stop/fail criteria: missing resolution metadata, source ambiguity, unavailable runtime, fixture substitution
Explicit non-goals: evolution, deletion, calibration admission, G2 admission, unrelated development changes
Downstream gate unlocked: none

# G1 source and input validation v1

Status: SOURCE_AND_INPUT_PREPARATION_CHECKS_RECORDED; structural source binding blocks launch.
Date: September 19, 2026 (initial source intake September 13).

This work continues the completed preparation deliverable without closing G1.

## Initial source findings

[Basu et al. 2009, arXiv v2](https://arxiv.org/html/0905.0651)
provides absolute sound speed, density and their errors in Table 3 for BiSON-13.
The two quantities have different radial grids. Section III defines reported
positions through averaging-kernel medians and resolution through quartiles;
BP04 is the principal reference model. The table does not provide the full
kernel arrays. Section IV.2 distinguishes density systematics from the smaller
statistical errors. These facts require an explicit comparison operator and
systematic-error policy; raw point interpolation must not silently stand in
for a resolved inversion comparison.

The 37-row table and primary HTML are retained under
`artifacts/research/g1-source-validation-v1/bison13-intake-20260913/`.
The identical 37-row CSV is tracked at
`configs/research/controlled-stellar-composition-transport-g1-bison13-table3.v1.csv`.
`ops/mesa/g1-preparation-v1/intake-bison13.ps1` reproduces extraction into a
new directory only, checks six numeric columns, positive entries and separate
strictly increasing radial grids, and records unit conversions and hashes.
CSV SHA-256: `3831ccfee250ce4398c54c8aa65b081160eaaf4587c287786ffbc2a2dfc571a6`.
HTML UTF-8 snapshot SHA-256:
`0940aaa2e3fdfb30c142bd52cd9b0cbe6612a38b867ba5cc16cf79af2d621945`.
All 37 six-column rows now match extraction from the primary PDF, and the
typeset table was visually reviewed on PDF pages 28 and 29. PDF SHA-256:
`c0efec964bfa85a11c66accc514adda0af6afd4ebb245bc42970f00b74158cab`.
An initial page-17/18 check failed because those pages contain prose, not this
PDF's table; the full-document search located the correct pages. No source
values were changed to make the comparison pass. The
[structural manifest](../../configs/research/controlled-stellar-composition-transport-g1-structural-source.v1.json)
binds this evidence while keeping acceptance disabled. Numerical kernel/support
binding remains unresolved.
Retain a typed
BLOCK_SOURCE_BINDING if required metadata cannot be obtained. Do not inflate
the published errors or change frozen thresholds after model results.

The legacy ICE Solar_Data endpoint and Yale research-page browser fetch failed
in this pass. The primary arXiv HTML is accessible; failed mirrors are not
evidence that the numerical observations do not exist.

## Runtime and input checks

The current Docker image-inspection command failed because the
`dockerDesktopLinuxEngine` named pipe was absent. No Docker Desktop/backend
processes were returned by the accompanying process-name check. This does not
invalidate the prior installed-image record, but fresh installed-file and
parser validation remain pending. No runtime repair, deletion or evolution
was performed in this pass.

The pinned upstream star_job defaults were read successfully. They document
GS98 initial metal fractions for pre-main-sequence construction and distinguish
that path from the optional uniform-composition reset. Before modifying the
inlist, follow the actual construction call path and confirm how initial Y/Z
and the selected network are applied. Do not add a composition reset merely
because a control exists.

The retained `run_star_support.f90` pre-MS call passes `initial_zfracs`, the
new-network selection and network name to `star_create_pre_ms_model`.
The retained `pre_ms_model.f90` reads controls initial Y/Z, constructs hydrogen
as 1-Y-Z and partitions helium using the initial-He3 convention. No additional
uniform-composition reset is justified by these checks. The intermediate
public routine and the age-reset ordering still need full call-path review.

Eleven pinned upstream source/default/network files are retained under
`artifacts/research/g1-source-validation-v1/mesa-upstream-20260913/`, with
`manifest.json`. All eleven hashes were independently recomputed successfully.
The intake script follows the network definition includes through `basic.net`,
`add_pp_extras`, `add_cno_extras` and `add_hot_cno`. This closes that definition
include tree only, not rates, opacity/EOS tables or compiler libraries.
The four default-file hashes agree with the earlier installed inspection record;
newly retained source files have not yet been compared with installed bytes.

The subsequent immutable `mesa-upstream-callpath-20260913/manifest.json`
adds `star/public/star_lib.f90` and `star/private/init.f90` (13 files total).
The public routine transfers the requested composition/network controls into
the model state; `init.f90` changes the network before building the pre-MS
model. Construction runs the requested 100 relaxation steps before returning.
`run_star_support.f90` then applies its after-load controls, including the
age-zero reset. Thus the model clock starts after construction relaxation,
not at a precisely established physical formation instant. This agrees with
the declared model convention; neither a later ZAMS reset nor a fixed age
offset is introduced. No model was constructed to make these source checks.

A normal hidden Docker Desktop start was attempted after measuring about
5.5 GiB host-available RAM; free storage was 16,146,145,280 bytes. No repair or
data deletion was requested. Runtime readiness is still being checked. This
storage measurement fails the 25 GB science-start gate regardless of whether
the daemon starts. Inspection-only work does not authorize a pilot.

The normal start failed: the host backend log at 23:17:13 UTC reports
`initializing Inference manager` and inability to remove/access the
`Docker/run/dockerInference` socket. Backend processes exist but are not proof
of a healthy engine. The pending read-only `docker info` probe was interrupted
after the startup failure was confirmed. No factory reset, socket removal,
directory rename or process shutdown was performed. Installed parser and
data checks require separately scoped runtime recovery; upstream checks cannot
substitute for them.

## Authorized runtime recovery

After explicit owner approval, the normal Docker stop command failed. Only
processes whose executable paths were verified under `C:\Program Files\Docker\Docker\`
were stopped, and only the `docker-desktop` WSL distribution was terminated.
The exact non-reparse runtime directory was checked to contain only the two
zero-byte sockets `dockerInference` and `userAnalyticsOtlpHttp.sock`.
It was renamed, without overwriting an existing backup, to
`C:\Users\dan\AppData\Local\Docker\run.pre-recovery-20260913-second`.
No data disk, image, volume or research data was deleted or moved.

After a normal hidden restart, `docker info` returned server version `28.3.2`.
Image inspection returned the expected immutable RepoDigest
`evbauer/mesa_lean@sha256:c9e4e66db3b34ca8b977bd32725a098eb4c6e81ac1e2f261aa4af38a7954de62`.
The startup blocker is recovered; parser and installed dependency validation
remain outstanding. No stellar evolution ran.

## September 19 continuation

The fresh readiness check found no engine. A normal start reproduced the
inference-socket failure at 16:24:55 UTC. The approved recoverable procedure
was repeated: verified Docker executables stopped, only `docker-desktop` WSL
terminated, exact runtime directory checked to contain the same two zero-byte
sockets, and directory preserved as
`C:\Users\dan\AppData\Local\Docker\run.pre-recovery-20260919`.
No backup was overwritten or data deleted. A normal hidden restart followed.

The read-only inventory at
`artifacts/research/g1-source-validation-v1/installed-inventory-20260919/inventory-final.txt`
completed with container exit 0. It records SHA-256 for 3,552 MESA data and
source files and 885 SDK files, plus symlink targets. Its SHA-256 is
`5f2ab8a085e69240323c6bc92c8ce99f5b3d7ed8eabb1912d8b0c939311bd6a3`.
The retained `inventory-validation.json` verifies the section structure and
all 13 selected installed/upstream hash matches. This covers the network
definition include tree, selected implementation/defaults, the installed data
tree including opacity and rate tables, and the SDK bin/lib tree. It is a
broad installed inventory, not a trace of which tables a future trial loads.
The container had a read-only root, no network, one CPU, 512 MiB memory and no
extra swap, 64 PIDs and no additional capabilities. No MESA executable ran.
The compact [installed provenance manifest](../../configs/research/controlled-stellar-composition-transport-g1-installed-provenance.v1.json)
is tracked with the image reference, receipt hash, inlist hash and 13 selected
matching file hashes. Detailed receipts remain in the local ignored artifact
tree and can be regenerated with the versioned inspection scripts.
The first mount attempt exited 125 because Docker interpreted a comma in the
workspace path as a mount-field separator; a read-only volume syntax resolved
it. The failed receipt is retained. No file was removed.

## Current validation audit

All 73 initial-inlist assignments were checked against their own namelist's
pinned defaults, and all 13 retained call-path/default/network source hashes
matched both upstream and the installed image. `f90nml` 1.5.0 independently
parsed the inlist's five groups. The versioned
`ops/mesa/g1-preparation-v1/validate-preparation-inlist.py` also checked the
age, composition, mixture, network, diffusion, opacity and zero-transport
settings. Its receipt is `installed-inventory-20260919/inlist-validation.json`;
the inlist SHA-256 remains
`20e2a14d328721618d790101409a879f79917b14e60b46cfb08adb399a8d9a77`.
These checks establish syntax and selected input semantics. MESA's native
namelist reader, effective-default resolution and a loader trace have not run.

The structural source manifest now records `BLOCK_SOURCE_BINDING`. Primary
HTML, PDF and author-data endpoint checks supplied the numerical profiles and
qualitative resolution definition, but not a complete numerical comparison
operator. Targeted BiSON-13 kernel searches returned paper figures rather
than a bound per-row numerical kernel product. Recovering these data may
require an author-provided dataset or an explicitly reviewed alternative
inversion product. No external message has been sent and no alternative
acceptance policy has been substituted.

The source manifest's typed blocker is the intended terminal source outcome
for this preparation step. The input packet now has installed-file provenance,
an independent syntax parse and source-backed initialization semantics. The
native MESA reader, actual loaded microphysics subset and resulting model
remain requirements of a separately authorized execution attempt. Available
host space at the latest check was 14,395,346,944 bytes, below the frozen 25 GB
science-start threshold. No calibrated-baseline claim is made.

## Remaining work

1. Obtain numerical averaging kernels or an independently reviewed quantitative
   resolution map, then freeze the observational comparison and systematic-error
   policy in a new manifest version. `BLOCK_SOURCE_BINDING` remains until then.
2. In the future executable attempt, capture MESA's native input parse,
   resolved defaults and loaded microphysics identities. The installed file
   inventory provides a pre-run provenance baseline.
3. Implement/test the bounded launcher and calibration driver, recover at
   least 25 GB of free space, and perform a fresh resource preflight before
   any separately authorized evolution run.

Launch remains disabled throughout this goal.
