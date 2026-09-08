Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral H2 turnaround preexecution
Capability or component: P8P-R41 short-local-path retrieval of the existing R40 evidence archive
Current maturity: frozen inert proposal; R40 recovery succeeded remotely and failed only at the long local destination
Target maturity: authenticated local R39 fixture evidence ready for independent classification
Required frozen inputs: immutable R40 result/receipt, exact stopped original/helper identities, existing remote archive, attached read-only clone, and exact R41 controller
Required evidence: stopped source/helper identities, R40 receipt identity, exactly one helper restart/SCP, exact short and preserved local archive agreement, helper stop, chronology, and independent audit
Stop/fail criteria: source restart, archive recreation/mutation, second restart/SCP, retry/fallback, new resource, writable mount, Docker/build/numerical start, candidate ingress, retune, evidence deletion, or authority promotion
Explicit non-goals: retrying R40, rerunning rescue or fixture logic, P=1024/P=65,536 execution, frozen-candidate evaluation, G3, SI/metric/lane work, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: local independent classification of the recovered fixture evidence and one evidence-selected minimal fixture correction

# H2-P8P-R41 short-path evidence retrieval proposal

Status date: September 4, 2026.

Status: **FROZEN INERT / SEPARATE CLOUD AUTHORIZATION REQUIRED**.

R40 authenticated the existing remote archive as exactly 12,122 bytes with
SHA-256
`73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922`,
then failed only because PSCP could not create the long local destination. R41
changes only that destination to `C:\NHM2-R41\r40.tgz` and preserves a verified
copy in the existing R40 local evidence root.

The exact controller
`tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r41_short_path_retrieval_controller_v1.ps1`
is 6,666 bytes with SHA-256
`6fc5434437e3736c3125e2fb95dfb45e691763f22cecf4d894efc7577ce6f55e`.
It has zero PowerShell parser errors and contains no build, Docker, numerical or
candidate invocation.

R41 requires both original VM `nhm2-h2-p8p-r32-e2-4-20260904`, instance ID
`1893159507643031574`, and helper
`nhm2-h2-p8p-r39-rescue-e2-small-20260904`, instance ID
`7129462452423922626`, to be `TERMINATED`. It requires the existing clone to
remain attached to the helper in `READ_ONLY` mode. It authenticates the
immutable R40 rescue receipt before any start.

Under an aggregate 1,200-second helper runtime ceiling and `$0.10` compute-cost
ceiling, R41 may perform exactly one helper restart, one fixed 120-second wait,
and one SCP of only the existing remote archive. It requires the short root and
both local archive destinations initially absent. It verifies 12,122 bytes and
the exact SHA-256 at the short path, makes one local preserved copy, verifies it
again, and stops the helper after success or failure.

R41 creates no cloud resource, does not restart the original VM, does not run
the rescue procedure, does not access or mount the clone, and does not start
Docker, a build, fixture or numerical process. First failure is terminal. No
retry, fallback, alternate destination, resource substitution, archive
recreation, evidence deletion, retuning, candidate evaluation,
P=1024/P=65,536 execution, G3/SI/metric/lane work, or authority promotion is
authorized.
