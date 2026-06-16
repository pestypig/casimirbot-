import { hawMessages } from "@/lib/i18n/messages/haw";
import { INTERFACE_MESSAGE_IDS } from "@/lib/i18n/messages/types";

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
    nativeLabel: "\u02bb\u014clelo Hawai\u02bbi",
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

export function isInterfaceLanguageCode(value: unknown): value is InterfaceLanguageCode {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase().replace("_", "-");
  const primary = normalized.split("-")[0] as InterfaceLanguageCode;
  return interfaceLanguageCodes.has(primary);
}

export function getInterfaceLanguageOption(value: unknown): InterfaceLanguageOption {
  const code = normalizeInterfaceLanguageCode(value);
  return INTERFACE_LANGUAGE_OPTIONS.find((option) => option.code === code) ?? INTERFACE_LANGUAGE_OPTIONS[0];
}

export function getInterfaceLanguageReadiness(option: InterfaceLanguageOption): string {
  if (option.translationMode === "source") return option.readiness;
  if (option.code === "haw") {
    return `${Object.keys(hawMessages).length}/${INTERFACE_MESSAGE_IDS.length} catalog strings`;
  }
  return option.readiness;
}
