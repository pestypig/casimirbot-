export const SHARED_INTERFACE_LANGUAGE_CODES = [
  "en",
  "haw",
  "es",
  "fr",
  "de",
  "pt",
  "ja",
  "ko",
  "zh",
  "ar",
  "wo",
] as const;

export type SharedInterfaceLanguageCode = (typeof SHARED_INTERFACE_LANGUAGE_CODES)[number];

// Account type does not change the available workstation languages. Catalog
// readiness is reported in the UI, but every account can select every catalog.
export const PUBLIC_INTERFACE_LANGUAGE_CODES = SHARED_INTERFACE_LANGUAGE_CODES;

const publicInterfaceLanguageCodes = new Set<SharedInterfaceLanguageCode>(
  PUBLIC_INTERFACE_LANGUAGE_CODES,
);

export const isPublicInterfaceLanguageCode = (
  value: SharedInterfaceLanguageCode,
): boolean => publicInterfaceLanguageCodes.has(value);
