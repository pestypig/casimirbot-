Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.ACCOUNTS / CFP-1.POLICY D02 specification acceptance
Capability or component: Public Google account, linked Auth0 operation proof, finite web session, per-installation P1 grant and local stdio/IPC trust boundary
Lifecycle stage: identity, enrollment, recovery, renewal, revocation and sensitive-operation admission specification
Reaction timescale: sign-in; every grant request; immediately before sensitive mutation and native effect release
Authority owner: Product owner selects the journey; account/security owner accepts the threat and proof contract; CFP-2 implements and proves it on the signed evaluation tuple
Current maturity: specified
Target maturity: specified with independently reviewed security decisions and executable positive/denial fixtures
Required evidence: current account/Auth0/device source, official provider behavior, reviewed D02 decisions, CFP-2 configured-tenant trace and signed ordinary-user P1S/GP evidence
Explicit non-goals: no Auth0 upgrade, provider configuration, credential enrollment, runtime/database/Codex setting, customer account, production secret, support claim or stage promotion
Downstream gate unlocked: D02 specification dependency closed by independent review 303; CFP-2 still requires canonical admission and installed evidence

# CFP-1 D02 account/security specification acceptance v1

This packet applies the owner's standing instruction to use the recommended
choices to D02's **specification**. It does not accept current implementation or
provider configuration. The selected first-customer journey is Google for
ordinary sign-in plus a separately linked Auth0 multifactor identity for
sensitive operations. A Google token, account picker, matching email, new token
`iat`, Auth0 federated `auth_time`, Codex account or local profile selection is
never the sensitive-operation proof.

## Selected identity and proof route

1. **Ordinary account identity.** Google sign-in resolves a server-verified
   provider `sub` to one active internal CasimirBot profile. Email equality
   cannot create, merge or recover authority. A seven-day absolute CasimirBot
   server session is issued with non-null server expiry; the cookie expires no
   later and ordinary reads do not slide the deadline.
2. **Explicit Auth0 link and bootstrap.** During P1 security setup, the active
   Google-owned profile creates a durable `provider_link_initial` intent bound
   to that profile, current seven-day session, native installation, device
   generation, exact Auth0 client, state, PKCE verifier and nonce. The returned
   Auth0 subject remains non-authoritative and pending until the OTP enrollment
   or challenge below yields an accepted post-event proof. The server then
   rechecks subject conflicts, account switch, same-email/different-subject and
   every intent binding and atomically activates the link. If the enrollment
   transaction cannot yield the accepted signed event, the pending link stays
   inactive and a separate `challengeWith({ type: "otp" })` transaction must
   succeed before activation. A `p1_initial_issue` transaction occurs only
   after link activation and requires its own current OTP proof. This is a
   second proof relationship, not a claim that Auth0 reauthenticated Google.
3. **First supported MFA factor.** TOTP through an authenticator application is
   the first supported first-cohort MFA factor. Auth0 Universal Login performs
   enrollment and, only when the tenant's recovery-code feature is enabled,
   returns one-time recovery codes to the user. CasimirBot never receives,
   stores, logs or acknowledges the actual TOTP secret or recovery-code value.
   WebAuthn, Guardian, SMS or another factor is excluded from the first support
   sentence until its plan availability, enrollment, operation-time event and
   recovery cases pass separately.
4. **Plan condition.** The selected flow requires an account plan and tenant
   configuration proven to include the exact production Pro MFA, Action and
   recovery-code behavior with the recovery-code feature enabled. The current
   observed Auth0 Free team and over-limit state do not meet that proof. D07
   retains the current public Essentials `$35/month` branch plus tax until an
   authorized account read establishes the actual term. This packet neither
   upgrades nor configures the tenant.
5. **Enrollment and operation-bound challenge.** A dedicated Auth0 client,
   Post-Login Action v3 runtime and enabled Customize MFA Factors using Actions
   feature respond only when both the exact client ID and CasimirBot's exact MFA
   `acr_values` request match. For `provider_link_initial` or
   `authenticator_enroll`, the first Action uses
   `api.authentication.enrollWith({ type: "otp" })` when OTP is not enrolled;
   if it is already enrolled, it uses
   `api.authentication.challengeWith({ type: "otp" })`. Every later non-
   recovery sensitive operation uses `challengeWith({ type: "otp" })` with no
   remembered-browser bypass. A subsequent ordered Action reads the latest
   post-enrollment or post-challenge `{ name: "mfa", type: "otp", timestamp }`
   entry from `event.authentication.methods` and places its factor-event
   timestamp and type in namespaced signed ID-token claims. A separately signed
   `{ name: "mfa", type: "recovery-code", timestamp }` event is admitted only
   for `authenticator_recover` or `device_recover`; no other factor type or
   purpose is accepted. The verifier requires those claims, the expected
   `acr`/`amr`, signed issuer/audience, PKCE callback, nonce, exact pending or
   active linked subject and the still-active server intent. Standard
   `auth_time` remains primary-session context and cannot satisfy the factor-
   event predicate.
