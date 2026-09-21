Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.ACCOUNTS / CFP-1.POLICY D02 specification acceptance
Capability or component: Public Google account, linked Auth0 operation proof, finite web session, P1 grant and local stdio/IPC boundary
Lifecycle stage: identity, enrollment, recovery, renewal, revocation and sensitive-operation admission specification
Reaction timescale: sign-in; every grant request; immediately before sensitive mutation and native effect release
Authority owner: Product owner selects the journey; account/security owner accepts the proof contract; CFP-2 implements and proves it
Current maturity: specified
Target maturity: specified with independently reviewed decisions and executable positive/denial fixtures
Required evidence: current source hashes, official provider behavior, reviewed D02 decision and later configured-provider/installed P1S/GP traces
Explicit non-goals: no Auth0 upgrade/configuration, credential enrollment, runtime/database/Codex setting, production secret, support claim or stage promotion
Downstream gate unlocked: D02 specification dependency after independent review; no CFP-2 admission until CFP-1's complete exit

# CFP-1 D02 account/security selection and source gap — 302

Date: 2026-09-21  
Repository commit observed: `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93`

## Decision recorded

The [D02 account/security specification](../../../work-packets/eh-g8-cfp1-d02-account-security-specification-acceptance-v1.md)
selects the following first-cohort contract under the owner's standing direction
to apply recommended choices:

- Google resolves ordinary account identity by verified provider `sub`; email
  equality never merges authority.
- The public web session has a seven-day absolute server expiry and never slides
  on reads.
- An explicit Authorization Code + PKCE, state and nonce flow creates a pending,
  non-authoritative Auth0 subject bound to the current Google-owned profile,
  session and installation. OTP enrollment or challenge proof and a conflict
  recheck precede atomic link activation; P1 initial issuance happens afterward
  under its own fresh OTP proof.
- TOTP is the first supported sensitive-operation MFA factor. When the Auth0
  tenant recovery-code feature is enabled, enrollment supplies the value only
  to the user; the first cohort requires that feature to be enabled. CasimirBot
  never receives, stores, logs or acknowledges the actual TOTP secret or
  recovery-code value.
- A dedicated Auth0 client, Post-Login Action v3 and enabled Customize MFA
  Factors using Actions feature must cause and attest a new OTP MFA event for
  the exact client, ACR and operation. An unenrolled initial link uses
  `enrollWith({type:"otp"})`; an already-enrolled initial link and later
  sensitive operations use `challengeWith({type:"otp"})`. A subsequent Action
  signs the latest post-event `{name:"mfa", type:"otp", timestamp}` claim,
  never ordinary primary-session `auth_time` alone. If enrollment cannot yield
  that event, the link stays pending until a separate OTP challenge succeeds.
- The factor event is tied to the pending operation intent, allows five seconds
  of clock tolerance, is at most five minutes old at operation consumption and
  produces a two-minute, single-use, purpose/target/profile/session/device-
  generation/service-epoch-bound receipt.
- P1 grants last at most 30 days per installation and named client profile;
  same-scope renewal is limited to the final seven days with current bindings.
- Re-enrollment/recovery advances `recovery_generation` and fences every prior
  grant. New enrollment, recovery, remote revoke, provider-link changes, scope
  expansion, account deletion and payment/subscription management require the
  operation-bound factor receipt.
- Exact protected-purpose IDs are `provider_link_initial`,
  `provider_link_change`, `authenticator_enroll`, `authenticator_recover`,
  `device_register`, `device_recover`, `device_revoke`, `session_revoke`,
  `p1_initial_issue`, `p1_recover`, `p1_scope_expand`, `account_delete` and
  `billing_manage`. The provider-reported signed
  `{name:"mfa", type:"recovery-code", timestamp}` method can serve only
  `authenticator_recover` or `device_recover`; the other high-risk mutations
  require `type:"otp"`. Public mutations also enforce same-origin/CSRF.
- The first local transport is the same signed EXE in
  `--mcp-stdio-personal` mode over an owner-SID ACL Windows named pipe. Processes
  running as the same signed-in Windows user are inside the declared trust
  boundary; no claim identifies the Codex UI process cryptographically.
- Enrollment, renewal and effects fail closed when authority cannot be checked.
  There is no general offline-effect promise. Independently enforceable local
  stop and outcome inspection remain truthful during an outage.
- A service-epoch change invalidates every unconsumed intent and receipt. A
  completed mutation can be recovered only by its durable idempotency record;
  authorization itself is never recovered after restart.

The selected provider route requires a proven Auth0 plan/tenant/client/Action
configuration that includes the exact MFA behavior. The current observed Free
team is not accepted. D07 therefore retains the public Essentials `$35/month`
plus tax/capacity cost branch until an authorized account read proves the actual
eligible terms. No upgrade or provider change was made.

## Current-source boundary

The following SHA-256 values bind this read to mutable source:

