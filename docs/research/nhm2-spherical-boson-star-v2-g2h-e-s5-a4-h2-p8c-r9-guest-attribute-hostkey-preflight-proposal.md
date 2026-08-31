Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R9 Google-API guest-attribute SSH host-key preflight
Current maturity: frozen inert read-only proposal; no cloud command executed
Target maturity: authenticated match or fail-closed mismatch between the R8-presented key and Google API hostkeys
Required frozen inputs: R8 result `590c56d9...a9b1`, R8 audit `95f96892...cffb5`, rescue instance ID `3332429239243725178`, and exact R9 command ledger
Required evidence: exact connection marker, stopped VM states, instance-ID match, bounded known-hosts identity, bounded Google guest attributes, derived SHA-256 fingerprints, and independent result audit
Stop/fail criteria: first command or predicate failure, absent/malformed guest attributes, instance drift, fingerprint mismatch, unbounded local file, extra command, retry, or mutation
Explicit non-goals: changing `known_hosts`, starting a VM, SSH/SCP, archive transfer, numerical work, P8C audit, candidate work, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: only a fingerprint match may permit a separately frozen exact stale-entry reconciliation proposal

# H2-P8C-R9 guest-attribute host-key preflight proposal

Status date: August 30, 2026.

Status: **FROZEN / INERT / AWAITING SEPARATE AUTHORIZATION**.

## Why this is the next lead

R8 proved that Cloud Shell rejected the rescue VM's presented SSH host key
before the remote guest guard. Deleting that stale entry without independently
authenticating the replacement would weaken the evidence chain.

Google documents `hostkeys/` guest attributes as the back channel used by the
guest environment and `gcloud` to improve SSH host authentication. R9 therefore
reads those keys through the project-bound Compute API, derives their OpenSSH
SHA-256 fingerprints locally in the shell, and requires the fingerprint
presented in R8 to be present. It also binds the immutable rescue instance ID,
both stopped VM states, and the exact existing known-hosts file and line 10.

Guest attributes are writable from inside the VM, so this packet does not
mislabel them as a general cryptographic attestation service. Their use here is
limited to Google's documented `gcloud` SSH host-key back channel, bound to the
exact Compute API instance identity and the independently observed R8 key.

## Frozen identities

- proposal SHA-256:
  `186447b240156574d33e57e39f84d1f1a7b15352170d6abd93f168108991a4df`;
- command ledger: 2,090 bytes at
  `0e5994ae70f4254be4e9d0d6607235965232018ebb089bfb904b91553f246673`;
- command 1: 30 characters at
  `6f114346a6886fb84dc7e30e0c210e19c6cace68ff62aa3ee5570d7aac08bb53`;
- command 2: 2,058 characters at
  `98573fe2f3c18b0c15d63cf16aaa13aae9f982b55ebbe53faafb57a7330ab905`;
- independent proposal audit: **20/20 PASS**;
- audit receipt SHA-256:
  `a2f9847023dc0ff8f7e4212b0c7466b3b0cc75b3846bc859619e16d431016abe`.

Preparation performed zero cloud actions, VM starts, SSH/SCP operations, file
mutations, numerical actions, candidate evaluations, or authority promotions.

## Exact authorization text

> I authorize exactly one H2-P8C-R9 read-only Google-API guest-attribute SSH host-key preflight under proposal SHA-256 `186447b240156574d33e57e39f84d1f1a7b15352170d6abd93f168108991a4df` using the preserved authenticated Cloud Shell session for project `dark-stratum-455714-h4`. Enter exactly two commands in order from the frozen 2,090-byte command ledger SHA-256 `0e5994ae70f4254be4e9d0d6607235965232018ebb089bfb904b91553f246673`. First enter the exact 30-character health command SHA-256 `6f114346a6886fb84dc7e30e0c210e19c6cace68ff62aa3ee5570d7aac08bb53` and require exact output `R9_CONNECTION_READY`. Only after that marker, enter the exact 2,058-character fail-fast read-only inspection command SHA-256 `98573fe2f3c18b0c15d63cf16aaa13aae9f982b55ebbe53faafb57a7330ab905`. It must bind project `dark-stratum-455714-h4`, zone `us-central1-a`, require both P8C VMs `TERMINATED`, require rescue instance ID `3332429239243725178`, read only the regular non-symlink `/home/pestypig/.ssh/google_compute_known_hosts` under a 65,536-byte cap and its exact line 10, query only the rescue VM's `hostkeys/` guest attributes through the Google Compute API under a 65,536-byte cap, derive their SHA-256 fingerprints, and require the R8-presented fingerprint `SHA256:ijX48Sh5o6lAfXmhYGrq+anJLuRA19XsvppsOcL3XFw` to match before printing `R9_READONLY_COMPLETE`. First failure is terminal and consumes R9. Preserve complete or partial terminal evidence. I do not authorize retrying R8 or R9; blank, duplicate or additional commands; starting, stopping, restarting, creating, modifying, attaching, detaching, mounting or deleting any cloud resource; modifying firewall, IAM, metadata, guest attributes, SSH configuration or `known_hosts`; SSH, SCP, archive copy or download; writing, moving, copying or deleting any file or evidence; Docker, build, diagnostic or numerical execution; P8C result audit; candidate evaluation, positive sampling, root or handler creation, Rust/G3/SI/metric/lane work, retuning, or any authority promotion.
