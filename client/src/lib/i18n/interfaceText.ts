import * as React from "react";
import {
  DEFAULT_INTERFACE_LANGUAGE,
  normalizeInterfaceLanguageCode,
  type InterfaceLanguageCode,
} from "@/lib/i18n/interfaceLanguage";
import { enMessages } from "@/lib/i18n/messages/en";
import { hawMessages } from "@/lib/i18n/messages/haw";
import type {
  InterfaceMessageCatalog,
  InterfaceMessageId,
  InterfaceMessageValues,
} from "@/lib/i18n/messages/types";

const interfaceMessageCatalogs: Record<InterfaceLanguageCode, InterfaceMessageCatalog> = {
  en: enMessages,
  haw: hawMessages,
};

const interpolationPattern = /\{([a-zA-Z0-9_]+)\}/g;

export type InterfaceTextResolver = {
  language: InterfaceLanguageCode;
  t: (id: InterfaceMessageId, values?: InterfaceMessageValues) => string;
};

function formatMessage(template: string, values?: InterfaceMessageValues): string {
  if (!values) return template;
  return template.replace(interpolationPattern, (match, key: string) => {
    const value = values[key];
    return value === null || value === undefined ? match : String(value);
  });
}

export function createInterfaceTextResolver(languageValue: unknown): InterfaceTextResolver {
  const language = normalizeInterfaceLanguageCode(languageValue);
  const catalog = interfaceMessageCatalogs[language] ?? interfaceMessageCatalogs[DEFAULT_INTERFACE_LANGUAGE];
  const fallbackCatalog = interfaceMessageCatalogs[DEFAULT_INTERFACE_LANGUAGE];
  return {
    language,
    t: (id, values) => formatMessage(catalog[id] ?? fallbackCatalog[id] ?? id, values),
  };
}

export function useInterfaceText(languageValue: unknown): InterfaceTextResolver {
  return React.useMemo(() => createInterfaceTextResolver(languageValue), [languageValue]);
}
