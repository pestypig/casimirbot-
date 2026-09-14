Program gate: G8 — environment-harness release evaluation.
Workstream: CS1/CS4 recovery within the continuous-session prerequisite.
Capability or component: shared Ready up durable goal recovery after idle player credential expiry.
Lifecycle stage: evidence re-entry.
Reaction timescale: explicit readiness request with current exact perception.
Authority owner: Codex requests recovery; Helix checks exact identity and existing finite human authority; no gameplay is dispatched.
Current maturity: specified for this repair.
Target maturity: deterministically verified recovery and separately evidenced packaged development rehearsal.
Required evidence: real-ledger red/green reproduction, same-consent epoch-only recovery, unchanged healthy retries, rejected identity/authority drift and user stops, fresh evidence and revision checks, focused regressions, discipline and documentation audits, package comparison and native rehearsal.
Explicit non-goals: no permission renewal, goal replacement, consent automation, gameplay, private agent loop, ET6 acceptance or NAV1 qualification.
Downstream gate unlocked: further CS1-CS4 development rehearsal only.

# Idle controller epoch recovery

The [work program](../helix-environment-harness-work-program-v1.md) remains the
sole roadmap. Preserve all [CS1-CS5](eh-g8-et6-continuous-session-build-v1.md)
and [O1-O6](eh-g8-cs-onboarding-pairing-plan-v1.md) exits.

## Frozen reproduction

[Packaged retry evidence](../evidence/eh-g8-et6-continuous-session-build-v1/2026-09-14-ready-up-retry-native.json)
records three successful delayed Ready up requests with unchanged goal and
authority. Subsequently the one-hour player transport credential expired.
Supported pairing restored the controller under the same active authority,
changing the action producer epoch. Native and MCP Ready up then returned
`durable_goal_authority_stale`; the existing goal remained active at revision 1
with no recovery event. No movement was attempted.

## Repair contract

An active goal with no recorded recovery may enter the existing fixed recovery
lifecycle only when authenticated current identity proves that its producer
epoch alone changed. Preserve every other identity field except the current
request's turn ID, including exact account, participant, device, installation,
room, source, world, player, run, authority ID, policy version and deadline.
Require fresh exact perception before writing recovery state. Append one
revision-checked `connector_epoch_changed` recovery event and use the existing
rebound, identity-only checkpoint and resume steps. No milestone or attempt is
completed by this operation. Healthy repeats must append nothing.

The internal ledger append accepts an expected current identity for this
recovery composition and checks it inside its existing transaction. A changed
identity at any write rejects that write; already committed recovery steps
remain visible and the goal remains recovering. This precondition is not a
public tool argument or a source of new authority.

Continue to reject unavailable/revoked/expired authority, changed scope,
stale evidence, binding revocation, revision conflicts and user stops. Do not
relax temporal admission or inject a recovery event into production storage to
make the rehearsal pass. Any unresolved concurrency or live failure remains
explicit evidence and prevents acceptance.

## Verification boundary

First reproduce against isolated pg-mem storage with the real durable ledger,
reducer and evidence validation. Connector identity and sensor readers remain
fixture ports; these tests do not prove physical sensing. Then rebuild and
compare package content, recover the existing accepted pairing through supported
workflows, verify native and MCP recovery, and retain all unchanged CS5 rows.
The original ET6 acceptance and NAV1 gate remain separate and unpassed.

## Packaged first divergence (2026-09-14)

The rebuilt package retained the accepted pairing and finite four-capability
authority, but native and MCP recovery still rejected evidence before any goal
event was appended. The immutable native-failure record preserves this result.
Source and actual probe inspection also exposed distinct sensor game-tick and
broker observation revisions: recovery used the former while the production
ledger evidence resolver used the latter. Existing composition fixtures hid the
difference. Add real broker-normalization-to-ledger recovery coverage before
changing that boundary. Preserve both revision meanings and the five-second
freshness limit. Measure and reduce unnecessary collection latency; do not infer
the exact expired substage from total request duration or widen admission windows.

The actual broker-to-ledger fixture now reproduces a recovery revision mismatch
and passes when recovery references the broker revision while retaining the
distinct sensor revision in the probe. Also require readiness presentation to
expire at the original observation deadline, including expiration during the
final binding check. A healthy preparation needs one complete fresh collection;
recollect after a subject repair or goal recovery, without duplicating the
unchanged pre-repair collection. Retain final binding, identity and expiry checks.
