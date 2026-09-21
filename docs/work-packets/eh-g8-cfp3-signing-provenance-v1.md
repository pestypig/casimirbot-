Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-3.SIGNING candidate implementation contract
Capability or component: Immutable signed Windows artifact and package provenance
Lifecycle stage: CI/release verification; presentation
Reaction timescale: durable implementation planning; runtime limits must be frozen by CFP-1
Authority owner: Release signing implementer; independent artifact/provenance reviewer; one signing-run operator; product owner retains commercial and release decisions
Current maturity: specified
Target maturity: deterministically verified within frozen scope, with separately labeled installed/sandbox acceptance where required
Required evidence: CFP-1 closure, CFP-2 completion, rights and terms freeze for the planned component scope, then exact source/built-artifact manifest, targeted checks and bounded acceptance artifacts produced in CFP-3
Explicit non-goals: no dispatch from this draft, no production charging/publication, source privatization, automatic rights clearance, capability promotion, or replacement agent runtime
Downstream gate unlocked: CFP-4 integrated same-signed-artifact acceptance only after parent CFP-3 evidence closure

# CFP-3.SIGNING — Immutable signed Windows artifact and package provenance

Status: candidate child packet, NOT DISPATCHABLE. Owner-selected bounded
Minecraft assistance is a product direction, not permission for paid Minecraft
admission checks. Minecraft EULA and Usage Guidelines classification/permission
review remains unresolved, including restrictions on indirect out-of-game
product checks affecting in-game features. A free mod / paid harness split is
not clearance. This packet does not approve that design.

Parent packet: `docs/work-packets/eh-g8-codex-first-paid-product-delivery-v1.md`.
Stage and task ID: CFP-3.SIGNING.
Change classification: CI/release verification; presentation.
Current stage authority: `docs/helix-environment-harness-work-program-v1.md`.

## Admission prerequisites

Require recorded CFP-1 closure and CFP-2 completion in canonical authority,
reviewed rights for every planned distributed component and the selected
paid/trial connector relationship, selected commercial
term/trial/device/offline/expiry/refund/service terms, frozen capability IDs,
versions and all numerical acceptance limits. Signing and feed provisioning
are independently owned external dependencies. Mere presence of this packet,
a passing source test, or preparation in parallel opens no implementation stage.

CFP-2 completion includes a private signed [SIGNED-QUALIFICATION](eh-g8-cfp2-signed-qualification-v1.md) tuple used to prove P1/PNA2. Consume its publisher, source/artifact manifest and installed failures as inputs, but **do not reuse its EXE or signature as the customer cohort**. This packet remains responsible for a new, immutable, rights-reviewed final signed build, complete release closure/notices and coordination with the public distribution packet. CFP-4 repeats the useful-task and full lifecycle matrix on those final bytes. A changed signing identity, component or staged byte requires the applicable rights and acceptance recheck; the CFP-2 tuple is no customer-feed authorization.

The controlling [CFP-1 identity/signing cash guard](eh-g8-cfp1-d07-identity-and-signing-cash-guard-owner-freeze-v1.md) conditionally selects Azure Artifact Signing Basic for a U.S. individual seller under `$15` per rolling 30 days. Before enrollment, prove the actual Individual billing account, legal-name/sold-to-address match, approved seller and public certificate identity, qualified D11 treatment, checkout/tax and least-privilege signer custody. Use an isolated SKU scope or exact reconciliation. Reserve each artifact/batch before dispatch; count every provider-billed artifact signature and conservatively count retries; prohibit overage; enforce at most 1,000 signatures per provider billing month and rolling 30 days, with routine/candidate work capped at 800 and 200 protected for same-or-newer security/rights repair. Unrelated Azure spend stays outside sponsor PBT and outside the `$15` line.

Prerequisite audit:
`docs/audits/eh-g8-cfp0-repository-release-gap-audit-2026-09-06.md`.
Specification:
`docs/work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md`.
Scenario draft:
`docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/entitlements-distribution-draft-2026-09-07.md`.

The scenario draft's numbers are proposals, not frozen tests. At dispatch,
copy selected values and exact IDs into a new immutable run contract and link
the owner's decision. Do not independently select price, rights interpretation
or expiry semantics during implementation.

## Scope and ownership

Owner/reviewer responsibilities: Release signing implementer; independent artifact/provenance reviewer; one signing-run operator.

