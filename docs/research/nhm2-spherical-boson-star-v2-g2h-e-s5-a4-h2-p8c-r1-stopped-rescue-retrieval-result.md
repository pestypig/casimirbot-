Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 exhaustion diagnosis
Capability or component: H2-P8C-R1 stopped-rescue archive retrieval result
Current maturity: one authorized retrieval attempt exhausted; blocked before transfer; partial evidence authenticated
Target maturity: immutable classification of the exhausted attempt and a bounded corrected retrieval handoff
Required frozen inputs: proposal `41f227b7...f186`, retained rescue VM, exact existing archive identity, and partial capture `a618dbe9...cd7d`
Required evidence: one start, one stop, terminal procedure status, remote guard output, absent SCP artifacts, exact partial-capture size/hash, and independent audit
Stop/fail criteria: any evidence drift, retry, transfer claim without SCP evidence, numerical action, resource deletion, or authority promotion
Explicit non-goals: result classification of the unread P8C terminal archive; restart/retry; numerical execution; candidate ingress; Rust/G3/SI/metric/lane work; or authority promotion
Downstream gate unlocked: an independently audited corrected retrieval proposal only; no cloud action

# H2-P8C-R1 stopped-rescue retrieval result

Status date: August 29, 2026.

Status: **BLOCKED_PRETRANSFER_SELF_MATCHING_PROCESS_GUARD / ATTEMPT EXHAUSTED**.

The one authorized R1 restart was consumed. The rescue VM started exactly once,
the read-only SSH guard ran once, and its first-failure policy stopped execution
before SCP. The cleanup trap then stopped the rescue VM. A read-only terminal
status check observed both the original P8C VM and rescue VM as `TERMINATED`.

The failure was representational, not scientific. The process predicate used
`pgrep -af` with a forbidden `nhm2-h2-p8c` substring. The SSH guard shell's own
command line contained that substring in the archive and clone-device paths, so
the predicate matched PID 905, the guard shell itself. It produced no archive
attestation lines and the SCP step was never reached.

## Preserved evidence

- partial evidence archive: 2,446 bytes;
- SHA-256: `a618dbe95916bc2e032eaeedbfbe7b615d0b67539b6b5930e626326e3949cd7d`;
- procedure exit: `1`;
- remote guard stderr: empty;
- SCP stdout/stderr: absent because transfer was not attempted;
- numerical processes started: 0;
- result audit executed: no, because the terminal archive was not retrieved;
- restart retries authorized or executed: 0;
- authority promoted: false.

The independent result audit passes **21/21** and assigns the exact
classification above. Its receipt SHA-256 is
`d879f2a7599538cc6e4c52268fa3e00b57ba46765c7ab88e021606dd0fd8ba0f`;
the audit source SHA-256 is
`0110f8f1b9800993220424a5ac95191d36df7916df86e7b8597371b4376728ac`.

R1 cannot be retried. The only eligible successor is a new, separately
authorized retrieval packet whose process check uses exact executable identity
and cannot inspect full command lines or evidence-path substrings.
