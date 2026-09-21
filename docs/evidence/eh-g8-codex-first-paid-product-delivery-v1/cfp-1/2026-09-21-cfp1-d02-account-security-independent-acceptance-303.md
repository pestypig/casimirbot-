Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.ACCOUNTS / CFP-1.POLICY D02 independent specification acceptance
Capability or component: Public Google account, linked Auth0 operation proof, finite web session, P1 grant and local stdio/IPC boundary
Lifecycle stage: independent review of identity, enrollment, recovery, renewal, revocation and sensitive-operation specification
Reaction timescale: sign-in; every grant request; immediately before sensitive mutation and native effect release
Authority owner: Product owner selected the route; independent security-specification reviewer tests completeness; CFP-2 owns configured-provider and installed proof
Current maturity: specified
Target maturity: specified with independently accepted decisions and executable positive/denial fixtures
Required evidence: D02 packet, source-gap record, official provider behavior and independent defect/re-review record
Explicit non-goals: no current-source, Auth0-tenant, credential, signed-build, named-pipe, installed-customer, support or stage acceptance
Downstream gate unlocked: D02 CFP-1 specification dependency only; CFP-2 remains blocked until the complete CFP-1 exit

# CFP-1 D02 account/security independent acceptance — 303

Date: 2026-09-21  
Review target: [D02 account/security specification](../../../work-packets/eh-g8-cfp1-d02-account-security-specification-acceptance-v1.md)  
Source boundary: [selection and source gap 302](2026-09-21-cfp1-d02-account-security-selection-and-source-gap-302.md)

## Review method

An independent review checked the selected identity, MFA, session, grant,
recovery, restart, local IPC and native-effect rules against the current source
findings and cited Auth0 behavior. The first pass was conditional and the next
pass failed closure because the packet did not yet define first OTP enrollment,
initial-link authority bootstrap or an exact recovery-code factor predicate.
The packet was revised and re-reviewed rather than accepting those gaps as
implementation details.

## Corrections required and applied

- The first Auth0 subject is now pending and non-authoritative. A durable
  `provider_link_initial` intent is bound to the active Google profile, finite
  session, installation, device generation, client, state, PKCE verifier and
  nonce.
- An unenrolled subject uses `enrollWith({type:"otp"})`; an enrolled subject and
  every later ordinary sensitive operation use exact
  `challengeWith({type:"otp"})`. A later Action signs the completed factor event.
- Link activation occurs only after factor evidence, subject-conflict checks and
  binding rechecks. `p1_initial_issue` then requires a separate fresh OTP proof.
- The exact protected-purpose set now includes initial provider link and
  authenticator enrollment as well as recovery, revoke, grant, scope, account
  and billing mutations.
- Recovery accepts only Auth0's signed
  `{name:"mfa", type:"recovery-code", timestamp}` event for
  `authenticator_recover` or `device_recover`; later high-risk mutations require
  a fresh OTP proof.
- Receipt consumption rechecks factor age and every live binding. A service-
  epoch change invalidates pending intents/receipts; only a completed durable
  operation result can be recovered idempotently.
- Public mutations require same-origin/CSRF enforcement. Every new native effect
  requires live server-authoritative account/device/grant checks at admission
  and again immediately before release.
- Signed bridge/service image and path checks, client SID, service epoch,
  first-instance and anti-squatting rules are required while malicious same-user
  code remains explicitly inside the accepted threat boundary. No Codex-process
  identity claim is made.

## Final verdict

**PASS for D02 specification acceptance.** The reviewer found no remaining
material specification defect after the corrections. D02's CFP-1 policy
dependency is closed.

This verdict does not accept current implementation or provider state. Current
source still relies on standard `auth_time`, memory-only intents/receipts,
nullable server session expiry, incomplete sensitive-purpose admission and a
same-ID recovery-generation bypass; it has no accepted P1 grant issuer,
`--mcp-stdio-personal` path or reviewed named-pipe transport. The observed Auth0
Free team does not prove the selected Pro MFA/Action/recovery configuration.
CFP-2 must supply those configured-provider and installed P1S/GP results on the
signed evaluation tuple after the parent stage admits it.

CFP-1 remains active at `specified`. D07 all-input economics, qualified D11
returns, final D12 owner freeze and independent integrated review remain open;
CFP-2 and CFP-3 remain blocked.
