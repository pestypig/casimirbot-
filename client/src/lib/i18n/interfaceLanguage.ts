export type InterfaceLanguageCode = "en" | "haw";

export type InterfaceLanguageTranslationMode = "source" | "procedural_catalog";

export type InterfaceLanguageOption = {
  code: InterfaceLanguageCode;
  label: string;
  nativeLabel: string;
  bcp47: string;
  writingSystem: "Latn";
  direction: "ltr";
  translationMode: InterfaceLanguageTranslationMode;
  readiness: string;
};

export const DEFAULT_INTERFACE_LANGUAGE: InterfaceLanguageCode = "en";

export const INTERFACE_LANGUAGE_OPTIONS: InterfaceLanguageOption[] = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    bcp47: "en",
    writingSystem: "Latn",
    direction: "ltr",
    translationMode: "source",
    readiness: "Source UI language",
  },
  {
    code: "haw",
    label: "Hawaiian",
    nativeLabel: "ʻŌlelo Hawaiʻi",
    bcp47: "haw",
    writingSystem: "Latn",
    direction: "ltr",
    translationMode: "procedural_catalog",
    readiness: "Procedural localization seed",
  },
];

const interfaceLanguageCodes = new Set<InterfaceLanguageCode>(
  INTERFACE_LANGUAGE_OPTIONS.map((option) => option.code),
);

export function normalizeInterfaceLanguageCode(value: unknown): InterfaceLanguageCode {
  if (typeof value !== "string") return DEFAULT_INTERFACE_LANGUAGE;
  const normalized = value.trim().toLowerCase().replace("_", "-");
  const primary = normalized.split("-")[0] as InterfaceLanguageCode;
  return interfaceLanguageCodes.has(primary) ? primary : DEFAULT_INTERFACE_LANGUAGE;
}

export function getInterfaceLanguageOption(value: unknown): InterfaceLanguageOption {
  const code = normalizeInterfaceLanguageCode(value);
  return INTERFACE_LANGUAGE_OPTIONS.find((option) => option.code === code) ?? INTERFACE_LANGUAGE_OPTIONS[0];
}
