#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { loadTokenizerAssets, tokenize, type TokenizerAssets } from "../shared/tokenizers/bpe";

type RegistryEntry = {
  id: string;
  tokenizerJson: string;
  merges?: string | null;
  gguf?: string | null;
  canary?: string | null;
  expected?: {
    tokenizerHash?: string;
    mergesHash?: string;
    vocabSize?: number;
    mergesCount?: number;
    tokenizerModel?: string;
    specialTokens?: Partial<Record<"bos" | "eos" | "pad" | "unk", number>>;
  };
};

type Canopy = {
  tokenizerId: string;
  prompt: string;
  prompt_hash?: string;
  tokenizer_hash?: string;
  merges_hash?: string;
  tokens?: number[];
  token_hash?: string;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = parseArgs(process.argv.slice(2));
const quiet = args.quiet === true || args.quiet === "true";
const registryPath = path.resolve(
  repoRoot,
  typeof args.registry === "string" ? args.registry : "server/config/tokenizer-registry.json",
);
const registry = loadRegistry(registryPath);
const tokenizerId = typeof args["tokenizer-id"] === "string" ? args["tokenizer-id"] : undefined;

const entry = tokenizerId ? registry.get(tokenizerId) : undefined;
const tokenizerPath = resolvePath(args["tokenizer-json"] ?? entry?.tokenizerJson);
const mergesPath = resolvePath(args.merges ?? entry?.merges ?? undefined);
const ggufPath = resolvePath(args.gguf ?? entry?.gguf ?? undefined);
const canaryPath = resolvePath(args.canary ?? entry?.canary ?? undefined);

const errors: string[] = [];
const warnings: string[] = [];

let assets: TokenizerAssets | null = null;
let tokenizerHash: string | null = null;
let mergesHash: string | null = null;

if (!tokenizerPath) {
  errors.push("Provide --tokenizer-json <path> or a registry entry with tokenizerJson");
} else {
  try {
    assets = loadTokenizerAssets(tokenizerPath, mergesPath ?? undefined);
    tokenizerHash = `sha256:${hashFile(tokenizerPath)}`;
    log(`tokenizer: ${tokenizerPath} (${tokenizerHash}, vocab=${assets.vocabSize})`);
    if (entry?.expected?.tokenizerHash && entry.expected.tokenizerHash !== tokenizerHash) {
      errors.push(
        `tokenizer hash mismatch: expected ${entry.expected.tokenizerHash}, got ${tokenizerHash}`,
      );
    }
    if (
      entry?.expected?.vocabSize &&
      assets.vocabSize !== Number(entry.expected.vocabSize)
    ) {
      errors.push(
        `vocab size mismatch: expected ${entry.expected.vocabSize}, got ${assets.vocabSize}`,
      );
    }
  } catch (err) {
    errors.push(`failed to load tokenizer: ${(err as Error).message}`);
  }
}

if (mergesPath) {
  mergesHash = `sha256:${hashFile(mergesPath)}`;
  log(`merges: ${mergesPath} (${mergesHash})`);
  if (entry?.expected?.mergesHash && entry.expected.mergesHash !== mergesHash) {
    errors.push(`merges hash mismatch: expected ${entry.expected.mergesHash}, got ${mergesHash}`);
  }
  if (entry?.expected?.mergesCount != null && assets) {
    if (assets.mergesCount !== Number(entry.expected.mergesCount)) {
      errors.push(
        `merges count mismatch: expected ${entry.expected.mergesCount}, got ${assets.mergesCount}`,
      );
    }
  }
}

if (ggufPath) {
  try {
    const gguf = readGgufMetadata(ggufPath);
    const ggufTokenizerModel = gguf.metadata["tokenizer.ggml.model"];
    const ggufTokens = parseArray(gguf.metadata["tokenizer.ggml.tokens"]);
    const ggufMerges = parseArray(gguf.metadata["tokenizer.ggml.merges"]);
    log(
      `gguf: ${ggufPath} (version=${gguf.version}, tokens=${ggufTokens?.length ?? "?"}, merges=${ggufMerges?.length ?? "?"})`,
    );
    if (entry?.expected?.tokenizerModel && typeof ggufTokenizerModel === "string") {
      if (ggufTokenizerModel !== entry.expected.tokenizerModel) {
        errors.push(
          `gguf tokenizer model mismatch: expected ${entry.expected.tokenizerModel}, got ${ggufTokenizerModel}`,
        );
      }
    }
    if (assets && ggufTokens && assets.vocabSize !== ggufTokens.length) {
      errors.push(`gguf vocab length ${ggufTokens.length} != tokenizer vocab ${assets.vocabSize}`);
    }
    if (
      assets &&
      ggufMerges &&
      assets.mergesCount > 0 &&
      ggufMerges.length !== assets.mergesCount
    ) {
      warnings.push(
        `gguf merges (${ggufMerges.length}) differ from tokenizer merges (${assets.mergesCount}).`,
      );
    }
    const special = {
      bos: readNumber(gguf.metadata["tokenizer.ggml.bos_token_id"]),
      eos: readNumber(gguf.metadata["tokenizer.ggml.eos_token_id"]),
      pad: readNumber(gguf.metadata["tokenizer.ggml.padding_token_id"]),
      unk: readNumber(gguf.metadata["tokenizer.ggml.unknown_token_id"]),
    };
    if (entry?.expected?.specialTokens) {
      for (const [key, value] of Object.entries(entry.expected.specialTokens)) {
        const actual =
          special[key as keyof typeof special] ?? (key === "unk" ? assets?.unkId ?? null : null);
        if (value != null && actual != null && Number(value) !== Number(actual)) {
          errors.push(`special token ${key} mismatch: expected ${value}, got ${actual}`);
        }
      }
    }
  } catch (err) {
    errors.push(`failed to read GGUF metadata: ${(err as Error).message}`);
  }
}

if (canaryPath) {
  try {
    if (!assets) {
      throw new Error("load tokenizer assets before running canary check");
    }
    const canary = JSON.parse(fs.readFileSync(canaryPath, "utf8")) as Canopy;
    if (canary.tokenizerId && tokenizerId && canary.tokenizerId !== tokenizerId) {
      warnings.push(
        `canary tokenizerId (${canary.tokenizerId}) differs from --tokenizer-id (${tokenizerId})`,
      );
    }
    if (canary.tokenizer_hash && tokenizerHash && canary.tokenizer_hash !== tokenizerHash) {
      errors.push(
        `canary tokenizer hash mismatch: expected ${canary.tokenizer_hash}, got ${tokenizerHash}`,
      );
    }
    if (canary.merges_hash && mergesHash && canary.merges_hash !== mergesHash) {
      errors.push(
        `canary merges hash mismatch: expected ${canary.merges_hash}, got ${mergesHash}`,
      );
    }
    if (!canary.prompt) {
      throw new Error("canary prompt missing");
    }
    const promptHash = `sha256:${hashText(canary.prompt)}`;
    if (canary.prompt_hash && canary.prompt_hash !== promptHash) {
      errors.push(`canary prompt hash mismatch: expected ${canary.prompt_hash}, got ${promptHash}`);
    }
    const tokens = tokenize(canary.prompt, assets);
    if (Array.isArray(canary.tokens)) {
      if (!arraysEqual(tokens.ids, canary.tokens)) {
        errors.push(
          `canary token IDs drifted (expected ${canary.tokens.join(",")}, got ${tokens.ids.join(",")})`,
        );
      }
      const computedHash = `sha256:${hashText(canary.tokens.join(","))}`;
      if (canary.token_hash && canary.token_hash !== computedHash) {
        errors.push(
          `canary token hash mismatch: expected ${canary.token_hash}, got ${computedHash}`,
        );
      }
    } else {
      warnings.push("canary file lacks token ID array; skipping diff");
    }
  } catch (err) {
    errors.push(`canary check failed: ${(err as Error).message}`);
  }
}

warnings.forEach((w) => console.warn(`warn: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  process.exit(1);
}

log("tokenizer verify ✔");

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const [key, inlineValue] = raw.slice(2).split("=");
    if (inlineValue !== undefined) {
      out[key] = inlineValue;
      continue;
    }
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function resolvePath(value?: string | null): string | null {
  if (!value) return null;
  if (path.isAbsolute(value)) return value;
  return path.resolve(repoRoot, value);
}

function loadRegistry(manifestPath: string): Map<string, RegistryEntry> {
  const map = new Map<string, RegistryEntry>();
  if (!fs.existsSync(manifestPath)) {
    return map;
  }
  try {
    const payload = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (Array.isArray(payload)) {
      for (const entry of payload) {
        if (!entry?.id) continue;
        map.set(entry.id, entry as RegistryEntry);
      }
    }
  } catch (err) {
    console.warn(`warn: failed to parse registry ${manifestPath}: ${(err as Error).message}`);
  }
  return map;
}

function parseArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  return null;
}

function readNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return null;
}

function hashFile(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function log(message: string) {
  if (quiet) return;
  console.log(message);
}

type GgufValue =
  | number
  | string
  | boolean
  | bigint
  | GgufValue[]
  | null;

function readGgufMetadata(filePath: string): { version: number; tensorCount: number; metadata: Record<string, GgufValue> } {
  const buffer = fs.readFileSync(filePath);
  const reader = new BufferReader(buffer);
  const magic = reader.readChars(4);
  if (magic !== "GGUF") {
    throw new Error(`invalid gguf magic: ${magic}`);
  }
  const version = reader.readUint32();
  const tensorCount = Number(reader.readUint64());
  const kvCount = Number(reader.readUint64());
  const metadata: Record<string, GgufValue> = {};
  for (let i = 0; i < kvCount; i += 1) {
    const key = reader.readString();
    const type = reader.readUint32();
    metadata[key] = reader.readValue(type);
  }
  return { version, tensorCount, metadata };
}

class BufferReader {
  private offset = 0;

  constructor(private readonly buffer: Buffer) {}

  readChars(count: number): string {
    this.ensure(count);
    const value = this.buffer.toString("utf8", this.offset, this.offset + count);
    this.offset += count;
    return value;
  }

  readUint32(): number {
    this.ensure(4);
    const value = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  readUint64(): bigint {
    this.ensure(8);
    const value = this.buffer.readBigUInt64LE(this.offset);
    this.offset += 8;
    return value;
  }

  readInt32(): number {
    this.ensure(4);
    const value = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  readInt64(): bigint {
    this.ensure(8);
    const value = this.buffer.readBigInt64LE(this.offset);
    this.offset += 8;
    return value;
  }

  readFloat32(): number {
    this.ensure(4);
    const value = this.buffer.readFloatLE(this.offset);
    this.offset += 4;
    return value;
  }

  readFloat64(): number {
    this.ensure(8);
    const value = this.buffer.readDoubleLE(this.offset);
    this.offset += 8;
    return value;
  }

  readBool(): boolean {
    this.ensure(1);
    const value = this.buffer[this.offset] !== 0;
    this.offset += 1;
    return value;
  }

  readBytes(length: number): Buffer {
    this.ensure(length);
    const slice = this.buffer.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  readString(): string {
    const size = Number(this.readUint64());
    const bytes = this.readBytes(size);
    return bytes.toString("utf8");
  }

  readValue(type: number): GgufValue {
    switch (type) {
      case 0:
        return this.readBytes(1)[0];
      case 1:
        return this.buffer.readInt8(this.consume(1));
      case 2:
        this.ensure(2);
        const u16 = this.buffer.readUInt16LE(this.offset);
        this.offset += 2;
        return u16;
      case 3:
        this.ensure(2);
        const i16 = this.buffer.readInt16LE(this.offset);
        this.offset += 2;
        return i16;
      case 4:
        return this.readUint32();
      case 5:
        return this.readInt32();
      case 6:
        return this.readFloat32();
      case 7:
        return this.readBool();
      case 8:
        return this.readString();
      case 9: {
        const subtype = this.readUint32();
        const length = Number(this.readUint64());
        const array: GgufValue[] = [];
        for (let i = 0; i < length; i += 1) {
          array.push(this.readValue(subtype));
        }
        return array;
      }
      case 10:
        return Number(this.readUint64());
      case 11:
        return Number(this.readInt64());
      case 12:
        return this.readFloat64();
      default:
        throw new Error(`unsupported gguf value type ${type}`);
    }
  }

  private consume(length: number): number {
    this.ensure(length);
    const position = this.offset;
    this.offset += length;
    return position;
  }

  private ensure(length: number) {
    if (this.offset + length > this.buffer.length) {
      throw new Error("unexpected EOF while reading gguf");
    }
  }
}
