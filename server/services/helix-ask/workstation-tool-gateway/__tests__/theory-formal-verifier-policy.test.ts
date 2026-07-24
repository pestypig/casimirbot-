import { beforeEach, describe, expect, it } from "vitest";

import {
  resetAccountSessionStore,
  signInLocalAccountSession,
} from "../../../helix-account/account-session-store";
import {
  callAccountAuthorizedWorkstationGatewayCapabilityForProvider,
  listAccountAuthorizedWorkstationGatewayCapabilities,
  resolveWorkstationGatewayAccountContext,
} from "../account-policy";
import {
  THEORY_FORMAL_VERIFIER_CAPABILITIES,
  THEORY_FORMAL_VERIFIER_START_CAPABILITY,
} from "../theory-formal-verifier";

describe("theory formal verifier gateway account policy", () => {
  beforeEach(async () => {
    await resetAccountSessionStore();
  });

  it("advertises the evidence-only rail to developers and hides it from users", async () => {
    const developerReceipt = await signInLocalAccountSession({
      profile_id: "profile:formal-verifier-developer",
      account_type: "developer",
    });
    const developerContext = await resolveWorkstationGatewayAccountContext(
      developerReceipt.session?.session_id,
    );
    const developerListing =
      listAccountAuthorizedWorkstationGatewayCapabilities({
        accountContext: developerContext,
        requestedMode: "act",
        requestedRuntime: "codex",
      });

    for (const capabilityId of THEORY_FORMAL_VERIFIER_CAPABILITIES) {
      expect(developerListing.capabilities).toContainEqual(
        expect.objectContaining({
          capability_id: capabilityId,
          terminal_eligible: false,
          post_tool_model_step_required: true,
          assistant_answer: false,
        }),
      );
    }
    expect(
      developerListing.capabilities.find(
        (entry) =>
          entry.capability_id === THEORY_FORMAL_VERIFIER_START_CAPABILITY,
      ),
    ).toMatchObject({
      mode: "act",
      requires_confirmation: true,
      shell_access: false,
      code_mutation: false,
    });

    const userReceipt = await signInLocalAccountSession({
      profile_id: "profile:formal-verifier-user",
      account_type: "user",
    });
    const userContext = await resolveWorkstationGatewayAccountContext(
      userReceipt.session?.session_id,
    );
    const userListing = listAccountAuthorizedWorkstationGatewayCapabilities({
      accountContext: userContext,
      requestedMode: "act",
      requestedRuntime: "codex",
    });
    for (const capabilityId of THEORY_FORMAL_VERIFIER_CAPABILITIES) {
      expect(userListing.capabilities).not.toContainEqual(
        expect.objectContaining({ capability_id: capabilityId }),
      );
      expect(userListing.locked_capabilities).toContainEqual(
        expect.objectContaining({
          capability_id: capabilityId,
          locked_reason: "capability_outside_account_policy",
        }),
      );
    }
  });

  it("fails closed at server policy before a public provider can start replay", async () => {
    const receipt = await signInLocalAccountSession({
      profile_id: "profile:formal-verifier-public-call",
      account_type: "user",
    });
    const accountContext = await resolveWorkstationGatewayAccountContext(
      receipt.session?.session_id,
    );
    const result =
      await callAccountAuthorizedWorkstationGatewayCapabilityForProvider({
        accountContext,
        requestedMode: "act",
        requestedRuntime: "codex",
        capabilityId: THEORY_FORMAL_VERIFIER_START_CAPABILITY,
        arguments: {},
        approvalToken: "must-not-bypass-account-policy",
        turnId: "ask:test:formal-verifier-public-block",
      });

    expect(result).toMatchObject({
      ok: false,
      capability_id: THEORY_FORMAL_VERIFIER_START_CAPABILITY,
      gateway_admission: {
        admission_status: "blocked",
        admission_reason: "account_policy_blocked",
        blocked_reason: "capability_outside_account_policy",
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
    });
  });
});
