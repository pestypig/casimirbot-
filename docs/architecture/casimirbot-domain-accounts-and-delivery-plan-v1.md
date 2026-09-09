# CasimirBot domain, accounts and delivery plan v1

Status: specified product/deployment plan, not an implemented production account or billing service. [CFP-1](../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md) controls the offer; the [environment work program](../helix-environment-harness-work-program-v1.md) controls stage admission. This plan changes no runtime, database, provider configuration, source visibility or deployment.

## One platform, three delivery surfaces

| Surface | Intended experience |
| --- | --- |
| Public domain landing page | Explain free personal tools and paid hosted collaboration; examples, developer documentation, Download and Open app calls to action. Public download does not require source-repository membership or purchase. |
| Browser service | Sign in, manage the account/subscription, create or join eligible rooms, invite participants and inspect permitted collaboration history. Clearly explain when a connected local harness is required. |
| Installed harness | Free supported personal MCP tools; connect local programs, approve scoped sharing and enforce local effects/stop/recovery. Hosted membership does not give the browser ambient access to a computer. |

Use one authoritative development repository initially, with shared contracts and web/desktop build targets. Replit is a deployment target built from that source, not an independently edited mirror. Follow the existing [Local/Replit parity contract](../replit-parity-contract.md); capture source and build fingerprints, compatible schema versions and explicit environment differences. Desktop and web may release at different cadences but must negotiate supported contract versions.

Private first-party implementation is the intended source boundary where rights permit. Publish selected developer contracts/examples/SDK components under reviewed licenses and provide binary downloads through a public release channel independent of source access. Free software, source publication and subscription eligibility are separate policies. Do not split repositories solely to introduce payment. Audit current GitHub/Replit linkage, artifact origins and updater migration before any visibility or deployment change.

## Domain account and database authority

The domain routes customers to the service; the backend and its durable database own account and hosted-entitlement records. The browser and installed clients call authenticated APIs and never connect directly to the database. Use a production PostgreSQL deployment with migrations, backups and tested restore. Do not treat a Replit process filesystem, in-memory database or desktop snapshot as the source of production subscription truth.

Source inspected for this plan: server/services/helix-account/account-session-store.ts uses server/db/client.ts and account/provider/session tables; migration 026 creates helix_accounts. Auth0 web/native account-linking routes exist, and the account session store explicitly supports Google sign-in identities. The database client supports DATABASE_URL and pg-mem/local-snapshot fallbacks. The existing billing store uses persistent entitlement/event/ledger records, but shared/helix-billing-entitlement.ts explicitly describes a sandbox credit-oriented product. These facts establish reuse candidates, not deployed production readiness or the selected subscription contract.

| Logical record | Required role and invariants |
| --- | --- |
| Account/profile | Stable internal account ID, status and profile data. Keep account_type user/developer separate from paid plan; no session remains user under existing policy. Purchase never promotes developer privileges. |
| Login identity | Bind verified provider issuer/subject to one internal account; email is a contact attribute, not permission to merge accounts. Linking another login requires authenticated ownership proof and deliberate confirmation. |
| Session and installation | Expiring/revocable web session, separately enrolled device/node and credential references. Bind each to the account; never copy a browser session or another app's credentials into a connector. |
| Billing account and subscription | Server-only Stripe customer/subscription references, billing owner, selected plan/price version, authoritative status, effective period end and cancellation state. Test and production mappings are isolated. |
| Billing event and reconciliation | Unique processor event ID, processing status, authoritative revision and sanitized audit facts. Apply verified events transactionally; duplicates cannot grant twice and older events cannot resurrect expired/revoked eligibility. |
| Hosted entitlement | Derived versioned hosted capability/limit grants for the selected payer scope. Do not infer access from a credit balance, client flag or checkout redirect. |
| Room/member and program grant | Membership/role plus a separate program owner grant binding node, subject, capability, limits, duration and revocation revision. Room owner, payer, participant and program owner need not be the same person. |

These are logical responsibilities, not approval to create parallel tables. Audit and reuse existing account, identity, session and room records; migrate only missing subscription semantics under CFP-3 ownership. Exact payer scope (person, host or organization), guest access, seat limits and $5/$10 benefits remain owner choices.

## Google sign-in and one account

The owner confirmed Google sign-in as a supported convenience option. Google authenticates the person; the domain service resolves their stable CasimirBot account. Subscriptions, room membership and program grants belong to that internal account, not to a particular sign-in button. A Google login does not grant a subscription, developer role or access to another person's programs.

Before deployment, audit whether the configured Google path is direct or brokered through Auth0 and preserve its verified identity mapping. If a returning customer adds another sign-in method, require explicit authenticated linking; do not merge on matching email alone or create a duplicate billing account. Verify Google cancellation, failed callback and returning-customer flows as well as first sign-in. This is a usability and acceptance requirement, not a claim that production OAuth configuration was tested here.

## Authentication and subscription flow

