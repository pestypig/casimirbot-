import { beforeEach, describe, expect, it } from "vitest";
import { HELIX_ROOM_SOURCE_NAMESPACE_RESERVED_ERROR } from "@shared/helix-room-source-ingress";
import {
  listObservationJournalEntries,
  appendObservationJournalEntry,
  resetObservationJournalForTest,
} from "../services/situation-room/observation-journal-store";
import {
  listProfileLiveSources,
  recordProfileLiveSource,
  resetProfileLiveSourcesForTest,
  resolveProfileMinecraftSource,
} from "../services/situation-room/profile-source-registry";
import {
  acceptSourceBindingRepairCandidate,
  appendSourceBindingStatusLedger,
  attachSourceToSituationRun,
  createSourceBindingRepairCandidate,
  getSourceBindingStatus,
  listSourceBindingRepairCandidates,
  listSourceBindingStatusLedger,
  listSourceBindingStatuses,
  observeSourceBindingState,
  recordObservedUnboundSource,
  replayUnboundEvidenceThroughRepair,
  resetSourceBindingStatusForTest,
  upsertSourceBindingStatus,
} from "../services/situation-room/source-binding-status-store";
import { resetSituationSourceBindingsForTest } from "../services/situation-room/situation-source-binding-store";
import {
  listPendingVisualFrameActionReplayRequests,
  listVisualFrameActionReplayResults,
  recordVisualFrameActionReplayResult,
  requestVisualFrameActionReplay,
  resetVisualFrameActionReplayStoreForTest,
  updateVisualFrameActionReplayRequestStatus,
} from "../services/situation-room/visual-frame-action-replay-store";

const RESERVED_SOURCE_ID = "source:room-ingress:authority-store-boundary";

const expectReservedSourceRejection = (write: () => unknown): void => {
  expect(write).toThrow(HELIX_ROOM_SOURCE_NAMESPACE_RESERVED_ERROR);
};

