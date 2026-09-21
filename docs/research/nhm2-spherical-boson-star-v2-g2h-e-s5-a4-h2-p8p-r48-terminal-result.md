Program gate: G2H-E-S5-A4 / P8P; P8Q STOP
Workstream: Candidate-neutral R39 build-fixture evidence recovery
Capability or component: Consumed R48 stopped-disk recovery execution
Current maturity: Terminal pre-effect failure; no archive or build result
Target maturity: Independently reviewed R49 lifecycle-port correction
Required frozen inputs: R48 direct grant, proposal/ledger, claimed anchor and preserved journals
Required evidence: Valid workload chain, command chronology, unchanged protected sources and local defect reproduction
Stop/fail criteria: R48 retry, evidence mutation, skipped review, build/numerical work or authority promotion
Explicit non-goals: Docker, P=1024/P=65,536, candidate evaluation, retuning, evidence deletion or physical claims
Downstream gate unlocked: Candidate-neutral R49 packet development only

# P8P R48 terminal result — September 21, 2026

R48 was executed exactly once under its direct grant and is consumed as
`R48_FAILED`. Its hash-valid 115-record workload journal terminates with
`r48_launcher_child_dead`. All 15 action-time preflight reads passed. The
parent staged the exact handoff and spawned its detached safety child, but the
child exited before publishing `SAFETY_READY`; the parent therefore refused to
issue a clone-create, helper-create or other cloud mutation command. Protected
sources were re-read unchanged. No R40 archive, build result or numerical
receipt was produced.

The preserved workload journal is 63,905 bytes with SHA-256
`7114f83611a9615ce7859f4236c65a67440298aff84db6e0bda4880f8bb1d9a2`
and terminal tail SHA-256
`ed1ce2e1a865b540a31b1acb50890b3a377d7c14613d58dabf2057e403f2e4c9`.
The exact reservation, child handoff and release records remain preserved in
the external execution root. R48 may not be retried.

Source inspection reproduces the candidate-neutral cause: the consumed R48
production safety CLI composes the safety entry without its required
`isProcessAlive` port. The entry fails closed before safety-journal creation,
provider access or READY publication. An additive R49 wrapper supplies only
that missing local lifecycle port while reusing the unchanged R48 parser and
safety entry. Its focused tests pass 3/3 and a separate static audit passes
9/9. This is local implementation evidence, not a new cloud proposal.

The R39/R40 archive remains unrecovered, build-only PASS remains absent, no
P=1024 calibration is admitted and
`P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` remains the only valid decision. No
candidate, proof, geometry/state, lane, lamp, physical, propulsion or transport
authority is promoted.
