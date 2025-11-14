import fs from "node:fs";
import path from "node:path";

export type TokenizerAssets = {
  vocab: Map<string, number>;
  vocabSize: number;
  merges: Map<string, number>;
  mergesCount: number;
  modelType: string;
  unkId: number | null;
  addedTokens: Map<string, number>;
};

export type TokenizeResult = { ids: number[]; pieces: string[] };

const PATTERN = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+/gu;

const byteEncoder = buildByteEncoder();
const byteDecoder = new Map<string, number>();
for (const [byte, ch] of byteEncoder.entries()) {
  byteDecoder.set(ch, byte);
}

const bpeCache = new Map<string, string[]>();

export function loadTokenizerAssets(tokenizerPath: string, mergesPath?: string): TokenizerAssets {
  const resolved = path.resolve(tokenizerPath);
  const json = JSON.parse(fs.readFileSync(resolved, "utf8"));
  const vocabSource = json?.model?.vocab;
  if (!vocabSource || typeof vocabSource !== "object") {
    throw new Error(`tokenizer vocab missing in ${tokenizerPath}`);
  }
  const vocab = new Map<string, number>();
  for (const [token, id] of Object.entries(vocabSource as Record<string, number>)) {
    const idx = Number(id);
    if (Number.isNaN(idx)) {
      continue;
    }
    vocab.set(token, idx);
  }
  const addedTokens = new Map<string, number>();
  if (Array.isArray(json?.added_tokens)) {
    for (const token of json.added_tokens) {
      if (!token || typeof token.content !== "string") continue;
      const id = Number(token.id);
      if (Number.isNaN(id)) continue;
      addedTokens.set(token.content, id);
    }
  }
  const mergedFromJson = Array.isArray(json?.model?.merges) ? (json.model.merges as string[]) : [];
  let mergedList: string[] = mergedFromJson;
  if (!mergedList.length && mergesPath) {
    const mergeText = fs.readFileSync(path.resolve(mergesPath), "utf8");
    mergedList = mergeText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  }
  const merges = new Map<string, number>();
  mergedList.forEach((entry, idx) => {
    const cleaned = entry.trim();
    if (!cleaned || cleaned.startsWith("#")) return;
    const parts = cleaned.split(/\s+/);
    if (parts.length !== 2) return;
    merges.set(`${parts[0]} ${parts[1]}`, idx);
  });
  const unkKey: string =
    typeof json?.model?.unk_token === "string"
      ? (json.model.unk_token as string)
      : typeof json?.unk_token?.content === "string"
        ? (json.unk_token.content as string)
        : "<unk>";
  const unkId = unkKey ? (addedTokens.get(unkKey) ?? vocab.get(unkKey) ?? null) : null;
  return {
    vocab,
    vocabSize: vocab.size,
    merges,
    mergesCount: merges.size,
    modelType: typeof json?.model?.type === "string" ? (json.model.type as string) : "unknown",
    unkId,
    addedTokens,
  };
}

export function tokenize(text: string, assets: TokenizerAssets): TokenizeResult {
  if (!text) return { ids: [], pieces: [] };
  const ids: number[] = [];
  const pieces: string[] = [];
  const matches = text.matchAll(PATTERN);
  for (const match of matches) {
    const token = match[0];
    const unicode = encodeByteLevel(token);
    const bpeTokens = applyBpe(unicode, assets.merges);
    for (const piece of bpeTokens) {
      const id = assets.vocab.get(piece) ?? assets.addedTokens.get(piece) ?? assets.unkId;
      if (id == null) {
        throw new Error(`Token "${piece}" missing from vocab and no unk_id configured`);
      }
      ids.push(id);
      pieces.push(piece);
    }
  }
  return { ids, pieces };
}

function applyBpe(token: string, ranks: Map<string, number>): string[] {
  if (bpeCache.has(token)) {
    return bpeCache.get(token)!.slice();
  }
  let word = token.split("");
  if (word.length === 1 || !ranks.size) {
    bpeCache.set(token, word);
    return word.slice();
  }
  let pairs = getPairs(word);
  while (pairs.length) {
    let minPair: [string, string] | null = null;
    let minRank = Number.POSITIVE_INFINITY;
    for (const pair of pairs) {
      const rank = ranks.get(`${pair[0]} ${pair[1]}`);
      if (rank !== undefined && rank < minRank) {
        minRank = rank;
        minPair = pair;
      }
    }
    if (!minPair) break;
    const [first, second] = minPair;
    const newWord: string[] = [];
    let i = 0;
    while (i < word.length) {
      const j = word.indexOf(first, i);
      if (j === -1) {
        newWord.push(...word.slice(i));
        break;
      }
      newWord.push(...word.slice(i, j));
      i = j;
      if (i < word.length - 1 && word[i] === first && word[i + 1] === second) {
        newWord.push(first + second);
        i += 2;
      } else {
        newWord.push(word[i]);
        i += 1;
      }
    }
    word = newWord;
    if (word.length === 1) break;
    pairs = getPairs(word);
  }
  bpeCache.set(token, word);
  return word.slice();
}

function getPairs(word: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < word.length - 1; i += 1) {
    pairs.push([word[i], word[i + 1]]);
  }
  return pairs;
}

function encodeByteLevel(token: string): string {
  const buffer = Buffer.from(token, "utf8");
  let out = "";
  for (const byte of buffer) {
    const mapped = byteEncoder.get(byte);
    if (mapped === undefined) {
      throw new Error(`byte ${byte} missing in encoder`);
    }
    out += mapped;
  }
  return out;
}

function buildByteEncoder(): Map<number, string> {
  const bs: number[] = [];
  for (let i = 33; i <= 126; i += 1) bs.push(i);
  for (let i = 161; i <= 172; i += 1) bs.push(i);
  for (let i = 174; i <= 255; i += 1) bs.push(i);
  const cs = bs.slice();
  const set = new Set(bs);
  let n = 0;
  for (let b = 0; b < 256; b += 1) {
    if (!set.has(b)) {
      bs.push(b);
      cs.push(256 + n);
      n += 1;
      set.add(b);
    }
  }
  const encoder = new Map<number, string>();
  bs.forEach((b, i) => {
    encoder.set(b, String.fromCharCode(cs[i]));
  });
  return encoder;
}
