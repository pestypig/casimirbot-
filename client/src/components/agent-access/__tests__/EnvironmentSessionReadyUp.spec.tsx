// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import EnvironmentSessionReadyUp from "../EnvironmentSessionReadyUp";
import { HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT } from "@/components/helix/ask-console/shared-live-room/SharedLiveRoomGuideProjection";
import type { BrowserReasoningBinding } from "@/lib/agent-access/reasoningTaskBinding";
const binding: BrowserReasoningBinding = { reasoning_binding_id: "binding:a", binding_epoch: 1,
  helix_conversation_id: "chat:a", run_id: "run:a", status: "active", continuation_transport: "polling" };
it("requests only the returned room and reports unavailable controls without changing permissions", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true,
    selection: { room_id: "room:exact" }, readiness: { ready: false, checks: [] } }) });
  vi.stubGlobal("fetch", fetcher);
  const listener = vi.fn();
  window.addEventListener(HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT, listener);
  try {
    render(<EnvironmentSessionReadyUp binding={binding} />);
    fireEvent.click(screen.getByRole("button", { name: "Ready up" }));
    fireEvent.click(await screen.findByRole("button", { name: "Review environment settings" }));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ roomId: "room:exact" });
    expect(screen.getByRole("status").textContent).toContain("No other room was opened");
    expect(fetcher).toHaveBeenCalledTimes(1);
  } finally {
    window.removeEventListener(HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT, listener);
  }
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });
it("prepares the exact binding without asking for goal or probe IDs", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true,
    readiness: { ready: true, valid_until_ms: Date.now() + 5000 } }) });
  vi.stubGlobal("fetch", fetcher);
  render(<EnvironmentSessionReadyUp binding={binding} />);
  fireEvent.click(screen.getByRole("button", { name: "Ready up" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("no movement was started"));
  const body = JSON.parse(fetcher.mock.calls[0][1].body);
  expect(body).toMatchObject({ reasoning_binding_id: "binding:a", binding_epoch: 1,
    helix_conversation_id: "chat:a", run_id: "run:a", request_id: expect.any(String) });
  expect(body).not.toHaveProperty("client_continuation_ref");
  expect(body).not.toHaveProperty("probe_request_id");
});
it("shows blocked layers rather than treating a successful HTTP response as ready", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true,
    readiness: { ready: false, checks: [{ layer: "authority", state: "revoked" }] } }) }));
  render(<EnvironmentSessionReadyUp binding={binding} />);
  fireEvent.click(screen.getByRole("button", { name: "Ready up" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("authority"));
  expect(screen.getByRole("status").textContent).toContain("No new permissions");
});
it("keeps chat-only sessions out of environment preparation", () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  render(<EnvironmentSessionReadyUp binding={{ ...binding, run_id: null }} />);
  expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  expect(fetcher).not.toHaveBeenCalled();
});
it("identifies ambiguous goals as an environment problem, not a new binding request", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false,
    error: "durable_goal_session_ambiguous" }) }));
  render(<EnvironmentSessionReadyUp binding={binding} />);
  fireEvent.click(screen.getByRole("button", { name: "Ready up" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("More than one unfinished goal"));
  expect(screen.getByRole("status").textContent).toContain("binding was not replaced");
});
it("expires the displayed readiness without telling the user to rebind", async () => {
  const deadline = Date.now() + 5000;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true,
    readiness: { ready: true, valid_until_ms: deadline } }) }));
  render(<EnvironmentSessionReadyUp binding={binding} />);
  fireEvent.click(screen.getByRole("button", { name: "Ready up" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("prerequisites checked"));
  // The component's interval uses the wall clock; retain real timers and move
  // only Date.now so this checks the actual scheduled UI refresh.
  vi.spyOn(Date, "now").mockReturnValue(deadline + 1);
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("binding was not revoked"), { timeout: 2000 });
  vi.restoreAllMocks();
});
