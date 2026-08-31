Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R10 observable Google-API host-key preflight result
Current maturity: authenticated blocked trust-source result; guest host-key attributes absent
Target maturity: independent offline attestation of the stopped rescue boot disk's SSH public host key
Required frozen inputs: R10 proposal `4926fa95...851a`, ledger `f767ace7...294f`, and browser-observed ordered output
Required evidence: exact command chronology, stopped VM states, rescue instance ID, known-hosts identity, guest-attribute API result, terminal preservation, and independent audit
Stop/fail criteria: R10 is exhausted; no retry, known-hosts change, SSH/SCP, VM action, archive transfer, numerical work, or authority promotion
Explicit non-goals: treating a 404 as a key mismatch, accepting the presented key on first use, retrieving the P8C archive, candidate work, or downstream authority
Downstream gate unlocked: one separately frozen offline rescue-boot-disk host-key attestation definition

# H2-P8C-R10 observable host-key preflight result

Status date: August 30, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / BLOCKED — GOOGLE HOST-KEY GUEST ATTRIBUTES ABSENT**.

R10's fresh authenticated Cloud Shell terminal returned the exact health marker.
The single child-process command then authenticated:

- original P8C VM: `TERMINATED`;
- rescue VM: `TERMINATED`;
- rescue instance ID: `3332429239243725178`;
- known-hosts file: 1,089 bytes at `9e31be57...de20`;
- exact stale line 10: the `ssh-ed25519` key bound to that instance ID.

The next guarded call to the Google Compute API returned code 1 and HTTP 404:
the `hostkeys/` resource of type `Guest Attribute` was not found. The child
stopped at `GUEST_ATTRIBUTES_BEGIN`, while the parent terminal remained active.
R10 therefore repaired R9's observability defect and established the exact
blocker.

A 404 is not a fingerprint mismatch. It means this VM does not expose the
Google API back-channel needed to authenticate the newly presented key. R10
does not permit deletion or replacement of the stale line and does not permit
trust-on-first-use SSH.

## Immutable evidence

- result SHA-256:
  `ae3f4ed5ea567b56a193edd83f2fa5f2df79aed14f4f724b7991111e55f9eb6a`;
- classification:
  `AUTHENTICATED_GOOGLE_API_HOSTKEY_GUEST_ATTRIBUTES_ABSENT_404`;
- independent result audit: **19/19 PASS**;
- audit receipt SHA-256:
  `ab97af6e7b0a3fbe78a5b022b576927afd01f4175bc14ae6a76f2def34e1bd43`;
- health commands: 1;
- inspection commands: 1;
- fresh terminal surfaces: 1;
- additional commands and retries: 0;
- trust decision reached: false;
- mutations, SSH/SCP, numerical and candidate actions: 0;
- every authority lock: false.

R10 may not be retried. The strongest next trust source is an independently
mounted read-only derivative of the stopped rescue boot disk, from which the
public `/etc/ssh/ssh_host_ed25519_key.pub` can be hashed and compared with the
R8-presented fingerprint. That requires a new versioned resource-and-read packet
and separate authorization. No such resource is created here.
