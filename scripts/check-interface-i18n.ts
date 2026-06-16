import { INTERFACE_LANGUAGE_OPTIONS } from "../client/src/lib/i18n/interfaceLanguage";
import { hawMessages } from "../client/src/lib/i18n/messages/haw";
import { enMessages } from "../client/src/lib/i18n/messages/en";
import {
  INTERFACE_MESSAGE_IDS,
  interfaceSourceMessages,
  type InterfaceMessageId,
  type InterfaceTargetCatalog,
} from "../client/src/lib/i18n/messages/types";

type Issue = {
  level: "error" | "warning";
  message: string;
};

const placeholderPattern = /\{([a-zA-Z0-9_]+)\}/g;

function placeholders(text: string): string[] {
  return [...text.matchAll(placeholderPattern)].map((match) => match[1]).sort();
}

function hasBalancedBraces(text: string): boolean {
  let depth = 0;
  for (const char of text) {
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function compareArrays(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function auditTargetCatalog(args: {
  locale: "haw";
  catalog: InterfaceTargetCatalog<InterfaceMessageId>;
  source: Record<InterfaceMessageId, string>;
}): Issue[] {
  const issues: Issue[] = [];
  const sourceIds = new Set(INTERFACE_MESSAGE_IDS);
  for (const id of Object.keys(args.catalog)) {
    if (!sourceIds.has(id as InterfaceMessageId)) {
      issues.push({ level: "error", message: `${args.locale}: orphan target message id ${id}` });
    }
  }

  for (const id of INTERFACE_MESSAGE_IDS) {
    const target = args.catalog[id];
    if (target === undefined) continue;
    if (!target.trim()) {
      issues.push({ level: "error", message: `${args.locale}: empty translation for ${id}` });
    }
    if (!hasBalancedBraces(target)) {
      issues.push({ level: "error", message: `${args.locale}: invalid brace pattern for ${id}` });
    }
    const sourcePlaceholders = placeholders(args.source[id]);
    const targetPlaceholders = placeholders(target);
    if (!compareArrays(sourcePlaceholders, targetPlaceholders)) {
      issues.push({
        level: "error",
        message: `${args.locale}: placeholder mismatch for ${id}; source=${sourcePlaceholders.join(",")} target=${targetPlaceholders.join(",")}`,
      });
    }
    if (args.locale === "haw" && /[A-Za-z]'[A-Za-z]/.test(target)) {
      issues.push({
        level: "error",
        message: `${args.locale}: ASCII apostrophe found inside Hawaiian word for ${id}; use okina U+02BB when intended`,
      });
    }
  }
  return issues;
}

const sourceIds = new Set(INTERFACE_MESSAGE_IDS);
const metaIds = new Set(Object.keys(interfaceSourceMessages));
const issues: Issue[] = [];

for (const id of sourceIds) {
  const meta = interfaceSourceMessages[id];
  if (!metaIds.has(id)) {
    issues.push({ level: "error", message: `missing source metadata for ${id}` });
  }
  if (meta.id !== id) {
    issues.push({ level: "error", message: `source metadata id mismatch for ${id}` });
  }
  if (!meta.defaultMessage.trim()) {
    issues.push({ level: "error", message: `empty default English source message for ${id}` });
  }
  if (!hasBalancedBraces(meta.defaultMessage)) {
    issues.push({ level: "error", message: `invalid brace pattern in source message ${id}` });
  }
  const declaredPlaceholders = Object.keys(meta.placeholders ?? {}).sort();
  const actualPlaceholders = placeholders(meta.defaultMessage);
  if (!compareArrays(declaredPlaceholders, actualPlaceholders)) {
    issues.push({
      level: "error",
      message: `source placeholder metadata mismatch for ${id}; declared=${declaredPlaceholders.join(",")} actual=${actualPlaceholders.join(",")}`,
    });
  }
  if (enMessages[id] !== meta.defaultMessage) {
    issues.push({ level: "error", message: `English catalog drift for ${id}` });
  }
}

for (const id of Object.keys(enMessages)) {
  if (!sourceIds.has(id as InterfaceMessageId)) {
    issues.push({ level: "error", message: `English catalog orphan message id ${id}` });
  }
}

issues.push(
  ...auditTargetCatalog({
    locale: "haw",
    catalog: hawMessages,
    source: enMessages,
  }),
);

const hawReviewed = Object.keys(hawMessages).length;
const total = INTERFACE_MESSAGE_IDS.length;
const hawOption = INTERFACE_LANGUAGE_OPTIONS.find((option) => option.code === "haw");
if (hawOption?.translationMode !== "procedural_catalog") {
  issues.push({ level: "error", message: "haw option must remain procedural_catalog while partial" });
}
if (hawReviewed < total && hawOption?.readiness.toLowerCase().includes("complete")) {
  issues.push({ level: "error", message: "haw readiness cannot claim complete coverage while catalog is partial" });
}

const errors = issues.filter((issue) => issue.level === "error");
const summary = {
  ok: errors.length === 0,
  source_messages: total,
  haw_catalog_messages: hawReviewed,
  issues,
};

if (errors.length > 0) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(summary, null, 2));
