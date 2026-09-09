Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1 code, GitHub and Replit alignment audit
Capability or component: Evidence-backed free-personal and hosted-collaboration build plan
Lifecycle stage: presentation; read-only implementation and deployment inspection
Reaction timescale: durable development planning
Authority owner: Coordinator integrates account/hosted and personal/developer audits; existing component owners retain implementation authority
Current maturity: specified
Target maturity: specified with referenced implementation gaps and ordered handoffs
Required evidence: current source identity and dirty-file qualification; GitHub repository/branch/workflow/release observations; domain/Replit evidence; requirement-to-source map; targeted component checks; reconciled current contracts; independent review
Explicit non-goals: no runtime patch, deployment, database mutation, payment, source visibility change, release publication, new agent runtime or G8 promotion
Downstream gate unlocked: none automatically; component implementation remains subject to canonical CFP and existing environment prerequisites

# CFP-1 code and deployment alignment audit

The user requested this audit on 2026-09-08 to ground the evolving product plan in available mechanisms. It is read-only outside documentation/evidence and cannot perturb open runtime prerequisites. [The work program](../helix-environment-harness-work-program-v1.md) remains the only stage ledger; [CFP-1](eh-g8-cfp1-product-rights-and-offer-contract-v1.md) remains the commercial specification.

The app rejected creating a second goal because the earlier CFP-1 goal is unfinished. This packet records the requested audit objective without falsely closing that goal.

## Completion criteria

1. Map personal use, collaboration, identity, billing, persistence, delivery, developer integration, rights and broader G8 claims to actual sources and missing evidence.
2. Compare local source, live GitHub and accessible Replit/domain state without treating configuration as deployment proof.
3. Rewrite material contradictory current instructions, preserving immutable older evidence.
4. Provide ordered, owned build tasks with exact reuse points, acceptance and external dependencies.
5. Run bounded relevant checks, preserve failures and obtain independent review. An inaccessible dashboard remains explicitly incomplete, not inferred from public HTTP success.

## Inspection baseline

Evidence directory: [2026-09-08 audit capture](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-08-code-deployment-audit-06/).

- Local HEAD and live GitHub main both identify `0f25f3538466d64c6468ad7e09b0a7300a8e9412`; the local checkout had 118 changed/untracked status entries at initial inspection. Commit equality does not make local uncommitted work deployed.
- GitHub repository is public; main reports unprotected. The queried releases collection returned no releases. This does not prove absence of local installers or unseen private drafts.
- Live domain fingerprint reports compiled production from `42c5b19b4be2a95d2d2de937ef9f550df8b6f2b4`, built 2026-09-01. Local ancestry check shows it is seven commits behind current HEAD. The endpoint reports its runtime/artifact commits agree with each other, not with current main.
- The live desktop-release endpoint reports `available:false`, `approved:false`, `reason:not_configured`; rendered `/download` says “No approved installer yet.” A working page is not an available product download.
- Latest-main Casimir Verify workflow failed at Validate agent context checklist; Run Casimir verify was skipped. Do not label this a physical verification FAIL or reuse it as PASS evidence. Robotics Benchmark also failed; Repo Atlas passed; Voice Train skipped in the sampled runs.
- Authenticated Replit inspection of `@pestypig/CasimirBot` confirms the expected GitHub remote and `main`, an Autoscale deployment in North America (4 vCPU / 8 GiB / maximum 1), and “Production database connected.” The Git panel's latest listed commit is `efe7794`, matching a local ancestor two commits behind current main; its upstream was last fetched five days ago. Two workspace modifications are listed: `docMetadata.generated.ts` and `code-lattice.json`. No fetch, synchronization or deployment was performed. The deployed fingerprint remains the stronger evidence for production source identity.
- Replit lists `casimir-bot-pestypig.replit.app`, `helixubi.com` and `casimirbot.com`; a failed marker appears alongside `helixubi.com`. The latter domain needs its own check before being advertised. Database connection status does not establish the actual runtime DSN, account migrations, backup restorability or production OAuth configuration. No credentials or OAuth callback parameters belong in saved evidence. See the [sanitized Replit observation](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-08-code-deployment-audit-06/replit-observation.json).

See [GitHub capture](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-08-code-deployment-audit-06/github-observation.json), [domain capture](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-08-code-deployment-audit-06/domain-observation.json) and [component results](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-08-code-deployment-audit-06/targeted-tests.json).

