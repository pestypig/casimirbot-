import { describe, expect, it } from "vitest";
import { resolveMobileDeviceSignals } from "../mobile-device-detection";

describe("mobile device detection", () => {
  it("accepts authoritative mobile hints and mobile user agents", () => {
    expect(resolveMobileDeviceSignals({ mobileHint: "?1", userAgent: "Desktop" })).toBe(true);
    expect(
      resolveMobileDeviceSignals({
        mobileHint: "?0",
        userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36",
      }),
    ).toBe(true);
  });

  it("recognizes compact touch devices even when the browser reports a desktop user agent", () => {
    expect(
      resolveMobileDeviceSignals({
        mobileHint: "?0",
        userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
        maxTouchPoints: 5,
        viewportWidth: 1280,
        screenWidth: 412,
        screenHeight: 915,
      }),
    ).toBe(true);
  });

  it("does not classify an ordinary desktop or large touch laptop as mobile", () => {
    expect(resolveMobileDeviceSignals({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", viewportWidth: 1440 })).toBe(false);
    expect(
      resolveMobileDeviceSignals({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        maxTouchPoints: 10,
        viewportWidth: 1440,
        screenWidth: 1920,
        screenHeight: 1080,
      }),
    ).toBe(false);
  });
});
