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

// Only catalogs that pass the strict completeness and exact-English coverage
// gate are exposed to public accounts. Developer accounts retain the full set
// so localization work can continue without becoming a public product promise.
export const PUBLIC_INTERFACE_LANGUAGE_CODES = [
  "en",
  "de",
  "ar",
] as const satisfies readonly SharedInterfaceLanguageCode[];

const publicInterfaceLanguageCodes = new Set<SharedInterfaceLanguageCode>(
  PUBLIC_INTERFACE_LANGUAGE_CODES,
);

export const isPublicInterfaceLanguageCode = (
  value: SharedInterfaceLanguageCode,
): boolean => publicInterfaceLanguageCodes.has(value);
