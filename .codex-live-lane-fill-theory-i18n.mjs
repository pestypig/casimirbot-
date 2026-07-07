import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, ".codex-theory-shared-rows.tmp.json");
const cachePath = path.join(root, ".codex-theory-i18n-cache.tmp.json");
const messagesDir = path.join(root, "client/src/lib/i18n/messages");
const serverBase = process.env.CATALOG_FILL_SERVER_BASE ?? "http://127.0.0.1:5050";
const batchSize = Number.parseInt(process.env.CATALOG_FILL_BATCH_SIZE ?? "60", 10);
const concurrency = Math.max(1, Number.parseInt(process.env.CATALOG_FILL_CONCURRENCY ?? "3", 10));
const retries = Math.max(0, Number.parseInt(process.env.CATALOG_FILL_RETRIES ?? "2", 10));
const localeArg = process.argv.find((arg) => arg.startsWith("--locale="))?.slice("--locale=".length);
const maxBatches = Number.parseInt(
  process.argv.find((arg) => arg.startsWith("--max-batches="))?.slice("--max-batches=".length) ?? "0",
  10,
);

const localeTargets = [
  ["haw", "haw"],
  ["es", "es"],
  ["fr", "fr"],
  ["de", "de"],
  ["pt", "pt-BR"],
  ["ja", "ja"],
  ["ko", "ko"],
  ["zh", "zh-Hans"],
  ["wo", "wo"],
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

function rowLine(index, text) {
  return `[[CBT:${index}]]\t${text.replace(/\s+/g, " ").trim()}`;
}

function parseBatchTranslation(output, expectedRows) {
  const parsed = new Map();
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^\s*\[\[CBT:(\d+)\]\]\s*(.*)$/);
    if (!match) continue;
    parsed.set(Number(match[1]), match[2].trim());
  }
  const missing = expectedRows.filter((row, index) => !parsed.get(index) && row.text.trim());
  if (missing.length > 0) {
    throw new Error(`Batch output missed ${missing.length}/${expectedRows.length} IDs.`);
  }
  return expectedRows.map((row, index) => parsed.get(index) || row.text);
}

async function signIn() {
  const response = await fetch(`${serverBase}/api/account/session/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_id: "codex-catalog-fill",
      display_name: "Codex Catalog Fill",
      account_type: "developer",
    }),
  });
  if (!response.ok) {
    throw new Error(`Developer session sign-in failed: ${response.status} ${await response.text()}`);
  }
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("Developer session sign-in did not return a session cookie.");
  return cookie.split(";")[0];
}

async function translateBatch({ cookie, locale, targetLanguage, rows, batchIndex }) {
  const text = rows.map((row, index) => rowLine(index, row.text)).join("\n");
  const response = await fetch(`${serverBase}/api/agi/capability-lanes/one-shot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      turn_id: `codex-catalog-fill-${locale}-${Date.now()}-${batchIndex}`,
      agent_runtime: "codex",
      capability_lane_call: {
        capability: "live_translation.translate_text",
        text,
        source_language: "en",
        target_language: targetLanguage,
        requested_backend_provider: "openai_compatible",
        source_id: "workstation:theory-badge-graph",
        source_hash: "codex-theory-shared-catalog",
        chunkId: `catalog-fill-${locale}-${batchIndex}`,
        chunkIndex: batchIndex,
        projection_target: "account_language",
        account_locale: locale,
      },
    }),
  });
  const body = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
  if (!response.ok || body?.requested !== true) {
    throw new Error(`Lane request failed for ${locale}: ${response.status} ${JSON.stringify(body).slice(0, 500)}`);
  }
  const result = body.call_results?.[0];
  const translated = typeof result?.translated_text === "string" ? result.translated_text : "";
  if (!translated) {
    throw new Error(`Lane request for ${locale} returned no translated_text.`);
  }
  if (result?.selected_runtime_agent_provider !== "codex") {
    throw new Error(`Expected codex runtime, got ${result?.selected_runtime_agent_provider ?? "unknown"}.`);
  }
  return parseBatchTranslation(translated, rows);
}

async function translateBatchWithRetry(params) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await translateBatch(params);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
      }
    }
  }
  throw lastError;
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

async function main() {
  const manifestRows = readJson(manifestPath, []);
  if (!Array.isArray(manifestRows) || manifestRows.length === 0) {
    throw new Error(`No manifest rows found at ${manifestPath}`);
  }
  const cache = readJson(cachePath, {});
  const selectedLocales = localeTargets.filter(([locale]) => !localeArg || locale === localeArg);
  if (selectedLocales.length === 0) throw new Error(`Unknown locale: ${localeArg}`);
  const cookie = await signIn();

  for (const [locale, targetLanguage] of selectedLocales) {
    const missing = manifestRows.filter((row) => !cache[cacheKey(locale, row.text)]);
    console.log(`${locale}: ${manifestRows.length - missing.length}/${manifestRows.length} cached`);
    const batches = [];
    for (let index = 0; index < missing.length; index += batchSize) {
      if (maxBatches > 0 && batches.length >= maxBatches) break;
      batches.push({ index, rows: missing.slice(index, index + batchSize) });
    }
    let nextBatch = 0;
    let completedRows = 0;
    const runBatch = async (batch) => {
      const { index, rows } = batch;
      try {
        const translations = await translateBatchWithRetry({
          cookie,
          locale,
          targetLanguage,
          rows,
          batchIndex: Math.floor(index / batchSize),
        });
        rows.forEach((row, rowIndex) => {
          cache[cacheKey(locale, row.text)] = translations[rowIndex];
        });
      } catch (error) {
        if (rows.length === 1) throw error;
        console.warn(`${locale}: splitting failed batch of ${rows.length}: ${error.message}`);
        for (const row of rows) {
          const [translation] = await translateBatchWithRetry({
            cookie,
            locale,
            targetLanguage,
            rows: [row],
            batchIndex: Math.floor(index / batchSize),
          });
          cache[cacheKey(locale, row.text)] = translation;
        }
      }
      completedRows += rows.length;
      writeJson(cachePath, cache);
      writeLocaleCatalog(locale, manifestRows, cache);
      console.log(`${locale}: ${completedRows}/${missing.length} newly filled`);
    };
    const worker = async () => {
      while (nextBatch < batches.length) {
        const batch = batches[nextBatch];
        nextBatch += 1;
        await runBatch(batch);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(concurrency, batches.length) }, () => worker()),
    );
    if (batches.length === 0) {
      writeLocaleCatalog(locale, manifestRows, cache);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
