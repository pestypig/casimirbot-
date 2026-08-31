import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildHelixMcpEvidenceInventoryAudit,
} from "../scripts/lib/helix-mcp-evidence-capability-inventory";

const workspaceRoot = path.resolve(process.cwd());

describe("Helix MCP evidence capability inventory", () => {
  it("discovers every literal production registration and reports unadopted tools as typed gaps", () => {
    const audit = buildHelixMcpEvidenceInventoryAudit({ workspaceRoot });

    expect(audit.ok).toBe(true);
    expect(audit.unresolved_registrations).toEqual([]);
    expect(audit.orphan_descriptor_tool_names).toEqual([]);
    expect(audit.invalid_descriptor_tool_names).toEqual([]);
    expect(audit.registration_count).toBeGreaterThanOrEqual(audit.unique_tool_count);
    expect(audit.unique_tool_count).toBeGreaterThan(50);
    expect(new Set(audit.tools.map((tool) => tool.mcp_tool_name)).size).toBe(
      audit.unique_tool_count,
    );

    for (const requiredTool of [
      "helix_public_ui_catalog",
      "helix_environment_device_check",
      "helix_run_fetch_evidence",
      "helix_minecraft_actor_status",
      "helix_room_inspect",
    ]) {
      expect(audit.tools.map((tool) => tool.mcp_tool_name)).toContain(requiredTool);
    }

    expect(audit.joined_tool_count).toBe(3);
    expect(audit.gap_tool_count).toBe(audit.unique_tool_count - 3);
    expect(
      audit.tools
        .filter((tool) => tool.descriptor_state === "joined")
        .map((tool) => tool.mcp_tool_name)
        .sort(),
    ).toEqual([
      "helix_environment_device_check",
      "helix_evidence_observation_get",
      "helix_public_ui_catalog",
    ]);
    expect(
      audit.tools
        .filter((tool) => tool.descriptor_state === "gap")
        .every((tool) =>
        tool.gap_reason_codes.includes("mcp_evidence_capability_descriptor_missing"),
      ),
    ).toBe(true);
  });

  it("rejects orphan descriptors instead of claiming catalog identity", () => {
    const audit = buildHelixMcpEvidenceInventoryAudit({
      workspaceRoot,
      descriptors: [
        {
          schema: "helix.mcp_evidence_capability_descriptor.v1",
          capability_id: "test.orphan.inspect",
          capability_version: 1,
          mcp_tool_name: "helix_tool_that_is_not_registered",
          semantic_family: "test.orphan",
          handler_id: "test.orphan.handler",
          handler_contract_version: "test.orphan.handler.v1",
          admission_profiles: [{
            surface: "full_helix_mcp",
            account_scope: "developer",
            required_oauth_scopes: ["helix.agent_runs.read"],
          }],
          permission_class: "read_observe",
          interaction_kind: "observe",
          effect_class: "read_only",
          confirmation_policy: "never",
          observation_schema: "test.orphan.observation.v1",
          observation_retention_class: "current_session",
          reentry_required: true,
          terminal_support_policy: "current_turn_only",
          claim_ceiling: {
            class: "metadata_only",
            description: "Test only.",
          },
        },
      ],
    });

    expect(audit.ok).toBe(false);
    expect(audit.orphan_descriptor_tool_names).toEqual([
      "helix_tool_that_is_not_registered",
    ]);
    expect(audit.failures).toContain(
      "orphan_mcp_evidence_descriptor:helix_tool_that_is_not_registered",
    );
  });
});
