/**
 * HEK (Heliophysics Events Knowledgebase) fetcher for solar events.
 * Provides a slim, typed layer that maps HPC coordinates into our disk (u,v) frame.
 */

export type HekCoordsys = "helioprojective" | "stonyhurst" | "carrington";

export interface HekEvent {
  ivorn: string;
  event_type: string;
  start: string;
  end: string;
  hpc_x?: number;
  hpc_y?: number;
  hpc_boundcc?: string;
  goes_class?: string;
  noaa_ar?: number;
  ch_area?: number;
  observatory?: string;
  frame?: string;
  refs?: string;
  u?: number;
  v?: number;
  polygon_uv?: Array<{ u: number; v: number }>;
  polygon_hpc?: Array<{ x: number; y: number }>;
}

interface FetchOpts {
  start: string;
  end: string;
  eventTypes?: string;
  coordsys?: HekCoordsys;
  hpcRadius?: number;
  resultLimit?: number;
  timeoutMs?: number;
}

import { spawn } from "child_process";
import path from "path";

const HEK_BASE_URL = process.env.HEK_BASE_URL ?? "http://www.lmsal.com/hek/her";
const HEK_DEFAULT_EVENT_TYPES = process.env.HEK_EVENT_TYPES ?? "ar,fl,ch,ef,cj";
const HEK_RESULT_LIMIT = Number.isFinite(Number(process.env.HEK_RESULT_LIMIT))
  ? Number(process.env.HEK_RESULT_LIMIT)
  : 500;
const HEK_HPC_RADIUS = Number.isFinite(Number(process.env.HEK_HPC_RADIUS))
  ? Math.max(1, Number(process.env.HEK_HPC_RADIUS))
  : 1200;
const HEK_TIMEOUT_MS = Number.isFinite(Number(process.env.HEK_TIMEOUT_MS))
  ? Math.max(1000, Number(process.env.HEK_TIMEOUT_MS))
  : 15_000;
const SUNPY_PYTHON_BIN = process.env.SUNPY_PYTHON_BIN || "python";
const HEK_USE_SUNPY = process.env.HEK_USE_SUNPY === "1";

const RETURN_FIELDS = [
  "kb_archivid",
  "event_type",
  "event_starttime",
  "event_endtime",
  "hpc_x",
  "hpc_y",
  "hpc_r",
  "hpc_bbox",
  "HPC_BOUNDCC",
  "FL_GOESCls",
  "AR_NOAANum",
  "CH_AREA",
  "FRM_Name",
  "OBS_Observatory",
  "refs",
];

type RawTable = { columns?: string[]; rows?: unknown[][] };

const asNumber = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
};

const asString = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  return undefined;
};

const pickFirstString = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
};

const mapRowToObject = (columns: string[], row: unknown[]): Record<string, unknown> => {
  const obj: Record<string, unknown> = {};
  for (let i = 0; i < columns.length; i++) {
    obj[columns[i]] = row[i];
  }
  return obj;
};

const parsePolygonHpc = (wkt: string | undefined): Array<{ x: number; y: number }> => {
  if (!wkt) return [];
  const match = wkt.match(/POLYGON\\s*\\(\\((.*?)\\)\\)/i);
  if (!match) return [];
  const pairs = match[1].split(",").map((p) => p.trim());
  const verts: Array<{ x: number; y: number }> = [];
  for (const pair of pairs) {
    const parts = pair.split(/\\s+/);
    if (parts.length < 2) continue;
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    verts.push({ x, y });
  }
  return verts;
};

const toUv = (hpcX: number | undefined, hpcY: number | undefined, radius: number) => {
  if (!Number.isFinite(hpcX) || !Number.isFinite(hpcY)) return null;
  return { u: (hpcX as number) / radius, v: (hpcY as number) / radius };
};

const extractTables = (payload: any): RawTable[] => {
  const tables: RawTable[] = [];
  const pushTable = (maybe: any) => {
    if (!maybe) return;
    const columns = maybe.columns ?? maybe.table?.columns;
    const rows = maybe.rows ?? maybe.table?.rows;
    if (Array.isArray(columns) && Array.isArray(rows)) {
      tables.push({ columns, rows });
    }
  };
  if (payload?.result) {
    const res = payload.result;
    if (Array.isArray(res)) {
      res.forEach(pushTable);
    } else {
      pushTable(res);
      pushTable(res.table);
    }
  }
  pushTable(payload);
  pushTable(payload.table);
  return tables;
};

