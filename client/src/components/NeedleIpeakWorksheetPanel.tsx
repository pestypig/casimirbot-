import React from "react";
import {
  AlertTriangle,
  Bolt,
  Calculator,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Info,
  RefreshCw,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useDocViewerStore } from "@/store/useDocViewerStore";
import defaultWorksheetCsv from "@/data/needle_Ipeak_worksheet.csv?raw";

type ParsedList = {
  values: number[];
  usedFallback: boolean;
  invalid: number;
};

type WorksheetRow = {
  E_coil_per_burst_kJ: number;
  L_coil_uH: number;
  I_peak_kA: number;
  V_required_Blumlein_kV: number;
  C_PFN_uF: number;
  V0_PFN_kV: number;
};

type BusRow = {
  V_bus_kV: number;
  I_bus_avg_A: number;
};

type ProvisionalLoad = {
  label: string;
  E_per_burst_kJ: number;
  L_uH: number;
  t_rise_us?: number;
  n_parallel?: number;
  area_mm2?: number;
  v_max_kV?: number;
  Jc_A_per_mm2?: number;
};

type ProvisionalRow = WorksheetRow & {
  load: string;
  t_rise_us: number;
  n_parallel?: number;
  area_mm2?: number;
  v_max_kV?: number;
  Jc_A_per_mm2?: number;
};

type NormalizedRow = Record<string, string>;

type ParsedWorksheetRow = {
  index: number;
  raw: Record<string, string>;
  normalized: NormalizedRow;
};

type ParsedWorksheet = {
  rows: ParsedWorksheetRow[];
  headers: string[];
  delimiter: string;
  warnings: string[];
};

type FilledWorksheetRow = {
  name: string;
  L_H?: number;
  E_pulse_J?: number;
  t_rise_s?: number;
  pulse_width_s?: number;
  rep_rate_hz?: number;
  di_dt_A_per_s?: number;
  I_peak_A?: number;
  I_peak_method?: string | null;
  V_required_kV?: number;
  V_max_kV?: number;
  L_total_uH?: number;
  J_A_per_mm2?: number;
  J_over_Jc?: number;
  N_parallel?: number;
  area_mm2?: number;
  Jc_A_per_mm2?: number;
  I_rms_A_est?: number;
  needs?: string;
};

type FillMeta = {
  source: string;
  parsedRows: number;
  filledRows: number;
  needsRows: number;
  delimiter: string;
  headers: string[];
  timestamp: number;
};

const DEFAULTS = {
  energies_kJ: [1, 5, 10, 20, 40],
  inductances_uH: [1, 5, 10, 20, 50, 100],
  tau_us: 10,
  pAvg_MW: 83.3,
  bus_kV: [5, 10, 20, 40],
};

const PROVISIONAL_TAU_US = 10;
const PROVISIONAL_LOADS: ProvisionalLoad[] = [
  {
    label: "MIDI coil (conservative)",
    E_per_burst_kJ: 5.0,
    L_uH: 50.0,
    t_rise_us: 10.0,
    n_parallel: 4,
    area_mm2: 8,
    v_max_kV: 80,
    Jc_A_per_mm2: 1000,
  },
  {
    label: "MIDI coil (aggressive)",
    E_per_burst_kJ: 5.0,
    L_uH: 10.0,
    t_rise_us: 10.0,
    n_parallel: 8,
    area_mm2: 8,
    v_max_kV: 40,
    Jc_A_per_mm2: 1000,
  },
  {
    label: "MIDI coil (high energy)",
    E_per_burst_kJ: 10.0,
    L_uH: 20.0,
    t_rise_us: 10.0,
    n_parallel: 8,
    area_mm2: 8,
    v_max_kV: 70,
    Jc_A_per_mm2: 1000,
  },
  {
    label: "Sector panel PFN (tile bank)",
    E_per_burst_kJ: 0.5,
    L_uH: 1.0,
    t_rise_us: 1.0,
    n_parallel: 8,
    area_mm2: 8,
    v_max_kV: 36,
    Jc_A_per_mm2: 1000,
  },
  {
    label: "Launcher (LF)",
    E_per_burst_kJ: 10.0,
    L_uH: 100.0,
    t_rise_us: 20.0,
    n_parallel: 4,
    area_mm2: 8,
    v_max_kV: 80,
    Jc_A_per_mm2: 1000,
  },
];

function parseList(input: string, fallback: number[]): ParsedList {
  const tokens = input
    .split(/[,;\s/]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const values = tokens
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n) && Math.abs(n) > 0);
  if (values.length === 0) {
    return { values: fallback, usedFallback: true, invalid: tokens.length };
  }
  return { values, usedFallback: false, invalid: tokens.length - values.length };
}

