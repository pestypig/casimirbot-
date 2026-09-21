import { afterEach, describe, expect, it, vi } from "vitest";
import { request as httpRequest } from "node:http";
import {
  startAuth0LoopbackCallback,
  type Auth0LoopbackCallbackLease,
} from "../apps/desktop/src/auth0-loopback-callback";

const leases: Auth0LoopbackCallbackLease[] = [];
const state = "s".repeat(43);
const start = async (onCallback: (url: string) => void): Promise<Auth0LoopbackCallbackLease> => {
  const lease = await startAuth0LoopbackCallback({
    expectedState: state,
    port: 0,
    onCallback,
  });
  leases.push(lease);
  return lease;
};

afterEach(async () => {
  await Promise.all(leases.splice(0).map((lease) => lease.close()));
});

describe("native Auth0 loopback return", () => {
  it("admits only one exact-state return and strips the browser-visible query", async () => {
    const received = vi.fn();
    const lease = await start(received);
    const wrongState = await fetch(`${lease.callbackUri}?code=valid-code-123&state=${"x".repeat(43)}`);
    expect(wrongState.status).toBe(400);
    expect(received).not.toHaveBeenCalled();

    const valid = await fetch(`${lease.callbackUri}?code=valid-code-123&state=${state}`, {
      redirect: "manual",
    });
    expect(valid.status).toBe(303);
    expect(valid.headers.get("location")).toBe(lease.callbackUri.replace("/callback", "/complete"));
    expect(valid.headers.get("referrer-policy")).toBe("no-referrer");
    await vi.waitFor(() => expect(received).toHaveBeenCalledTimes(1));
    expect(received.mock.calls[0]?.[0]).toContain("code=valid-code-123");
    const complete = await fetch(valid.headers.get("location")!);
    expect(complete.status).toBe(200);
    expect(await complete.text()).not.toContain("valid-code-123");
    const replay = await fetch(`${lease.callbackUri}?code=valid-code-123&state=${state}`);
    expect(replay.status).toBe(404);
    expect(received).toHaveBeenCalledTimes(1);
  });

  it("rejects wrong host, method, path and duplicate code without consuming", async () => {
    const received = vi.fn();
    const lease = await start(received);
    const url = `${lease.callbackUri}?code=valid-code-123&state=${state}`;
    expect((await fetch(url, { method: "POST" })).status).toBe(404);
    const wrongHostStatus = await new Promise<number>((resolve, reject) => {
      const request = httpRequest(url, { headers: { Host: "evil.example" } }, (response) => {
        response.resume();
        resolve(response.statusCode ?? 0);
      });
      request.on("error", reject);
      request.end();
    });
    expect(wrongHostStatus).toBe(404);
    expect((await fetch(url.replace("/callback", "/other"))).status).toBe(400);
    expect((await fetch(`${url}&code=second-code-456`)).status).toBe(400);
    expect(received).not.toHaveBeenCalled();
  });

  it("releases the port on close and fails closed when it is occupied", async () => {
    const lease = await start(vi.fn());
    const port = Number(new URL(lease.callbackUri).port);
    await expect(startAuth0LoopbackCallback({
      expectedState: state,
      port,
      onCallback: vi.fn(),
    })).rejects.toThrow("desktop_auth0_callback_port_unavailable");
    await lease.close();
    const next = await startAuth0LoopbackCallback({
      expectedState: state,
      port,
      onCallback: vi.fn(),
    });
    leases.push(next);
    expect(next.callbackUri).toBe(lease.callbackUri);
  });
});
