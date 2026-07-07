import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, ".codex-theory-shared-rows.tmp.json");
const cachePath = path.join(root, ".codex-theory-i18n-cache.tmp.json");
const messagesDir = path.join(root, "client/src/lib/i18n/messages");
const serverBase = process.env.CATALOG_FILL_SERVER_BASE ?? "http://127.0.0.1:5050";
const batchSize = Math.max(1, Number.parseInt(process.env.CATALOG_FILL_BATCH_SIZE ?? "5", 10));
const retries = Math.max(0, Number.parseInt(process.env.CATALOG_FILL_RETRIES ?? "2", 10));
const serverWaitMs = Math.max(0, Number.parseInt(process.env.CATALOG_FILL_SERVER_WAIT_MS ?? "180000", 10));
const batchDelayMs = Math.max(0, Number.parseInt(process.env.CATALOG_FILL_BATCH_DELAY_MS ?? "1500", 10));
const localeArg = process.argv.find((arg) => arg.startsWith("--locale="))?.slice("--locale=".length);
const statusOnly = process.argv.includes("--status");
const maxBatches = Math.max(
  0,
  Number.parseInt(process.argv.find((arg) => arg.startsWith("--max-batches="))?.slice("--max-batches=".length) ?? "0", 10),
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
  ["ar", "ar"],
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
  ar: "arMessages",
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

function writeLocaleCatalog(locale, manifestRows, cache) {
  const filePath = path.join(messagesDir, `${locale}.ts`);
  const entries = parseCatalog(filePath);
  for (const row of manifestRows) {
    const translated = cache[cacheKey(locale, row.text)];
    if (typeof translated === "string" && translated.trim()) entries.set(row.id, translated);
  }
  fs.writeFileSync(filePath, renderCatalog(exportNames[locale], entries), "utf8");
}

function countCachedRows(locale, manifestRows, cache) {
  return manifestRows.filter((row) => cache[cacheKey(locale, row.text)]).length;
}

function printStatus(manifestRows, cache, selectedLocales) {
  const summary = Object.fromEntries(
    selectedLocales.map(([locale]) => {
      const catalogPath = path.join(messagesDir, `${locale}.ts`);
      const targetCatalogMessages = fs.existsSync(catalogPath) ? parseCatalog(catalogPath).size : 0;
      return [
        locale,
        {
          theorySharedRows: `${countCachedRows(locale, manifestRows, cache)}/${manifestRows.length}`,
          targetCatalogMessages,
        },
      ];
    }),
  );
  console.log(JSON.stringify(summary, null, 2));
}

async function translateRows({ locale, rows }) {
  const response = await fetch(`${serverBase}/api/docs/translate-units`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      doc_path: "workstation/theory-badge-graph/catalog-fill",
      locale,
      source_hash: "codex-theory-shared-catalog",
      title: "Theory Badge Graph catalog fill",
      units: rows.map((row, index) => ({
        unit_id: `u${index}`,
        kind: "paragraph",
        source_markdown: row.text,
        translatable: true,
        protected_spans: [],
      })),
    }),
  });
  const body = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
  if (!response.ok || body?.ok !== true) {
    throw new Error(`Translation route failed: ${response.status} ${JSON.stringify(body).slice(0, 500)}`);
  }
  const translations = body.result?.translations ?? {};
  const warnings = Array.isArray(body.result?.warnings) ? body.result.warnings : [];
  const checks = Array.isArray(body.result?.checks) ? body.result.checks : [];
  const failing = checks.filter((check) => check?.status === "fail");
  if (failing.length > 0) throw new Error(`Translation checks failed: ${JSON.stringify(failing)}`);
  if (warnings.some((warning) => String(warning).includes("capped"))) {
    throw new Error(`Server capped the batch below requested size: ${warnings.join("; ")}`);
  }
  return rows.map((row, index) => {
    const translated = translations[`u${index}`];
    if (typeof translated !== "string" || !translated.trim()) {
      throw new Error(`Missing translated unit u${index}`);
    }
    return translated.trim();
  });
}

async function waitForServer() {
  const deadline = Date.now() + serverWaitMs;
  let lastError = null;
  while (Date.now() <= deadline) {
    try {
      const response = await fetch(`${serverBase}/desktop`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  if (lastError) throw lastError;
  throw new Error(`Server did not become ready within ${serverWaitMs}ms.`);
}

async function delayBetweenBatches() {
  if (batchDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
}

async function translateRowsWithRetry(params) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await translateRows(params);
    } catch (error) {
      lastError = error;
      if (error instanceof TypeError && String(error.message).includes("fetch failed") && serverWaitMs > 0) {
        console.warn("Translation server unavailable; waiting for it to return.");
        await waitForServer();
      }
      if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function main() {
  const manifestRows = readJson(manifestPath, []);
  if (!Array.isArray(manifestRows) || manifestRows.length === 0) {
    throw new Error(`No manifest rows found at ${manifestPath}`);
  }
  const cache = readJson(cachePath, {});
  const selectedLocales = localeTargets.filter(([locale]) => !localeArg || locale === localeArg);
  if (selectedLocales.length === 0) throw new Error(`Unknown locale: ${localeArg}`);
  if (statusOnly) {
    printStatus(manifestRows, cache, selectedLocales);
    return;
  }

  for (const [locale] of selectedLocales) {
    const missing = manifestRows.filter((row) => !cache[cacheKey(locale, row.text)]);
    console.log(`${locale}: ${manifestRows.length - missing.length}/${manifestRows.length} cached`);
    let completed = 0;
    let batches = 0;
    for (let index = 0; index < missing.length; index += batchSize) {
      if (maxBatches > 0 && batches >= maxBatches) break;
      const rows = missing.slice(index, index + batchSize);
      try {
        const translations = await translateRowsWithRetry({ locale, rows });
        rows.forEach((row, rowIndex) => {
          cache[cacheKey(locale, row.text)] = translations[rowIndex];
        });
      } catch (error) {
        if (isFatalTranslationError(error)) throw error;
        if (rows.length === 1) throw error;
        console.warn(`${locale}: splitting failed batch of ${rows.length}: ${error.message}`);
        for (const row of rows) {
          const [translation] = await translateRowsWithRetry({ locale, rows: [row] });
          cache[cacheKey(locale, row.text)] = translation;
        }
      }
      batches += 1;
      completed += rows.length;
      writeJson(cachePath, cache);
      writeLocaleCatalog(locale, manifestRows, cache);
      console.log(`${locale}: ${completed}/${missing.length} newly filled`);
      await delayBetweenBatches();
    }
    writeLocaleCatalog(locale, manifestRows, cache);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});

function isFatalTranslationError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("translation credentials were rejected") ||
    message.includes("document_translation_unavailable")
  );
}
