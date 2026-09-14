# Continuous-session handoff after accepted pairing and root motion

Recorded 2026-09-14, following observations through 14:38:15Z and the isolated
association reconstruction test at 14:41Z. G8 remains active. No complete
CS1–CS4 or O1–O6 stage is claimed. Original ET6 remains unpassed; NAV1 still
requires the separate NAV-EQ qualification. Follow the
[work program](../../helix-environment-harness-work-program-v1.md),
[continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md),
[onboarding packet](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md), and
[read-cost repair packet](../../work-packets/eh-g8-cs3-durable-binding-read-cost-v1.md).
The [preceding handoff](2026-09-14-expired-pairing-review-cs5-handoff.md) remains
an immutable snapshot; its pending human-pairing statement is now superseded.

The user approved the exact task/chat/run invitation. This task accepted the
actual invitation at 14:06:34.062Z, without impersonation or automatic consent.
Pairing `pairing:88fe3e2d-5217-40f6-8214-43237cb58915` remains accepted until
22:00:36.357Z. Agent-origin prompt submission, exact pickup and acknowledgement
succeeded; the EXE visibly displayed the prompt with its agent-origin label.
The same durable goal recovered from revision 14 to 18 through verified epoch
rebound/checkpoint/resume events. Three automatic Ready up calls on the preceding
package succeeded, with no repairs on the last two and no permission renewal.
See [pairing and ingress](2026-09-14-new-run-pairing-accepted.json) and the third
repeated call retained in the [runtime supplement](2026-09-14-pairing-read-cost-runtime.json).

The third root submission was admitted but missed the frozen start deadline
before any motion: about 5,507 ms from planning clock to resident start.
The native encrypted pairing fixture reproduced eight full snapshot writes for
eight unchanged reads. The repair reuses successful unchanged snapshot coverage;
it still decrypts and validates the current grant on each admission, invalidates
coverage after mutations, and rejects uncertain persistence. Mutation
acknowledgements retain their strict barrier. This is persistence evidence
normalization/source admission, with no changed physics or adapter contract.

The new package's distinct fourth root succeeded under the original budgets:
1,407 ms tool response, 3,201 ms planning-clock-to-start, 1,050 ms requested walk,
and required endpoint/grounded checkpoints satisfied. Fresh observation moved
from (0.18,65,2.81) to (-2.10,65,-1.10), about 4.53 blocks, with health 20.
The 14:38:15.438Z heartbeat confirms zero active workflows and controls not held.
No block, inventory, combat, host, replay or model effect was reported.
This is one root baseline, not three linked successors or continuous capacity.
See [attempt 3](2026-09-14-cs3-root-attempt-3-request.json),
[attempt 4](2026-09-14-cs3-root-attempt-4-request.json), and its
[bounded corridor](2026-09-14-cs3-root-attempt-4-corridor.json).

After one normal EXE close/launch, saved device trust restored Full Harness and
the same pairing recovered with its original deadline. Goal revision 18 and its
hash survived. Exact-evidence Ready up then verified all ten layers. However,
two automatic-selection Ready up calls returned generic `internal_error`;
the cause remains unresolved. The fully migrated isolated run-association query
passes before and after snapshot reconstruction, including revoked-binding
rejection. That component result does not explain the live error. Native capture
also failed twice with “foreground window did not report a process id”; no
current native UI readiness is inferred from that tooling failure.

