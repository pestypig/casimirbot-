Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral retained-evidence transport diagnosis
Capability or component: R43 PSCP timeout attribution
Current maturity: local log diagnosis; no new cloud execution
Target maturity: bounded noninteractive diagnostic with explicit failure output
Required frozen inputs: R43 receipts, retained SDK log, historical R40 transfer receipt
Required evidence: exact client invocation, trust boundary, no-retry execution proposal before any restart
Stop/fail criteria: do not infer authenticated host identity from a presented fingerprint or changed IP
Explicit non-goals: cloud action, trust-cache mutation, key creation, retry, build, simulation, candidate evaluation, evidence deletion, authority promotion
Downstream gate unlocked: prepare a separately authorized noninteractive retrieval/diagnostic successor

# R43 diagnosis

R43 failed with `process_timeout` after its one 120-second transfer budget.
Cleanup completed and the helper was observed TERMINATED. Archive verification
remains false. This is infrastructure evidence, not a build or mathematical
result. R43 is exhausted and its production files/captures remain unchanged.

The retained SDK log
`C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-config/logs/2026.09.05/03.50.27.995209.log`
is 3,891 bytes, SHA-256
`52995f04b2d459eaa5258654e8cef58cdcfb6ecbcd919e77c09d379dff1b0b1d`.
It proves the Compute instance and project GETs succeeded and the SDK dispatched
its Windows `pscp.exe` with the existing .ppk identity, the exact remote
archive path and short local destination. No inline shell program was passed.
The dispatched arguments lacked `-batch`, `-v` and an explicit `-hostkey`.
The log ends at client dispatch; no client error or transfer result was saved.

The SDK also reported no google_compute_known_hosts file. That alone does not
prove PuTTY lacks trust: PuTTY uses a separate cache. The current local cache
name inspection found no entry matching the R43 external IP; it does not prove
what a different process context could access.

Historical R40 `procedure.scp.txt` explicitly records a previously uncached
host-key prompt at the helper's then-current external IP, followed by a
successful upload. R43 used a different external IP after restart. This makes
a fresh host-key prompt plausible, but does not establish it as the cause of
the silent timeout. A network stall remains possible. The R40 presented
fingerprint is not independently authenticated trust and must not simply be
reused as an accepted key.

## Next supported step

Prepare a separately authorized successor using the same helper and archive,
with explicit noninteractive PSCP batch behavior and bounded verbose error
capture. Keep force-connect disabled. Fail immediately on unknown/mismatched
host identity; do not inject consent, accept a new key, modify caches, switch
VMs, extend timeout or add a fallback. If existing authenticated trust permits
the copy, verify the original archive hash and stop. Otherwise preserve the
specific error and stop, then choose the next action from that evidence.

Before freezing it, test the installed SDK's generated argument list locally
without contacting a VM, including preservation of `-batch` and `-v` and exact
source/destination argument boundaries. The current R43 tests mocked SDK
dispatch and therefore did not exercise PSCP prompt behavior. Do not claim
those tests proved unattended live transport.

No R44 execution or authorization packet is created by this diagnostic note.
No cloud API, VM action, key/trust change, file deletion, build or numerical
process ran during this diagnosis. The actual R39 build failure is still unread.

Planning follow-up: the subordinate
[transport exit plan](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-transport-exit-plan.md)
requires real local SDK/client preflight and at most one separately authorized
diagnostic attempt before a mandatory transport-design review. This backlink
does not alter the diagnostic findings or authorize execution.
