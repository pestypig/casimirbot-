# AR-2B1 first implementation slice — 2026-09-21

The [AR-2B1 packet](../../../work-packets/eh-g8-ar2b1-external-mission-association-v1.md)
and [canonical work program](../../../helix-environment-harness-work-program-v1.md)
admit this exact developer-only change.

**Implemented:** the authenticated browser Ready up path now checks the durable
goal's owner profile, room, goal owner participant, current participant and run
against the freshly verified external task/run association. It rejects an
invalid revision before requesting the first environment observation. The
typed `environment_session_goal_identity_mismatch` response has no readiness,
execution or answer authority.

This closes a component-level gap: a goal lookup whose returned record is
stale or substituted cannot enter the read-only preparation path merely
because it was queried with the correct room arguments. The pre-existing
Ready up procedure still revalidates the task/run association during setup
and after observations.

[Implementation](../../../../server/services/environment-connectors/session/prepare-browser-session.ts)
and [focused tests](../../../../server/services/environment-connectors/session/__tests__/prepare-browser-session.test.ts)
cover wrong owner, room, goal owner participant, participant, run and invalid
revision. Each denial happens before `observe`, `prepare` or subject refresh.
The existing valid preparation, replay, recovery, revoked authority and stale
task tests remain in the same suite.

**Validation:** focused Ready up plus task-binding battery: 63/63 PASS.
Environment harness docs audit PASS, G8 active; Helix Ask discipline quick
classified no sensitive Helix Ask files. The server build passed. Whole-repo
typecheck exhausted Node's 4 GB heap before diagnostics; its verdict remains
unverified. The exact check outcomes are recorded in
[validation.json](validation.json).

**Boundary:** this does not bind a GPT Live transcript to the external task,
select an external task on behalf of three room members, deliver the
task's decision back to the room, or enforce a mission revision at worker
result return. The task binding's `mission_id` may be null in the existing
personal Ready up flow; this patch does not relabel a durable goal ID as that
mission ID. The room remains limited to two human participants. These are the
remaining AR-2B1 and AR-2 prerequisites, not accepted behavior.

Next caller design needs an explicit owner-selected room principal, a
server-authored current mission revision, current participant consent and an
acknowledged pickup and return path. It must reject foreign room, task epoch,
run, revoked grant and late result before speech or effect. A separate
work-program admission is required before those production files change.
No model API call, native effect, credential change or billing action occurred.