6. **Freshness.** The latest verified MFA event must occur no earlier than the
   operation intent's creation minus **five seconds** of clock tolerance, no
   later than verifier time plus five seconds, and be no more than **five
   minutes old when the protected operation consumes the receipt**. The opaque
   receipt is purpose/target/profile/session/device-generation/provider-link-
   revision/service-epoch bound, single use and expires **two minutes** after
   issuance. The durable verified record carries `intent_created_at`,
   `factor_event_at`, `factor_type`, `device_recovery_generation`,
   `provider_link_revision`, `service_epoch` and `receipt_revision`.
   Consumption atomically rechecks the active session, exact linked subject,
   device generation, grant revision, purpose, target, service epoch, factor
   age and receipt age; a receipt cannot outlive the five-minute factor window.

The provider trace must demonstrate the two-Action ordering on first enrollment
as well as later challenges. Auth0 documents that the older
`api.multifactor.enable` path may omit the MFA method on first login; it is not
accepted for this proof. If the configured tenant cannot return the exact
factor event after `enrollWith` or `challengeWith`, D02 returns to review rather
than weakening the predicate to `auth_time`.

## Selected session, grant and local trust terms

| Boundary | Accepted specification | Implementation hold |
| --- | --- | --- |
| Web session | Seven-day absolute server expiry; no null public expiry and no sliding reads. Reauthentication creates a new session without extending the independent trial or P1 grant. | Current Google/Auth0 sessions with null `expires_at` must be migrated or rejected for public use. |
| P1 grant | Thirty-day maximum, one profile + Windows installation + recovery generation + named client profile + exact scopes. Same-scope renewal is allowed only in the final seven days with current session, current installation proof over authenticated IPC and unchanged generation/scopes. | No accepted P1 grant store/issuer exists. The renewal commit/custody lost-response case needs one durable successor revision or typed fresh approval. |
| Sensitive operations | Freeze exact purpose IDs: `provider_link_initial`, `provider_link_change`, `authenticator_enroll`, `authenticator_recover`, `device_register`, `device_recover`, `device_revoke`, `session_revoke`, `p1_initial_issue`, `p1_recover`, `p1_scope_expand`, `account_delete` and `billing_manage`. Every matching public mutation requires same-origin/CSRF enforcement plus the exact MFA receipt or the explicitly bounded initial-link enrollment proof above. Ordinary sign-in, sanitized status inspection and independently valid local Emergency Stop do not wait for MFA. | Current developer-only route and purpose list do not expose this complete ordinary-user surface; current account deletion uses the account cookie without step-up. |
| Receipt and intent | Store only hashes and bounded evidence in a durable shared store. Make receipt consumption and the protected operation atomic where possible; otherwise use one durable operation/idempotency record and return its existing result after response loss. A service-epoch change invalidates every unconsumed receipt and pending sensitive-operation intent. Durable records preserve denial and replay evidence; only a completed protected operation is recoverable through its durable idempotency record. Authorization itself is never recovered after restart. | Current pending intents and receipt records are process memory. Current code checks standard `auth_time`, not a new factor-event claim. |
| Device recovery | Re-registration of a revoked same ID fails to explicit recovery or advances `recovery_generation` atomically and fences every old grant. Multiple separately enrolled personal Windows devices have no paid device SKU or advertised numerical cap; rate/abuse controls and independent grants still apply. Hosted trial/paid counters remain per sponsor. | Current `registerDevice` can reactivate a revoked same-ID row without advancing generation. |
| Local process boundary | For first P1, another process running as the same signed-in Windows user is explicitly inside the accepted local trust boundary. The product does not claim to cryptographically identify the Codex UI process, and the pipe does not prevent malicious same-user code from impersonating an endpoint. Other Windows users, devices and remote/cloud stdio placement are outside it. | A later stronger same-user isolation claim requires enforceable caller authentication and a new review. |
| Transport | Codex launches the same signed CasimirBot EXE using fixed `--mcp-stdio-personal`; it enters protocol mode before GUI/single-instance/stdout logging and connects to the installed node through a per-user Windows named pipe. The server verifies the client SID and expected signed bridge image/path; the bridge verifies the expected signed service image/path and current service epoch. Both sides enforce first-instance/anti-squatting and typed stale/substituted-endpoint rejection. No reusable proof appears in config, arguments, environment, stdout, renderer or Codex configuration. | The current EXE has no command mode or reviewed pipe implementation. The HTTP helper remains held on its cached-bearer wrong-listener case. These checks constrain accidental or substituted endpoints within the declared boundary; they do not create a stronger claim against malicious same-user code. |
| Revocation/effects | Every new native effect requires live server-authoritative account/device/grant checks at admission and again immediately before native release. Durable revision denial applies on the next MCP request. Already released effects reconcile from their durable effect identity; server revoke does not falsely report an unreachable native action stopped. | CFP-2 must implement the two checks and close all bypasses. |
| Outage | Enrollment, renewal and new effects fail closed when identity/grant/device authority cannot be verified. No general offline-effect promise. Independently enforceable local stop and outcome inspection remain available with truthful verified/pending state. | Installed outage behavior remains downstream evidence. |

