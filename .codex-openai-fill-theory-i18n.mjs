import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, ".codex-theory-shared-rows.tmp.json");
const cachePath = path.join(root, ".codex-theory-i18n-cache.tmp.json");
const messagesDir = path.join(root, "client/src/lib/i18n/messages");
const envPath = path.join(root, ".env");
const batchSize = Number.parseInt(process.env.CATALOG_FILL_BATCH_SIZE ?? "80", 10);
const retries = Math.max(0, Number.parseInt(process.env.CATALOG_FILL_RETRIES ?? "2", 10));
const localeArg = process.argv.find((arg) => arg.startsWith("--locale="))?.slice("--locale=".length);
const maxBatches = Number.parseInt(
  process.argv.find((arg) => arg.startsWith("--max-batches="))?.slice("--max-batches=".length) ?? "0",
  10,
);

const localeTargets = [
  ["haw", "Hawaiian (ʻŌlelo Hawaiʻi)"],
  ["es", "Spanish"],
  ["fr", "French"],
  ["de", "German"],
  ["pt", "Portuguese (Brazil)"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["zh", "Simplified Chinese"],
  ["wo", "Wolof"],
];

const exportNames = {
  haw: "hawMessages",
  es: "esMessages",
  fr: "frMessages",
  de: "deMessages",
  pt: "ptMessages",
  ja: "jaMessages",
  ko: "koMessages",
  zh: "zhMessages",
  wo: "woMessages",
};

function loadDotEnv() {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    if (process.env[key]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseCatalog(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const entries = new Map();
  const re = /  "([^"]+)":\s*"((?:\\.|[^"\\])*)",/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    entries.set(match[1], JSON.parse(`"${match[2]}"`));
  }
  return entries;
}

function renderCatalog(exportName, entries) {
  const lines = [
    'import type { InterfaceMessageId, InterfaceTargetCatalog } from "@/lib/i18n/messages/types";',
    "",
    `export const ${exportName} = {`,
  ];
  for (const [key, value] of entries) {
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
  }
  lines.push("} as const satisfies InterfaceTargetCatalog<InterfaceMessageId>;", "");
  return lines.join("\n");
}

function cacheKey(locale, text) {
  return `${locale}\0${text}`;
}

function parseJsonObject(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([^]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

function writeLocaleCatalog(locale, manifestRows, cache) {
  const filePath = path.join(messagesDir, `${locale}.ts`);
  const entries = parseCatalog(filePath);
  for (const row of manifestRows) {
    const translated = cache[cacheKey(locale, row.text)];
    if (typeof translated === "string" && translated.trim()) {
      entries.set(row.id, translated);
    }
  }
  fs.writeFileSync(filePath, renderCatalog(exportNames[locale], entries), "utf8");
}

async function requestBatch({ locale, targetLanguage, rows }) {
  const providerBase = (
    process.env.LIVE_TRANSLATION_OPENAI_BASE ||
    process.env.DOC_TRANSLATION_BASE ||
    process.env.LLM_HTTP_BASE ||
    "https://api.openai.com"
  ).trim();
  const apiKey = (
    process.env.LIVE_TRANSLATION_OPENAI_API_KEY ||
    process.env.DOC_TRANSLATION_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.LLM_HTTP_API_KEY ||
    ""
  ).trim();
  const model = (
    process.env.LIVE_TRANSLATION_OPENAI_MODEL ||
    process.env.DOC_TRANSLATION_MODEL ||
    process.env.LLM_HTTP_MODEL ||
    "gpt-4o-mini"
  ).trim();
  if (!apiKey && providerBase.replace(/\/+$/, "") === "https://api.openai.com") {
    throw new Error("OpenAI-compatible translation key is not configured.");
  }
  const response = await fetch(`${providerBase.replace(/\/+$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Translate interface catalog strings from English into the requested target language. Return only compact JSON. Preserve IDs, formulas, code, variables, URLs, file paths, symbols, and product names exactly. Translate human-readable titles and sentences. Do not omit rows.",
        },
        {
          role: "user",
          content: JSON.stringify({
            schema: "casimir.interface_catalog_batch_translation.v1",
            target_language: targetLanguage,
            locale,
            output_shape: {
              translations: [
                {
                  id: "same id from input",
                  text: "translated text",
                },
              ],
            },
            rows: rows.map((row) => ({ id: row.id, text: row.text })),
          }),
        },
      ],
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Provider returned ${response.status}${text ? `: ${text.slice(0, 400)}` : ""}`);
  }
  const body = await response.json();
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Provider response did not include content.");
  }
  const parsed = parseJsonObject(content);
  const translations = Array.isArray(parsed.translations) ? parsed.translations : [];
  const byId = new Map(
    translations
      .filter((entry) => entry && typeof entry.id === "string" && typeof entry.text === "string")
      .map((entry) => [entry.id, entry.text.trim()]),
  );
  const missing = rows.filter((row) => !byId.get(row.id));
  if (missing.length) {
    throw new Error(`Provider missed ${missing.length}/${rows.length} rows.`);
  }
  return rows.map((row) => byId.get(row.id) || row.text);
}

async function requestBatchWithRetry(params) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestBatch(params);
    } catch (error) {
      lastError = error;
      if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function main() {
  loadDotEnv();
  const manifestRows = readJson(manifestPath, []);
  const cache = readJson(cachePath, {});
  const selectedLocales = localeTargets.filter(([locale]) => !localeArg || locale === localeArg);
  if (selectedLocales.length === 0) throw new Error(`Unknown locale: ${localeArg}`);

  for (const [locale, targetLanguage] of selectedLocales) {
    const missing = manifestRows.filter((row) => !cache[cacheKey(locale, row.text)]);
    console.log(`${locale}: ${manifestRows.length - missing.length}/${manifestRows.length} cached`);
    let done = 0;
    for (let index = 0; index < missing.length; index += batchSize) {
      if (maxBatches > 0 && done / batchSize >= maxBatches) break;
      const rows = missing.slice(index, index + batchSize);
      try {
        const translations = await requestBatchWithRetry({ locale, targetLanguage, rows });
        rows.forEach((row, rowIndex) => {
          cache[cacheKey(locale, row.text)] = translations[rowIndex];
        });
      } catch (error) {
        if (rows.length === 1) throw error;
        console.warn(`${locale}: splitting failed batch of ${rows.length}: ${error.message}`);
        for (const row of rows) {
          const [translation] = await requestBatchWithRetry({ locale, targetLanguage, rows: [row] });
          cache[cacheKey(locale, row.text)] = translation;
        }
      }
      done += rows.length;
      writeJson(cachePath, cache);
      writeLocaleCatalog(locale, manifestRows, cache);
      console.log(`${locale}: ${done}/${missing.length} newly filled`);
    }
    writeLocaleCatalog(locale, manifestRows, cache);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