function parseNumber(input: string, fallback: number): number {
  const n = Number(input);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function round(n: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function computeWorksheet(energies_kJ: number[], inductances_uH: number[], tau_us: number): WorksheetRow[] {
  const tau_s = tau_us * 1e-6;
  const fullPeriod_s = 2 * tau_s;
  const rows: WorksheetRow[] = [];

  for (const E_kJ of energies_kJ) {
    for (const L_uH of inductances_uH) {
      const E_J = E_kJ * 1e3;
      const L_H = L_uH * 1e-6;
      const iPeak_A = Math.sqrt((2 * E_J) / Math.max(L_H, 1e-18));
      const vBlumlein_V = (iPeak_A * L_H) / Math.max(tau_s, 1e-12);
      const C_F = (fullPeriod_s / (2 * Math.PI)) ** 2 / Math.max(L_H, 1e-18);
      const v0_V = Math.sqrt((2 * E_J) / Math.max(C_F, 1e-24));

      rows.push({
        E_coil_per_burst_kJ: round(E_kJ, 6),
        L_coil_uH: round(L_uH, 6),
        I_peak_kA: round(iPeak_A / 1e3, 6),
        V_required_Blumlein_kV: round(vBlumlein_V / 1e3, 6),
        C_PFN_uF: round(C_F * 1e6, 6),
        V0_PFN_kV: round(v0_V / 1e3, 6),
      });
    }
  }

  return rows.sort((a, b) =>
    a.E_coil_per_burst_kJ === b.E_coil_per_burst_kJ
      ? a.L_coil_uH - b.L_coil_uH
      : a.E_coil_per_burst_kJ - b.E_coil_per_burst_kJ,
  );
}

function computeBus(bus_kV: number[], pAvg_MW: number): BusRow[] {
  const pAvg_W = pAvg_MW * 1e6;
  return bus_kV.map((kv) => ({
    V_bus_kV: round(kv, 6),
    I_bus_avg_A: round(pAvg_W / Math.max(kv * 1e3, 1e-9), 6),
  }));
}

function computeProvisionalRows(loads: ProvisionalLoad[], tau_us: number): ProvisionalRow[] {
  return loads.map((load) => {
    const rise_us =
      typeof load.t_rise_us === "number" && Number.isFinite(load.t_rise_us) ? (load.t_rise_us as number) : tau_us;
    const tau_s = Math.max(1e-9, rise_us * 1e-6);
    const fullPeriod_s = 2 * tau_s;
    const E_J = load.E_per_burst_kJ * 1e3;
    const L_H = load.L_uH * 1e-6;
    const iPeak_A = Math.sqrt((2 * E_J) / Math.max(L_H, 1e-18));
    const vBlumlein_V = (iPeak_A * L_H) / Math.max(tau_s, 1e-12);
    const C_F = (fullPeriod_s / (2 * Math.PI)) ** 2 / Math.max(L_H, 1e-18);
    const v0_V = Math.sqrt((2 * E_J) / Math.max(C_F, 1e-24));

    return {
      load: load.label,
      t_rise_us: rise_us,
      n_parallel: load.n_parallel,
      area_mm2: load.area_mm2,
      v_max_kV: load.v_max_kV,
      Jc_A_per_mm2: load.Jc_A_per_mm2,
      E_coil_per_burst_kJ: round(load.E_per_burst_kJ, 6),
      L_coil_uH: round(load.L_uH, 6),
      I_peak_kA: round(iPeak_A / 1e3, 6),
      V_required_Blumlein_kV: round(vBlumlein_V / 1e3, 6),
      C_PFN_uF: round(C_F * 1e6, 6),
      V0_PFN_kV: round(v0_V / 1e3, 6),
    };
  });
}

const OUTPUT_COLUMNS: (keyof FilledWorksheetRow)[] = [
  "name",
  "L_H",
  "E_pulse_J",
  "t_rise_s",
  "pulse_width_s",
  "rep_rate_hz",
  "di_dt_A_per_s",
  "I_peak_A",
  "I_peak_method",
  "V_required_kV",
  "V_max_kV",
  "L_total_uH",
  "J_A_per_mm2",
  "J_over_Jc",
  "N_parallel",
  "area_mm2",
  "Jc_A_per_mm2",
  "I_rms_A_est",
  "needs",
];

function normalizeKey(key: string): string {
  return key
    .replace(/[µμ]/g, "u")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function splitRow(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"+|"+$/g, ""));
}

function detectDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 5);
  const candidates: Array<"," | ";" | "\t" | "|"> = [",", ";", "\t", "|"];
  let best = ",";
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const score = sample.reduce((acc, line) => acc + (line.split(candidate).length - 1), 0);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return bestScore <= 0 ? "," : best;
}

function parseWorksheet(raw: string): ParsedWorksheet {
  const cleaned = raw.replace(/\uFEFF/g, "").trim();
  if (!cleaned) return { rows: [], headers: [], delimiter: ",", warnings: ["Worksheet is empty"] };

  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const delimiter = detectDelimiter(lines);
  const headers = splitRow(lines[0], delimiter);
  const warnings: string[] = [];
  if (headers.length <= 1) warnings.push("Only one column detected; check delimiter or header row.");

  const rows: ParsedWorksheetRow[] = [];
  lines.slice(1).forEach((line, idx) => {
    const cells = splitRow(line, delimiter);
    const rawRow: Record<string, string> = {};
    headers.forEach((header, colIdx) => {
      rawRow[header] = cells[colIdx] ?? "";
    });
    const normalized: NormalizedRow = {};
    for (const [key, value] of Object.entries(rawRow)) {
      const normKey = normalizeKey(key);
      if (!normKey) continue;
      const trimmed = value.trim();
      if (normalized[normKey] && normalized[normKey].length > 0) continue;
      normalized[normKey] = trimmed;
    }
    rows.push({ index: idx, raw: rawRow, normalized });
  });

  return { rows, headers, delimiter, warnings };
}