| Requirement | Current evidence and remaining exit |
| --- | --- |
| CS1.1 Shared Ready up | Three automatic MCP calls passed on the preceding package; exact-evidence Ready up passed all ten layers after restart. Automatic selection on the current package and current native UI/MCP parity remain open. |
| CS1.2 Exact identity | Authenticated same task/client/profile/chat/room/run and player retained; actual finite invitation accepted. Current-service binding recovered from that exact grant. Complete integrated wrong-identity matrix remains required. |
| CS1.3 Idempotency | Repeated readiness preserved goal 18, run revision 1 and valid authority. Snapshot fixture now writes zero times for eight unchanged acknowledged grant reads. Integrated retry/duplicate-effect matrix remains required. |
| CS1.4 Finite authority | Pairing deadline 22:00:36.357Z, player authority deadline 15:35:00.911Z and run deadline 20:14:10.898Z remain independent. Only Walk, Look, Jump and sequence are consented. Current source/player credentials must be reinspected before reuse; no expiry/revocation acceptance claim. |
| CS1.5 Durable recovery | Same goal recovered 14→18 using actual fresh evidence, then survived EXE restart unchanged. Same pairing recovered without consent or deadline extension. Full ordinary recovery and wrong-account/revocation matrix remains required. |
| CS2.1 Exact-chat ingress | New-run agent prompt submitted, read and acknowledged through the exact accepted binding; native prompt text visible. Full interaction/re-entry workflow remains required. |
| CS2.2 Scoped idempotent ingress | Existing component and replay evidence retained; exact prompt has one retained event and acknowledgement. Full integrated duplicate/reordering and zero gameplay duplicates remain open. |
| CS2.3 Origin and delivery | Visible truthful agent-origin label verified. The actual host still uses explicit copy/poll fallback; automatic provider delivery/wake is not claimed. Prompt and receipts are not answers. |
| CS3.1 Three linked successors | One actual bounded root now succeeds through production compiler, broker and resident. No three-successor live trace exists; independent walks cannot substitute. |
| CS3.2 Frozen timing | Root met unchanged 4,000 ms start, 1,050 ms requested walk, 6,000 ms stop, 7,500 ms overall and 5,000 ms perception limits. Failed attempt retained. Successor runway/latency capacity remains unmeasured. |
| CS3.3 Changed affordance and faults | Fresh yaw changed from 168.63 to 149.73 and a newly inspected corridor informed the distinct plan. This does not qualify in-flight changed-affordance, backpressure, reconnect or duplicate-effect cases. |
| CS4.1 Interruption | Root ended with released controls and current idle heartbeat. Actual operator interruption, successor invalidation and measured release remain required. |
| CS4.2 Revocation | Deterministic grant and run-binding negatives retained. Actual player-authority revocation and fresh no-motion verification remain required. |
| CS4.3 Fresh re-entry | Actual initial/final observations were re-entered and evaluated; goal epoch recovery is evidenced. Full changed-observation reasoning, interruption recovery and stale-action rejection remain required. |
| CS4.4 Package identity | 647 runtime, 636 client and eight host artifacts match; zero mismatches/extras. Known fixture scan: 828 text files, zero hits, eight positive controls. Current EXE/service/runtime/client identities below. No certificate or complete isolation proof follows from scanning. |
| CS4.5 Ordinary workflow | Accepted pairing and goal survived one EXE restart and supported transport restoration. Native capture unavailable after restart; automatic Ready up fails. Complete ordinary session, cold launcher and recovery rehearsal remains required. |
| CS5.1 Full handoff | All 17 requirements retained here with component, packaged and live scopes separated. No omitted exit or maturity promotion. Goal remains incomplete. |

O1 retains frozen failures, including current automatic Ready up and the separate
native tooling failure. O2 adds unchanged-read durability coverage and accepted
grant recovery. O3 retains truthful actual-host copy/poll fallback; supported
automatic host delivery remains unverified. O4 retains the previous expiry-review
UI repair and adds actual human invitation acceptance. O5 adds 59 focused passing
tests, five real PostgreSQL contention/transaction-termination cases, and one
additional full local-database reconstruction test. The PostgreSQL tests do not
prove database-server restart, power loss or all audit-event crash atomicity.
Earlier 44 component/eight browser and 20 real-handler browser cases retain their
stated scope and were not repeated for this server-only change. O6 adds actual
pairing, ingress, recovery and root movement; three successors, interruption,
revocation and full ordinary workflow remain open.

See [checks](2026-09-14-pairing-read-cost-checks.json),
[package comparison](2026-09-14-pairing-read-cost-package.json),
[fixture scan](2026-09-14-pairing-read-cost-fixture-scan.json), and
[runtime recovery](2026-09-14-pairing-read-cost-runtime.json).
Casimir verification was not applicable to this non-physics application patch;
no adapter or certificate integrity claim is made.

Running directory: `apps/desktop/release-pairing-read-cost-20260914/win-unpacked`.
EXE SHA256: `b6a008b0c3baa5fffaae22d78a2a9e99fe0d6da073c6266479b179fbbe1fca35`.
Service SHA256: `3b30bd985518ccfc2a8447d6bc4026ce060eec81960364f400f5f854413e609d`.
Runtime-manifest SHA256: `f1e3973cc29987f2e4dbd1a388b0c67d2f65ad64ebf83d655975b69d5da55820`.
Client `AgentConnectionSetup-HXPDdQnC.js` SHA256:
`03705a9ed70554da4d6801b2298b6a473b1d3112edbc0472e887659132ab2b30`.
Current service is `service_instance:633c0249fc13f2d6493ec1d709f78217`, PID 4452,
ready 14:25:58.429Z. Current binding is
`reasoning_binding:e150d448ec72c99c5f96176b099f48f3`, epoch 1.
Exact continuation remains `codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d`.
Run remains `run_30e7bbe7-f334-4947-88cb-2ac85db039b9`.
Goal remains `environment_durable_goal:f15854ade7a779ee48eb077b430c006184d9a24e9a9ab7520439153f5609588f`,
revision 18, hash `sha256:092f12f24227247eb297d3889e614642a76acc7af7ec88928d09ae4e20d2a29a`.

Next repair boundary: diagnose automatic Ready up's generic failure without
claiming another consent or reconnect is needed. Revalidate actual credential
and presence expiry before further live probes. Do not replay either admitted
root request, replace the valid pairing, or stretch the frozen timing budgets.
