import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { HELIX_USER_WORKSTATION_PANEL_IDS } from "../helix-account-session";
import {
  HELIX_PUBLIC_UI_AUTHORITY_BINDINGS,
  HELIX_PUBLIC_UI_ROUTE_OWNED_CAPABILITIES,
  HELIX_PUBLIC_UI_SURFACE_CATALOG,
} from "../helix-public-ui-affordance";
import { HELIX_PUBLIC_UI_CONTROL_CATALOG } from "../helix-public-ui-control-catalog.generated";
import {
  buildHelixPublicUiControlInventory,
  HELIX_PUBLIC_UI_SOURCE_SCOPES,
} from "../../scripts/lib/helix-public-ui-control-inventory";

const repoRoot = path.resolve(process.cwd());

describe("Helix public UI control inventory", () => {
  it("keeps source scopes aligned with the public surface catalog", () => {
    const catalogIds = HELIX_PUBLIC_UI_SURFACE_CATALOG.map((entry) => entry.surface_id).sort();
    const scopeIds = HELIX_PUBLIC_UI_SOURCE_SCOPES.map((entry) => entry.surface_id).sort();

    expect(scopeIds).toEqual(catalogIds);
  });

  it("covers every and only public-user workstation panel", () => {
    const catalogPanelIds = HELIX_PUBLIC_UI_SURFACE_CATALOG
      .filter((entry) => entry.family === "workstation_panel")
      .map((entry) => entry.panel_id)
      .sort();

    expect(catalogPanelIds).toEqual([...HELIX_USER_WORKSTATION_PANEL_IDS].sort());
  });

  it("classifies every public policy capability that intentionally bypasses the shared gateway", () => {
    expect(
      HELIX_PUBLIC_UI_AUTHORITY_BINDINGS.map((binding) => binding.capability_id).sort(),
    ).toEqual([...HELIX_PUBLIC_UI_ROUTE_OWNED_CAPABILITIES].sort());
    expect(
      HELIX_PUBLIC_UI_AUTHORITY_BINDINGS.every((binding) =>
        HELIX_PUBLIC_UI_SURFACE_CATALOG.some((surface) => surface.surface_id === binding.surface_id),
      ),
    ).toBe(true);
  });

  it("produces a deterministic, duplicate-free inventory for all public surfaces", () => {
    const inventory = buildHelixPublicUiControlInventory(repoRoot);
    const ids = inventory.map((entry) => entry.control_id);
    const surfaceCounts = Object.fromEntries(
      HELIX_PUBLIC_UI_SURFACE_CATALOG.map((surface) => [
        surface.surface_id,
        inventory.filter((entry) => entry.surface_id === surface.surface_id).length,
      ]),
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(surfaceCounts).toMatchInlineSnapshot(`
      {
        "helix.ask": 64,
        "helix.ask.shared_live_room": 103,
        "workstation.mobile_launcher": 17,
        "workstation.panel.account-session": 29,
        "workstation.panel.agent-access": 2,
        "workstation.panel.agi-task-history": 2,
        "workstation.panel.docs-viewer": 14,
        "workstation.panel.image-lens": 22,
        "workstation.panel.local-harness": 2,
        "workstation.panel.moral-graph": 7,
        "workstation.panel.narrator": 7,
        "workstation.panel.postulate-board": 2,
        "workstation.panel.scientific-calculator": 33,
        "workstation.panel.theory-badge-graph": 57,
        "workstation.panel.workflow-demo-lab": 19,
        "workstation.panel.workstation-clipboard-history": 1,
        "workstation.panel.workstation-notes": 9,
        "workstation.panel.workstation-storage-map": 3,
        "workstation.panel.workstation-task-manager": 1,
        "workstation.shell": 4,
      }
    `);
  });

  it("follows statically analyzable dynamic component imports", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "helix-public-ui-inventory-"));
    const componentsRoot = path.join(tempRoot, "client/src/components/dynamic-fixture");
    fs.mkdirSync(componentsRoot, { recursive: true });
    fs.writeFileSync(
      path.join(componentsRoot, "Root.tsx"),
      'import { lazy } from "react";\nconst Child = lazy(() => import("./Child"));\nexport const Root = () => <Child />;\n',
    );
    fs.writeFileSync(
      path.join(componentsRoot, "Child.tsx"),
      'export const Child = () => <button data-helix-control-id="fixture.dynamic" data-helix-interaction-kind="navigate" data-helix-authority-state="client_local">Open</button>;\n',
    );
    try {
      const inventory = buildHelixPublicUiControlInventory(tempRoot, [{
        surface_id: "workstation.panel.fixture",
        account_scope: "user",
        default_authority_state: "client_local",
        files: ["client/src/components/dynamic-fixture/Root.tsx"],
        follow_component_imports: true,
      }]);
      expect(inventory.map((entry) => entry.locator)).toEqual(["fixture.dynamic"]);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("includes delegated public panel components and freezes the classification distribution", () => {
    const inventory = buildHelixPublicUiControlInventory(repoRoot);
    const interactionCounts = inventory.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.interaction_kind] = (counts[entry.interaction_kind] ?? 0) + 1;
      return counts;
    }, {});
    const authorityCounts = inventory.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.authority_state] = (counts[entry.authority_state] ?? 0) + 1;
      return counts;
    }, {});

    expect(inventory.some((entry) => entry.source_path.endsWith("AgentAccountBindingReadiness.tsx"))).toBe(true);
    expect(inventory.some((entry) => entry.source_path.endsWith("MoralGraphPanel.tsx"))).toBe(true);
    expect(inventory.some((entry) => entry.source_path.endsWith("ScientificCalculatorLiveSourceControls.tsx"))).toBe(true);
    expect(inventory.some((entry) => entry.source_path.endsWith("TheoryAchievementMap.tsx"))).toBe(true);
    expect(interactionCounts).toEqual({
      act: 186,
      configure: 150,
      human_only: 1,
      navigate: 43,
      observe: 18,
    });
    expect(authorityCounts).toEqual({
      blocked_pending_contract: 101,
      client_local: 295,
      route_owned: 2,
    });
    expect(
      inventory.filter((entry) => entry.interaction_kind === "human_only").map((entry) => entry.locator),
    ).toEqual(["workstation.panel.workstation-notes.workstation-notes-panel.button"]);
  });

  it("classifies every control while never inferring gateway or route authority from labels", () => {
    const inventory = buildHelixPublicUiControlInventory(repoRoot);
    const explicitAgentAuthority = inventory.filter((entry) =>
      entry.authority_state === "shared_gateway" || entry.authority_state === "route_owned",
    );

    expect(inventory.every((entry) => entry.authority_state !== "unmapped")).toBe(true);
    expect(explicitAgentAuthority).toHaveLength(2);
    expect(explicitAgentAuthority).toEqual(expect.arrayContaining([
      expect.objectContaining({
        locator: "helix.ask.shared_live_room.shared-live-room-runtime-panel.take-speaking-floor",
        authority_state: "route_owned",
        route_contract_id: "room.floor.acquire",
        authority_classification_source: "route_binding",
      }),
      expect.objectContaining({
        locator: "helix.ask.shared_live_room.shared-live-room-runtime-panel.release-speaking-floor",
        authority_state: "route_owned",
        route_contract_id: "room.floor.release",
        authority_classification_source: "route_binding",
      }),
    ]));
    expect(
      inventory
        .filter((entry) => entry.surface_id === "helix.ask.shared_live_room")
        .filter((entry) => !explicitAgentAuthority.some((authority) => authority.locator === entry.locator))
        .every((entry) => entry.authority_state === "blocked_pending_contract"),
    ).toBe(true);
    expect(inventory.some((entry) => entry.interaction_kind === "act")).toBe(true);
    expect(inventory.some((entry) => entry.interaction_kind === "configure")).toBe(true);
    expect(inventory.some((entry) => entry.interaction_kind === "human_only")).toBe(true);
  });

  it("ratchets stable semantic identity coverage for future public controls", () => {
    const inventory = buildHelixPublicUiControlInventory(repoRoot);
    const missingSemanticIds = inventory.filter((entry) => entry.needs_explicit_semantic_id);

    expect(missingSemanticIds.length).toBe(0);
    expect(inventory.every((entry) => entry.locator_kind === "helix_control_id")).toBe(true);
    expect(new Set(inventory.map((entry) => entry.locator)).size).toBe(inventory.length);
    expect(
      inventory.every((entry) => entry.interaction_classification_source === "explicit"),
    ).toBe(true);
    expect(
      inventory.every((entry) => entry.authority_classification_source !== "surface_default"),
    ).toBe(true);
    expect(
      inventory.find((entry) => entry.locator === "helix.ask.composer.prompt_submit"),
    ).toMatchObject({
      interaction_kind: "act",
      authority_state: "client_local",
      interaction_classification_source: "explicit",
      authority_classification_source: "explicit_safe_state",
      needs_explicit_semantic_id: false,
    });
    expect(
      inventory.find((entry) => entry.locator === "helix.ask.shared_live_room.open_dialog"),
    ).toMatchObject({
      interaction_kind: "navigate",
      authority_state: "blocked_pending_contract",
      interaction_classification_source: "explicit",
      authority_classification_source: "explicit_safe_state",
      needs_explicit_semantic_id: false,
    });
  });

  it("keeps the generated runtime-safe catalog in exact inventory parity", () => {
    const inventoryProjection = buildHelixPublicUiControlInventory(repoRoot).map((entry) => ({
      control_id: entry.locator,
      surface_id: entry.surface_id,
      account_scope: entry.account_scope,
      interaction_kind: entry.interaction_kind,
      authority_state: entry.authority_state,
      ...(entry.capability_id ? { capability_id: entry.capability_id } : {}),
      ...(entry.route_contract_id ? { route_contract_id: entry.route_contract_id } : {}),
    }));
    expect(HELIX_PUBLIC_UI_CONTROL_CATALOG).toEqual(inventoryProjection);
    expect(HELIX_PUBLIC_UI_CONTROL_CATALOG).toHaveLength(398);
    expect(
      HELIX_PUBLIC_UI_CONTROL_CATALOG.every((entry) =>
        Object.keys(entry).every((key) => [
          "control_id",
          "surface_id",
          "account_scope",
          "interaction_kind",
          "authority_state",
          "capability_id",
          "route_contract_id",
        ].includes(key)),
      ),
    ).toBe(true);
  });
});