const fetchJson = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const fetchImpl =
    globalThis.fetch ??
    (((await import("node-fetch")) as unknown as { default: typeof fetch }).default as unknown as typeof fetch);
  try {
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HEK request failed status=${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

export async function fetchHekEventsForWindow(opts: FetchOpts): Promise<HekEvent[]> {
  const {
    start,
    end,
    eventTypes,
    coordsys = "helioprojective",
    hpcRadius = HEK_HPC_RADIUS,
    resultLimit = HEK_RESULT_LIMIT,
    timeoutMs = HEK_TIMEOUT_MS,
  } = opts;

  const radius = Math.max(1, hpcRadius);
  const params = new URLSearchParams();
  params.set("cosec", "2"); // JSON
  params.set("cmd", "search");
  params.set("type", "column");
  params.set("event_coordsys", coordsys);
  params.set("event_starttime", start);
  params.set("event_endtime", end);
  params.set("event_type", (eventTypes ?? HEK_DEFAULT_EVENT_TYPES).trim());
  params.set("x1", (-radius).toString());
  params.set("x2", radius.toString());
  params.set("y1", (-radius).toString());
  params.set("y2", radius.toString());
  params.set("result_limit", String(Math.max(1, resultLimit)));
  params.set("return", RETURN_FIELDS.join(","));

  const url = `${HEK_BASE_URL}?${params.toString()}`;
  const payload = await fetchJson(url, timeoutMs);
  const tables = extractTables(payload);
  const events: HekEvent[] = [];

  for (const table of tables) {
    if (!table.columns || !table.rows) continue;
    for (const row of table.rows) {
      const obj = mapRowToObject(table.columns, row);
      const ivorn =
        asString(obj.kb_archivid) ||
        asString(obj.kb_archiveid) ||
        asString(obj.ivorn) ||
        asString(obj.hek_id) ||
        "unknown";
      const event_type = pickFirstString(obj.event_type) ?? "unknown";
      const startTime = pickFirstString(obj.event_starttime) ?? "";
      const endTime = pickFirstString(obj.event_endtime) ?? "";
      const hpc_x = asNumber(obj.hpc_x);
      const hpc_y = asNumber(obj.hpc_y);
      const hpc_boundcc = asString(obj.HPC_BOUNDCC) ?? asString(obj.hpc_boundcc);
      const noaa_ar = asNumber(obj.AR_NOAANum);
      const ch_area = asNumber(obj.CH_AREA);
      const goes_class = asString(obj.FL_GOESCls);
      const observatory = asString(obj.OBS_Observatory);
      const frame = asString(obj.FRM_Name);
      const refs = asString(obj.refs);
      const uv = toUv(hpc_x, hpc_y, radius);
      const polygonHpc = parsePolygonHpc(hpc_boundcc);
      const polygonUv =
        polygonHpc.length > 0
          ? polygonHpc
              .map((pt) => toUv(pt.x, pt.y, radius))
              .filter((p): p is { u: number; v: number } => Boolean(p))
          : undefined;

      events.push({
        ivorn,
        event_type,
        start: startTime,
        end: endTime,
        hpc_x,
        hpc_y,
        hpc_boundcc,
        noaa_ar,
        ch_area,
        goes_class,
        observatory,
        frame,
        refs,
        u: uv?.u,
        v: uv?.v,
        polygon_hpc: polygonHpc.length ? polygonHpc : undefined,
        polygon_uv: polygonUv as Array<{ u: number; v: number }> | undefined,
      });
    }
  }

  if (!events.length) return events;
  if (!HEK_USE_SUNPY) return events;
  const refined = await refineEventsWithSunpy(events).catch((error) => {
    console.warn("[hek] sunpy refinement failed; falling back to linear mapping", error);
    return events;
  });
  return refined;
}

/**
 * Optional refinement using sunpy to map HPC -> (u,v) with the true angular solar radius at obs time.
 * Falls back silently if python/sunpy is not available.
 */
export async function refineEventsWithSunpy(events: HekEvent[], pythonBin: string = SUNPY_PYTHON_BIN): Promise<HekEvent[]> {
  if (!events.length) return events;
  const script = path.resolve(process.cwd(), "tools", "sunpy_bridge.py");
  return new Promise<HekEvent[]>((resolve, reject) => {
    const child = spawn(pythonBin, [script], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => {
      out += d.toString();
    });
    child.stderr.on("data", (d) => {
      err += d.toString();
    });
    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code !== 0) {
        const msg = err || `sunpy_bridge exit ${code}`;
        return reject(new Error(msg));
      }
      try {
        const parsed = JSON.parse(out);
        resolve(Array.isArray(parsed?.events) ? (parsed.events as HekEvent[]) : events);
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.write(JSON.stringify({ events }));
    child.stdin.end();
  });
}