1. The visitor downloads the personal harness freely or selects Open app. Hosted sign-in prominently offers Continue with Google for ease of use, alongside other supported methods. Reuse the existing Google/Auth0 identity integration rather than creating a separate Google-only account or billing system. Validate the login response server-side, including issuer/audience and flow protections; resolve the stable internal account and issue a protected, revocable service session. Use CSRF protection for cookie-authenticated state changes.
2. The desktop links to that same account through the supported native authorization flow with PKCE/state or the existing reviewed equivalent. Authenticate the owner and enroll the installation; never match accounts merely by a typed email, reuse a development session or ask for a Codex account password. Local personal tool access remains free; free does not mean authentication/consent checks are removed.
3. An authenticated billing owner explicitly starts checkout. The backend selects an allowed hosted-subscription price and binds checkout to the internal billing account. Stripe hosts payment entry. The service stores processor references, not card details. The success page can show pending verification; it cannot grant access.
4. The webhook endpoint verifies the processor signature against the exact request body and expected environment, durably records the event, and updates subscription state and derived hosted grants in a transaction. Reconcile disputed/out-of-order state with the processor; unknown customer/account bindings fail to manual investigation rather than guessed assignment. Recover missed events through a bounded reconciliation process.
5. Hosted requests resolve current server-side eligibility, room membership and the owner's program grant. An eligible subscriber can use only their authorized capabilities. An invited participant follows the selected guest/seat policy; no assumption is made that all guests pay or that payment includes another user's model access.
6. Cancellation, failed renewal, refund and dispute follow separately frozen effective-boundary policies. Revoke affected hosted grants and propagate revision changes within the accepted bounds. New ineligible collaboration stops; free personal tools remain available under their own permissions. Stop/revoke and identity-protected history/export/account recovery remain accessible.

Authentication answers who is acting. Hosted entitlement answers which paid service is available. A program grant answers what may happen to whose program. All three must be checked where applicable; none substitutes for another.

## Failure, privacy and deployment rules

- Production hosted identity/billing must fail closed if the durable database is missing or unavailable; do not silently fall back to a fresh local account or empty subscription store. Preserve personal operation where its existing local authorization permits; never turn an outage into paid access.
- Keep session/refresh secrets in protected service or native stores; store only secure verifiers for opaque tokens where applicable. Public/MCP projections contain safe capability and expiry summaries, not processor IDs, tokens, passwords or another member's billing data.
- A browser sign-out, device revoke, room removal, subscription cancellation and account deletion are distinct operations. Define their affected credentials, grants, retention and recovery explicitly. Account linking, lost-device recovery and billing changes require the existing supported fresh-authentication/step-up policy.
- Replit Preview/test and production have separate databases, identity callbacks and payment credentials. No production customer data in preview fixtures. Deployment health checks must verify database/migration and contract compatibility before serving hosted entitlements.
- Backups/restores must reconcile current processor status and revocation history before renewing hosted authority; restored stale data cannot silently reactivate old grants. Stage rollout and rollback around compatible migrations, with one authoritative subscription writer.

## Ordered implementation and acceptance handoff

1. CFP-1 audits existing domain routes, GitHub/Replit deployment linkage, identity mappings and database migrations; freezes the personal/hosted capability map, payer policy and customer-facing lifecycle terms.
2. CFP-2.PUBLIC/ONBOARD proves a free personal ordinary-user journey and correct account/device linking without role promotion or room setup. Public landing/download and browser route work gets exact file ownership before dispatch.
3. CFP-3.COMMERCE owns hosted subscription persistence, verified webhook/reconciliation and account portal behavior. CFP-3.LICENSE owns trusted hosted eligibility and revision enforcement. CFP-3.DISTRIBUTION owns public artifact/download and source-independent update delivery. No additional account stack is implied.
4. CFP-4 repeats the account/billing/room journey on the accepted web deployment and signed client; CFP-5 performs only separately authorized attended production payment/pilot actions. The following cases supplement existing ENT/COLLAB/DIST requirements.

| Case | Required evidence |
| --- | --- |
| DOM-01 public entry | Logged-out visitor can understand the offer and download a verified artifact without repository access; Open app reaches the intended sign-in/service route. |
| DOM-02 account continuity | Google first sign-in, returning sign-in and explicitly linked alternate login resolve the same intended account and hosted subscription across web and desktop; canceled/failed sign-in creates no authenticated grant. Same authenticated person links web and desktop to one stable account; forged callback, wrong issuer, email-only merge and cross-account link fail. Purchase never changes account type. |
| DOM-03 payment authority | Forged success redirect, invalid-signature webhook, duplicate event, wrong environment/account and out-of-order event cannot misgrant hosted access. Verified eligible subscription activates exactly the selected hosted capabilities. |
| DOM-04 permission separation | Paying without an owner grant cannot control another program; a guest cannot exceed their room role; a never-subscribed user retains supported personal tools. |
| DOM-05 lifecycle | Cancel, expiry, revoke, missed webhook and reconnect produce the frozen outcome without restoring stale authority or disabling free personal use. |
| DOM-06 durable deployment | Restart/redeploy preserves account and billing state; unavailable DB fails closed; backup/restore and processor reconciliation do not resurrect revoked grants. Preview cannot read or modify production state. |
| DOM-07 distribution parity | Web/client contract compatibility and deployment source/build fingerprints match the declared release; downloads/updates work without private-source membership. |

Freeze exact test files, versions, time bounds and resources in implementation packets. No database migration, payment activation, site publication or repository-visibility change is authorized by this planning document.
