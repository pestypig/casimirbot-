// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import { SharedLiveRoomOwnerResultsPanel } from "../SharedLiveRoomOwnerResultsPanel";

const room = { room_id: "room:one", status: "open", public_terminal_results: [] } as unknown as HelixSharedRealtimeRoom;
const catalog = { schema: "helix.room_result_catalog.v1", room_id: room.room_id,
  mission: { mission_id: "mission:one", mission_revision: 2 }, limited: false,
  results: [{ result_ref: "result:one", steering_event_ref: "event:one", room_id: room.room_id,
    room_mission_id: "mission:one", room_mission_revision: 2, status: "unable", created_at: "2026-09-24T23:00:00.000Z" }],
  answer_authority: false, raw_content_included: false };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
function fixture() {
  const fetcher = vi.fn(async (_url: unknown, _init?: RequestInit) => json(catalog));
  vi.stubGlobal("fetch", fetcher);
  const onProcessed = vi.fn(async () => true);
  const ui = render(<SharedLiveRoomOwnerResultsPanel room={room} onProcessed={onProcessed} />);
  return { fetcher, onProcessed, ...ui };
}
async function choose() {
  fireEvent.change(await screen.findByLabelText("Task report"), { target: { value: "result:one" } });
  fireEvent.click(screen.getByRole("checkbox"));
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("owner result sharing", () => {
  it("requires an explicit selection and disclosure before sending the exact source", async () => {
    const f = fixture();
    const button = await screen.findByRole("button", { name: "Explain to room" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(f.fetcher).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Task unable to complete/)).toBeTruthy();
    await choose();
    f.fetcher.mockResolvedValue(json({ final_status: "final_answer", turn_id: "ask:room-result:one", selected_final_answer: "Private response is not rendered directly" }));
    fireEvent.click(button);
    await waitFor(() => expect(f.onProcessed).toHaveBeenCalledOnce());
    const [url, init] = f.fetcher.mock.calls[1];
    expect(url).toBe("/api/agi/ask/turn");
    expect(JSON.parse(init!.body as string)).toEqual({ question: "Explain the selected task report to this room.",
      session_id: "helix-ask:room:room:one", room_mission_result: { room_id: room.room_id,
        room_mission_id: "mission:one", room_mission_revision: 2, steering_event_ref: "event:one",
        result_ref: "result:one", request_id: "result:one", share_with_room: true } });
    expect(screen.queryByText("Private response is not rendered directly")).toBeNull();
    expect(screen.getByText(/Waiting for its shared room result/)).toBeTruthy();
    f.rerender(<SharedLiveRoomOwnerResultsPanel room={{ ...room, public_terminal_results: [{ turn_id: "ask:room-result:one" } as never] }} onProcessed={f.onProcessed} />);
    expect(screen.getByText(/explanation is available in Shared supported results/)).toBeTruthy();
  });
  it("reuses the request after an uncertain response and does not double-submit while pending", async () => {
    const f = fixture(); await choose();
    let reject!: (reason: Error) => void;
    f.fetcher.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
    const button = screen.getByRole("button", { name: "Explain to room" });
    fireEvent.click(button); fireEvent.click(button);
    expect(f.fetcher).toHaveBeenCalledTimes(2);
    reject(new Error("network"));
    await screen.findByText(/outcome is unknown/);
    f.fetcher.mockResolvedValue(json({ final_status: "final_answer", turn_id: "ask:room-result:one" }));
    fireEvent.click(screen.getByRole("button", { name: "Explain to room" }));
    await waitFor(() => expect(f.onProcessed).toHaveBeenCalledOnce());
    expect(f.fetcher.mock.calls[2][1]?.body).toBe(f.fetcher.mock.calls[1][1]?.body);
  });
  it("requires disclosure again when the question changes", async () => {
    fixture(); await choose();
    fireEvent.change(screen.getByLabelText("What should the room understand?"), { target: { value: "What remains uncertain?" } });
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("button", { name: "Explain to room" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it.each([202, 409, 200])("does not claim publication from pending or failure HTTP %s", async status => {
    const f = fixture(); await choose();
    f.fetcher.mockResolvedValue(json({ final_status: "final_failure", terminal_error_code: "room_result_mission_not_current" }, status));
    fireEvent.click(screen.getByRole("button", { name: "Explain to room" }));
    await screen.findByText(status === 202 ? /still running/ : /No shared answer confirmed/);
    expect(f.onProcessed).not.toHaveBeenCalled();
    expect(screen.queryByText(/explanation is available/)).toBeNull();
  });
  it("does not accept a catalog from another room", async () => {
    const f = fixture();
    await screen.findByLabelText("Task report");
    f.fetcher.mockResolvedValue(json({ ...catalog, room_id: "room:other" }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh results" }));
    await screen.findByText(/room_result_source_mismatch/);
    expect(screen.queryByLabelText("Task report")).toBeNull();
  });
  it("aborts an in-flight request on room-panel unmount without reopening the old room", async () => {
    const f = fixture(); await choose();
    let finish!: (response: Response) => void;
    f.fetcher.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    fireEvent.click(screen.getByRole("button", { name: "Explain to room" }));
    const signal = f.fetcher.mock.calls[1][1]?.signal;
    f.unmount();
    expect(signal?.aborted).toBe(true);
    finish(json({ final_status: "final_answer", turn_id: "ask:room-result:one" }));
    await Promise.resolve(); await Promise.resolve();
    expect(f.onProcessed).not.toHaveBeenCalled();
  });
});