## Recovery and customer wording

The first cohort requires the configured tenant recovery-code feature to be
enabled. TOTP enrollment must provide a recovery code and require the user to
confirm that it was saved before P1
enrollment completes without sending the code value to CasimirBot. A valid
recovery code may complete one operation-bound `authenticator_recover` or
`device_recover` challenge and is then rotated or consumed under Auth0's
verified behavior. A newly established TOTP challenge is required afterward
before `billing_manage`, `p1_scope_expand`, `provider_link_change` or
`account_delete`. Loss of both the factor and recovery codes has no promised
automated reset in the first cohort. Existing independent local stop, account
inspection and support contact remain available; new enrollment, recovery,
payment changes and effects requiring current authority stay denied. Any future
support-assisted factor reset needs a separately reviewed identity proof, audit
and abuse process.

Candidate customer wording:

> Sign in with Google. The first time you connect or recover this computer,
> CasimirBot asks for a code from your authenticator app. Save the recovery
> code. Personal MCP access is free, each Windows computer is approved
> separately, and internet sign-in is required for enrollment and recovery.

Do not advertise WebAuthn, silent recovery, offline effects, unlimited active
machines, Codex-process identity or a currently available public connection.

## Frozen acceptance and failure rule

Carry P1S-01–07 and GP-01–11 forward with these additions:

- first OTP enrollment, saved recovery-code acknowledgement and a later
  operation-time OTP challenge;
- unlinked/unenrolled `provider_link_initial`, already-enrolled initial link,
  pending link when the enrollment event is absent, conflict denial, atomic link
  activation and denial of `p1_initial_issue` before active link plus fresh OTP;
- challenge event immediately inside/outside intent time, five-second skew,
  five-minute consumption age and two-minute receipt age;
- absent, malformed, future, primary-only or pre-intent MFA-event claim;
- exact `otp` factor acceptance for ordinary sensitive operations, exact
  `recovery-code` acceptance for only the two recovery purposes and wrong
  factor/purpose denial;
- Google-only profile, correct linked Auth0 subject, wrong subject,
  same-email/different-subject, conflicting prior link and link revocation;
- process restart and concurrent instances around challenge, receipt consume,
  durable mutation and response loss, including service-epoch invalidation of
  every unconsumed intent/receipt and completed-operation idempotent recovery;
- current Free-plan or missing Action/factor configuration denial with a typed
  operator readiness reason rather than a user login loop;
- TOTP loss with a valid recovery code and loss without one;
- same-origin/CSRF denial and wrong-purpose denial for every frozen sensitive-
  operation purpose ID;
- same-user process invocation accepted as the declared boundary, while other
  Windows user, wrong SID pipe, remote/cloud placement, pipe squatting, stale
  service generation, unsigned/wrong bridge or service image/path and
  substituted endpoint fail.

Record exact Auth0 plan/tenant/client/Action revisions, redacted factor-event
trace, provider subject reference, intent and receipt timestamps, session/grant
and device revisions, signed executable and service hashes, pipe identity,
Codex build, expected/actual outcome and first divergence. No reusable factor,
recovery, token, cookie or client-grant secret enters evidence.

The [independent acceptance review](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-d02-account-security-independent-acceptance-303.md)
returned PASS after the initial-link bootstrap, factor predicates, restart rule,
protected purposes and endpoint boundary were made exact.

**Specification decision:** these terms resolve D02's product and security
choices after independent review. They do not prove the current code, tenant or
installed journey. A review finding that OTP/Action event evidence, provider
recovery, pricing or the named-pipe boundary cannot meet this contract reopens
D02. CFP-2 remains blocked until CFP-1's full exit, and later installed evidence
is required before FC-02 or account-management CTAs can become public.
