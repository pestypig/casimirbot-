Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral existing-evidence retrieval
Capability or component: R43 actual-response-tested retained-helper retrieval
Current maturity: locally tested integrated controller; not executed
Target maturity: authenticated local R40 archive with helper stop confirmed
Required frozen inputs: six-file manifest; R40 receipt and archive; exact retained resources
Required evidence: identity receipts, one transfer, exact archive hash, exclusive publication, separate stopped observation
Stop/fail criteria: first failure terminal; no retry or fallback; unresolved cleanup never passes
Explicit non-goals: original restart, resource creation, uploads, mounts, builds, numerical execution, candidate evaluation, deletion, scientific promotion
Downstream gate unlocked: local inspection of existing R39 fixture failure

# R43 retrieval proposal

This is an operational successor to exhausted R42, not authorization to retry it.
R42 failed before start because it equated the attachment alias with the disk
resource name. Bind both independently using the actual preserved response.
No scientific equation, output, threshold, maturity or authority is changed.

## Authorized scope requested

One restart of existing helper `nhm2-h2-p8p-r39-rescue-e2-small-20260904`,
ID `7129462452423922626`, project `dark-stratum-455714-h4`, zone `us-east1-b`.
Require it and original `nhm2-h2-p8p-r32-e2-4-20260904`, ID
`1893159507643031574`, initially TERMINATED. Original remains stopped.
Helper must be e2-small with its same-named 10 GB persistent boot disk and
exactly one 30 GB read-only retained clone resource
`nhm2-h2-p8p-r39-evidence-clone-20260904`, attachment alias
`nhm2-h2-p8p-r39-evidence-clone`, autoDelete false. Full source URLs bind
project and zone; no suffix-only resource acceptance.

Ceilings: 1,200 seconds aggregate helper restart runtime and $0.10 compute.
Retained storage continues to incur charges and is not deleted here.
Require 256 MiB free locally before preparation, before start and before copy.
After one start and fixed 120-second wait, issue one SCP of only
`/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz`.
Require exactly 12,122 bytes, SHA-256
`73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922`.
No guest shell program, upload, archive recreation, rescue or mount is included.

Require fresh `C:\NHM2-R43` and fresh repository capture
`artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r43-retrieval-v1-20260905`.
Use one unique download directory beneath the short root, verify, then publish
exclusively into that capture. Preserve partial outputs and all predecessors.

## Frozen runtime

Authenticate manifest `h2_p8p_r43_manifest.json` at SHA-256
`740f44c6edebfc6870b4a3354c9146a85fc89653fbc5ab9c721c8e122c76b6c0`.
It binds all six production modules, including the unchanged R42 flow,
subprocess and filesystem modules. Entrypoint is 1,184 bytes at SHA-256
`50190b9536aaa1f7958fe59fe3b46629340f4850f53fb42351e7fde50f743bf8`.
After separate authorization, invoke exactly once from the canonical checkout:

```text
node tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r43_execute.mjs --execute-once
```

Use only existing SDK 583.0.0 bundled Python and dedicated R22 configuration;
authenticate existing account pestypig@gmail.com and project before start.
No installation, login, configuration change, IAM, firewall, key creation or
trust reconciliation is authorized. R43 explicitly disables the SDK's PuTTY
force-connect option for its child process; do not accept a host-key prompt.
No inline remote shell command is supplied. All calls use executable/argument
arrays, no gcloud.cmd shell interpolation. Source archive identity is verified
after transfer against the previously preserved R40 receipt.

## Failure and cleanup

R42's bounded flow reserves 300 seconds for cleanup, limits operational
subprocesses to 120 seconds, attempts one helper stop after any dispatched
start, and separately observes helper identity/status. Failed stop, observation,
hash, publication or persistence cannot be PASS. Results are printed and
stored exclusively. First failure consumes this attempt; no retry or fallback.

This is not an unconditional shutdown guarantee: API outages or failure to
terminate a local process tree can prevent automatic cleanup. The executor
must monitor the live handle and immediately report unresolved cleanup rather
than claim success. Tests cover ordinary timeout/tree termination, not every
OS or API failure. No unattended execution beyond the authorized ceiling is
permitted. Any exceptional recovery needs operator direction.

## Verification and next action

48/48 local tests pass: 20 actual-response resource regressions/adversarial
cases, 8 integrated sequence/failure cases, 15 inherited flow cases, and 5
actual subprocess cases. Entrypoint parses. Cloud calls in composition tests
are mocked; this is neither an independent scientific audit nor proof that
the live transfer succeeds. SDK source inspection confirms argument-array
SCP construction and Windows drive-path parsing; no live SCP was tested here.

After successful recovery and stop, bounded local archive inspection may
identify the actual R39 fixture failure. Do not rebuild, rerun rescue, run
P=1024/P=65,536, evaluate a candidate, retune, delete evidence, begin
G3/SI/metric/lane work or promote any authority. A later execution needs
separate authorization. The broader goal remains unfulfilled.
