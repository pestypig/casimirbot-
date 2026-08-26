Program gate: G2H — Tolman-VII proof implementation/preexecution
Workstream: authenticated classical and quantum control branch
Capability or component: inert G2H-E one-shot execution proposal
Current maturity: two byte-bound unexecuted proof images; no G2H-E authorization record
Target maturity: exact separately authorized primary-once then independent-once checkpoint
Required frozen inputs: current G2G contract, seven source PDFs, proof binding, token and checkpoint digests
Required evidence: explicit user authorization, exact AUTHORIZED record, immutable invocation/log/result ledger and exclusive evidence root
Stop/fail criteria: missing or mutated digest, pre-existing root/container/ledger, chronology violation, partial output or first typed proof failure
Explicit non-goals: authorization in this packet, candidate admission, retry, retune, alternate root, G3, SI, lanes, lamp or physical claims
Downstream gate unlocked: none until separately authorized G2H-E evidence is independently audited

# G2H-E inert one-shot execution proposal

## Decision

`PENDING_SEPARATE_EXPLICIT_USER_AUTHORIZATION`.

This packet does not authorize or execute the Tolman-VII candidate. The raw
token is frozen so that a later authorization can name exact bytes; possession
of the token is insufficient. Both exact runtime authorization files are absent,
both candidate roots are absent, and candidate evaluations remain zero.

The proposal JSON is byte-bound by SHA-256
`bab85c219be9245b77b6a353b9aa47cebe13153107f7d46e0d0e699071feb46e`.
The checkpoint source is 11,641 bytes with SHA-256
`531fe27b3fcd064f11ea612a9b01e41bfc6c372ef147e0fcdd1f9d644e844e61`.

## Frozen token and commands

Token:

```text
797cafb72170c8b441cc75b3ec74bb118fed24d3a2e628194d0280bb54a59ac7
```

Token SHA-256:

```text
33524fdff6e69b40ae75cdff3b3ee1d049a718d70996e08a9397ff18b3e2960a
```

Primary command, eligible only after the exact primary authorization record is
issued:

```powershell
python scripts/nhm2_g2h_e_checkpoint.py --lane primary --token 797cafb72170c8b441cc75b3ec74bb118fed24d3a2e628194d0280bb54a59ac7 --execute
```

Independent command, eligible only after primary completion and a new exact
authorization record binding the observed primary manifest:

```powershell
python scripts/nhm2_g2h_e_checkpoint.py --lane independent --token 797cafb72170c8b441cc75b3ec74bb118fed24d3a2e628194d0280bb54a59ac7 --execute
```

Both commands must run from the canonical repository root. The checkpoint uses
the byte-bound image, disables networking, mounts scientific inputs read-only,
uses a read-only container root, drops all capabilities, fixes memory/process
bounds and writes a create-new invocation marker before Docker starts. A
marker, log, candidate root, fixed-name container, `PASS`, `FAIL` or partial
output makes retry impossible.

## Later primary authorization record

Only an explicit user authorization may create this exact seven-line file at
`artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v1.txt`:

```text
schema=nhm2.g2h_execution_authorization.v1
decision=AUTHORIZED
lane=primary
token_sha256=33524fdff6e69b40ae75cdff3b3ee1d049a718d70996e08a9397ff18b3e2960a
contract_sha256=30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d
executable_sha256=3345e4511b017e6ad54960903d96a8af6cd605312052412302a4286420c47128
output_root=artifacts/research/nhm2/g2h/tolman-vii-primary-v1
```

## Later independent authorization record

The independent record cannot be issued before primary completion. It must be
a separately created eight-line file at
`artifacts/research/nhm2/g2h-authorizations/g2h-e-independent-v1.txt`, with the
last value copied from the immutable primary `proof-manifest.json`:

```text
schema=nhm2.g2h_execution_authorization.v1
decision=AUTHORIZED
lane=independent
token_sha256=33524fdff6e69b40ae75cdff3b3ee1d049a718d70996e08a9397ff18b3e2960a
contract_sha256=30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d
executable_sha256=c6f9c86da092600b2e4baf03d38d55a11a9c365909ca7cc903ecd24c1c1c6a87
output_root=artifacts/research/nhm2/g2h/tolman-vii-independent-v1
primary_manifest_sha256=<OBSERVED_IMMUTABLE_PRIMARY_MANIFEST_SHA256>
```

## Claim boundary

Source-level exact arithmetic shows that the surface-gate implementations are
designed to compare the one-sided `B` jets and to stop at their first disjoint
order. That inspection is not a candidate execution or a proof result. Only the
later immutable G2H-E receipts may establish `PASS`, typed `FAIL`, partial
evidence or primary/independent agreement. All admission, geometry/state, lane,
lamp, physical-viability, propulsion and transport authority remains false.
