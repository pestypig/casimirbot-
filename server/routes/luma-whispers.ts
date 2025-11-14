import type { Express } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import {
  LumaContext,
  LumaSignal,
  LumaWhisperList,
  whisperContextZ,
  type TLumaContext,
  type TLumaWhisper,
  type WhisperContext,
} from "@shared/whispers";

let BANK: TLumaWhisper[] | null = null;

async function loadBank(): Promise<TLumaWhisper[]> {
  if (BANK) return BANK;
  const bankPath = path.join(process.cwd(), "server/_generated/luma-whispers.json");
  try {
    const raw = await fs.readFile(bankPath, "utf8");
    const parsed = JSON.parse(raw);
    BANK = LumaWhisperList.parse(parsed);
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      BANK = [];
    } else {
      throw err;
    }
  }
  return BANK;
}

function toHash(value: unknown): string {
  const str = typeof value === "string" ? value : Array.isArray(value) ? value[0] : "";
  if (!str) return "";
  const trimmed = str.trim();
  if (!trimmed) return "";
  const lowered = trimmed.toLowerCase();
  return lowered.startsWith("#") ? lowered : `#${lowered}`;
}

function parseJSONParam(value: unknown): Record<string, unknown> | undefined {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function buildWhisperContext(req: { query: Record<string, unknown> }): WhisperContext {
  const hashFromQuery = toHash(req.query.hash);
  const hashFromPanelHash =
    typeof req.query.panelHash === "string" ? toHash(req.query.panelHash) : "";
  const hashFromPanelString =
    typeof req.query.panel === "string" && req.query.panel.trim().startsWith("#")
      ? toHash(req.query.panel)
      : "";
  const telemetry = parseJSONParam(req.query.telemetry);
  const panel = parseJSONParam(req.query.panel);
  const tsValue = Array.isArray(req.query.ts) ? req.query.ts[0] : req.query.ts;
  const tsNumeric = typeof tsValue === "string" ? Number(tsValue) : undefined;
  const base = {
    hash: hashFromQuery || hashFromPanelHash || hashFromPanelString || "#",
    ts: Number.isFinite(tsNumeric) ? Number(tsNumeric) : Date.now(),
    telemetry,
    panel,
  };
  const parsed = whisperContextZ.safeParse(base);
  return parsed.success ? parsed.data : (base as WhisperContext);
}

function extractSignals(
  telemetry: Record<string, unknown> | undefined,
  fallback: TLumaContext["signals"],
): TLumaContext["signals"] | undefined {
  if (telemetry && "signals" in telemetry) {
    const candidate = (telemetry as { signals?: unknown }).signals;
    const parsed = LumaSignal.safeParse(candidate);
    if (parsed.success) {
      return parsed.data;
    }
  }
  return fallback;
}

function toSignals(value: unknown): TLumaContext["signals"] {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return undefined;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as TLumaContext["signals"]) : undefined;
  } catch {
    return undefined;
  }
}

function score(whisper: TLumaWhisper, ctx: TLumaContext): number {
  let s = 0;
  const hash = (ctx.hash || "").toLowerCase();

  if (whisper.rule.anyHash?.some((h) => h.toLowerCase() === hash)) s += 2;
  if (whisper.hashes?.some((h) => h.toLowerCase() === hash)) s += 1;

  const zeta = ctx.signals?.zeta;
  if (typeof zeta === "number") {
    if (typeof whisper.rule.minZeta === "number" && zeta >= whisper.rule.minZeta) s += 1;
    if (typeof whisper.rule.maxZeta === "number" && zeta > whisper.rule.maxZeta) s -= 2;
  }

  const q = ctx.signals?.qCavity;
  if (typeof whisper.rule.minQ === "number" && typeof q === "number" && q >= whisper.rule.minQ) {
    s += 1;
  }

  if (whisper.rule.requireSubThreshold && ctx.signals?.staySubThreshold === false) {
    s -= 2;
  }

  const duty = ctx.signals?.dutyEffectiveFR ?? 0;
  if (whisper.tags.includes("#ford-roman") && duty > 2.5e-5) s += 1;

  if (
    typeof whisper.rule.maxDuty === "number" &&
    typeof duty === "number" &&
    duty > whisper.rule.maxDuty
  ) {
    s -= 1;
  }

  return s;
}

export function registerLumaWhisperRoute(app: Express) {
  app.get("/api/luma/whispers", async (req, res) => {
    try {
      const bank = await loadBank();
      const whisperCtx = buildWhisperContext({ query: req.query as Record<string, unknown> });
      const fallbackSignals = toSignals(req.query.signals);
      const legacySignals = extractSignals(
        whisperCtx.telemetry as Record<string, unknown> | undefined,
        fallbackSignals,
      );

      const legacyParsed = LumaContext.safeParse({
        hash: whisperCtx.hash,
        panel: whisperCtx.hash.startsWith("#") ? whisperCtx.hash.slice(1) : whisperCtx.hash,
        signals: legacySignals,
      });
      const legacyCtx = legacyParsed.success
        ? legacyParsed.data
        : {
            hash: whisperCtx.hash,
            panel: whisperCtx.hash.startsWith("#") ? whisperCtx.hash.slice(1) : whisperCtx.hash,
            signals: legacySignals,
          };

      const ranked = bank
        .map((w) => ({ w, s: score(w, legacyCtx) }))
        .filter(({ s }) => s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 3)
        .map(({ w }) => w);

      res.json({ items: ranked, context: whisperCtx });
    } catch (err: any) {
      res.status(500).json({ error: err?.message ?? "failed" });
    }
  });
}
