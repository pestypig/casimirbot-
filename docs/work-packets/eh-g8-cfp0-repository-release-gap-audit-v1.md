Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-0 repository and development-plan audit
Capability or component: Release dependency, implementation, rights, and distribution inventory for the paid Codex-first harness
Lifecycle stage: presentation (primary); read-only audit of the underlying lifecycle and release claims
Reaction timescale: durable planning
Authority owner: Development audit agents inspect evidence; one coordinator assigns findings; the product owner retains commercial and release decisions; existing work programs retain runtime authority
Current maturity: specified
Target maturity: specified with a reviewed complete first-release dependency and gap inventory
Required evidence: scoped source/evidence manifest, disposition matrix covering relevant canonical G8 references, implementation and installed-evidence mapping, licensing/distribution unknowns, conflict resolutions or assigned decisions, and a reviewed CFP-1 handoff
Explicit non-goals: no runtime edits or shared-service restart; no live account or payment operation; no license or visibility change; no certification or capability promotion; no silent cancellation of other active packets
Downstream gate unlocked: CFP-1 product and rights specification, after coordinator closure in the canonical work program

# CFP-0 repository release-gap audit v1

Parent contract:
[`eh-g8-codex-first-paid-product-delivery-v1.md`](eh-g8-codex-first-paid-product-delivery-v1.md).
Current stage and advancement authority:
[`docs/helix-environment-harness-work-program-v1.md`](../helix-environment-harness-work-program-v1.md).
The planning baseline at
[`docs/audits/eh-g8-codex-first-paid-product-planning-baseline-2026-09-06.md`](../audits/eh-g8-codex-first-paid-product-planning-baseline-2026-09-06.md)
is input, not stage closure.

## Assignment A — roadmap audit

Read the parent packet's mandatory source set, the canonical G8 sections and
capability table, and follow their relevant development-packet links. Produce
one row for every traversed packet; explicitly record unrelated packets as out
of scope with a reason rather than silently dropping them. Include separately
owned Helix parity prerequisites without changing that program's gate.

For each row record path, authority owner, declared stage, maturity as claimed
by the authoritative source, evidence references actually inspected, missing
or stale evidence, dependencies, proposed offer relationship, disposition, and
the exact next task. Conflicting statements become identified findings; do not
infer that the newer file or a successful isolated test wins automatically.

## Assignment B — implementation and distribution audit

Map each proposed first-release requirement to exact source files, tests,
packaged artifacts, and installed acceptance records. Classify observations as
source-inspected, result-inspected, or not checked. Existing tests on disk do
not prove they currently pass. Do not run paid/live tests or start a service.

Inspect software entitlement versus provider billing, account roles and direct
API enforcement, external-client setup, shipped dependencies, secret custody,
release signing, updates, license metadata/history, and rights provenance.
List owner/legal review questions without issuing a relicensing determination.
Do not expose credentials, enumerate secret values, or copy auth stores.
Remote repository visibility and signing/billing dashboards remain not checked
unless independently inspected through an authorized read-only path.

## Assignment C — coordinator and reviewer

Reconcile A and B into one inventory. Propose the smallest useful paid
capability slice and map it to every existing G8 release requirement. Assign
each material gap an owner responsibility, prerequisite, acceptance scenario,
and next child packet. Identify decisions needing the product owner; prepare
concrete options and their consequences. Pricing need not be invented by the
auditor to finish the inventory.

The reviewer must reject an inventory that substitutes a connection test for a
useful task, sandbox commerce for a paid release, an unpacked build for a signed
install, or developer credentials for ordinary-user setup. Existing narrow
capability evidence retains its exact scope.

## Allowed writes, evidence, and stop conditions

Audit assignments A/B are read-only. The coordinator may write this task's new
dated audit and sanitized evidence files, create the CFP-1 child specification
packet, and update only this lane's canonical stage/evidence entries after
review. Runtime, licenses, release workflows, unrelated research, and existing
dated audits are outside this assignment. Any proposed contract reconciliation
is recorded as an assigned CFP-1 change, not made through an audit shortcut.

Capture HEAD, relevant dirty-file hashes, path inventory, and evidence versions.
Use a unique dated audit filename under `docs/audits/` and raw artifacts under
`docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-0/<run-id>/`.
Respect other agents' work; never reset, clean, commit, or stage their files.

Stop dependent conclusions when a prerequisite, version, artifact identity,
ownership right, or authority source cannot be established. Assign a concrete
next action and continue independent inspection. A missing live artifact is
an assigned implementation/acceptance gap, not permission to run that journey.

Closure requires full disposition coverage for the declared traversal scope,
all material gaps assigned, unresolved decisions explicitly owned, independent
review or a disclosed separate review pass, and
`npm run helix:environment-harness:docs-audit` after status/backlink edits.
CFP-0 closure accepts the inventory only. It does not assert that the proposed
offer is licensed, implemented, paid, signed, or release-ready.