| Source | SHA-256 | Finding |
| --- | --- | --- |
| `shared/desktop-auth0-step-up.ts` | `E7889E0BDE2334E671EEC5F6D838DC81ECF988467519C0A9D031E62959EF069F` | Current purpose and native request schema do not express the complete first-cohort sensitive-operation surface. |
| `server/services/helix-account/auth0-step-up.ts` | `DBD6E7B9DE29EB85EDD1A24A9C74F1BF80E2CEEF941AD5C41909FEB28A3CC5D1` | Verifier checks `acr`, `amr` and standard `auth_time`; it does not prove a new MFA factor event occurred after the operation intent. Pending intents are process-local memory. |
| `server/services/helix-account/auth0-step-up-receipt-store.ts` | `6D81875D05CAE5BCC3405221DE5CF276C0C1003411E909E361531631F659856D` | Step-up receipts are process-local memory rather than a durable hash/operation ledger. |
| `server/routes/desktop-auth0-step-up.ts` | `03ED34FDD8159A8C2581FD5DD2272C5DE652EF7B4C82CE0A882F309976DE14A7` | Current admission is `developer` plus `installed_service_management`, not the ordinary-user P1 route. |
| `auth0/actions/casimirbot-post-login.cjs` | `199DA896BA965240EA471BFC4AC8895B276A263CA566C307AF415099DE2DA2BF` | Current Action calls `api.multifactor.enable("any")`; it neither requires OTP nor emits a signed post-challenge MFA-event timestamp. |
| `server/services/helix-account/installed-security-store.ts` | `5BF7884B4A4F509D980908819DD131A67E912CCF3F2AB14EC979BBDFFDD5867B` | Same-ID registration can reactivate a revoked/recovery row without incrementing `recovery_generation`; explicit recovery does increment it. |
| `server/services/helix-account/account-session-store.ts` | `29FC227AAB9E46F95C89BB2D12EA3D1E96C190C5328A625270D863DD7C1BB7A2` | Existing account sessions can have null expiry; public sessions therefore need migration or rejection under the selected absolute-expiry rule. |
| `server/services/helix-account/session-cookie.ts` | `B42DF13FE56FCC95213D6509CD86F7C7BEBC11DE50DA412F156F3E27074E4CE2` | A seven-day cookie default does not create the selected authoritative server expiry. |
| `server/routes/account-session.ts` | `B7799A594D6166AAA44D963A7AAE998C1F5C8407490971CF42571D682F8231D3` | Current profile deletion is account-cookie authorized and lacks the selected `account_delete` operation-bound step-up. |
| `apps/desktop/src/main.ts` | `90840BCF957B9D85E20277A75734CF51C1364A0066E46F30C3D40BBF52240B18` | No `--mcp-stdio-personal` early protocol-mode path exists; current launch enters the GUI/single-instance lifecycle. |

These are implementation gaps, not reasons to weaken the specification. CFP-2
must implement and prove the configured-provider, durable-store, recovery-
generation, ordinary-user, executable-mode and IPC boundaries on the selected
signed evaluation tuple.

## Provider sources and implications

- Auth0's [current plan comparison](https://auth0.com/pricing) lists the Free
  tier separately from Essentials and shows Pro MFA in the paid comparison. The
  observed owner tenant remains an account-specific input; public pricing does
  not prove its contract or capacity.
- Auth0 documents [OTP enrollment and recovery-code challenge behavior](https://auth0.com/docs/secure/multi-factor-authentication/authenticate-using-ropg-flow-with-mfa/enroll-and-challenge-otp-authenticators).
  The configured Universal Login journey still needs an ordinary-user trace.
- Auth0 explains that the older `api.multifactor.enable` path can omit the MFA
  authentication method during first login and documents
  [`challengeWith` and `challengeWithAny`](https://support.auth0.com/center/s/article/using-actions-mfa-authentication-method-is-missing-on-first-login)
  when subsequent Actions must observe the method. The selected single-factor
  route uses exact `challengeWith({type:"otp"})`.
- Auth0 documents [Action prerequisites for the challenge API](https://support.auth0.com/center/s/article/api-authentication-is-undefined-in-post-login-action),
  including the current Post-Login Action runtime and tenant feature dependency.
- Auth0 documents the distinct [`enrollWith` and `challengeWith` flows](https://support.auth0.com/center/s/article/Action-triggered-MFA-using-enrollWith-and-challengeWith).
  The initial bootstrap therefore branches on existing OTP enrollment and keeps
  the Auth0 link pending until the later Action exposes the completed event.
- Auth0 documents [signed custom ID-token claims from Actions](https://support.auth0.com/center/s/article/Set-ID-token-claims-using-actions).
  CFP-2 must prove the selected ordering and factor timestamp; the documentation
  alone does not prove the owner's tenant produces it.
- Auth0's [step-up authentication guidance](https://auth0.com/docs/fr-ca/secure/multi-factor-authentication/step-up-authentication)
  supports requesting stronger authentication for a protected operation. The
  CasimirBot intent, receipt, binding and atomic-consumption rules remain
  first-party requirements.
- Auth0 notes that [WebAuthn MFA availability varies by plan](https://auth0.com/docs/secure/multi-factor-authentication/fido-authentication-with-webauthn/configure-webauthn-security-keys-for-mfa).
  WebAuthn is therefore outside the first support sentence rather than a silent
  substitute for the selected TOTP route.
- Auth0 documents [recovery-code challenge and replacement behavior](https://auth0.com/docs/secure/multi-factor-authentication/authenticate-using-ropg-flow-with-mfa/challenge-with-recovery-codes).
  Auth0's [Universal Login enrollment documentation](https://auth0.com/docs/secure/multi-factor-authentication/customize-mfa/customize-mfa-enrollments-universal-login)
  identifies `recovery-code` as an MFA event `type`; the first cohort restricts
  that exact provider-reported type to the two enumerated recovery purposes and
  requires a fresh OTP proof before later high-risk mutations.

## Stage conclusion

This evidence records a complete D02 **specification selection** and its current
source gaps. It does not accept the current code, provider configuration,
ordinary-user journey, named-pipe transport or recovery path. Independent
security review is required before the specification dependency is treated as
closed. CFP-1 remains active at `specified`; CFP-2 and CFP-3 remain blocked.
