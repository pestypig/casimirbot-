// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { INTERFACE_LANGUAGE_OPTIONS } from "@/lib/i18n/interfaceLanguage";
import { createInterfaceTextResolver } from "@/lib/i18n/interfaceText";
import { enMessages } from "@/lib/i18n/messages/en";
import { hawMessages } from "@/lib/i18n/messages/haw";
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

  it("keeps Hawaiian partial, schema-bound, and placeholder-compatible", () => {
    const sourceIds = new Set<InterfaceMessageId>(INTERFACE_MESSAGE_IDS);
    const hawOption = INTERFACE_LANGUAGE_OPTIONS.find((option) => option.code === "haw");

    expect(hawOption?.translationMode).toBe("procedural_catalog");
    expect(Object.keys(hawMessages).length).toBeLessThan(INTERFACE_MESSAGE_IDS.length);

    for (const [id, message] of Object.entries(hawMessages)) {
      expect(sourceIds.has(id as InterfaceMessageId)).toBe(true);
      expect(message.trim()).not.toBe("");
      expect(placeholders(message)).toEqual(placeholders(enMessages[id as InterfaceMessageId]));
    }
  });

  it("emits a debug event when a partial target catalog falls back to English", () => {
    setWorkstationDebugEnabled(true);
    clearWorkstationDebugEvents();

    const resolver = createInterfaceTextResolver("haw");
    expect(resolver.t("account.header.title")).toBe("Account & Sessions");

    expect(getWorkstationDebugSnapshot().events.at(-1)).toMatchObject({
      channel: "interface_i18n",
      action: "message.fallback_used",
      detail: {
        language: "haw",
        message_id: "account.header.title",
        fallback_language: "en",
        source_surface: "account-session",
      },
    });
  });

  it("does not emit fallback debug for reviewed Hawaiian entries", () => {
    setWorkstationDebugEnabled(true);
    clearWorkstationDebugEvents();

    const resolver = createInterfaceTextResolver("haw");
    expect(resolver.t("account.language.title")).toBe("ʻŌlelo");

    expect(getWorkstationDebugSnapshot().events).toHaveLength(0);
  });
});
