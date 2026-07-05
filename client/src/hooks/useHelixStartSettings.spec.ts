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
    expect(normalizeInterfaceLanguageCode("es-MX")).toBe("es");
    expect(normalizeInterfaceLanguageCode("pt_BR")).toBe("pt");
    expect(normalizeInterfaceLanguageCode("zh-Hans-CN")).toBe("zh");
    expect(normalizeInterfaceLanguageCode("ar-EG")).toBe("ar");
    expect(normalizeInterfaceLanguageCode("zz")).toBe("en");
    expect(getInterfaceLanguageOption("haw").translationMode).toBe("procedural_catalog");
    expect(getInterfaceLanguageOption("ar").direction).toBe("rtl");
  });

  it("resolves interface message catalogs with English fallback", () => {
    expect(createInterfaceTextResolver("haw").t("account.language.title")).toBe("\u02bb\u014clelo");
    expect(createInterfaceTextResolver("haw").t("account.header.title")).toBe("Mo\u02bbok\u0101ki a me n\u0101 kau");
    expect(createInterfaceTextResolver("es").t("account.language.interfaceLabel")).toBe("Interface language");
    expect(createInterfaceTextResolver("ar").t("account.language.interfaceLabel")).toBe("Interface language");
    expect(createInterfaceTextResolver("zz").t("account.language.interfaceLabel")).toBe("Interface language");
  });
});