function pick(row: NormalizedRow, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && String(value).trim() !== "") return value;
  }
  return undefined;
}

function toNumber(value: string | undefined): number | undefined {
  if (value == null) return undefined;
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return undefined;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

function resolveInductanceH(row: NormalizedRow): number | undefined {
  const L = toNumber(pick(row, "l_h", "l_henry", "inductance_h", "l"));
  if (L !== undefined) return L;
  const l_uH = toNumber(pick(row, "l_uh", "inductance_uh", "l_total_uh"));
  if (l_uH !== undefined) return l_uH * 1e-6;
  const l_mH = toNumber(pick(row, "l_mh", "inductance_mh"));
  if (l_mH !== undefined) return l_mH * 1e-3;
  return undefined;
}

function resolveEnergyJ(row: NormalizedRow): number | undefined {
  const E = toNumber(pick(row, "e_j", "energy_j", "e_pulse_j", "stored_energy_j"));
  if (E !== undefined) return E;
  const e_mJ = toNumber(pick(row, "e_mj", "energy_mj"));
  if (e_mJ !== undefined) return e_mJ * 1e-3;
  const e_kJ = toNumber(pick(row, "e_kj", "energy_kj"));
  if (e_kJ !== undefined) return e_kJ * 1e3;
  return undefined;
}

function resolveTriseS(row: NormalizedRow): number | undefined {
  const t = toNumber(pick(row, "t_rise_s", "trise_s", "rise_time_s", "pulse_rise_s"));
  if (t !== undefined) return t;
  const t_us = toNumber(pick(row, "t_rise_us", "trise_us", "rise_time_us", "pulse_rise_us"));
  if (t_us !== undefined) return t_us * 1e-6;
  const t_ns = toNumber(pick(row, "t_rise_ns", "trise_ns"));
  if (t_ns !== undefined) return t_ns * 1e-9;
  return undefined;
}

function resolveDurationS(row: NormalizedRow): number | undefined {
  const t = toNumber(pick(row, "pulse_width_s", "tau_s", "duration_s", "fwhm_s"));
  if (t !== undefined) return t;
  const t_us = toNumber(pick(row, "pulse_width_us", "tau_us", "duration_us"));
  if (t_us !== undefined) return t_us * 1e-6;
  const t_ns = toNumber(pick(row, "pulse_width_ns", "tau_ns", "duration_ns"));
  if (t_ns !== undefined) return t_ns * 1e-9;
  return undefined;
}

function resolveRepRate(row: NormalizedRow): number | undefined {
  return toNumber(pick(row, "rep_rate_hz", "rep_hz", "pps", "prf_hz"));
}

function resolveDiDt(row: NormalizedRow): number | undefined {
  const diDt = toNumber(pick(row, "di_dt_a_per_s", "di_dt", "didt"));
  if (diDt !== undefined) return diDt;
  const diDtUs = toNumber(pick(row, "di_dt_a_per_us", "didt_a_per_us"));
  if (diDtUs !== undefined) return diDtUs * 1e6;
  const diDtNs = toNumber(pick(row, "di_dt_a_per_ns", "didt_a_per_ns"));
  if (diDtNs !== undefined) return diDtNs * 1e9;
  return undefined;
}

function resolveVmax(row: NormalizedRow): number | undefined {
  const V = toNumber(pick(row, "v_max_v", "vmax_v", "v_bus_max_v", "bus_vmax_v"));
  if (V !== undefined) return V;
  const kV = toNumber(pick(row, "v_max_kv", "vmax_kv", "v_bus_max_kv"));
  if (kV !== undefined) return kV * 1e3;
  return undefined;
}

function resolveStrayL(row: NormalizedRow): number {
  const Ls = toNumber(pick(row, "l_stray_h", "l_bus_h", "ls_h"));
  if (Ls !== undefined) return Ls;
  const nH = toNumber(pick(row, "l_stray_nh", "ls_nh"));
  if (nH !== undefined) return nH * 1e-9;
  return 0;
}

function resolveConductor(row: NormalizedRow) {
  const N = toNumber(pick(row, "n_parallel", "n_tapes", "n_strands", "tapes", "strands"));
  const area = toNumber(pick(row, "area_mm2", "sc_area_mm2", "strand_area_mm2", "cs_area_mm2"));

  let area_mm2 = area;
  if (area_mm2 === undefined) {
    const width = toNumber(pick(row, "tape_width_mm", "width_mm", "conductor_width_mm"));
    const thUm = toNumber(pick(row, "tape_thickness_um", "thickness_um"));
    const thMm = toNumber(pick(row, "tape_thickness_mm", "thickness_mm"));
    if (width !== undefined && thUm !== undefined) {
      area_mm2 = width * (thUm * 1e-3);
    } else if (width !== undefined && thMm !== undefined) {
      area_mm2 = width * thMm;
    }
  }

  const Jc = toNumber(pick(row, "jc_a_per_mm2", "jcrit_a_per_mm2", "jc"));
  const Npar = N !== undefined && N > 0 ? Math.round(N) : undefined;
  return { Npar, area_mm2, Jc };
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e6)) return value.toExponential(6);
  return Number(value.toFixed(6)).toString();
}

