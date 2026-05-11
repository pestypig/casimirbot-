import { describe, expect, it } from "vitest";
import { validateTinySykSafeLanguage } from "../shared/er-epr-tiny-syk-safe-language";

describe("tiny SYK safe language", () => {
  it("rejects forbidden overclaims", () => {
    expect(validateTinySykSafeLanguage("this proves ER=EPR").ok).toBe(false);
    expect(validateTinySykSafeLanguage("real wormhole").ok).toBe(false);
    expect(validateTinySykSafeLanguage("NHM2 propulsion evidence").ok).toBe(false);
    expect(validateTinySykSafeLanguage("CL4 support").ok).toBe(false);
  });

  it("accepts bounded model-internal phrasing", () => {
    const validation = validateTinySykSafeLanguage("model-internal support from a tiny SYK-like toy backend with proxy-only QST boundary");
    expect(validation.ok).toBe(true);
  });
});
