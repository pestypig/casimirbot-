Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding and binding repair
Capability or component: O6 development package preparation
Lifecycle stage: presentation; source admission
Reaction timescale: packaged startup and recovery
Authority owner: human retains production consent; native service owns persisted authority
Current maturity: implemented
Target maturity: separately evidenced packaged rehearsal
Required evidence: successful build exit, byte comparisons, isolated launch, ordinary consent and integrated session workflow
Explicit non-goals: no signed-release qualification, production consent automation, replacement keyed server, ET6 substitution or NAV1 unlock
Downstream gate unlocked: none

# September 12 package checks

Built a new development package at
`apps/desktop/release-onboarding-pairing-20260912/win-unpacked/CasimirBot.exe`.
The existing September 8 package and its running keyed service were preserved.
This build includes the September 12 acceptance/revocation reconciliation,
rejected legacy-replacement preservation and storage-error diagnostics repairs.
The checkout is dirty; HEAD alone is not an exact source snapshot or release seal.

Executed sequentially with no concurrent test/build worker tree:

- `npm run build:client`: exit 0, 34.54-second Vite build; regenerated normal
  documentation metadata. Existing browser-external, tree-sitter eval and
  dynamic/static import warnings remain.
- `npm --prefix apps/desktop run build:host`: exit 0; pinned tunnel-client
  v0.0.13 verified; four existing unrelated duplicate-key/case warnings.
- `npm --prefix apps/desktop run stage:runtime`: exit 0; six allowlisted
  runtime roots, dependency closure `staged_verified`.
- From `apps/desktop`, `electron-builder --config electron-builder.config.cjs
  --dir --config.directories.output=release-onboarding-pairing-20260912`:
  exit 0. Build output mentioning signing is not independent signature verification.
- Read-only package comparison: 645 staged/runtime files and 635 built/packaged
  renderer files, zero mismatches or extras; all eight host dist files match
  their archived bytes, including both required data assets and overlay preload.

Exact SHA256 and comparison details are in
`2026-09-12-onboarding-pairing-package.json`. EXE SHA256:
`4275cbac44867b51d09768ff69bb7155903a05ab3ca8fccb7caec1419861b99c`.

The first comparison helper used forward-slash paths for nested ASAR entries
on Windows and failed extraction. An archive listing confirmed the asset was
present. Correcting the helper to native path separators produced the full
passing comparison; no package asset or build configuration changed for this.

The existing isolated launch smoke was invoked with the exact new EXE via its
`-ExecutablePath` parameter. It exited 1 at its initial 4 GiB physical-memory
headroom guard, before starting an application process. No guard was weakened
and no user process was terminated to force a pass. The test's temporary root
is validated and cleaned by its existing finally block. This is an unexecuted
launch due to resource preflight, not evidence of an application startup defect.
The production service PID 22908 was separately observed running during these
checks; this dated observation must be refreshed before any future transition.

`git diff --check` and the environment documentation audit passed. No verification
policy or release pipeline code changed. This is non-physics development
packaging, not Casimir certificate or signed release qualification.

## Remaining acceptance

The new EXE has not replaced the running package. Its native launch, production
checkbox interaction, exact-task pairing, automatic delivery, visible prompt
pickup/acknowledgement, idle/restart recovery and revoke/zero-duplicate effects
are unproven. Existing deterministic fixtures remain component evidence only.
This observation closes no CS exit, O6 acceptance or original ET6 gate.
