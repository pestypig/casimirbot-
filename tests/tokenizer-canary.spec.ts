import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { loadTokenizerAssets, tokenize } from "../shared/tokenizers/bpe";

type RegistryEntry = {
  id: string;
  tokenizerJson: string;
  merges?: string | null;
  canary?: string | null;
};

type CanaryFixture = {
  tokenizerId: string;
  prompt: string;
  tokenizer_hash?: string;
  merges_hash?: string;
  token_hash?: string;
  tokens: number[];
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const registryPath = path.resolve(repoRoot, "server/config/tokenizer-registry.json");
const fixturePath = path.resolve(repoRoot, "tests/fixtures/tokenizer-canary.json");

const registry = loadRegistry(registryPath);
const canary = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as CanaryFixture;
const entry = registry.find((item) => item.id === canary.tokenizerId);

if (!entry) {
  throw new Error(`tokenizer "${canary.tokenizerId}" missing from ${registryPath}`);
}

describe("tokenizer canary", () => {
  it("matches saved token ids + hashes", () => {
    const tokenizerPath = path.resolve(repoRoot, entry.tokenizerJson);
    const mergesPath = entry.merges ? path.resolve(repoRoot, entry.merges) : undefined;
    const assets = loadTokenizerAssets(tokenizerPath, mergesPath);
    const tokens = tokenize(canary.prompt, assets);
    expect(tokens.ids).toEqual(canary.tokens);
    const tokenizerDigest = `sha256:${hashFile(tokenizerPath)}`;
    expect(tokenizerDigest).toBe(canary.tokenizer_hash);
    if (mergesPath && canary.merges_hash) {
      const mergesDigest = `sha256:${hashFile(mergesPath)}`;
      expect(mergesDigest).toBe(canary.merges_hash);
    }
    if (canary.token_hash) {
      const computed = `sha256:${hashText(tokens.ids.join(","))}`;
      expect(computed).toBe(canary.token_hash);
    }
  });

  it("passes tokenizer-verify CLI", () => {
    const tsxCli = path.resolve(repoRoot, "node_modules/tsx/dist/cli.cjs");
    let runner: string;
    let args: string[];
    if (fs.existsSync(tsxCli)) {
      runner = process.execPath;
      args = [
        tsxCli,
        "tools/tokenizer-verify.ts",
        "--tokenizer-id",
        canary.tokenizerId,
        "--canary",
        fixturePath,
        "--quiet",
      ];
    } else {
      runner = process.platform === "win32" ? "npx.cmd" : "npx";
      args = [
        "tsx",
        "tools/tokenizer-verify.ts",
        "--tokenizer-id",
        canary.tokenizerId,
        "--canary",
        fixturePath,
        "--quiet",
      ];
    }
    execFileSync(runner, args, { cwd: repoRoot, stdio: "inherit" });
  });
});

function loadRegistry(manifestPath: string): RegistryEntry[] {
  if (!fs.existsSync(manifestPath)) return [];
  const payload = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(payload)) return [];
  return payload as RegistryEntry[];
}

function hashFile(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
