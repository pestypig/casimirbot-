import { describe, expect, it } from "vitest";
import {
  HELIX_ROBINHOOD_READ_CAPABILITY_IDS,
  HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS,
  helixBrokerageConnectionSchema,
} from "../helix-brokerage-environment";
import {
  HELIX_DEVELOPER_ACCOUNT_POLICY,
  HELIX_USER_ACCOUNT_POLICY,
} from "../helix-account-session";

describe("Robinhood brokerage environment contract", () => {
  it("freezes an immutable read-only capability and upstream-tool set", () => {
    expect(HELIX_ROBINHOOD_READ_CAPABILITY_IDS.length).toBeGreaterThan(0);
    expect(
      HELIX_ROBINHOOD_READ_CAPABILITY_IDS.every((id) => id.endsWith(".read")),
    ).toBe(true);
    expect(HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS).not.toContain(
      "get_accounts",
    );
    expect(HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/place|cancel|review|option/iu),
      ]),
    );
  });

  it("rejects credentials and raw provider fields from connection projections", () => {
    const projection = {
      schema: "helix.brokerage_connection.v1",
      connection_id: "brokerage_connection:test",
      provider: "robinhood",
      environment_domain: "brokerage",
      status: "connected",
      account_selection_status: "pending",
      provider_account_label: null,
      capability_ids: [...HELIX_ROBINHOOD_READ_CAPABILITY_IDS],
      read_only: true,
      upstream_tool_execution_enabled: false,
      live_order_execution_enabled: false,
      connected_at: "2026-08-11T12:00:00.000Z",
      credential_expires_at: null,
      updated_at: "2026-08-11T12:00:00.000Z",
      credential_included: false,
      account_numbers_included: false,
      raw_provider_payload_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    expect(helixBrokerageConnectionSchema.safeParse(projection).success).toBe(
      true,
    );
    expect(
      helixBrokerageConnectionSchema.safeParse({
        ...projection,
        access_token: "must-never-project",
      }).success,
    ).toBe(false);
    expect(
      helixBrokerageConnectionSchema.safeParse({
        ...projection,
        live_order_execution_enabled: true,
      }).success,
    ).toBe(false);
  });

  it("keeps the environment developer-only at the account-policy boundary", () => {
    expect(HELIX_DEVELOPER_ACCOUNT_POLICY.feature_flags).toContain(
      "brokerage_environment",
    );
    expect(HELIX_DEVELOPER_ACCOUNT_POLICY.locked_features).not.toContain(
      "brokerage_environment",
    );
    expect(HELIX_USER_ACCOUNT_POLICY.feature_flags).not.toContain(
      "brokerage_environment",
    );
    expect(HELIX_USER_ACCOUNT_POLICY.locked_features).toContain(
      "brokerage_environment",
    );
  });
});
