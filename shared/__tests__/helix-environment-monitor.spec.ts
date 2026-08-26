import { describe, expect, it } from "vitest";
import {
  HelixEnvironmentMonitorContractError,
  acknowledgeHelixEnvironmentMonitor,
  createHelixEnvironmentMonitorLease,
  deliverHelixEnvironmentMonitorItems,
  helixEnvironmentMonitorLeaseSchema,
  markHelixEnvironmentMonitorRetentionGap,
  repairHelixEnvironmentMonitorWithFreshSnapshot,
  revokeHelixEnvironmentMonitor,
  type HelixEnvironmentMonitorItem,
} from "../helix-environment-monitor";

const createdAt = "2026-08-24T12:00:00.000Z";
const expiresAt = "2026-08-24T13:00:00.000Z";

const lease = () =>
  createHelixEnvironmentMonitorLease({
    monitorId: "environment_monitor:test",
    identity: {
      owner_profile_id: "profile:test",
      mcp_client_id: "mcp_client:test",
      client_continuation_ref: "codex_task:test",
      run_id: "agent_run:test",
      goal_id: "environment_durable_goal:test",
      room_id: "shared_realtime_room:test",
      participant_id: "shared_realtime_participant:test",
      environment_binding_id: "environment_binding:test",
      source_id: "source:test",
      world_id: "minecraft:overworld:test",
      subject_ref: "environment_subject_binding:test",
      producer_epoch_ref: "environment_action_epoch:test",
      policy_revision: 4,
    },
    eventFamilies: ["workflow", "hazard"],
    maxEventAgeMs: 30_000,
    wakeBudgetTotal: 2,
    createdAt,
    expiresAt,
  });

const item = (overrides: Partial<HelixEnvironmentMonitorItem> = {}): HelixEnvironmentMonitorItem => ({
  evidence_ref: "environment_situation_digest_evidence:test",
  digest_id: "environment_situation_digest:test",
  digest_hash: `sha256:${"a".repeat(64)}`,
  observation_revision: 8,
  event_families: ["workflow"],
  source_id: "source:test",
  world_id: "minecraft:overworld:test",
  subject_ref: "environment_subject_binding:test",
  producer_epoch_ref: "environment_action_epoch:test",
  observed_at: "2026-08-24T12:00:01.000Z",
  provenance_valid: true,
  raw_events_included: false,
  content_role: "environment_monitor_item_not_assistant_answer",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  ...overrides,
});

