Program gate: G8 (CS1 active; original ET6 remains unpassed)
Workstream: Continuous environment-session build
Capability or component: Packaged run discovery and retained-run review
Lifecycle stage: Preparation and restart recovery
Reaction timescale: Operator setup; no gameplay
Authority owner: Authenticated owner/task and existing human consent
Current maturity: As recorded in the canonical work program; no advancement claimed
Target maturity: Unchanged CS1 exit criteria
Required evidence: Indexed-history regression, focused suite, package and native review
Explicit non-goals: No new principal, consent, run replacement, gameplay or ET6 acceptance
Downstream gate unlocked: None until full CS1 exit evidence

# Packaged restart and indexed discovery boundary

The first package attempt had matching application bundles but no recovered
successful builder exit. Its EXE was 162004992 bytes and ShellExecute returned
access denied. This was not a successful package launch. A second clean output
completed electron-builder with exit 0; its 225533440-byte EXE launched normally.
Content comparison and hashes are in `2026-09-08-cs1-review-retry-package.json`.
The ordinary application appeared after service startup (the initial UI-tool
window timeout did not imply process failure).

The new keyed native service reported ready at 2026-09-08T17:05:22.221Z,
origin http://127.0.0.1:63973, service PID 38920. These are observations, not
future connection defaults. Service identity:
`service_instance:31202706e9633dcdbdbf03f49278a6fd`.
The exact continuation remained `01a081e3-1973-76a3-b35b-0bd6d541933d`;
its server-derived session changed to
`supervisor_client:0e193b9a2b73a2dd8b97f824c25b40f8`.

The transport initially restored read-only scope. Ready up returned
insufficient_scope; authorization inspection was not in that scoped server
catalog. The ordinary Refresh harness connection control reused the device's
existing Full Harness trust. g2-action then reported all required scopes and
expiry 2026-09-08T18:08:04.821Z. No new device consent or game permission was
clicked. No user reconnect was requested.

The retained run `run_69cb152a-dcb9-40ff-a988-d95e75acacff` and room binding
`agent_room_binding:a91bedfe-399b-4087-a89c-4c2932fb610b` survived restart,
version 1, zero steps used, deadline 2026-09-08T17:43:50.629Z. Republishing
explicit read/retained-runtime resource claims through authenticated presence
revalidated both identities at 17:11:31.487Z. Merely publishing advisory room
and run refs did not verify them. No old task identity or claim was reused.

MCP discover_runs still returned internal_error while room.inspect succeeded.
An offline diagnostic loaded only relevant durable tables into a separate
in-memory database with the real migrations; it reproduced `lookups on joins`.
No running database or principal was modified. A fresh regression with 18
fixture runs (16 expired) reproduced the same failure. The nullable optional
run filter's OR triggers the indexed pg-mem join limitation. Omitting that
predicate when no run is requested, and retaining a parameterized equality
when one is requested, passes the regression. All owner, membership, consent,
run lifecycle and deadline predicates remain in the same query; the two-row
ambiguity limit remains after eligibility filtering. This is evidence
normalization/query compatibility, not a new authority policy.

At this snapshot the focused broader suite is running, and the discovery fix
is not in the running package. Native exact-run binding review and all gameplay
criteria remain unverified. No human-only approval has been requested or
performed. CS1–CS4 and CS5 remain incomplete; ET6 unpassed and NAV1 gated.
