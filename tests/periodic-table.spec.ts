import { describe, expect, it } from "vitest";

import { ELEMENT_Z_LOOKUP } from "@shared/periodic-table";

describe("ELEMENT_Z_LOOKUP", () => {
  it("covers all 118 elements", () => {
    expect(ELEMENT_Z_LOOKUP).toHaveLength(118);
    expect(ELEMENT_Z_LOOKUP[0]).toEqual({ name: "hydrogen", Z: 1 });
    expect(ELEMENT_Z_LOOKUP[117]).toEqual({ name: "oganesson", Z: 118 });
  });
});
