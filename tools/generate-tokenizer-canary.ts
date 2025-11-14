#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { loadTokenizerAssets, tokenize } from "../shared/tokenizers/bpe";

type RegistryEntry = {
  id: string;
  tokenizerJson: string;
  merges?: string | null;
  canary?: string | null;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.resolve(repoRoot, "server/config/tokenizer-registry.json");
const registry = loadRegistry(registryPath);
const tokenizerId = process.argv[2] ?? "mock-helix-local";
const entry = registry.get(tokenizerId);
if (!entry) {
  throw new Error(`tokenizer "${tokenizerId}" not found in ${registryPath}`);
}

const tokenizerPath = path.resolve(repoRoot, entry.tokenizerJson);
const mergesPath = entry.merges ? path.resolve(repoRoot, entry.merges) : undefined;
const canaryPath = entry.canary ? path.resolve(repoRoot, entry.canary) : path.resolve(repoRoot, "tests/fixtures/tokenizer-canary.json");

const prompt =
  process.env.CANARY_PROMPT ??
  "Helix core token budget check. Stay within guardrails.";

const assets = loadTokenizerAssets(tokenizerPath, mergesPath);
const tokens = tokenize(prompt, assets);
const payload = {
  tokenizerId,
  prompt,
  prompt_hash: `sha256:${hashText(prompt)}`,
  tokenizer_hash: `sha256:${hashFile(tokenizerPath)}`,
  merges_hash: mergesPath ? `sha256:${hashFile(mergesPath)}` : undefined,
  tokens: tokens.ids,
  token_hash: `sha256:${hashText(tokens.ids.join(","))}`,
};

fs.mkdirSync(path.dirname(canaryPath), { recursive: true });
fs.writeFileSync(canaryPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${canaryPath}`);

function loadRegistry(manifestPath: string): Map<string, RegistryEntry> {
  const map = new Map<string, RegistryEntry>();
  if (!fs.existsSync(manifestPath)) {
    return map;
  }
  const json = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (Array.isArray(json)) {
    for (const entry of json) {
      if (!entry?.id) continue;
      map.set(entry.id, entry as RegistryEntry);
    }
  }
  return map;
}

function hashFile(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