function computeFilledRow(row: ParsedWorksheetRow): FilledWorksheetRow {
  const normalized = row.normalized;
  const name = (pick(normalized, "name", "load", "id", "element", "stage") ?? `row_${row.index + 1}`).toString();
  const L = resolveInductanceH(normalized);
  const E = resolveEnergyJ(normalized);
  let tr = resolveTriseS(normalized);
  const tp = resolveDurationS(normalized);
  const rep = resolveRepRate(normalized);
  const diDt = resolveDiDt(normalized);
  const Vmax = resolveVmax(normalized);
  const Ls = resolveStrayL(normalized);
  const { Npar, area_mm2, Jc } = resolveConductor(normalized);
  const I_user = toNumber(pick(normalized, "i_peak_a", "ipeak_a", "i_a_peak", "i_pk_a"));

  const needs = new Set<string>();
  const Ltot = (L ?? 0) + (Ls ?? 0);
  const L_base = L !== undefined && L > 0 ? L : undefined;
  const L_total = Ltot > 0 ? Ltot : undefined;

  let I_final: number | undefined;
  let picked: string | null = null;
  let trFinal = tr;
  let didtFinal = diDt;
  let Vflat = Vmax;
  let E_final = E;

  const I_energy =
    E_final !== undefined && L_base !== undefined ? Math.sqrt(Math.max(0, (2 * E_final) / L_base)) : undefined;

  if (I_user !== undefined && Number.isFinite(I_user) && I_user > 0) {
    I_final = I_user;
    picked = "user";
  }

  if (I_final === undefined && I_energy !== undefined) {
    I_final = I_energy;
    picked = "E & L";
  }

  if (I_final === undefined && didtFinal !== undefined && trFinal !== undefined && trFinal > 0) {
    I_final = didtFinal * trFinal;
    picked = "di/dt * t_rise";
  }

  if (
    I_final === undefined &&
    Vflat !== undefined &&
    L_total !== undefined &&
    trFinal !== undefined &&
    trFinal > 0
  ) {
    const diFromV = Vflat / L_total;
    I_final = diFromV * trFinal;
    if (didtFinal === undefined) didtFinal = diFromV;
    picked = "V * t_rise / L";
  }

  if (I_final === undefined && didtFinal !== undefined && I_energy !== undefined && didtFinal > 0) {
    I_final = I_energy;
    trFinal = I_energy / didtFinal;
    picked = "E & di/dt -> t_rise";
  }

  if (trFinal === undefined && I_final !== undefined && didtFinal !== undefined && didtFinal > 0) {
    trFinal = I_final / didtFinal;
  }
  if (didtFinal === undefined && I_final !== undefined && trFinal !== undefined && trFinal > 0) {
    didtFinal = I_final / trFinal;
  }
  if (didtFinal === undefined && Vflat !== undefined && L_total !== undefined) {
    didtFinal = Vflat / L_total;
  }
  if (Vflat === undefined && didtFinal !== undefined && L_total !== undefined) {
    Vflat = L_total * didtFinal;
  }
  if (E_final === undefined && I_final !== undefined && L_base !== undefined) {
    E_final = 0.5 * L_base * I_final * I_final;
  }

  if (I_final === undefined) {
    if (L === undefined) needs.add("L");
    if (E === undefined && Vmax === undefined && diDt === undefined) needs.add("E_or_Vmax_or_di/dt");
    if (tr === undefined && (E === undefined || diDt === undefined)) needs.add("t_rise or (E & di/dt)");
  }

  const V_req = L_total !== undefined && didtFinal !== undefined ? L_total * didtFinal : undefined;

  let J: number | undefined;
  let J_frac: number | undefined;
  if (I_final !== undefined && area_mm2 !== undefined && area_mm2 > 0) {
    const N_eff = Npar && Npar > 0 ? Npar : 1;
    J = I_final / (N_eff * area_mm2);
    if (Jc !== undefined && Jc > 0) {
      J_frac = J / Jc;
    }
  }

  let I_rms: number | undefined;
  const width = tp ?? trFinal;
  if (I_final !== undefined && width !== undefined && width > 0) {
    I_rms = I_final / Math.sqrt(3);
    if (rep !== undefined && rep > 0) {
      const duty = width * rep;
      I_rms *= Math.sqrt(Math.max(1e-12, duty));
    }
  }

  return {
    name,
    L_H: L,
    E_pulse_J: E_final,
    t_rise_s: trFinal,
    pulse_width_s: tp,
    rep_rate_hz: rep,
    di_dt_A_per_s: didtFinal,
    I_peak_A: I_final,
    I_peak_method: picked,
    V_required_kV: V_req !== undefined ? V_req / 1e3 : undefined,
    V_max_kV: Vmax !== undefined ? Vmax / 1e3 : undefined,
    L_total_uH: Ltot > 0 ? Ltot * 1e6 : undefined,
    J_A_per_mm2: J,
    J_over_Jc: J_frac,
    N_parallel: Npar,
    area_mm2,
    Jc_A_per_mm2: Jc,
    I_rms_A_est: I_rms,
    needs: needs.size ? Array.from(needs).sort().join(", ") : undefined,
  };
}