Allowed files: apps/desktop/scripts/release-signing-config.cjs; apps/desktop/scripts/release-preflight.mjs; apps/desktop/scripts/verify-release-artifacts.mjs; apps/desktop/electron-builder.config.cjs; tests/desktop-release-signing.spec.ts; a precisely enumerated release workflow after its current path and ownership are inspected; new release evidence only. No signing account purchase, production publication, visibility change, policy downgrade or ad hoc certificate substitution.

Reverify provider provisioning through an authorized read-only path. At entry,
consume the CFP-1 planned source/component inclusion and notice contract and
freeze the source/dirty-file and toolchain/client/connector inputs. During the
CFP-3 build, capture and inspect the actual shipped tree and dependency closure;
complete its rights-cleared SBOM/notices before signing acceptance. Produce an
immutable signed Windows installer plus Authenticode publisher/hash evidence and
package manifest. Apply existing release Casimir checks to the exact artifact.
No existing certificate or earlier unpacked build accepts changed bytes.
Coordinate artifact version and immutable identifiers with DISTRIBUTION.

Consume the CFP-1 [planned release inclusion selector](eh-g8-cfp1-planned-release-inclusion-and-rights-review-v1.md),
the rights-reviewed component/inclusion matrix and its
release-time inspection rules. The final source/build/EXE/JAR/profile hashes
are CFP-3 output evidence, not a retroactive CFP-1 entry prerequisite. Reject
any actual included component or notice obligation outside the approved scope;
return that delta for rights review before accepting the signed cohort.

The coordinator freezes exact file ownership before dispatch. Shared builder,
schema or handler files have one writer; changes required by another packet
are handed to that owner. One operator reserves each installed node, shared
service, Minecraft session, sandbox account, signing resource or feed rehearsal.
No shared service restart is implied by this packet.

## Acceptance and commands

Required scenario IDs: DIST-01, DIST-03; package prerequisite for DIST-02/04/05 and all CFP-4 same-artifact scenarios.

For each scenario record arrange/action/expected/actual, allowed effect,
identity revision, measured timing, exact artifact hashes and sanitized failure
evidence. Deterministic fixtures, deployed sandbox, unpacked diagnostic builds,
signed installed acceptance and production pilot evidence remain distinct.
Tests below already exist; this draft does not claim they currently pass.

```text
npx vitest run tests/desktop-release-signing.spec.ts tests/desktop-release-slice.spec.ts tests/desktop-site-release-metadata.spec.ts --pool=forks
npm run helix:environment-harness:docs-audit
```

Before any build/sign command, inspect apps/desktop/package.json and current release workflow and freeze their existing commands, environment and provider resource. Do not invent a release command here. Read WARP_AGENTS.md and verify-gr-math skill for CI/release gate changes; require adapter PASS, certificate hash/integrity OK and release-matched trace evidence. Signing/account provisioning is an external dependency, not an invitation to purchase or alter account security.

Read applicable repository/adapter contracts and skills before implementation.
Run the narrowest meaningful checks for actual edits. If release verification,
adapter contracts or other Casimir scope changes apply, follow the required
gate instead of reusing a historical certificate. Documentation validation
establishes consistency only.

## Evidence, stop conditions and handoff

Write new sanitized results under
`docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-3/<task-id>/<run-id>/`
with source HEAD/dirty-file hashes, contract version, package/client versions,
command and environment, complete result, representative pass/fail cases and
first divergent stage. Include immutable artifact paths/hashes and explicit
not-run scenarios. Never include raw credentials, processor objects, private
reasoning or account stores. Create new records for repairs; preserve failures.

Stop/fail criteria: Signing provisioning unavailable, rights/SBOM unreviewed, source/artifact mismatch, invalid/missing signature or publisher, failing hard verifier constraint, missing certificate integrity, or concurrent signing/resource ownership conflict stops release acceptance.

The reviewer checks source diff, exact acceptance scope and artifact identity;
unresolved findings return to this packet's owner with a bounded repair.
Record completion only for this component and hand exact evidence to the
coordinator. Do not advance canonical CFP-3/G8 or publish from a child result.

Authorized implementation after stage dispatch covers reversible development
and required local/sandbox verification under the frozen resource reservation.
Production charging, feed publication, release publication and source visibility
changes require separately recorded owner authorization for the concrete action;
those actions are not granted by this planning packet. Sandbox attendance uses
the designated owner/operator; no agent invents payment authorization.
