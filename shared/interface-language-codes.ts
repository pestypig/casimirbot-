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
