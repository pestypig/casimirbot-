// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { getInterfaceLanguageReadiness, INTERFACE_LANGUAGE_OPTIONS } from "@/lib/i18n/interfaceLanguage";
import { createInterfaceTextResolver } from "@/lib/i18n/interfaceText";
import { enMessages } from "@/lib/i18n/messages/en";
import { hawMessages } from "@/lib/i18n/messages/haw";
import { INTERFACE_TARGET_CATALOGS } from "@/lib/i18n/messages/targetCatalogs";
import {
  INTERFACE_MESSAGE_IDS,
  interfaceSourceMessages,
  type InterfaceMessageId,
} from "@/lib/i18n/messages/types";
import {
  clearWorkstationDebugEvents,
  getWorkstationDebugSnapshot,
  setWorkstationDebugEnabled,
} from "@/lib/helix/workstation-debug";

const placeholderPattern = /\{([a-zA-Z0-9_]+)\}/g;

function placeholders(text: string): string[] {
  return [...text.matchAll(placeholderPattern)].map((match) => match[1]).sort();
}

describe("interface catalog integrity", () => {
  afterEach(() => {
    clearWorkstationDebugEvents();
    setWorkstationDebugEnabled(false);
    localStorage.clear();
  });

  it("derives the message ID list from source metadata and keeps English complete", () => {
    const sourceIds = Object.keys(interfaceSourceMessages).sort();
    expect([...INTERFACE_MESSAGE_IDS].sort()).toEqual(sourceIds);

    for (const id of INTERFACE_MESSAGE_IDS) {
      expect(interfaceSourceMessages[id].id).toBe(id);
      expect(interfaceSourceMessages[id].defaultMessage.trim()).not.toBe("");
      expect(enMessages[id]).toBe(interfaceSourceMessages[id].defaultMessage);
    }
  });

  it("keeps target catalogs schema-bound and placeholder-compatible while partial", () => {
    const sourceIds = new Set<InterfaceMessageId>(INTERFACE_MESSAGE_IDS);

    for (const { code, catalog } of INTERFACE_TARGET_CATALOGS) {
      const option = INTERFACE_LANGUAGE_OPTIONS.find((entry) => entry.code === code);
      expect(option?.translationMode).toBe("procedural_catalog");
      expect(Object.keys(catalog).length).toBeLessThanOrEqual(INTERFACE_MESSAGE_IDS.length);
      expect(option ? getInterfaceLanguageReadiness(option) : "").toBe(
        `${Object.keys(catalog).length}/${INTERFACE_MESSAGE_IDS.length} catalog strings`,
      );

      for (const [id, message] of Object.entries(catalog)) {
        expect(sourceIds.has(id as InterfaceMessageId)).toBe(true);
        expect(message.trim()).not.toBe("");
        expect(placeholders(message)).toEqual(placeholders(enMessages[id as InterfaceMessageId]));
      }
    }
    expect(Object.keys(hawMessages).length).toBeGreaterThan(0);
  });

  it("does not emit fallback debug for unknown IDs without source fallback text", () => {
    setWorkstationDebugEnabled(true);
    clearWorkstationDebugEvents();

    const resolver = createInterfaceTextResolver("haw");
    expect(resolver.t("missing.id" as never)).toBe("missing.id");

    expect(getWorkstationDebugSnapshot().events).toHaveLength(0);
  });

  it("does not emit fallback debug for reviewed Hawaiian entries", () => {
    setWorkstationDebugEnabled(true);
    clearWorkstationDebugEvents();

    const resolver = createInterfaceTextResolver("haw");
    expect(resolver.t("account.language.title")).toBe("ʻŌlelo");
    expect(resolver.t("account.header.title")).toBe("Moʻokāki a me nā kau");
    expect(resolver.t("account.usage.threads")).toBe("Nā thread");

    expect(getWorkstationDebugSnapshot().events).toHaveLength(0);
  });
});
