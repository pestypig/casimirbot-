# G1 engineering freeze review — 2026-09-21

Scope: source-backed planning and a narrow engineering admission, not runtime
acceptance or public-release clearance.

The [G1 packet](../../../../work-packets/eh-g8-g1-release-matrix-and-engineering-admission-v1.md)
contains the consolidated release matrix and next implementation assignment.
The owner selected: “Retain paid no-model collaboration; evaluate assisted
rooms separately (Recommended).” Free personal MCP remains separate.

## Source and independent review

[Source manifest](source-manifest.json) records 28 inspected working-file hashes,
the live HEAD and G0 checkpoint. Untracked files were compared directly with
checkpoint bytes; an index diff alone would falsely report deletions. At the
recorded comparison, only the launch guide differed among compared sources.
This packet and canonical admission are subsequent documentation changes.

Independent reviewer `/root/g1_independent_review` returned **PASS** after
correction of three stale offer statements in the launch guide. The reviewer
verified all 28 source hashes and confirmed the canvas action is absent from
the registry. The review found G1-T1 confined to isolated contract fixtures;
CFP-2/3, native effects, production changes, billing and public acceptance
remain unadmitted. This PASS establishes document/source consistency and
bounded engineering admission only, not rights or runtime acceptance.

## Disposition

- G1.1 BLOCKED: specified action candidates are not commercially rights-cleared.
- G1.2 PASS: capacity candidate and measurement method frozen; economics open.
- G1.3 PASS: qualified-review requirements and public holds recorded.
- G1.4 BLOCKED: consolidated matrix exists; complete customer/operation acceptance absent.
- G1.5 PASS: owner resolved first-launch commercial relationship.
- G1.6 PASS: platform/package/credential/profile boundaries specified.
- G1.7 PASS: canonical work program admits only G1-T1's explicit test-only scope.
- G1.8 PASS: independent corrections resolved and documentation audit passed.

## Verification and limits

Harness documentation audit via
`node node_modules/tsx/dist/cli.mjs scripts/audit-environment-harness-work-program.ts`
passed: G8 active, 6 backlinks, 7 canonical targets, 40 capability status rows,
14 acceptance claims, no failures. The final output is [docs-audit.json](docs-audit.json).
Source hashes and relative file links are checked separately in
[local-checks.json](local-checks.json). Referenced tests are proposed acceptance
leads; no runtime, EXE, hosted-domain or action acceptance was executed here.
Casimir verification is outside this documentation-only patch's scope.

Microsoft signing access remains deferred until October 1, 2026, or restored
access. Recheck available memory before installed testing. Preserve concurrent
NAV changes; G1 modified no production source or NAV files.

## Budget and next assignment

Account credits observed at G1 start: 1389.55977; closing review observation:
1180.86195. The 208.69782 account-wide decrease includes other tasks and cannot
be attributed to G1 alone. It exceeds the 187.5 review point of the planned
250-credit ceiling, so this run finishes documentation and starts no new build.

Next assignment: G1-T1 reference-canvas pure contract schema and adversarial
fixtures, with the exact allowlist and CF-01–08 cases in the packet. Its proposed
80-credit ceiling is separately funded, not additional authorization under G1.
Use a reviewed source tuple including the admission documents; the G0 snapshot
alone predates them. This planning assignment records the open items; neither
G1's full release conditions nor CFP-1 is closed.
