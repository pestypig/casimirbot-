Program gate: G8 — Environment-harness release evaluation
Workstream: launch-ledger G0 source stabilization (not canonical program gate G0)
Capability or component: source inventory, local preservation checkpoint and execution prerequisites
Lifecycle stage: preparation for CFP-1 work; no child-stage implementation
Reaction timescale: one captured source tuple and subsequent task admission
Authority owner: Define agent build plan coordinator; canonical work program retains gate authority
Current maturity: specified
Target maturity: deterministically verified source identity and documentation baseline only
Required evidence: per-file inventory, Git objects and hashes, ownership reservations, prerequisite checks and docs audit
Explicit non-goals: release acceptance, runtime changes, process termination, signing provisioning, publication, deployment, billing or physics verification
Downstream gate unlocked: none; CFP-1 remains active and child implementation remains unadmitted

# G0 source stabilization review — 2026-09-21

## Disposition

| Item | Result | Evidence and limits |
| --- | --- | --- |
| G0.1 | PASS | [source-tuple.json](source-tuple.json) inventories 770 individual modified/untracked paths with path-based workstreams, sizes and inclusion/exclusion decisions. Task ownership reservations below prevent this inventory from becoming permission to edit another task's files. |
| G0.2 | PASS | Local preservation commit `3606fa7b1403bf1b42b3c3dfddda1ec504e39681`, tree `b6be0e259b38edd8995c18bfd8fe5a5d75f4d9e5`, parent `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93`. All 537 included changed-file blobs were read back from the commit and compared to captured SHA-256 values; zero failures and zero live-file drift during capture. This is a reproducible source snapshot, not a build or release qualification. |
| G0.3 | PASS | Current writer and later verifier roles, exact worktree convention, shared-file restrictions and next-work location are defined below. No second writer or verifier task has been started. |
| G0.4 | BLOCKED | Inspection completed, but sufficient prerequisites are not established: free physical memory was 2.014 GiB against the 4-GiB launch requirement; local release signing resolver reports missing backend selection; both inspected EXEs are `NotSigned`. Remote signing provisioning was not live-verified. |
| G0.5 | PASS | [docs-audit.json](docs-audit.json): exit 0, active G8, 6 backlinks, 7 targets, 40 capability rows, 14 acceptance claims, no failures. |

G0 is not fully closed while G0.4 remains unchecked. The next independent
admitted work is CFP-1 source inspection or fixture preparation under the
existing work-program rules; this report does not advance G1–G9 or CFP stages.

## Snapshot and preservation scope

The live checkout was on `main` at the parent above. Snapshot branch:
`codex/g0-source-snapshot-20260921t182905082`.

Capture interval and exact per-file identities are in the manifest. Its SHA-256
is `dcd8b6e246ab1394dd72fbd64f77a4ec3afcce762357e3a5cdb4c47743b35199`.
The private capture script and alternate index remain under `.git/casimir-g0*`.
The live index hash and live HEAD were unchanged; the real staging area remained
empty. Nothing was pushed, checked out, reset, stashed, deleted or merged.

| Workstream (classification, not proof of authorship) | Included changes | Excluded changes |
| --- | ---: | ---: |
| CFP platform/contracts/evidence | 368 | 0 |
| NAV execution/contracts/evidence | 124 | 0 |
| Account/onboarding | 33 | 0 |
| Shared integration | 11 | 0 |
| Other preserved | 1 | 0 |
| NHM2/math | 0 | 7 |
| Generated archives/build caches | 0 | 226 |

Excluded modified tracked paths retain their parent-commit bytes in the
snapshot; excluded untracked paths are absent. Their live files remain intact.
The 226 generated paths include 222 archived desktop package files and four
Minecraft build/cache changes. The seven unrelated research/report changes
remain outside this launch checkpoint. Ignored files, credentials and installed
runtime data are not represented as source inputs. This does not certify the
whole repository as secret-free or publication-ready.

The earlier 549 count used Git's directory-collapsed display. This capture uses
individual untracked files and occurred later during ongoing work; it is not a
claim that 221 new source changes were made by G0.

The snapshot captures exact observed bytes, including local line endings, and
reuses parent Git objects for unchanged paths. Future source builds must record
Git checkout filters/toolchain and recheck relevant hashes. New G0 evidence and
the checklist update are later coordination changes, not implicitly included in
the frozen commit. No runnable build was demonstrated from this commit.

## Ownership and worktree control

App inventory and read-task state confirmed these identities:

