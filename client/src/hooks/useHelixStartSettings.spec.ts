import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./useHelixStartSettings";
import { getInterfaceLanguageOption, normalizeInterfaceLanguageCode } from "@/lib/i18n/interfaceLanguage";
import { createInterfaceTextResolver } from "@/lib/i18n/interfaceText";

describe("Helix Start settings defaults", () => {
  it("keeps the legacy Helix Ask observer lane opt-in", () => {
    expect(DEFAULT_SETTINGS.showHelixAskObserverLane).toBe(false);
  });

  it("keeps Dottie voice debug clips separate from the legacy observer lane", () => {
    expect(DEFAULT_SETTINGS.showDottieVoiceDebugClips).toBe(false);
    expect(DEFAULT_SETTINGS.showHelixAskObserverLane).toBe(false);
  });

  it("defaults the interface language to source English", () => {
    expect(DEFAULT_SETTINGS.interfaceLanguage).toBe("en");
  });

  it("normalizes interface language tags to supported catalog roots", () => {
    expect(normalizeInterfaceLanguageCode("haw-US")).toBe("haw");
    expect(normalizeInterfaceLanguageCode("en_US")).toBe("en");
    expect(normalizeInterfaceLanguageCode("zz")).toBe("en");
    expect(getInterfaceLanguageOption("haw").translationMode).toBe("procedural_catalog");
  });

  it("resolves interface message catalogs with English fallback", () => {
    expect(createInterfaceTextResolver("haw").t("account.language.title")).toBe("\u02bb\u014clelo");
    expect(createInterfaceTextResolver("haw").t("account.header.title")).toBe("Account & Sessions");
    expect(createInterfaceTextResolver("zz").t("account.language.interfaceLabel")).toBe("Interface language");
  });
});