## Requirement-to-mechanism audit

| Requirement | Actual references | Finding and disposition |
| --- | --- | --- |
| Free personal MCP loop | `server/routes/helix-mcp.ts:8`; `shared/helix-account-session.ts:116`; `minecraft-local-lifecycle.ts:169` under workstation-tool-gateway | Existing MCP transport is reusable. User policy and native lifecycle still restrict actions to developer in important paths. Build exact supported personal admission, not a blanket developer unlock. |
| Tool access separate from task steering | `server/mcp/helix-mcp-server.ts:10168` and `:10187` | Tool and supervisor registrations are separate. This does not establish externally initiated existing-task delivery. Prove the supported host bridge separately; ordinary tools must remain useful without it. |
| Google and web/native account continuity | `server/routes/google-auth.ts:29`; `GoogleSignInButton.tsx:75` under client auth; `account-session-store.ts:1472`; `auth0-native-account-link.ts:282` | Direct Google GIS route and Auth0/native PKCE linking already exist. Reuse them. Direct Google and Auth0-brokered identities are not automatically identical; prove explicit linking, issuer boundaries and no email-only merge. |
| Durable domain accounts | `server/db/client.ts:628`; migrations `026_helix_accounts.ts`, `079_linked_provider_exact_unique_constraint.ts` | Persistent schema exists, but DB client permits absent-DSN/pg-mem fallback. Add production hosted admission that fails closed without durable DB; do not remove valid local development behavior. Actual production DB mode remains unverified. |
| Subscription ownership and granting | `billing-entitlement-store.ts:198`; `stripe-sandbox-webhook.ts:73`; `shared/helix-billing-entitlement.ts` | Existing ledger is sandbox/credit-based and rejects live events. Reuse verified-event/persistence mechanics, replace selected product semantics with hosted grants, and enforce checkout/customer/account association. No production commerce claim. |
| Ordinary billing owner access | `desktop-auth0-step-up.ts:195`, `:408`, `:459` | Checkout/portal currently require developer admission. Add normal authenticated billing-owner permission and retain step-up; purchase must not promote roles. |
| Hosted rooms and program sharing | `shared-live-room-control/service.ts:640`, `:1401` | Existing feature/role/program-grant machinery is the base. Inspected room service has no subscription-backed admission. Compose hosted eligibility with membership and owner grants; do not replace them. |
| Personal/hosted entitlement separation | CFP-1 POLICY/ENTITLEMENTS/evaluation boundary and CFP-2/3 handoffs | Earlier override paragraphs left obsolete paid-personal instructions. Rewrite operative clauses: personal consent is not a trial or commercial grant; purchase governs hosted capabilities only. |
| Public landing and Open app | `client/src/App.tsx:179–199` | `/` and `/open` currently use AdaptiveWorkstationRoute; `/download` exists. Implement product explanation/CTA entry while preserving workstation deep links; do not assume the landing page is already built. |
| Signed public download/update | `client/src/pages/download.tsx:23`; `server/routes/desktop-release.ts:15`; `.github/workflows/desktop-release.yml:3` | Release status, signing pipeline and update guards exist. Live status is not configured and workflow is tag-triggered. Reuse these mechanisms; do not fabricate a download or publish before signed evidence. |
| GitHub/Replit alignment | `.replit:12`; `scripts/replit-build.sh:6`; `docs/replit-parity-contract.md` | Autoscale build declares strict origin/main authority and fingerprints. Public deployment is older. Audit actual dashboard source/deploy linkage, then use a reviewed release deployment; do not assume every push deploys or fork another codebase. |
| Developer kit | `connectors/environment/README.md:12`; contract/v1, sdk/typescript, sdk/java, templates/read-only, examples/system-clock, conformance | A probe-only kit already exists. Extend it rather than scaffold another SDK. Generic mutation and independent developer acceptance remain missing. |
| Non-Minecraft program evidence | `environment-adapter-registry.ts:271`, `:325`; `environment-adapter-registry.test.ts:162` | Enabled system-clock read profile is real source, not merely a synthetic fixture. Reconcile the old registry-document baseline in its owning work; no inference to full cross-program action/collaboration acceptance. |
| Rights and distribution | CFP-1 rights inventory, retained license/JAR/native dependency audit | Prior component inventory is a starting point; current artifact-specific notices, ownership evidence and applicable Minecraft commercial classification remain independent. This code audit supplies no legal clearance or license changes. |
| Broad G8/runtime requirements | Canonical work-program capability table and original PNA/ET/NAV/federation packets | Retain all prerequisites; the personal or hosted slice does not accept temporal capacity, navigation, voice, multi-device isolation or broader environment claims. |

