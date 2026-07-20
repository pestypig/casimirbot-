import { beforeEach, describe, expect, it } from "vitest";
import {
  resetAccountSessionStore,
  signInLocalAccountSession,
} from "../../../helix-account/account-session-store";
import { resolveWorkstationGatewayAccountContext } from "../../workstation-tool-gateway/account-policy";
import { runExplicitFutureWorkstationGatewayCalls } from "../future-provider";

describe("future provider workstation account policy", () => {
  beforeEach(async () => {
    await resetAccountSessionStore();
  });

  it("passes a trusted developer account context through the shared gateway", async () => {
    const receipt = await signInLocalAccountSession({
      profile_id: "profile:future-provider-developer",
      account_type: "developer",
    });
    const accountContext = await resolveWorkstationGatewayAccountContext(
      receipt.session?.session_id,
    );
    const results = await runExplicitFutureWorkstationGatewayCalls({
      body: {
        turn_id: "ask:test:future-provider-developer",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: { expression: "8 * 8" },
        },
      },
      accountContext,
    });

    expect(results).toEqual([
      expect.objectContaining({
        ok: true,
        agent_runtime: "future",
        capability_id: "scientific-calculator.solve_expression",
        observation: expect.objectContaining({ result: "64" }),
      }),
    ]);
  });

  it("fails closed when an anonymous public account requests the locked future runtime", async () => {
    const accountContext = await resolveWorkstationGatewayAccountContext(null);
    const results = await runExplicitFutureWorkstationGatewayCalls({
      body: {
        turn_id: "ask:test:future-provider-public",
        workstation_gateway_call: {
          capability_id: "scientific-calculator.solve_expression",
          arguments: { expression: "8 * 8" },
        },
      },
      accountContext,
    });

    expect(results).toEqual([
      expect.objectContaining({
        ok: false,
        agent_runtime: "future",
        capability_id: "scientific-calculator.solve_expression",
        error: "runtime_agent_outside_account_policy",
        gateway_admission: expect.objectContaining({
          admission_status: "blocked",
          blocked_reason: "runtime_agent_outside_account_policy",
        }),
        observation: expect.objectContaining({
          account_policy_block: expect.objectContaining({
            error: "runtime_agent_locked_by_account_policy",
          }),
        }),
      }),
    ]);
  });
});
