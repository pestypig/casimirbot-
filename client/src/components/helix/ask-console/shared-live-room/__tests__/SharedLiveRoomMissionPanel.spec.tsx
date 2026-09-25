// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SharedLiveRoomMissionPanel } from "../SharedLiveRoomMissionPanel";
import { useRoomMissionHandoffReview } from "../RoomMissionHandoffReview";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";

const room = { room_id: "room:one", status: "open", participants: [{ participant_id: "speaker:one", display_name: "Guest One" }] } as unknown as HelixSharedRealtimeRoom;
const candidate = { reasoning_binding_id: "binding:one", binding_epoch: 1, helix_conversation_id: "chat:one", binding_mission_id: null, run_id: null };
const mission = { ...candidate, room_id: room.room_id, mission_id: "mission:one", mission_revision: 1, status: "active" };
const hash = "a".repeat(64);
const local = { roomId: room.room_id, handoffId: "handoff:one", realtimeSessionId: "live:one", text: "Review the plan.", textHash: `sha256:${hash}`, capturedAt: 100 };
const option = { handoff_id: local.handoffId, realtime_session_id: local.realtimeSessionId,
  speaker_participant_id: "speaker:one", transcript_text_hash: local.textHash, transcript_text_char_count: local.text.length, created_at_ms: 100 };
const catalog = { schema: "helix.room_mission_owner_catalog.v1", room_id: room.room_id, mission, candidate,
  candidate_unavailable: false, handoffs: [option], execution_authority: false, answer_authority: false, raw_content_included: false };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const selectedResponse = (value: typeof mission) => ({ ok: true, mission: value, dispatch_authority: false, answer_authority: false, terminal_eligible: false });
const dispatchResponse = () => ({ ok: true, room_mission_id: mission.mission_id, room_mission_revision: 1,
  speaker_participant_id: "speaker:one", provider_pickup_confirmed: false, answer_authority: false, terminal_eligible: false,
  event: { schema: "helix.reasoning_steering_event.v1", steering_event_ref: "event:one", reasoning_binding_id: "binding:one", binding_epoch: 1,
    cursor: 1, client_event_ref: "room-handoff:handoff:one", origin: "gpt_live_finalized", delivery_state: "pending",
    instruction_sha256: hash, instruction_length: local.text.length, created_at: "2026-09-25T00:00:00.000Z",
    expires_at: "2026-09-25T01:00:00.000Z", acknowledged_at: null, advisory_only: true, execution_requested: false,
    evidence_satisfied: false, provider_thread_content_included: false, hidden_reasoning_included: false, answer_authority: false, terminal_eligible: false } });
