import { describe, expect, it } from "vitest";

import {
  WORKSTATION_LINK_META_CONTRACT_VERSION,
  buildWorkstationEntryUrl,
  encodeWorkstationLinkMetaSearch,
  normalizeWorkstationEntrySurface,
  parseWorkstationLinkMetaFromUrl,
} from "../workstation-link-meta";

describe("workstation link meta", () => {
  it("uses a versioned presentation-only link contract", () => {
    expect(WORKSTATION_LINK_META_CONTRACT_VERSION).toBe(
      "helix.workstation_link_meta.v1",
    );
  });

  it("parses valid entry surfaces and fails safe for invalid values", () => {
    expect(
      parseWorkstationLinkMetaFromUrl("/open?entry=workstation"),
    ).toEqual({ entry: "workstation" });
    expect(parseWorkstationLinkMetaFromUrl("/open?entry=ASK")).toEqual({
      entry: "ask",
    });
    expect(parseWorkstationLinkMetaFromUrl("/open?entry=admin")).toEqual({});
    expect(normalizeWorkstationEntrySurface(undefined)).toBeNull();
  });

  it("encodes entry metadata without disturbing workstation view state", () => {
    expect(
      encodeWorkstationLinkMetaSearch(
        { entry: "workstation" },
        "?panels=docs-viewer&focus=docs-viewer",
      ),
    ).toBe(
      "?panels=docs-viewer&focus=docs-viewer&entry=workstation",
    );
  });

  it("builds adaptive entry links with query and legacy hash state", () => {
    expect(
      buildWorkstationEntryUrl({
        baseUrl: "https://casimirbot.com/",
        search: "?panels=docs-viewer",
        hash: "project=alpha",
        entry: "ask",
      }),
    ).toBe(
      "https://casimirbot.com/open?panels=docs-viewer&entry=ask#project=alpha",
    );
  });
});
