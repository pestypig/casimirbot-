Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 evidence retrieval
Capability or component: H2-P8C-R11 offline host-key resource inventory preflight
Current maturity: frozen inert read-only proposal; independent audit 24/24 PASS; no cloud command executed
Target maturity: authenticated stopped rescue-boot-disk identity and absent derivative resource names before a separately frozen offline host-key attestation
Required frozen inputs: R10 result `ae3f4ed5...eb6a`, R10 audit `ab97af6e...bd43`, rescue instance ID `3332429239243725178`, exact existing resource names, and exact R11 command ledger
Required evidence: connection marker, stopped original/rescue VM states, exact rescue instance/machine/disk topology, boot-disk status/type/size/image, read-only evidence-clone attachment, absent proposed derivative names, and independent result audit
Stop/fail criteria: any missing or ambiguous resource, identity/topology drift, proposed-name collision, extra command, retry, resource mutation, VM action, SSH/SCP, mount, file mutation, numerical work, or authority promotion
Explicit non-goals: creating the attestation resources; starting a VM; reading the offline host key; SSH/SCP; archive transfer; numerical work; P8C audit; candidate work; Rust/G3/SI/metric/lane work; or physical claims
Downstream gate unlocked: only a passing R11 inventory may permit a separately frozen offline rescue-boot-disk host-key attestation proposal

# H2-P8C-R11 offline host-key resource inventory preflight

Status date: August 30, 2026.

Status: **EXECUTED ONCE / EXHAUSTED / PASS**.

The exact authorization was received on August 30, 2026. Before browser
discovery or any Cloud Shell input, the Codex browser-control kernel failed to
initialize with a missing-path error. Prescribed local diagnostics report
Chrome running, the ChatGPT Chrome extension installed and enabled, and the
native-host manifest correct. A single kernel reset and setup retry produced
the same pre-browser failure. No Cloud Shell command character was transmitted,
no cloud API was called, and no VM or resource state changed. Therefore R11 is
**not consumed** and remains eligible for its first execution after the local
Codex browser-control surface is restored.

After a full Codex app restart, Chrome attachment succeeded and the exact
Cloud Shell tab remained visible. However, the existing tab did not respond to
claiming, DOM inspection, screenshot capture, or a narrow terminal-input
locator; each supported inspection timed out before any input. Because the
authorization permits a fresh terminal surface only when terminal-input
absence is established, and the unresponsive tab prevents that predicate from
being authenticated, no fresh tab or reload was attempted. Command count,
Cloud Shell character count, cloud action count, and resource mutation count
remain zero. R11 remains unconsumed.

## Why this gate exists

R10 authenticated the stopped rescue instance and the stale Cloud Shell
known-hosts record, but Google's guest-attribute `hostkeys/` channel returned
HTTP 404. An offline comparison against the rescue boot disk is therefore the
next trust route. Before any snapshot, clone, or helper VM may be proposed,
R11 performs a read-only inventory of the exact retained resource topology and
proves that the proposed derivative names do not already exist.

R11 does not create a snapshot, disk, or VM. It does not start either retained
VM, invoke SSH/SCP, mount a filesystem, inspect a host-key file, or mutate any
local or cloud state.

## Frozen identities

- proposal SHA-256:
  `7eec8a9406c12c1d430def05e6f5b13c7bd91897b934a1a94920f2a9da85af47`;
- command ledger: 3,928 bytes at
  `e1acdd23d5c989684a5980420ed4b6a3d069cf11065c2acab2457ba5ad3d80b0`;
- command 1: 31 characters at
  `d752558665c681baf6db0cf9d71a25731f06ef49cfd42d142432e4704bbcbeb2`;
- command 2: 3,895 characters at
  `c3d7c263c6354ad91f1d5eab1a5dfa72610f621d530bcf2fa73f1ca68e3606ae`;
- corrected independent proposal audit: **24/24 PASS**;
- corrected audit receipt SHA-256:
  `ec04061284043e0ede67a41c90db3192a61576dba81588a55fbb6d24fa3b3b7a`.

The first audit is preserved as an immutable **23/24 FAIL** at
`5e05ac76af8420a25f02d9f263fde06d1961859d92d5bc00d27b4ff51561cb75`.
Its sole failure was an audit-only substring predicate that treated the
read-only `instances describe` API surface as mutating. The corrected audit
narrows that predicate to exact mutating command forms. The proposal, command
ledger, and proposal SHA-256 are unchanged.

