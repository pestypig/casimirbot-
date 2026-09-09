import { expect, it } from "vitest";
import { helixAgentBudgetSchema } from "../contracts/helix-agent-api.v1";
import { helixConnectorPairingCreateRequestSchema } from "../helix-connector-pairing";
import { helixEnvironmentActionAuthoritySettingsSchema } from "../helix-environment-action";

it("accepts the explicit eight-hour development window at the three separate contracts", () => {
  const durationMs = 8 * 60 * 60 * 1000;
  const budget = helixAgentBudgetSchema.parse({ expires_in_seconds: durationMs / 1000 });
  const pairing = helixConnectorPairingCreateRequestSchema.parse({ purpose: "rotate",
    binding_id: "environment:exact", domain_adapter: "minecraft.player_client.fabric.v1",
    action_credential_requested: true, action_authority_id: "authority:exact",
    credential_ttl_ms: durationMs });
  const authority = helixEnvironmentActionAuthoritySettingsSchema.parse({
    participant_id: "participant:exact", domain_adapter: "minecraft.player_client.fabric.v1",
    allowed_capability_ids: ["walk"], autonomy_mode: "approved_capabilities",
    manual_override_policy: "cancel", expires_at: "2026-09-08T08:00:00.000Z",
  });
  expect(budget.expires_in_seconds * 1000).toBe(pairing.credential_ttl_ms);
  expect(Date.parse(authority.expires_at!) - Date.parse("2026-09-08T00:00:00.000Z")).toBe(durationMs);
  // Parsing one grant must not silently lengthen the independent run default.
  expect(helixAgentBudgetSchema.parse({}).expires_in_seconds).toBe(3600);
});

it("rejects durations beyond each existing finite request ceiling", () => {
  expect(helixAgentBudgetSchema.safeParse({ expires_in_seconds: 7 * 24 * 3600 + 1 }).success).toBe(false);
  expect(helixConnectorPairingCreateRequestSchema.safeParse({
    domain_adapter: "minecraft.fabric_mod.v1", credential_ttl_ms: 30 * 24 * 3600 * 1000 + 1,
  }).success).toBe(false);
});