## Ordered build direction

These tasks refine existing CFP ownership, not new active gates. Exact file ownership and frozen contracts are required before implementation dispatch. Read-only audits and documentation may proceed while commercial decisions remain open.

| Order / owner | Concrete work and reuse | Acceptance / dependency |
| --- | --- | --- |
| A — CFP-1 coordinator | Reconcile current operative plans, inventory every supported personal and hosted capability, record source/deployment identities | No paid-personal grant requirement remains; each capability has a handler owner and evidence limit. Exact public support set still requires review; do not market the entire developer catalog. |
| B — CFP-2.PUBLIC + ONBOARD | Reuse MCP, native pairing, Google/Auth0 account link and policy machinery for one ordinary personal journey | Never-subscribed and expired-hosted users can inspect/use/stop/reconnect with collaboration unavailable; no developer launcher, manual secret or task-binding repair. Bound mutation through the existing CAPABILITY owner. |
| C — account/database owner coordinated with CFP-3 | Harden hosted DB admission, exact account/provider linking and deployment migration/readiness | DOM-02/06: no email merge, no mem fallback for production hosted authority, durable restart and restore/revocation; use isolated tests before any deployment. |
| D — CFP-3.COMMERCE + LICENSE | Implement selected hosted subscription grants using existing event/account infrastructure; ordinary billing-owner checkout/portal | Freeze payer/guest policy, benefits and interval first. Verified customer binding, duplicate/reordered/missed events, expiry/refund/reconcile; free personal access remains independent. |
| E — existing room/PNA owners + CFP-4.INTEGRATION | Compose paid-hosted eligibility with existing participant and program grants; prove actual task bridge if offered | COLLAB-01–06; exact invite/target/revoke/reconnect. Separate one-host evidence from physical two-device acceptance and tool access from task steering. |
| F — web/distribution owners | Build public landing/Open app experience, preserve deep links, supply signed source-independent artifacts through existing release path | DOM-01/07, DIST cases and same-artifact checks. Review signing and repository/feed migration before publication; source privacy is not required to build the experience. |
| G — developer integration owner | Extend existing read-only connector kit with documented onboarding/conformance and system-clock exercise | DEV-01 and the read-only portion of DEV-02 first, explicitly partial. Admit the generic bounded-action contract through its owner, then complete full DEV-02 before DEV-03–06. No parallel SDK/agent runtime. |
| H — release/deployment owner | Repair relevant CI prerequisite, verify Replit source/build/DB/callback environment and deploy an accepted version when separately authorized | Fingerprint and replay agree with the declared release, live download metadata matches signed artifacts, OAuth and hosted acceptance completed. Old public deployment is not fixed by updating local docs. |

C and signing/deployment discovery can be prepared independently of B; paid implementation D waits for the existing commercial prerequisites. Web and desktop may have separate deployment cadences while sharing contracts. Runtime patches, release verification and live tests follow the gates applicable to their actual scope; this audit runs no server-backed Casimir verifier.

## Verification and open evidence

The four-file deterministic check yielded 19 passing and 2 failing tests. Registry (7), connector conformance (5) and Google route (5) passed. Public MCP catalog had two passes and two failures: expected 398 controls but observed 402; expected 100 room controls but observed 101. Investigate whether new controls are intended and policy-correct before adjusting expectations. Do not weaken assertions just to produce green output.

Authenticated Replit dashboard and Git inspection is complete at metadata scope. The source audit, GitHub/public-domain comparison, plan reconciliation and independent reviews satisfy this audit packet's planning criteria. Deployed database mode/backups, actual Google/Auth0 production callbacks, provider account settings, signing provisioning and a deployed hosted purchase remain acceptance work for their owners. Historical Replit conversation text is not fresh execution evidence. No external payment, database, source synchronization or deployment action was performed. Price/payer/guest decisions remain owner choices; CFP-1 and G8 remain open. See the final validation capture alongside the earlier pre-login snapshot.
