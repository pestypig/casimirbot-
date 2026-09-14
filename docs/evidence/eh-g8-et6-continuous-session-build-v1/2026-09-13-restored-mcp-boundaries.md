# Restored MCP transport and remaining admission boundaries

Classification: evidence normalization; authenticated supported MCP diagnostics.

After the status-recovery package launch, authenticated supervisor presence
registration succeeded at 18:51:09 UTC for the exact continuation
`codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d`.
Service instance: `service_instance:3abb9e60bfa7132f4183a803815918b5`.
Client session: `supervisor_client:be3b9e57484a890528d9ac1feba34622`.
The receipt verified the profile and MCP client server-side; the exact task
continuation remains client-declared, not provider task attestation. Presence was
finite (180 seconds), with no room, run, environment or execution resource claims.

Supported follow-up calls returned:

- Ready up `read_preparation`: `insufficient_scope`, requiring
  `helix.environment_actions.write`; no preparation result was read.
- Destination registration, request
  `cs-onboarding-20260913-status-recovery-destination-01`, requested 28800 seconds:
  `pairing_registration_device_trust_required`; no durable registration succeeded.
- Device Check at 18:51:52 UTC: succeeded with an empty device list.

Inspection of authenticatedPairingDestination shows the registration error covers
missing installation identity, absent/untrusted device readiness, missing account
session readiness, or missing agent-account binding readiness. The generic error
does not independently establish which of those checks failed. Do not direct the
operator to repeat device consent solely from this error or infer OAuth success
from authenticated supervisor presence.

This supersedes the old transport-unavailable observation only for these current
calls. No prior claim or pairing was reused. It does not establish authenticated
gameplay, current connector readiness, actual-host delivery, exact-chat acceptance,
or an authoritative answer to a gameplay prompt.

CS5 supplement: retain every requirement and matrix row in
`2026-09-13-oauth-recovery-cs5-reconciliation.md`. CS1.2 now has successful current
authenticated MCP presence but lacks the complete task/chat/run/source/player/
lease/goal chain. O3 still lacks actual provider delivery/acceptance. CS4.4 now
includes the status-read source repair in the launched package, documented in
`2026-09-13-status-recovery-packaged-launch.md`; the companion and integrated
workflow remain unqualified. All other original exits remain incomplete without
promotion. CS5 handoff is recorded incrementally, not accepted as completion.
ET6 remains unpassed and NAV1 unqualified.
