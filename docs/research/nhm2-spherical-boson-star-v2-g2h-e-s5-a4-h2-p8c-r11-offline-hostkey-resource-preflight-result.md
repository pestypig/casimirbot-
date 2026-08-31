Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R11 offline host-key resource inventory result
Current maturity: executed once; authenticated read-only inventory PASS; independent audit 19/19 PASS
Target maturity: separately frozen offline rescue-boot-disk host-key attestation and authenticated P8C archive retrieval
Required frozen inputs: R11 proposal `7eec8a94...af47`, ledger `e1acdd23...d80b0`, exact two-command chronology, and browser-observed terminal output
Required evidence: connection marker, stopped VM states, exact rescue identity/topology, boot-disk identity, proposed-name absence, terminal completion, and independent audit
Stop/fail criteria: R11 is exhausted; no retry, topology reinterpretation, resource mutation, SSH/SCP, mount, numerical work, or authority promotion
Explicit non-goals: creating the attestation resources, reading the host key, retrieving or auditing P8C, candidate work, Rust/G3/SI/metric/lane work, or physical claims
Downstream gate unlocked: one separately bounded offline rescue-boot-disk host-key attestation and P8C evidence handoff

# H2-P8C-R11 offline host-key resource inventory result

Status date: August 30, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / PASS**.

The exact health command returned `R11_CONNECTION_READY`. The exact 3,895-
character read-only inventory command then completed through
`R11_READONLY_COMPLETE` and authenticated:

- original P8C VM: `TERMINATED`;
- rescue VM: `TERMINATED`, instance ID `3332429239243725178`, `e2-small`;
- rescue topology: exactly two disks;
- rescue boot attachment: `READ_WRITE` and same-named disk;
- evidence clone `nhm2-h2-p8c-evidence-clone-20260829`: `READ_ONLY`;
- boot disk: `READY`, 10 GB, `pd-standard`, exact Debian image
  `debian-12-bookworm-v20260817`, one user;
- proposed host-key snapshot, clone and helper names: all absent.

The fresh terminal was needed only because the preserved earlier Cloud Shell
surface was unresponsive before input. That preexecution surface transmitted no
command and performed no cloud action. The authorized R11 surface transmitted
exactly the two frozen commands, with no additional input or retry.

## Immutable evidence

- result SHA-256:
  `6c386c37ebf5bc4de6eaae0577da42d0c99b3330df3d0685df08b1298bebc8c6`;
- classification: `AUTHENTICATED_READ_ONLY_RESOURCE_INVENTORY_PASS`;
- independent result audit: **19/19 PASS**;
- audit receipt SHA-256:
  `98117b1d6a194ea9c664e0163797c09e83d20a872b3379ba09bb63532d07c083`;
- connection commands: 1;
- inspection commands: 1;
- additional commands and retries: 0;
- cloud resource mutations, mounts, SSH/SCP, numerical and candidate actions: 0;
- every authority lock: false.

R11 is exhausted and may not be retried. Its PASS permits preparation of the
offline host-key attestation using the now-authenticated stopped boot disk and
previously absent derivative names. It does not itself create those resources
or authenticate the SSH key.
