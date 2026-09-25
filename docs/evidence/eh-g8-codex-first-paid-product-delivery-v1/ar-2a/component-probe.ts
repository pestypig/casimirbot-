import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { RoomReadGrantLifecycle, type TrustedProfileConnection } from "../../../../server/services/environment-connectors/profiles/room-read-grant-lifecycle";
import { HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS } from "../../../../shared/helix-shared-realtime-room";

// Offline evidence probe: trusted identities and observations are synthetic.
// No authentication, room DB, provider, mission reasoning or native action.
const scenario = JSON.parse(readFileSync(new URL("./scenario.json", import.meta.url), "utf8"));
const CREATED = "2026-09-21T12:00:00.000Z";
const NOW = "2026-09-21T12:01:00.000Z";
const EXPIRES = "2026-09-21T13:00:00.000Z";
const CAP = "com.casimirbot.environment.status.read";
const connection: TrustedProfileConnection = {
  connectionRef: "profile_connection:ar2-dan",
  ownerProfileRef: "profile:dan",
  installedNodeRef: "device:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  environmentRef: "environment:ar2-course",
  sourceRef: "source:ar2-course",
  producerEpochRef: "epoch:ar2:1",
  capabilityIds: [CAP], status: "active", policyRevision: 1, updatedAt: CREATED,
};
let reads = 0;
const lifecycle = new RoomReadGrantLifecycle({
  participants: [
    ...scenario.humans.map((p: { participantRef: string; profileRef: string }) => ({
      participantRef: p.participantRef, profileRef: p.profileRef, roomIds: [scenario.room],
    })),
    { participantRef: "participant:outsider", profileRef: "profile:outsider", roomIds: [scenario.otherRoom] },
  ],
  connections: [connection],
  drivers: [{
    connectionRef: connection.connectionRef, capabilityId: CAP,
    read: () => {
      reads++;
      return { observedAt: NOW, freshnessDeadline: EXPIRES,
        facts: [{ fact_ref: "fact:left-restricted", key: "course.left_restricted", value: true, source_method: "mock_fixture" }] };
    },
  }],
});
const checks: Array<{ name: string; status: string; detail?: string }> = [];
const check = (name: string, run: () => void) => {
  try { run(); checks.push({ name, status: "pass" }); }
  catch (error) { checks.push({ name, status: "fail", detail: String(error) }); }
};
const deny = (fn: () => unknown, code: string) => assert.throws(fn, (e: unknown) =>
  typeof e === "object" && e !== null && "code" in e && e.code === code);
const grantInput = { ownerParticipantRef: "participant:dan", roomId: scenario.room,
  connectionRef: connection.connectionRef, installedNodeRef: connection.installedNodeRef,
  capabilityIds: [CAP], createdAt: CREATED, expiresAt: EXPIRES };
const grant = lifecycle.createGrant(grantInput);
const request = { requestingParticipantRef: "participant:sam", roomId: scenario.room,
  grantRef: grant.grant_ref, connectionRef: connection.connectionRef,
  installedNodeRef: connection.installedNodeRef, capabilityId: CAP, now: NOW };

check("production room capacity remains two; fixture does not create a three-person room", () =>
  assert.equal(HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS, 2));
check("three synthetic profiles are distinct", () =>
  assert.equal(new Set(scenario.humans.map((p: { profileRef: string }) => p.profileRef)).size, 3));
check("Alex cannot grant Dan's connection", () =>
  deny(() => lifecycle.createGrant({ ...grantInput, ownerParticipantRef: "participant:alex" }), "room_read_owner_mismatch"));