function filledRowsToCsv(rows: FilledWorksheetRow[]): string {
  const header = OUTPUT_COLUMNS.join(",");
  const lines = rows.map((row) =>
    OUTPUT_COLUMNS.map((col) => {
      const value = row[col];
      if (value === undefined || value === null) return "";
      if (typeof value === "number") return formatNumber(value);
      return String(value).replace(/[\r\n]+/g, " ").trim();
    }).join(","),
  );
  return [header, ...lines].join("\n");
}

function toCsv<T extends Record<string, number>>(rows: T[], columns: (keyof T)[]): string {
  const header = columns.join(",");
  const body = rows.map((row) => columns.map((col) => row[col]).join(",")).join("\n");
  return `${header}\n${body}`;
}

function downloadCsv(csv: string, filename: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function NeedleIpeakWorksheetPanel() {
  const [worksheetText, setWorksheetText] = React.useState(() => defaultWorksheetCsv.trim());
  const [parsedWorksheet, setParsedWorksheet] = React.useState<ParsedWorksheet>({
    rows: [],
    headers: [],
    delimiter: ",",
    warnings: [],
  });
  const [filledWorksheet, setFilledWorksheet] = React.useState<FilledWorksheetRow[]>([]);
  const [filledCsv, setFilledCsv] = React.useState<string>("");
  const [fillMeta, setFillMeta] = React.useState<FillMeta>({
    source: "seed",
    parsedRows: 0,
    filledRows: 0,
    needsRows: 0,
    delimiter: ",",
    headers: [],
    timestamp: Date.now(),
  });
  const [loadMessage, setLoadMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [energyInput, setEnergyInput] = React.useState(DEFAULTS.energies_kJ.join(", "));
  const [inductanceInput, setInductanceInput] = React.useState(DEFAULTS.inductances_uH.join(", "));
  const [busInput, setBusInput] = React.useState(DEFAULTS.bus_kV.join(", "));
  const [tauInput, setTauInput] = React.useState(String(DEFAULTS.tau_us));
  const [pAvgInput, setPAvgInput] = React.useState(String(DEFAULTS.pAvg_MW));
  const docViewer = useDocViewerStore();

  const provisionalRows = React.useMemo(
    () => computeProvisionalRows(PROVISIONAL_LOADS, PROVISIONAL_TAU_US),
    [],
  );

  const runFill = React.useCallback(
    (text: string, source: string) => {
      const parsed = parseWorksheet(text);
      const provisionalParsed: ParsedWorksheetRow[] = provisionalRows.map((row, idx) => {
        const normalized: NormalizedRow = {
          name: `Provisional: ${row.load}`,
          e_kj: `${row.E_coil_per_burst_kJ}`,
          l_uh: `${row.L_coil_uH}`,
          t_rise_us: `${row.t_rise_us}`,
          n_parallel: row.n_parallel !== undefined ? `${row.n_parallel}` : "",
          area_mm2: row.area_mm2 !== undefined ? `${row.area_mm2}` : "",
          v_max_kv: row.v_max_kV !== undefined ? `${row.v_max_kV}` : `${row.V_required_Blumlein_kV}`,
          jc_a_per_mm2: row.Jc_A_per_mm2 !== undefined ? `${row.Jc_A_per_mm2}` : "",
        };
        return { index: parsed.rows.length + idx, raw: normalized, normalized };
      });
      const allRows = [...parsed.rows, ...provisionalParsed];
      const filled = allRows.map((row) => computeFilledRow(row));
      setParsedWorksheet(parsed);
      setFilledWorksheet(filled);
      setFilledCsv(filledRowsToCsv(filled));
      const filledCount = filled.filter((row) => row.I_peak_A !== undefined).length;
      const needsCount = filled.filter((row) => row.needs && row.needs.length > 0).length;
      setFillMeta({
        source,
        parsedRows: allRows.length,
        filledRows: filledCount,
        needsRows: needsCount,
        delimiter: parsed.delimiter,
        headers: parsed.headers,
        timestamp: Date.now(),
      });
    },
    [provisionalRows],
  );

  React.useEffect(() => {
    runFill(worksheetText, "seed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecompute = React.useCallback(() => {
    runFill(worksheetText, "manual");
    setLoadMessage("Re-ran fill with current worksheet text");
  }, [runFill, worksheetText]);

  const handleLoadDefault = React.useCallback(() => {
    const trimmed = defaultWorksheetCsv.trim();
    setWorksheetText(trimmed);
    runFill(trimmed, "repo");
    setLoadMessage("Loaded data/needle_Ipeak_worksheet.csv");
  }, [runFill]);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      setWorksheetText(text);
      runFill(text, `file:${file.name}`);
      setLoadMessage(`Loaded ${file.name}`);
      event.target.value = "";
    },
    [runFill],
  );

  const handleDownloadFilled = React.useCallback(() => {
    if (!filledCsv) return;
    downloadCsv(filledCsv, "needle_Ipeak_filled.csv");
  }, [filledCsv]);

  const resetDefaults = React.useCallback(() => {
    setEnergyInput(DEFAULTS.energies_kJ.join(", "));
    setInductanceInput(DEFAULTS.inductances_uH.join(", "));
    setBusInput(DEFAULTS.bus_kV.join(", "));
    setTauInput(String(DEFAULTS.tau_us));
    setPAvgInput(String(DEFAULTS.pAvg_MW));
  }, []);

  const energies = React.useMemo(() => parseList(energyInput, DEFAULTS.energies_kJ), [energyInput]);
  const inductances = React.useMemo(() => parseList(inductanceInput, DEFAULTS.inductances_uH), [inductanceInput]);
  const busVoltages = React.useMemo(() => parseList(busInput, DEFAULTS.bus_kV), [busInput]);

  const tau_us = parseNumber(tauInput, DEFAULTS.tau_us);
  const pAvg_MW = parseNumber(pAvgInput, DEFAULTS.pAvg_MW);

  const worksheet = React.useMemo(
    () => computeWorksheet(energies.values, inductances.values, tau_us),
    [energies.values, inductances.values, tau_us],
  );
  const busRows = React.useMemo(
    () => computeBus(busVoltages.values, pAvg_MW),
    [busVoltages.values, pAvg_MW],
  );

  const worksheetCsv = React.useMemo(
    () =>
      toCsv(worksheet, [
        "E_coil_per_burst_kJ",
        "L_coil_uH",
        "I_peak_kA",
        "V_required_Blumlein_kV",
        "C_PFN_uF",
        "V0_PFN_kV",
      ]),
    [worksheet],
  );
  const busCsv = React.useMemo(() => toCsv(busRows, ["V_bus_kV", "I_bus_avg_A"]), [busRows]);
  const lastRunLabel = React.useMemo(() => new Date(fillMeta.timestamp).toLocaleString(), [fillMeta.timestamp]);
  const normalizedHeaders = React.useMemo(
    () => fillMeta.headers.map((header) => normalizeKey(header)),
    [fillMeta.headers],
  );
  const delimiterLabel = React.useMemo(() => {
    if (fillMeta.delimiter === "\t") return "tab";
    if (fillMeta.delimiter === ",") return "comma";
    if (fillMeta.delimiter === ";") return "semicolon";
    if (fillMeta.delimiter === "|") return "pipe";
    return fillMeta.delimiter || "n/a";
  }, [fillMeta.delimiter]);
  const displayNumber = React.useCallback((value?: number) => {
    const formatted = formatNumber(value);
    return formatted === "" ? "—" : formatted;
  }, []);

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-50">
      <aside className="w-[340px] border-r border-white/10 bg-slate-950/70 p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Needle Hull Mk.1</p>
            <h1 className="text-lg font-semibold text-slate-50">I_peak Worksheet</h1>
            <p className="text-xs text-slate-400">
              Mirrors the pulsed-power sketch (10 us window, 83.3 MW baseline).
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-400/50 bg-indigo-500/15">
            <Bolt className="h-5 w-5 text-indigo-200" />
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Info className="h-4 w-4 text-cyan-300" />
            <span>
              Feeds the load matrix in <code className="text-[11px]">docs/warp-pulsed-power.md</code>. Override with
              measured E/L and export CSV.
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
            <BadgeChip icon={<Zap className="h-3 w-3" />} label="83.3 MW P_avg" />
            <BadgeChip icon={<Zap className="h-3 w-3" />} label="10 us window" />
            <BadgeChip icon={<Zap className="h-3 w-3" />} label="1 kHz sector cadence" />
          </div>
        </div>

        <div className="space-y-3">
          <Field
            label="Energy per burst (kJ)"
            value={energyInput}
            onChange={setEnergyInput}
            hint="Comma/space separated"
            status={energies}
          />
          <Field
            label="Inductance (uH)"
            value={inductanceInput}
            onChange={setInductanceInput}
            hint="Comma/space separated"
            status={inductances}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Pulse window tau (us)" value={tauInput} onChange={setTauInput} />
            <Field label="P_avg (MW)" value={pAvgInput} onChange={setPAvgInput} />
          </div>
          <Field
            label="Bus voltages (kV)"
            value={busInput}
            onChange={setBusInput}
            hint="For avg bus current table"
            status={busVoltages}
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => downloadCsv(worksheetCsv, "needle_Ipeak_worksheet.csv")}
          >
            <Download className="h-4 w-4 mr-2" />
            Worksheet CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => downloadCsv(busCsv, "needle_bus_current_examples.csv")}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Bus table
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="w-full text-slate-100" onClick={resetDefaults}>
          Reset to defaults
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => docViewer.viewDoc("/docs/warp-pulsed-power.md")}
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          Open pulsed-power doc
        </Button>
      </aside>

      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex min-h-full flex-col">
            <section className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Worksheet ingest</p>
                  <h2 className="text-lg font-semibold text-slate-50">Load, detect, and fill I_peak</h2>
                  <p className="text-xs text-slate-400">
                    Auto-detects L/E/t_rise/di/dt and conductor geometry, then picks the best I_peak path per row with a
                    provenance note and needs list.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="border border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                    onClick={handleDownloadFilled}
                    disabled={!filledWorksheet.length}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Filled CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20"
                    onClick={handleRecompute}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-run fill
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="space-y-3 rounded-lg border border-white/10 bg-slate-900/60 p-3 xl:col-span-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-dashed border-white/30"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Load CSV
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-100" onClick={handleLoadDefault}>
                      Repo worksheet
                    </Button>
                    <BadgeChip icon={<FileSpreadsheet className="h-3 w-3" />} label={`${fillMeta.parsedRows} rows`} tone="cyan" />
                    <BadgeChip
                      icon={<Info className="h-3 w-3" />}
                      label={`${delimiterLabel}-sep`}
                    />
                  </div>
                  <Textarea
                    value={worksheetText}
                    onChange={(event) => setWorksheetText(event.target.value)}
                    className="min-h-[190px] bg-slate-950/70 border-white/10 text-xs font-mono text-slate-100"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>{loadMessage ?? `Last run: ${lastRunLabel} (${fillMeta.source})`}</span>
                    <span className="text-slate-500">
                      Headers: {fillMeta.headers.length ? normalizedHeaders.join(", ") : "none detected"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-white/10 bg-slate-900/60 p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <SummaryCard
                      label="I_peak solved"
                      value={`${fillMeta.filledRows}/${fillMeta.parsedRows || 0}`}
                      icon={<Zap className="h-4 w-4 text-emerald-200" />}
                    />
                    <SummaryCard
                      label="Needs data"
                      value={`${fillMeta.needsRows}`}
                      icon={<AlertTriangle className="h-4 w-4 text-amber-200" />}
                    />
                    <SummaryCard
                      label="Rows ingested"
                      value={`${fillMeta.parsedRows}`}
                      icon={<FileSpreadsheet className="h-4 w-4 text-cyan-200" />}
                    />
                    <SummaryCard
                      label="Headers"
                      value={`${fillMeta.headers.length}`}
                      icon={<Info className="h-4 w-4 text-slate-200" />}
                    />
                  </div>
                  {parsedWorksheet.warnings.length > 0 && (
                    <div className="rounded-md border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-100">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-4 w-4" />
                        Parser warnings
                      </div>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {parsedWorksheet.warnings.map((warning, idx) => (
                          <li key={`warn-${idx}`}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="rounded-md border border-white/10 bg-slate-950/60 p-2 text-[11px] text-slate-300">
                    <div className="font-semibold text-slate-100">Auto-detection</div>
                    <p className="mt-1">
                      Looks for L/E/t_rise/di/dt/V_max plus conductor geometry (area, width×thickness, N_parallel).
                      Keeps blanks for missing inputs and tags them in the needs column.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-slate-900/60">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Filled sheet preview</p>
                    <h3 className="text-base font-semibold text-slate-50">
                      I_peak path, V_required, J, and RMS estimates
                    </h3>
                    <p className="text-xs text-slate-400">
                      Method column shows which path won per row; "needs" lists the inputs that would improve the estimate.
                    </p>
                  </div>
                  <BadgeChip icon={<Calculator className="h-4 w-4" />} label={`${filledWorksheet.length} rows`} tone="cyan" />
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-900/70">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>I_peak (A)</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>V_req (kV)</TableHead>
                        <TableHead>V_max (kV)</TableHead>
                        <TableHead>di/dt (A/s)</TableHead>
                        <TableHead>L_total (uH)</TableHead>
                        <TableHead>J (A/mm²)</TableHead>
                        <TableHead>I_rms est (A)</TableHead>
                        <TableHead>Needs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filledWorksheet.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-xs text-slate-300">
                            No rows parsed yet. Load a CSV or paste content, then re-run the fill.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filledWorksheet.map((row) => (
                          <TableRow
                            key={`${row.name}-${row.L_H ?? row.E_pulse_J ?? row.I_peak_A ?? row.t_rise_s ?? row.pulse_width_s ?? row.rep_rate_hz ?? ""}`}
                          >
                            <TableCell className="font-semibold text-xs text-slate-100">{row.name}</TableCell>
                            <TableCell className="font-mono text-xs text-emerald-200">
                              {displayNumber(row.I_peak_A)}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-300">
                              {row.I_peak_method ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-cyan-200">
                              {displayNumber(row.V_required_kV)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-200">
                              {displayNumber(row.V_max_kV)}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-200">
                              {displayNumber(row.di_dt_A_per_s)}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-200">
                              {displayNumber(row.L_total_uH)}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-200">
                              {displayNumber(row.J_A_per_mm2)}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-200">
                              {displayNumber(row.I_rms_A_est)}
                            </TableCell>
                            <TableCell className="text-[11px] text-amber-100">{row.needs ?? "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </section>

            <Separator className="border-white/10" />

            <HeaderStrip tau={tau_us} pAvg={pAvg_MW} energies={energies.values} inductances={inductances.values} />
            <Separator className="border-white/10" />

            <div className="p-4 space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Provisional fill</p>
                    <h2 className="text-base font-semibold text-slate-50">
                      Three load classes (10 us Blumlein ramp)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Starter values to pre-fill the doc; swap with bench L/E once measured.
                    </p>
                  </div>
                  <BadgeChip icon={<Info className="h-4 w-4" />} label="10 us fixed" tone="amber" />
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/50 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-900/70">
                      <TableRow>
                        <TableHead>Load</TableHead>
                        <TableHead>E_burst (kJ)</TableHead>
                        <TableHead>L (uH)</TableHead>
                        <TableHead>t_rise (us)</TableHead>
                        <TableHead>I_peak (kA)</TableHead>
                        <TableHead>V_blumlein (kV)</TableHead>
                        <TableHead>C_PFN (uF)</TableHead>
                        <TableHead>V0_PFN (kV)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {provisionalRows.map((row) => (
                        <TableRow key={`${row.load}-${row.L_coil_uH}-${row.E_coil_per_burst_kJ}`}>
                          <TableCell className="text-xs text-slate-100">{row.load}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-200">
                            {row.E_coil_per_burst_kJ}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-200">{row.L_coil_uH}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-200">{row.t_rise_us}</TableCell>
                          <TableCell className="font-mono text-xs text-emerald-200">{row.I_peak_kA}</TableCell>
                          <TableCell className="font-mono text-xs text-cyan-200">
                            {row.V_required_Blumlein_kV}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-200">{row.C_PFN_uF}</TableCell>
                          <TableCell className="font-mono text-xs text-amber-200">{row.V0_PFN_kV}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-[11px] text-slate-400">
                  CSV mirror in repo: <code className="text-[11px]">data/needle_Ipeak_recommended.csv</code> (matches
                  the rows/rise times shown above).
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Worksheet</p>
                    <h2 className="text-base font-semibold text-slate-50">
                      I_peak, Blumlein step, and PFN sizing
                    </h2>
                    <p className="text-xs text-slate-400">
                      Idealized exchange; plug in measured E/L to update limits and PFN charging voltage.
                    </p>
                  </div>
                  <BadgeChip icon={<Calculator className="h-4 w-4" />} label={`${worksheet.length} rows`} tone="cyan" />
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/50 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-900/70">
                      <TableRow>
                        <TableHead>E_burst (kJ)</TableHead>
                        <TableHead>L (uH)</TableHead>
                        <TableHead>I_peak (kA)</TableHead>
                        <TableHead>V_blumlein (kV)</TableHead>
                        <TableHead>C_PFN (uF)</TableHead>
                        <TableHead>V0_PFN (kV)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {worksheet.map((row, idx) => (
                        <TableRow key={`${row.E_coil_per_burst_kJ}-${row.L_coil_uH}-${idx}`}>
                          <TableCell className="font-mono text-xs text-slate-100">
                            {row.E_coil_per_burst_kJ}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-200">{row.L_coil_uH}</TableCell>
                          <TableCell className="font-mono text-xs text-emerald-200">{row.I_peak_kA}</TableCell>
                          <TableCell className="font-mono text-xs text-cyan-200">
                            {row.V_required_Blumlein_kV}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-200">{row.C_PFN_uF}</TableCell>
                          <TableCell className="font-mono text-xs text-amber-200">{row.V0_PFN_kV}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Bus current</p>
                    <h3 className="text-base font-semibold text-slate-50">
                      Average bus current at {pAvg_MW} MW
                    </h3>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/50 overflow-hidden max-w-xl">
                  <Table>
                    <TableHeader className="bg-slate-900/70">
                      <TableRow>
                        <TableHead>V_bus (kV)</TableHead>
                        <TableHead>I_bus_avg (A)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {busRows.map((row) => (
                        <TableRow key={row.V_bus_kV}>
                          <TableCell className="font-mono text-xs text-slate-100">{row.V_bus_kV}</TableCell>
                          <TableCell className="font-mono text-xs text-cyan-200">{row.I_bus_avg_A}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  status?: ParsedList;
};

function Field({ label, value, onChange, hint, status }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-[0.22em] text-slate-300">{label}</Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 bg-slate-900/60 border-white/10 text-sm font-mono"
      />
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{hint ?? "\u00a0"}</span>
        {status ? (
          <span className="text-slate-500">
            {status.usedFallback ? "Using defaults" : "Parsed"}
            {status.invalid > 0 ? `, dropped ${status.invalid}` : ""}
          </span>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

type BadgeChipProps = {
  icon?: React.ReactNode;
  label: string;
  tone?: "cyan" | "slate" | "amber";
};

function BadgeChip({ icon, label, tone = "slate" }: BadgeChipProps) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
      : tone === "amber"
        ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
        : "border-white/15 bg-white/5 text-slate-100";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
        toneClass,
      )}
    >
      {icon}
      {label}
    </span>
  );
}

type HeaderStripProps = {
  tau: number;
  pAvg: number;
  energies: number[];
  inductances: number[];
};

function HeaderStrip({ tau, pAvg, energies, inductances }: HeaderStripProps) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 bg-slate-900/60 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard label="Pulse window tau" value={`${tau} us`} icon={<Zap className="h-4 w-4 text-cyan-200" />} />
      <SummaryCard label="P_avg" value={`${pAvg} MW`} icon={<Bolt className="h-4 w-4 text-emerald-200" />} />
      <SummaryCard label="E choices" value={`${energies.length} values`} icon={<Calculator className="h-4 w-4 text-indigo-200" />} />
      <SummaryCard
        label="L choices"
        value={`${inductances.length} values`}
        icon={<Calculator className="h-4 w-4 text-indigo-200" />}
      />
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

function SummaryCard({ label, value, icon }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900/70 text-slate-50">
        {icon}
      </div>
      <div className="leading-tight">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-50">{value}</p>
      </div>
    </div>
  );
}
