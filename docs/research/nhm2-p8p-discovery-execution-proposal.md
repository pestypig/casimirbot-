Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral R39 evidence recovery
Capability or component: retained-helper disk-discovery diagnostic
Current maturity: locally implemented and reviewed; native execution unverified
Target maturity: authenticated diagnostic or preserved failure with verified stop
Required frozen inputs: manifest a794405d00b9acca346d62fcdf2388a572a2af8c45c825939b13d91e6f27d911
Required evidence: bounded raw observations, journal, serial/API bindings, independent helper stop
Stop/fail criteria: identity/hash/budget mismatch, first execution error, uncertain cleanup or incomplete evidence
Explicit non-goals: mount, archive recovery, builds, numerical/candidate execution, retuning, deletion, G3/SI/metric/lanes, authority promotion
Downstream gate unlocked: evidence-based next recovery decision only

# Frozen local packet

Prepared locally on September 7, 2026. No cloud operation was performed.

- Manifest: C:/NHM2-Discovery-v1/manifest.json
- Manifest SHA-256: a794405d00b9acca346d62fcdf2388a572a2af8c45c825939b13d91e6f27d911
- Bound local source inventory: 44 files; guest inventory: 23 files.
- Startup: C:/NHM2-Discovery-v1/startup.sh, 153844 bytes.
- Startup SHA-256: 7e0d047ccd94d7daa50f0043850be1542a6f121710a0a109aa1bb55dd1e517c7
- Attempt: 72a4224a3ad77f31c57d2f2dc25dc66c6564624e6e2ec9aeeb024c0a8859587f
- Ledger SHA-256: 8c828ade60963a80522ab126451d72de18bda2efec5c5c65311d85beed0b463e
- Expiry: September 12, 2026, 14:00 UTC; a full runtime window must fit before expiry.

Final local suites: 38 JavaScript and 106 Python tests PASS. Independent source
review cleared local preparation. These tests do not establish actual Linux
device, service, serial or cloud behavior. The first authorized diagnostic is
also the live check of those infrastructure bindings; failure remains evidence.

# Exact scope and limits

Project dark-stratum-455714-h4; zone us-east1-b. Reuse only helper
nhm2-p8p-cv2-hostkey-helper-20260905, instance ID2570241336417567358.
Preserve its existing e2-small machine, boot disk and attached read-only clone
nhm2-p8p-cv2-hostkey-clone-20260905, disk ID6517758864936518301.

Fresh read-only account/project/resource preflight must match the authenticated
consumed history. Permit one startup-script metadata replacement with the exact
frozen startup, independently verify it while stopped, and restart once. No
creation, attachment, detachment, disk access-mode change or resource deletion.

The guest verifies the existing block alias and read-only/unmounted device
family, observes lsblk version plus the preregistered baseline/tree inventory
pair, preserves output and publishes one bounded diagnostic value. It never
mounts or reads the retained recovery archive. A transient service contains the
diagnostic at120seconds with10second stop allowance; outer guest startup has
bounded termination and poweroff paths. Local execution uses a monotonic
1200second total deadline with300seconds reserved for independent cleanup.
If that deadline is already exhausted, only the existing bounded emergency
stop/confirmation path may run for at most60additional seconds; it cannot make
the result successful or authorize further diagnostic work.

Total cost ceiling:0.10USD, including safety cleanup. This is a ceiling, not a
new quoted compute rate. No additional storage is provisioned. The proposed
reservation is1200seconds/0.10USD against prior12000seconds/1.60USD; aggregate
charter ceilings remain21600seconds/12USD. Existing retained-storage charges
are not removed by stopping the helper and no deletion is authorized here.

At most eight serial observations, separated by60second waits while incomplete,
cover the permitted startup window. On a complete diagnostic, one guest-attribute
read must match the audited publication hash. Preserve raw complete/partial
evidence in the exclusive local store and serial input file. Independently
confirm the exact helper stopped on every post-restart outcome. First failure
is terminal; no retry, fallback or alternate output root.

# What the result can establish

A completed diagnostic can show the actual lsblk output shape and whether the
unchanged selector accepts the planned explicit-tree observation. A failure
can identify an infrastructure defect. Neither result proves the star model,
recovers the R39 archive, admits a candidate, or advances physical authority.
Afterward, independently audit the immutable evidence and state the next
recovery decision without silently rerunning or broadening this attempt.

# Consolidated authorization

I authorize exactly one retained-helper disk-discovery diagnostic under frozen
manifest SHA-256 a794405d00b9acca346d62fcdf2388a572a2af8c45c825939b13d91e6f27d911
and the scope and limits in this proposal. Reuse only
nhm2-p8p-cv2-hostkey-helper-20260905, instance ID2570241336417567358, in project
dark-stratum-455714-h4, zone us-east1-b. Replace its startup script once with the
frozen153844-byte script, verify it, and restart once. Preserve the1200second
execution deadline,0.10USD total ceiling and specified emergency-stop-only
allowance. Run only the candidate-neutral disk-discovery diagnostic, preserve
and independently audit all complete or partial evidence, and stop the helper.
I authorize creating the local hash-bound record of this authorization after
my confirmation. First failure is terminal. No retry, fallback, resource
creation/substitution, disk changes, mount, archive recovery, Docker/build or
numerical execution, candidate evaluation, retuning, evidence deletion,
G3/SI/metric/lane work or authority promotion is authorized.
