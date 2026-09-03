import { describe, expect, it } from "vitest";
import {
  HELIX_OPERATOR_ACTIVITY_CURSOR_SCHEMA,
  HELIX_OPERATOR_ACTIVITY_EVENT_SCHEMA,
  HELIX_OPERATOR_ACTIVITY_PAGE_SCHEMA,
  HELIX_OPERATOR_ACTIVITY_STREAM_LIST_SCHEMA,
  helixOperatorActivityEventSchema,
  helixOperatorActivityPageSchema,
  helixOperatorActivityStreamListSchema,
  type HelixOperatorActivityEvent,
} from "../shared/helix-operator-activity";

const event = (sequence: number): HelixOperatorActivityEvent => ({
  schema: HELIX_OPERATOR_ACTIVITY_EVENT_SCHEMA,
  activity_event_id: `operator_activity:${sequence}`,
  projection_sequence: sequence,
  source_kind: "mcp_capability_lifecycle",
  source_schema: "helix.capability_lifecycle_ledger.v1",
  source_event_ref: `capability_stage:${sequence}`,
  profile_ref: "profile:owner",
  node_ref: "node:installed",
  oauth_client_ref: "oauth_client:codex",
  client_session_ref: "client_session:one",
  provider_thread_ref: "provider_thread:principal",
  provider_thread_epoch: "provider_thread_epoch:one",
  run_id: "run:one",
  turn_id: "turn:one",
  capability_call_ref: `capability_call:${sequence}`,
  environment_binding_ref: "environment_binding:minecraft",
  room_ref: "room:one",
  source_ref: "source:fabric",
  world_ref: "world:one",
  workflow_ref: null,
  effect_lease_ref: null,
  terminal_product_ref: null,
  event_kind: "observation",
  lifecycle_stage: "result_observed",
  outcome: "succeeded",
  summary: `Observed capability result ${sequence}`,
  evidence_refs: [`evidence:${sequence}`],
  occurred_at: "2026-09-01T20:00:00.000Z",
  observed_at: "2026-09-01T20:00:01.000Z",
  provenance: "reported",
  redaction_state: "sanitized",
  visibility: "profile",
  content_role: "operator_activity_not_assistant_answer",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const page = (events: HelixOperatorActivityEvent[]) => ({
  schema: HELIX_OPERATOR_ACTIVITY_PAGE_SCHEMA,
  stream_ref: "operator_activity_stream:profile-owner",
  profile_ref: "profile:owner",
  node_ref: "node:installed",
  run_id: "run:one",
  provider_thread_ref: "provider_thread:principal",
  provider_thread_epoch: "provider_thread_epoch:one",
  events,
  next_cursor: null,
  has_more: false,
  complete_for_query: true,
  summary: {
    returned_count: events.length,
    first_sequence: events.at(0)?.projection_sequence ?? null,
    last_sequence: events.at(-1)?.projection_sequence ?? null,
    outcome_counts: { succeeded: events.length },
  },
  content_role: "operator_activity_page_not_assistant_answer",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

describe("Helix operator activity contracts", () => {
  it("accepts an ordered public lifecycle longer than fifteen events", () => {
    const events = Array.from({ length: 24 }, (_, index) => event(index));
    const parsed = helixOperatorActivityPageSchema.parse(page(events));
    expect(parsed.events).toHaveLength(24);
    expect(parsed.complete_for_query).toBe(true);
    expect(parsed.answer_authority).toBe(false);
  });

  it("rejects duplicate ordering and cross-profile activity", () => {
    const duplicate = page([event(2), event(2)]);
    expect(helixOperatorActivityPageSchema.safeParse(duplicate).success).toBe(false);

    const wrongProfile = event(3);
    wrongProfile.profile_ref = "profile:other";
    expect(
      helixOperatorActivityPageSchema.safeParse(page([wrongProfile])).success,
    ).toBe(false);
  });

  it("rejects thread identity without its exact epoch", () => {
    const missingEpoch = event(1);
    missingEpoch.provider_thread_epoch = null;
    expect(helixOperatorActivityEventSchema.safeParse(missingEpoch).success).toBe(false);
  });

  it("rejects raw or answer-authoritative activity payloads", () => {
    expect(
      helixOperatorActivityEventSchema.safeParse({
        ...event(1),
        raw_content_included: true,
      }).success,
    ).toBe(false);
    expect(
      helixOperatorActivityEventSchema.safeParse({
        ...event(1),
        assistant_answer: true,
      }).success,
    ).toBe(false);
    expect(
      helixOperatorActivityEventSchema.safeParse({
        ...event(1),
        provider_transcript: "private reasoning",
      }).success,
    ).toBe(false);
  });

  it("requires a continuation cursor to preserve exact scope", () => {
    const events = [event(0), event(1)];
    const valid = {
      ...page(events),
      has_more: true,
      complete_for_query: false,
      next_cursor: {
        schema: HELIX_OPERATOR_ACTIVITY_CURSOR_SCHEMA,
        stream_ref: "operator_activity_stream:profile-owner",
        profile_ref: "profile:owner",
        node_ref: "node:installed",
        run_id: "run:one",
        provider_thread_ref: "provider_thread:principal",
        provider_thread_epoch: "provider_thread_epoch:one",
        after_sequence: 1,
        projection_version: 1,
      },
    };
    expect(helixOperatorActivityPageSchema.safeParse(valid).success).toBe(true);
    expect(
      helixOperatorActivityPageSchema.safeParse({
        ...valid,
        next_cursor: { ...valid.next_cursor, run_id: "run:other" },
      }).success,
    ).toBe(false);
  });

  it("lists only streams from the exact signed-in profile", () => {
    const valid = {
      schema: HELIX_OPERATOR_ACTIVITY_STREAM_LIST_SCHEMA,
      profile_ref: "profile:owner",
      streams: [{
        stream_ref: "operator_activity_stream:one",
        profile_ref: "profile:owner",
        node_ref: "node:one",
        event_count: 24,
        next_sequence: 24,
        latest_observed_at: "2026-09-01T20:00:01.000Z",
      }],
      content_role: "operator_activity_stream_list_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    } as const;
    expect(helixOperatorActivityStreamListSchema.safeParse(valid).success).toBe(true);
    expect(helixOperatorActivityStreamListSchema.safeParse({
      ...valid,
      streams: [{ ...valid.streams[0], profile_ref: "profile:other" }],
    }).success).toBe(false);
  });
});
