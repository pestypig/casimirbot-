import { describe, expect, it } from "vitest";
import { runBoundedProviderSelectedContinuation } from "../bounded-provider-continuation";

type Request = {
  capability: string;
};

type Result = {
  request: Request | null;
  answer?: string;
};

describe("bounded provider-selected continuation", () => {
  it("re-enters tool A and tool B observations before accepting final synthesis", async () => {
    const executed: string[] = [];
    const result = await runBoundedProviderSelectedContinuation<
      Result,
      Request,
      { capability: string; ok: true }
    >({
      initialResult: {
        request: { capability: "tool.a" },
      },
      maxSteps: 4,
      requestFromResult: (entry) => entry.request,
      requestFingerprint: (request) => request.capability,
      admitRequest: () => true,
      executeAndReenter: async (request) => {
        executed.push(request.capability);
        return {
          observation: {
            capability: request.capability,
            ok: true,
          },
          result:
            request.capability === "tool.a"
              ? { request: { capability: "tool.b" } }
              : { request: null, answer: "Grounded final synthesis." },
        };
      },
    });

    expect(executed).toEqual(["tool.a", "tool.b"]);
    expect(result).toMatchObject({
      stop_reason: "no_next_request",
      pending_request: null,
      result: {
        request: null,
        answer: "Grounded final synthesis.",
      },
    });
    expect(result.steps.map((step) => step.observation.capability)).toEqual([
      "tool.a",
      "tool.b",
    ]);
  });

  it("carries a Minecraft inventory observation into a later model synthesis", async () => {
    const result = await runBoundedProviderSelectedContinuation<
      Result,
      Request,
      { capability: string; slots: number }
    >({
      initialResult: {
        request: {
          capability: "com.casimirbot.minecraft.inventory.check",
        },
      },
      maxSteps: 2,
      requestFromResult: (entry) => entry.request,
      requestFingerprint: (request) => request.capability,
      admitRequest: (request) =>
        request.capability ===
        "com.casimirbot.minecraft.inventory.check",
      executeAndReenter: async (request) => ({
        observation: {
          capability: request.capability,
          slots: 9,
        },
        result: {
          request: null,
          answer: "The current inventory observation contains nine slots.",
        },
      }),
    });

    expect(result.stop_reason).toBe("no_next_request");
    expect(result.steps).toEqual([
      {
        iteration: 1,
        request: {
          capability: "com.casimirbot.minecraft.inventory.check",
        },
        observation: {
          capability: "com.casimirbot.minecraft.inventory.check",
          slots: 9,
        },
      },
    ]);
    expect(result.result.answer).toContain("nine slots");
  });

  it("fails boundedly without executing duplicate or over-budget requests", async () => {
    const duplicate = await runBoundedProviderSelectedContinuation<
      Result,
      Request,
      { ok: true }
    >({
      initialResult: { request: { capability: "tool.a" } },
      maxSteps: 2,
      requestFromResult: (entry) => entry.request,
      requestFingerprint: (request) => request.capability,
      priorRequestFingerprints: ["tool.a"],
      admitRequest: () => true,
      executeAndReenter: async () => {
        throw new Error("duplicate request must not execute");
      },
    });
    expect(duplicate.stop_reason).toBe("duplicate_request");

    const exhausted = await runBoundedProviderSelectedContinuation<
      Result,
      Request,
      { ok: true }
    >({
      initialResult: { request: { capability: "tool.a" } },
      maxSteps: 1,
      requestFromResult: (entry) => entry.request,
      requestFingerprint: (request) => request.capability,
      admitRequest: () => true,
      executeAndReenter: async () => ({
        observation: { ok: true },
        result: { request: { capability: "tool.b" } },
      }),
    });
    expect(exhausted).toMatchObject({
      stop_reason: "budget_exhausted",
      pending_request: { capability: "tool.b" },
    });
  });

  it("re-enters one duplicate rejection so the provider can synthesize a final answer", async () => {
    const reentered: string[] = [];
    const result = await runBoundedProviderSelectedContinuation<
      Result,
      Request,
      { ok: true }
    >({
      initialResult: { request: { capability: "tool.a" } },
      maxSteps: 2,
      requestFromResult: (entry) => entry.request,
      requestFingerprint: (request) => request.capability,
      priorRequestFingerprints: ["tool.a"],
      admitRequest: () => true,
      executeAndReenter: async () => {
        throw new Error("duplicate request must not execute");
      },
      reenterRejection: async (request, reason) => {
        reentered.push(`${reason}:${request.capability}`);
        return {
          request: null,
          answer: "Final synthesis after the duplicate was rejected.",
        };
      },
    });

    expect(reentered).toEqual(["duplicate_request:tool.a"]);
    expect(result).toMatchObject({
      stop_reason: "no_next_request",
      pending_request: null,
      rejections: [
        {
          iteration: 1,
          request: { capability: "tool.a" },
          reason: "duplicate_request",
        },
      ],
      result: {
        request: null,
        answer: "Final synthesis after the duplicate was rejected.",
      },
    });
  });
});
