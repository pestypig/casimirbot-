import { describe, expect, it } from "vitest";

import { HELIX_PUBLIC_UI_CONTROL_CATALOG } from "../helix-public-ui-control-catalog.generated";

const PREFIX =
  "workstation.panel.agent-access.agent-connection-setup.";

describe("reasoning-task binding public control identities", () => {
  it("exposes stable observation controls without making consent agent-executable", () => {
    const controls = HELIX_PUBLIC_UI_CONTROL_CATALOG.filter((entry) =>
      entry.control_id.startsWith(PREFIX),
    );

    expect(controls).toEqual([
      expect.objectContaining({
        control_id: `${PREFIX}reasoning-claim-handle`,
        interaction_kind: "observe",
        authority_state: "client_local",
      }),
      expect.objectContaining({
        control_id: `${PREFIX}bind-current-helix-chat`,
        interaction_kind: "human_only",
        authority_state: "client_local",
      }),
      expect.objectContaining({
        control_id: `${PREFIX}check-reasoning-binding`,
        interaction_kind: "observe",
        authority_state: "client_local",
      }),
      expect.objectContaining({
        control_id: `${PREFIX}revoke-reasoning-binding`,
        interaction_kind: "human_only",
        authority_state: "client_local",
      }),
    ]);
    expect(
      controls.every(
        (entry) => !("capability_id" in entry) && !("route_contract_id" in entry),
      ),
    ).toBe(true);
  });
});
