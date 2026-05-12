import { describe, expect, it } from "vitest";
import { validateTinySykValidationSafeLanguage } from "../shared/er-epr-tiny-syk-validation-safe-language";

describe("tiny SYK validation safe language", () => {
  it("rejects forbidden overclaims", () => {
    expect(validateTinySykValidationSafeLanguage("proves ER=EPR").ok).toBe(false);
    expect(validateTinySykValidationSafeLanguage("real wormhole").ok).toBe(false);
    expect(validateTinySykValidationSafeLanguage("traversable wormhole created").ok).toBe(false);
    expect(validateTinySykValidationSafeLanguage("NHM2 propulsion evidence").ok).toBe(false);
    expect(validateTinySykValidationSafeLanguage("CL4 support").ok).toBe(false);
  });

  it("accepts bounded validation language", () => {
    expect(validateTinySykValidationSafeLanguage("model-internal validation support observed with proxy-only QST boundary").ok).toBe(true);
  });
});