function fixture(body: unknown = catalog) {
  const fetcher = vi.fn(async (_url: unknown, _init?: RequestInit) => json(body));
  vi.stubGlobal("fetch", fetcher);
  const ui = render(<SharedLiveRoomMissionPanel room={room} />);
  return { fetcher, ...ui };
}
async function choose() {
  fireEvent.change(await screen.findByLabelText("Captured room instruction"), { target: { value: local.handoffId } });
  fireEvent.click(screen.getByRole("checkbox"));
}
beforeEach(() => useRoomMissionHandoffReview.setState({ entries: [local] }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); useRoomMissionHandoffReview.setState({ entries: [] }); });
describe("room mission owner workflow", () => {
  it("requires explicit task review and sends the exact discovered binding and expected revision", async () => {
    const f = fixture({ ...catalog, mission: null });
    const button = await screen.findByRole("button", { name: "Select room task" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(f.fetcher).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("checkbox"));
    f.fetcher.mockResolvedValueOnce(json(selectedResponse(mission)));
    fireEvent.click(button);
    await screen.findByText(/Room mission selected/);
    const body = JSON.parse(f.fetcher.mock.calls[1][1]!.body as string);
    expect(body).toEqual({ ...candidate, room_id: room.room_id, expected_revision: null, request_id: expect.any(String) });
    expect(screen.queryByRole("button", { name: "Select room task" })).toBeNull();
    expect(f.fetcher).toHaveBeenCalledTimes(2);
  });
  it("preserves the select request on an uncertain response and suppresses double clicks", async () => {
    const f = fixture({ ...catalog, mission: null });
    const button = await screen.findByRole("button", { name: "Select room task" });
    fireEvent.click(screen.getByRole("checkbox"));
    let fail!: (error: Error) => void;
    f.fetcher.mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
    fireEvent.click(button); fireEvent.click(button);
    expect(f.fetcher).toHaveBeenCalledTimes(2);
    fail(new Error("network")); await screen.findByText(/outcome is unknown/);
    f.fetcher.mockResolvedValueOnce(json(selectedResponse(mission))); fireEvent.click(button);
    await screen.findByText(/Room mission selected/);
    expect(f.fetcher.mock.calls[1][1]!.body).toBe(f.fetcher.mock.calls[2][1]!.body);
  });
  it("shows captured speaker/text and sends only after explicit review, reporting queued rather than completed", async () => {
    const f = fixture();
    fireEvent.change(await screen.findByLabelText("Captured room instruction"), { target: { value: local.handoffId } });
    expect(screen.getByText("Guest One: Review the plan.")).toBeTruthy();
    const button = screen.getByRole("button", { name: "Send reviewed instruction" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    f.fetcher.mockResolvedValueOnce(json(dispatchResponse(), 202));
    fireEvent.click(screen.getByRole("checkbox")); fireEvent.click(button);
    await screen.findByText(/Instruction queued. Codex pickup and a result are not confirmed/);
    expect(JSON.parse(f.fetcher.mock.calls[1][1]!.body as string)).toEqual({ room_id: room.room_id,
      room_mission_id: "mission:one", room_mission_revision: 1, handoff_id: local.handoffId,
      transcript_text: local.text, client_event_ref: "room-handoff:handoff:one" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
  it("reuses the handoff request after remount and an uncertain outcome", async () => {
    const f = fixture(); await choose(); f.fetcher.mockRejectedValueOnce(new Error("network"));
    fireEvent.click(screen.getByRole("button", { name: "Send reviewed instruction" }));
    await screen.findByText(/outcome is unknown/);
    const first = f.fetcher.mock.calls[1][1]!.body;
    f.unmount();
    const next = fixture(); await choose(); next.fetcher.mockResolvedValueOnce(json(dispatchResponse(), 202));
    fireEvent.click(screen.getByRole("button", { name: "Send reviewed instruction" }));
    await screen.findByText(/Instruction queued/);
    expect(next.fetcher.mock.calls[1][1]!.body).toBe(first);
  });
  it("revokes the exact selection and removes the dispatch control", async () => {
    const f = fixture();
    const button = await screen.findByRole("button", { name: "Revoke room mission" });
    f.fetcher.mockResolvedValueOnce(json(selectedResponse({ ...mission, status: "revoked", mission_revision: 2 })));
    fireEvent.click(button); await screen.findByText(/Mission revoked/);
    expect(JSON.parse(f.fetcher.mock.calls[1][1]!.body as string)).toEqual({ expected_revision: 1, request_id: expect.any(String) });
    expect(screen.queryByLabelText("Captured room instruction")).toBeNull();
  });
  it.each(["room", "session", "hash", "length"])("does not mix a mismatched %s preview", async field => {
    useRoomMissionHandoffReview.setState({ entries: [{ ...local,
      ...(field === "room" ? { roomId: "room:other" } : field === "session" ? { realtimeSessionId: "live:other" }
        : field === "hash" ? { textHash: "sha256:other" } : { text: "A much longer transcript for this test" }) }] });
    fixture(); await screen.findByText(/No current captured instructions/);
    expect(screen.queryByLabelText("Captured room instruction")).toBeNull();
  });
  it("clears approval after a disconnect removes the preview", async () => {
    fixture(); await choose();
    act(() => useRoomMissionHandoffReview.setState({ entries: [] }));
    expect(screen.queryByRole("button", { name: "Send reviewed instruction" })).toBeNull();
    act(() => useRoomMissionHandoffReview.setState({ entries: [local] }));
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  });
  it.each(["mission", "speaker", "hash"])("rejects a mismatched %s dispatch response", async field => {
    const f = fixture(); await choose(); const response = dispatchResponse();
    if (field === "mission") response.room_mission_revision = 2;
    if (field === "speaker") response.speaker_participant_id = "speaker:other";
    if (field === "hash") response.event.instruction_sha256 = "b".repeat(64);
    f.fetcher.mockResolvedValueOnce(json(response, 202));
    fireEvent.click(screen.getByRole("button", { name: "Send reviewed instruction" }));
    await screen.findByText(/room_mission_response_mismatch/);
    expect(screen.queryByText(/Instruction queued/)).toBeNull();
  });
  it("rejects a catalog for another room", async () => {
    fixture({ ...catalog, room_id: "room:other" });
    await screen.findByText(/room_mission_response_mismatch/);
    expect(screen.queryByLabelText("Captured room instruction")).toBeNull();
  });
  it("aborts on unmount and ignores a late selection response", async () => {
    const f = fixture({ ...catalog, mission: null });
    const button = await screen.findByRole("button", { name: "Select room task" });
    fireEvent.click(screen.getByRole("checkbox"));
    let finish!: (response: Response) => void;
    f.fetcher.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    fireEvent.click(button); const signal = f.fetcher.mock.calls[1][1]!.signal; f.unmount();
    expect(signal?.aborted).toBe(true); finish(json(selectedResponse(mission)));
    await waitFor(() => expect(screen.queryByText(/Room mission selected/)).toBeNull());
  });
  it("bounds an uncertain request without automatic retry or a stuck button", async () => {
    const f = fixture(); await choose(); vi.useFakeTimers();
    f.fetcher.mockImplementationOnce(() => new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "Send reviewed instruction" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(10_001); });
    expect(screen.getByText(/outcome is unknown/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Send reviewed instruction" }) as HTMLButtonElement).disabled).toBe(false);
    expect(f.fetcher.mock.calls[1][1]!.signal?.aborted).toBe(true);
    expect(f.fetcher).toHaveBeenCalledTimes(2);
  });
});