describe("profile-scoped environment monitor contract", () => {
  it("creates a finite secret-free read-only lease", () => {
    expect(lease()).toMatchObject({
      status: "active",
      event_families: ["hazard", "workflow"],
      delivered_cursor: 0,
      acknowledged_cursor: 0,
      credential_included: false,
      raw_events_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
  });

  it("delivers one deduplicated semantic wake position and advances acknowledgement monotonically", () => {
    const delivered = deliverHelixEnvironmentMonitorItems({
      lease: lease(),
      items: [item(), item()],
      now: "2026-08-24T12:00:02.000Z",
    });
    expect(delivered.delivery).toMatchObject({
      disposition: "delivered",
      cursor_before: 0,
      cursor_after: 1,
      wake_requested: true,
      client_wake_transport: "active_wait",
      raw_events_included: false,
    });
    expect(delivered.delivery.items).toHaveLength(1);
    expect(
      acknowledgeHelixEnvironmentMonitor({
        lease: delivered.lease,
        cursor: 1,
        now: "2026-08-24T12:00:03.000Z",
      }).acknowledged_cursor,
    ).toBe(1);
    expect(() =>
      acknowledgeHelixEnvironmentMonitor({
        lease: { ...delivered.lease, acknowledged_cursor: 1 },
        cursor: 0,
        now: "2026-08-24T12:00:03.000Z",
      }),
    ).toThrowError(expect.objectContaining({ code: "monitor_cursor_regression" }));
    expect(() =>
      acknowledgeHelixEnvironmentMonitor({
        lease: delivered.lease,
        cursor: 2,
        now: "2026-08-24T12:00:03.000Z",
      }),
    ).toThrowError(expect.objectContaining({ code: "monitor_cursor_not_delivered" }));
  });

  it.each([
    ["source identity", item({ source_id: "source:other" }), "monitor_identity_mismatch"],
    ["producer epoch", item({ producer_epoch_ref: "environment_action_epoch:other" }), "monitor_identity_mismatch"],
    ["event family", item({ event_families: ["inventory"] }), "monitor_event_family_forbidden"],
    ["freshness", item({ observed_at: "2026-08-24T11:59:00.000Z" }), "monitor_event_stale"],
  ])("rejects %s drift", (
    _label: string,
    evidence: HelixEnvironmentMonitorItem,
    code: string,
  ) => {
    expect(() =>
      deliverHelixEnvironmentMonitorItems({
        lease: lease(),
        items: [evidence],
        now: "2026-08-24T12:00:02.000Z",
      }),
    ).toThrowError(expect.objectContaining({ code }));
  });

  it("enforces the finite wake budget", () => {
    const base = lease();
    expect(() =>
      deliverHelixEnvironmentMonitorItems({
        lease: { ...base, wakes_delivered: 2 },
        items: [item()],
        now: "2026-08-24T12:00:02.000Z",
      }),
    ).toThrowError(expect.objectContaining({ code: "monitor_wake_budget_exhausted" }));
  });

  it("forces a post-gap fresh snapshot before semantic delivery resumes", () => {
    const gap = markHelixEnvironmentMonitorRetentionGap({
      lease: lease(),
      now: "2026-08-24T12:00:04.000Z",
    });
    expect(gap.delivery).toMatchObject({
      disposition: "retention_gap",
      fresh_snapshot_required: true,
      wake_requested: false,
    });
    expect(() =>
      deliverHelixEnvironmentMonitorItems({
        lease: gap.lease,
        items: [item({ observed_at: "2026-08-24T12:00:05.000Z" })],
        now: "2026-08-24T12:00:05.000Z",
      }),
    ).toThrowError(expect.objectContaining({ code: "monitor_snapshot_required" }));
    expect(() =>
      repairHelixEnvironmentMonitorWithFreshSnapshot({
        lease: gap.lease,
        snapshotEvidenceRef: "environment_probe_evidence:old",
        observedAt: "2026-08-24T12:00:03.000Z",
        now: "2026-08-24T12:00:05.000Z",
      }),
    ).toThrowError(expect.objectContaining({ code: "monitor_snapshot_required" }));
    const repaired = repairHelixEnvironmentMonitorWithFreshSnapshot({
      lease: gap.lease,
      snapshotEvidenceRef: "environment_probe_evidence:fresh",
      observedAt: "2026-08-24T12:00:05.000Z",
      now: "2026-08-24T12:00:05.000Z",
    });
    expect(repaired).toMatchObject({
      fresh_snapshot_required: false,
      gap_after_cursor: null,
      recovery_snapshot_evidence_ref: "environment_probe_evidence:fresh",
      recovery_snapshot_observed_at: "2026-08-24T12:00:05.000Z",
    });
  });

  it("revokes without granting later delivery", () => {
    const revoked = revokeHelixEnvironmentMonitor({
      lease: lease(),
      now: "2026-08-24T12:00:04.000Z",
    });
    expect(revoked).toMatchObject({ status: "revoked", credential_included: false });
    expect(() =>
      deliverHelixEnvironmentMonitorItems({
        lease: revoked,
        items: [item()],
        now: "2026-08-24T12:00:05.000Z",
      }),
    ).toThrowError(expect.objectContaining({ code: "monitor_inactive" }));
  });

  it("rejects impossible stored projections", () => {
    expect(() =>
      helixEnvironmentMonitorLeaseSchema.parse({
        ...lease(),
        acknowledged_cursor: 2,
        delivered_cursor: 1,
      }),
    ).toThrow();
    expect(() =>
      helixEnvironmentMonitorLeaseSchema.parse({
        ...lease(),
        fresh_snapshot_required: true,
        gap_after_cursor: null,
      }),
    ).toThrow();
    expect(() =>
      helixEnvironmentMonitorLeaseSchema.parse({
        ...lease(),
        recovery_snapshot_evidence_ref: "environment_probe_evidence:orphan",
      }),
    ).toThrow();
  });

  it("uses typed monitor errors", () => {
    expect(
      new HelixEnvironmentMonitorContractError(
        "monitor_inactive",
        "inactive",
      ),
    ).toBeInstanceOf(Error);
  });
});