## Required read-only observations

The inspection must establish all of the following:

- project `dark-stratum-455714-h4`, zone `us-central1-a`;
- original VM `nhm2-h2-p8c-diagnostic-c4-16-20260828` is `TERMINATED`;
- rescue VM `nhm2-h2-p8c-rescue-e2-small-20260829` is `TERMINATED`, is
  instance ID `3332429239243725178`, and has machine type `e2-small`;
- the rescue VM has exactly two attached disks: its same-named boot disk in
  `READ_WRITE` mode and `nhm2-h2-p8c-evidence-clone-20260829` in `READ_ONLY`
  mode;
- the rescue boot disk is `READY`, 10 GB, `pd-standard`, and sourced from exact
  image `debian-12-bookworm-v20260817`;
- snapshot `nhm2-h2-p8c-rescue-hostkey-snapshot-20260830`, clone disk
  `nhm2-h2-p8c-rescue-hostkey-clone-20260830`, and helper VM
  `nhm2-h2-p8c-hostkey-attestor-e2-small-20260830` are all absent.

Any mismatch or ambiguity is terminal for R11 and does not authorize a repair,
retry, or substituted resource.

## Exact authorization text

> I authorize exactly one H2-P8C-R11 read-only offline-host-key resource inventory preflight under proposal SHA-256 `7eec8a9406c12c1d430def05e6f5b13c7bd91897b934a1a94920f2a9da85af47` using the authenticated Cloud Shell page for project `dark-stratum-455714-h4`. If and only if no terminal input exists, I authorize opening exactly one fresh Cloud Shell terminal UI surface before command entry; this does not authorize a Google Compute Engine VM start or any preliminary shell command. Enter exactly two commands in order from the frozen 3,928-byte command ledger SHA-256 `e1acdd23d5c989684a5980420ed4b6a3d069cf11065c2acab2457ba5ad3d80b0`. First enter the exact 31-character health command SHA-256 `d752558665c681baf6db0cf9d71a25731f06ef49cfd42d142432e4704bbcbeb2` and require exact output `R11_CONNECTION_READY`. Only after that marker, enter the exact 3,895-character read-only inventory command SHA-256 `c3d7c263c6354ad91f1d5eab1a5dfa72610f621d530bcf2fa73f1ca68e3606ae`. It must bind project `dark-stratum-455714-h4` and zone `us-central1-a`; require original VM `nhm2-h2-p8c-diagnostic-c4-16-20260828` and rescue VM `nhm2-h2-p8c-rescue-e2-small-20260829` both `TERMINATED`; require rescue instance ID `3332429239243725178`, machine type `e2-small`, exactly two attached disks, same-named boot disk in `READ_WRITE` mode, and evidence clone `nhm2-h2-p8c-evidence-clone-20260829` in `READ_ONLY` mode; require the rescue boot disk `READY`, exactly 10 GB, `pd-standard`, and sourced from exact image `debian-12-bookworm-v20260817`; and require snapshot `nhm2-h2-p8c-rescue-hostkey-snapshot-20260830`, clone disk `nhm2-h2-p8c-rescue-hostkey-clone-20260830`, and helper VM `nhm2-h2-p8c-hostkey-attestor-e2-small-20260830` all absent before printing `R11_READONLY_COMPLETE`. Preserve PASS, FAIL, traceback, or partial output as immutable evidence. First execution is terminal and consumes R11; no retry or fallback. I do not authorize retrying R10 or R11; blank, duplicate or additional commands; starting, stopping, restarting, creating, modifying, attaching, detaching, mounting, snapshotting or deleting any cloud resource; modifying firewall, IAM, metadata, guest attributes, SSH configuration or `known_hosts`; SSH, SCP, archive copy or download; writing, moving, copying or deleting any file or evidence; Docker, build, diagnostic or numerical execution; P8C result audit; candidate evaluation, positive sampling, root or handler creation, Rust/G3/SI/metric/lane work, retuning, or any authority promotion.

The transient control-surface blocker was later resolved with one fresh
authorized Cloud Shell tab. The exact two commands executed once and reached
`R11_READONLY_COMPLETE`. The immutable
[R11 result](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8c-r11-offline-hostkey-resource-preflight-result.md)
passes independent audit 19/19. R11 is exhausted and may not be retried.