- **Define agent build plan**, `01a0798b-b5bd-7bf2-946a-9a77e086316a`:
  current G0 coordinator and sole G0 writer. Allowed changes are the launch
  guide, this evidence directory and private snapshot metadata.
- **Check G7 checkpoint status**, `01a03464-1f5e-7f93-bd17-e4ca8a0bec9e`:
  active in the canonical checkout. Reserve NAV/Minecraft execution and shared
  runtime files to this task pending explicit integration review. Per-file
  historical authorship is not established by the task title or Git status.
- **Audit Daybreak harness authorization**: idle in a separate Documents/Codex
  directory; no canonical-checkout mutation assignment inferred.
- NHM2/math files have separate program ownership and are excluded. Account
  and shared integration changes are preserved but their prior author is not
  assigned from filenames. They require handoff/hunk review before mutation.

Later verifier role: **G0 source tuple verifier**, using `gpt-5.6-luna` low as
recommended by the guide, read-only on the immutable commit and evidence. This
role is reserved, not a claimed independent review or a created task. The
coordinator performed the deterministic blob/audit checks in this report.

Worktree convention: one future implementation branch `codex/<goal>-<slice>`
and one sibling worktree outside the canonical checkout, based explicitly on
the frozen snapshot commit, not implicitly on `origin/main`. For G1 the reserved
location is sibling `CasimirBot-launch-g1`, branch `codex/launch-g1-freeze`.
Check that both are unused before creation. Review newer NAV/account changes
before integrating them. Do not reuse locked/initializing worktrees or prune
the stale Replit entry during G0. No new implementation worktree is needed for
this documentation/inventory task.

Existing worktree inventory showed the canonical root, three Codex-managed
detached worktrees (two locked initializing), one prunable historical Replit
entry and an ET6 hotfix worktree. None was altered.

Shared files flagged by the existing [release-slice audit](release-slice-audit.json):
`server/db/client.ts`, `server/__tests__/local-pg-mem-persistence.test.ts`, and
`server/mcp/helix-mcp-server.ts`. Snapshot inclusion is preservation only;
release inclusion requires hunk review. The audit's 242 owned changes include
archived development files, which this source checkpoint explicitly excludes.

## Packaging prerequisite observations

At `2026-09-21T18:22:43.6827152Z`, C: had 19.167 GiB free and physical memory
had 2.014 GiB free. Disk capacity is measured, not certified sufficient for an
unmeasured future build. `check-build-retention.mjs` passed with one retained
development package, `release-nav-eq-verified-20260920`, below its limit of three.

`smoke-packaged-launch.ps1` checks the 4-GiB memory floor before launching.
The EXE was not launched and no process was stopped to manufacture headroom.
Both `apps/desktop/release/win-unpacked/CasimirBot.exe` and
`apps/desktop/release-nav-eq-verified-20260920/win-unpacked/CasimirBot.exe`
were present at 225533440 bytes and returned `NotSigned` from Authenticode.

The release signing resolver, invoked read-only with `releaseMode: true`,
reported `CASIMIR_DESKTOP_SIGNING_BACKEND is required`. This is evidence about
this shell, not proof that no remote account exists. The existing September 1
cloud-signing infrastructure record is historical and lists provisioning as
open; it cannot prove current provisioning. CFP-2 signed qualification requires
an approved publicly trusted identity and a separate no-publication recipe.
Creating a billable signing account or changing provider custody is outside G0.

To clear G0.4, obtain fresh headroom/disk evidence and an identified usable
signing route under the owning packet. Never substitute an unsigned or
self-signed diagnostic build for signed qualification.

## Verification and accounting

The package command `npm run helix:environment-harness:docs-audit` passed during
the initial check. A later PowerShell capture using `& npm` returned an npm
`Unknown command: pm` invocation error, preserved in
[docs-audit-invocation-error.txt](docs-audit-invocation-error.txt). The same audit
implementation was then run directly through
`node node_modules/tsx/dist/cli.mjs scripts/audit-environment-harness-work-program.ts`,
producing the retained passing JSON. The invocation failure is not presented as
a successful audit. No Casimir physics/release verifier was run; this report
does not change its contracts or claim an artifact certificate.

Model requested by the owner: GPT-6 Astra, medium reasoning. Runtime effort is
not separately introspectable; no alternate model or verifier was dispatched.
G0 ceiling: 200 Codex credits. Initial observed balance: 1562.53398; review-time
balance: 1498.54554; account-wide delta: 63.98844 credits. Another task was
active, so this is not attributable G0 consumption. Later usage for report
writing/verification must be charged against the remaining envelope. The
ceiling is an operational checkpoint, not an enforceable per-task billing cap.