const sam = lifecycle.executeRead(request);
const alex = lifecycle.executeRead({ ...request, requestingParticipantRef: "participant:alex" });
check("same room grant preserves separate Sam and Alex observation attribution", () => {
  assert.equal(sam.requesting_profile_ref, "profile:sam");
  assert.equal(alex.requesting_profile_ref, "profile:alex");
  assert.notEqual(sam.observation_ref, alex.observation_ref);
  assert.equal(sam.source_ref, connection.sourceRef);
  assert.equal(sam.producer_epoch_ref, connection.producerEpochRef);
  assert.equal(sam.commands_executed, 0);
  assert.equal(sam.mutation_authority, false);
  assert.equal(sam.terminal_eligible, false);
});
check("outsider cannot read original room", () =>
  deny(() => lifecycle.executeRead({ ...request, requestingParticipantRef: "participant:outsider" }), "room_read_participant_not_in_room"));
check("outsider cannot substitute their room into original grant", () =>
  deny(() => lifecycle.executeRead({ ...request, requestingParticipantRef: "participant:outsider", roomId: scenario.otherRoom }), "room_read_grant_wrong_room"));
check("wrong node is denied before read driver", () => {
  const before = reads;
  deny(() => lifecycle.executeRead({ ...request, installedNodeRef: "device:wrong" }), "room_read_connection_node_mismatch");
  assert.equal(reads, before);
});
check("expired grant is denied", () =>
  deny(() => lifecycle.executeRead({ ...request, now: EXPIRES }), "room_read_grant_expired"));
check("tampered observation cannot re-enter", () =>
  deny(() => lifecycle.reenterObservation({ observation: { ...sam, room_id: scenario.otherRoom },
    principalRuntimeRef: scenario.principal, turnRef: "turn:ar2:1" }), "room_read_observation_invalid"));
check("exact issued observation can be projected as non-authoritative evidence", () => {
  const reentry = lifecycle.reenterObservation({ observation: sam, principalRuntimeRef: scenario.principal, turnRef: "turn:ar2:1" });
  assert.equal(reentry.observation_ref, sam.observation_ref);
  assert.equal(reentry.answer_authority, false);
  assert.equal(reentry.mutation_authority, false);
});
// Characterize, do not approve: the helper trusts the caller's principal reference.
const otherPrincipalProjection = lifecycle.reenterObservation({
  observation: sam, principalRuntimeRef: scenario.otherPrincipal, turnRef: "turn:ar2:foreign",
});
lifecycle.revokeGrant({ ownerParticipantRef: "participant:dan", roomId: scenario.room,
  grantRef: grant.grant_ref, revokedAt: NOW });
check("revoke prevents new reads", () =>
  deny(() => lifecycle.executeRead(request), "room_read_grant_inactive"));
const historicalProjection = lifecycle.reenterObservation({
  observation: sam, principalRuntimeRef: scenario.principal, turnRef: "turn:ar2:after-revoke",
});
const limitations = [
  { name: "principal_binding_not_verified_here", observed: otherPrincipalProjection.principal_runtime_ref === scenario.otherPrincipal,
    meaning: "Exact observation integrity is checked, but caller-selected principal is accepted. This probe cannot establish room/principal/mission authorization." },
  { name: "historical_observation_projection_after_revoke", observed: historicalProjection.exact_observation_reentered,
    meaning: "Previously issued observation still projects after read grant revocation. Caller must decide current context-release permission; this is not a new read or effect." },
  { name: "mission_revision_not_an_input", observed: true,
    meaning: "reenterObservation takes observation, principalRuntimeRef and turnRef. Mission-revision validation must be proven in a qualified caller path." },
];
const report = { schema: "casimirbot.ar2a.component-evidence.v1", synthetic: true,
  runtime_acceptance: false, api_calls: 0, native_effects: 0,
  checks, limitations, mock_driver_reads: reads,
  scope: "RoomReadGrantLifecycle and capacity constant only; three profiles injected as trusted fixture data, no real authentication or capacity change.",
  expected_only_steps: scenario.expectedOnly,
};
writeFileSync(fileURLToPath(new URL("./component-results.json", import.meta.url)), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ checks: checks.length, passed: checks.filter(x => x.status === "pass").length,
  failed: checks.filter(x => x.status === "fail"), limitations, mock_driver_reads: reads }, null, 2));
if (checks.some(x => x.status === "fail")) process.exitCode = 1;

