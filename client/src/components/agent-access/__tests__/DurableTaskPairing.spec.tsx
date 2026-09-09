// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import DurableTaskPairing from "../DurableTaskPairing";

const props = { profileId: "profile:owner", chatId: "chat:exact", environment: { roomId: "room:exact", runId: "run:exact" } };
const destination = { registrationId: "registration:exact", expiresAt: "2026-09-09T12:00:00.000Z",
  destinationDigest: "a".repeat(64),
  proofBasis: "authenticated_client_declaration", currentPresence: false, pairingAuthority: false, executionAuthority: false,
  destination: { issuer: "issuer:exact", profileId: props.profileId, installationId: "installation:exact", clientId: "client:exact", taskId: "task:exact" } };
const listed = { ok: true, destinations: [destination], execution_authority: false, answer_authority: false };
const response = (body: unknown) => new Response(JSON.stringify(body));
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); vi.useRealTimers(); });
async function selectAndApprove() {
  await screen.findByRole("option", { name: "task:exact · client:exact" });
  fireEvent.change(screen.getByLabelText("Registered AI task"), { target: { value: destination.registrationId } });
  fireEvent.click(screen.getByLabelText(/Include environment run/));
  fireEvent.click(screen.getByLabelText(/I approve pairing/));
}

it("O4 preserves selected run when presence-derived props disappear and requires explicit approval", async () => {
  const fetch = vi.fn().mockImplementation(async () => response(listed)); vi.stubGlobal("fetch", fetch);
  const view = render(<DurableTaskPairing {...props} />);
  await screen.findByRole("option", { name: "task:exact · client:exact" });
  expect((screen.getByRole("button", { name: "Approve pairing and create invitation" }) as HTMLButtonElement).disabled).toBe(true);
  await selectAndApprove();
  view.rerender(<DurableTaskPairing {...props} environment={null} />);
  expect((screen.getByLabelText(/Include environment run/) as HTMLInputElement).checked).toBe(true);
  expect((screen.getByLabelText(/I approve pairing/) as HTMLInputElement).checked).toBe(true);
  expect((screen.getByRole("button", { name: "Approve pairing and create invitation" }) as HTMLButtonElement).disabled).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("O4 reload reconciles an uncertain write with identical scope and never persists an invitation secret", async () => {
  const writes: unknown[] = [];
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    if (init.method === "GET") return response(_url.includes("/reasoning-invitations/")
      ? { ok: true, pairing: null, execution_authority: false, answer_authority: false } : listed);
    writes.push(JSON.parse(init.body as string)); throw new Error("lost response");
  }));
  const view = render(<DurableTaskPairing {...props} />);
  await selectAndApprove();
  fireEvent.click(screen.getByRole("button", { name: "Approve pairing and create invitation" }));
  await screen.findByRole("alert");
  view.unmount(); render(<DurableTaskPairing {...props} />);
  await waitFor(() => expect((screen.getByRole("button", { name: "Reconcile invitation" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Reconcile invitation" }));
  await waitFor(() => expect(writes).toHaveLength(2));
  expect(writes[1]).toEqual(writes[0]);
  expect(writes[0]).toMatchObject({ environment: props.environment, registrationId: destination.registrationId });
  expect(localStorage.getItem(localStorage.key(0)!)).not.toContain("secret");
});

it("O4 account changes cannot reuse a previous owner's reviewed destination", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => response(listed)));
  const view = render(<DurableTaskPairing {...props} />);
  await selectAndApprove();
  view.rerender(<DurableTaskPairing {...props} profileId="profile:other" />);
  await waitFor(() => expect(screen.queryByRole("option", { name: "task:exact · client:exact" })).toBeNull());
  expect((screen.getByLabelText(/I approve pairing/) as HTMLInputElement).checked).toBe(false);
  expect((screen.getByRole("button", { name: "Approve pairing and create invitation" }) as HTMLButtonElement).disabled).toBe(true);
});

function restoredGrant(state = "accepted") {
  const key = `helix.pairing.review.v1:${JSON.stringify([props.profileId, props.chatId])}`;
  localStorage.setItem(key, JSON.stringify({ requestId: "request:original", registrationId: destination.registrationId,
    chatId: props.chatId, environment: props.environment, invitationSeconds: 900, pairingSeconds: 28800 }));
  localStorage.setItem(`${key}:pairing`, "pairing:exact");
  localStorage.setItem(`${key}:destination`, destination.destinationDigest);
  return { schema: "helix.pairing_status.v1", id: "pairing:exact", revision: 2, chatId: props.chatId,
    destinationDigest: destination.destinationDigest,
    environment: props.environment, state, createdAt: "2026-09-08T12:00:00.000Z",
    invitationExpiresAt: "2026-09-08T12:15:00.000Z", pairingExpiresAt: "2026-09-08T20:00:00.000Z",
    acceptedAt: state === "accepted" ? "2026-09-08T12:01:00.000Z" : null,
    revokedAt: null, executionAuthority: false, answerAuthority: false };
}
it("O4 accepted recovery uses GET even when task registration has expired", async () => {
  const pairing = restoredGrant();
  const fetch = vi.fn(async (url: string) => url.endsWith("reasoning-destinations")
    ? new Response("", { status: 503 })
    : response({ ok: true, pairing, runtime_binding_active: null, execution_authority: false, answer_authority: false }));
  vi.stubGlobal("fetch", fetch);
  render(<DurableTaskPairing {...props} />);
  expect((await screen.findByRole("status")).textContent).toContain("Pairing: accepted");
  expect(screen.getByRole("status").textContent).toContain("availability has not been verified");
  expect(fetch.mock.calls).toHaveLength(3);
  expect(fetch.mock.calls.every(call => (call as unknown as [string, RequestInit])[1].method === "GET")).toBe(true);
});
it.each([{ chatId: "chat:other" }, { destinationDigest: "b".repeat(64) }])("O4 rejects restored scope mismatch %j without displaying acceptance", async mismatch => {
  const pairing = { ...restoredGrant(), ...mismatch };
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("reasoning-destinations") ? response(listed)
    : response({ ok: true, pairing, runtime_binding_active: null, execution_authority: false, answer_authority: false })));
  render(<DurableTaskPairing {...props} />);
  await screen.findByRole("alert");
  expect(screen.queryByRole("status")).toBeNull();
});
it("O4 refreshes pending status without another write and releases new review only after server expiry", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-08T12:14:58.000Z"));
  const pairing = restoredGrant("pending");
  let expired = false;
  const fetch = vi.fn(async (url: string) => url.endsWith("reasoning-destinations") ? response(listed)
    : response({ ok: true, pairing: { ...pairing, state: expired ? "expired" : "pending" },
      runtime_binding_active: false, execution_authority: false, answer_authority: false }));
  vi.stubGlobal("fetch", fetch);
  const onRuntimeBinding = vi.fn();
  await act(async () => { render(<DurableTaskPairing {...props} onRuntimeBinding={onRuntimeBinding} />); });
  expect(screen.queryByRole("button", { name: "Review a new invitation" })).toBeNull();
  expired = true;
  await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
  expect(screen.getByRole("status").textContent).toContain("Pairing: expired");
  expect(onRuntimeBinding).toHaveBeenCalledWith(null, "pairing:exact");
  expect(screen.getByRole("button", { name: "Review a new invitation" })).toBeTruthy();
  expect(fetch.mock.calls.every(call => (call as unknown as [string, RequestInit])[1].method === "GET")).toBe(true);
});