describe("reserved room-source authority store boundary", () => {
  beforeEach(() => {
    resetProfileLiveSourcesForTest();
    resetObservationJournalForTest();
    resetSourceBindingStatusForTest();
    resetSituationSourceBindingsForTest();
    resetVisualFrameActionReplayStoreForTest();
  });

  it("rejects protected profile-source writes and hides stale protected profile records", () => {
    expectReservedSourceRejection(() =>
      recordProfileLiveSource({
        profile_id: "profile:test",
        source_family: "minecraft",
        room_id: "room:test",
        source_id: RESERVED_SOURCE_ID,
        world_id: "world:test",
      }),
    );

    const source = recordProfileLiveSource({
      profile_id: "profile:test",
      source_family: "minecraft",
      room_id: "room:test",
      source_id: "source:minecraft:test",
      world_id: "world:test",
    });
    expect(source).not.toBeNull();
    expect(
      resolveProfileMinecraftSource({
        profile_id: "profile:test",
        source_id: "source:minecraft:test",
      }).resolved,
    ).toBe(true);

    source!.source_id = RESERVED_SOURCE_ID;
    expect(listProfileLiveSources("profile:test")).toEqual([]);
    expect(
      resolveProfileMinecraftSource({
        profile_id: "profile:test",
        source_id: RESERVED_SOURCE_ID,
      }),
    ).toMatchObject({
      resolved: false,
      reason: "missing_source",
      candidates: [],
    });
  });

  it("rejects protected observation writes and hides stale protected observations", () => {
    expectReservedSourceRejection(() =>
      appendObservationJournalEntry({
        thread_id: "thread:test",
        source_id: RESERVED_SOURCE_ID,
        role: "raw_source_event",
        modality: "world_event",
        text: "Protected room-source observation.",
      }),
    );

    const observation = appendObservationJournalEntry({
      thread_id: "thread:test",
      source_id: "source:generic:test",
      role: "raw_source_event",
      modality: "world_event",
      text: "Ordinary source observation.",
    });
    expect(listObservationJournalEntries({ threadId: "thread:test" })).toContain(observation);

    observation.source_id = RESERVED_SOURCE_ID;
    expect(listObservationJournalEntries({ threadId: "thread:test" })).toEqual([]);
  });

  it("rejects protected binding status, attach, repair, and replay authority writes", () => {
    expectReservedSourceRejection(() =>
      upsertSourceBindingStatus({
        thread_id: "thread:test",
        source_id: RESERVED_SOURCE_ID,
        state: "observed_unbound",
      }),
    );
    expectReservedSourceRejection(() =>
      appendSourceBindingStatusLedger({
        thread_id: "thread:test",
        source_id: RESERVED_SOURCE_ID,
        source_kind: "minecraft_world_events",
        to_state: "observed_unbound",
        event_kind: "source_observed_unbound",
        reason: "protected source",
      }),
    );
    expectReservedSourceRejection(() =>
      recordObservedUnboundSource({
        threadId: "thread:test",
        sourceId: RESERVED_SOURCE_ID,
        modality: "world_event",
      }),
    );
    expectReservedSourceRejection(() =>
      observeSourceBindingState({
        threadId: "thread:test",
        sourceId: RESERVED_SOURCE_ID,
        modality: "world_event",
      }),
    );
    expectReservedSourceRejection(() =>
      createSourceBindingRepairCandidate({
        threadId: "thread:test",
        sourceId: RESERVED_SOURCE_ID,
        sourceKind: "minecraft_world_events",
      }),
    );
    expectReservedSourceRejection(() =>
      attachSourceToSituationRun({
        threadId: "thread:test",
        sourceId: RESERVED_SOURCE_ID,
        sourceKind: "minecraft_world_events",
        situationRunId: "situation_run:test",
      }),
    );

    const candidate = createSourceBindingRepairCandidate({
      threadId: "thread:test",
      sourceId: "source:minecraft:repair",
      sourceKind: "minecraft_world_events",
      targetSituationRunId: "situation_run:test",
    });
    candidate.source_id = RESERVED_SOURCE_ID;

    expect(listSourceBindingRepairCandidates({ threadId: "thread:test" })).toEqual([]);
    expectReservedSourceRejection(() =>
      replayUnboundEvidenceThroughRepair({
        repairCandidateId: candidate.repair_candidate_id,
        bindingId: "source_binding:test",
      }),
    );
    expectReservedSourceRejection(() =>
      acceptSourceBindingRepairCandidate({
        repairCandidateId: candidate.repair_candidate_id,
        replayPolicy: "future_only",
        targetSituationRunId: "situation_run:test",
      }),
    );
  });

  it("filters stale protected binding status and ledger records while preserving ordinary attach", () => {
    const status = upsertSourceBindingStatus({
      thread_id: "thread:test",
      source_id: "source:generic:status",
      source_kind: "visual_capture",
      modality: "visual_frame",
      state: "observed_unbound",
    });
    expect(getSourceBindingStatus(status.status_id)).toBe(status);
    status.source_id = RESERVED_SOURCE_ID;
    expect(getSourceBindingStatus(status.status_id)).toBeNull();
    expect(listSourceBindingStatuses({ threadId: "thread:test" })).toEqual([]);

    const ledgerEntry = appendSourceBindingStatusLedger({
      thread_id: "thread:test",
      source_id: "source:generic:ledger",
      source_kind: "visual_capture",
      to_state: "observed_unbound",
      event_kind: "source_observed_unbound",
      reason: "ordinary source",
    });
    ledgerEntry.source_id = RESERVED_SOURCE_ID;
    expect(listSourceBindingStatusLedger({ threadId: "thread:test" })).toEqual([]);

    const attached = attachSourceToSituationRun({
      threadId: "thread:test",
      sourceId: "source:generic:attached",
      sourceKind: "visual_capture",
      modality: "visual_frame",
      situationRunId: "situation_run:test",
    });
    expect(attached).toMatchObject({
      source_id: "source:generic:attached",
      state: "bound",
      terminal_eligible: true,
    });
  });

  it("rejects protected replay requests and results, including stale request authority", () => {
    expectReservedSourceRejection(() =>
      requestVisualFrameActionReplay({
        thread_id: "thread:test",
        source_id: RESERVED_SOURCE_ID,
      }),
    );
    expectReservedSourceRejection(() =>
      recordVisualFrameActionReplayResult({
        replay_request_id: "visual_frame_action_replay:missing",
        source_id: RESERVED_SOURCE_ID,
      }),
    );

    const request = requestVisualFrameActionReplay({
      thread_id: "thread:test",
      source_id: "source:visual:stale-request",
    });
    request.source_id = RESERVED_SOURCE_ID;
    expectReservedSourceRejection(() =>
      updateVisualFrameActionReplayRequestStatus({
        replayRequestId: request.replay_request_id,
        status: "running",
      }),
    );
    expectReservedSourceRejection(() =>
      recordVisualFrameActionReplayResult({
        replay_request_id: request.replay_request_id,
        source_id: "source:visual:benign-alias",
      }),
    );
    expect(listPendingVisualFrameActionReplayRequests({ threadId: "thread:test" })).toEqual([]);
  });

  it("preserves ordinary replay flow and hides stale protected replay results", () => {
    const request = requestVisualFrameActionReplay({
      thread_id: "thread:test",
      source_id: "source:visual:ordinary",
      shade_profile_ids: ["profile:science"],
    });
    const recorded = recordVisualFrameActionReplayResult({
      replay_request_id: request.replay_request_id,
      source_frame_id: "visual_frame:source",
      replay_frame_id: "visual_frame:replay",
      evidence_id: "visual_evidence:replay",
      status: "completed",
    });
    expect(recorded.result.source_id).toBe("source:visual:ordinary");
    expect(recorded.request?.status).toBe("completed");
    expect(
      listVisualFrameActionReplayResults({
        replayRequestId: request.replay_request_id,
      }),
    ).toContain(recorded.result);

    recorded.result.source_id = RESERVED_SOURCE_ID;
    expect(
      listVisualFrameActionReplayResults({
        replayRequestId: request.replay_request_id,
      }),
    ).toEqual([]);
  });
});
