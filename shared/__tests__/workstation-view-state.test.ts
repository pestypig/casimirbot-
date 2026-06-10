import { describe, expect, it } from "vitest";

import {
  WORKSTATION_VIEW_STATE_CONTRACT_VERSION,
  buildWorkstationDocViewState,
  buildWorkstationPanelViewState,
  coerceWorkstationViewState,
  coerceWorkstationViewStateFromPathInput,
  encodeWorkstationViewStateSearch,
  normalizeWorkstationDocPath,
} from "../workstation-view-state";

describe("workstation view state contract", () => {
  it("uses the canonical contract version", () => {
    expect(WORKSTATION_VIEW_STATE_CONTRACT_VERSION).toBe("helix.workstation_view_state.v1");
  });

  it("builds panel view state with workspace-relative path refs", () => {
    expect(buildWorkstationPanelViewState("docs-viewer", "Docs & Papers")).toEqual({
      panels: ["docs-viewer"],
      focusPanel: "docs-viewer",
      pathRef: {
        root: "workspace",
        relativePath: "panels/docs-viewer",
        displaySegments: ["Workspace", "Panels", "Docs & Papers"],
        virtualUri: "workspace://workspace/panels/docs-viewer",
      },
    });
  });

  it("normalizes docs and rejects raw absolute local paths", () => {
    expect(normalizeWorkstationDocPath("/docs/foo.md")).toBe("docs/foo.md");
    expect(normalizeWorkstationDocPath("foo.md")).toBe("docs/foo.md");
    expect(normalizeWorkstationDocPath("C:\\Users\\dan\\secret.md")).toBeNull();
  });

  it("coerces docs paths and panels without exposing raw paths", () => {
    const resolvePanelId = (value: string) => (value === "docs" ? "docs-viewer" : value === "docs-viewer" ? value : null);
    expect(coerceWorkstationViewStateFromPathInput("workspace://workspace/panels/docs", { resolvePanelId })).toMatchObject({
      panels: ["docs-viewer"],
      focusPanel: "docs-viewer",
      pathRef: {
        relativePath: "panels/docs-viewer",
      },
    });
    expect(coerceWorkstationViewStateFromPathInput("docs/a/b.md#intro", { resolvePanelId })).toMatchObject({
      panels: ["docs-viewer"],
      focusPanel: "docs-viewer",
      activeDocPath: "docs/a/b.md",
      anchor: "intro",
    });
    expect(coerceWorkstationViewStateFromPathInput("C:\\Users\\dan\\secret.md", { resolvePanelId })).toBeNull();
  });

  it("coerces safe object payloads for agent restore actions", () => {
    expect(
      coerceWorkstationViewState({
        panels: ["docs-viewer"],
        focusPanel: "docs-viewer",
        activeDocPath: "/docs/papers.md",
      }),
    ).toMatchObject({
      panels: ["docs-viewer"],
      focusPanel: "docs-viewer",
      activeDocPath: "docs/papers.md",
      pathRef: {
        relativePath: "docs/papers.md",
      },
    });
    expect(coerceWorkstationViewState({ activeDocPath: "C:\\Users\\dan\\secret.md" })).toBeNull();
  });

  it("encodes only canonical query params", () => {
    expect(
      encodeWorkstationViewStateSearch(
        buildWorkstationDocViewState("docs/foo.md", "overview") ?? { panels: [] },
        "?legacy=1",
      ),
    ).toBe("?legacy=1&panels=docs-viewer&focus=docs-viewer&doc=docs%2Ffoo.md&anchor=overview");
  });
});
