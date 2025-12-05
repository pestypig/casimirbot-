#!/usr/bin/env -S tsx

/**
 * Needle Hull Mk.1 I_peak worksheet generator (pulsed-power sketch).
 *
 * Varies coil energy-per-burst (kJ) and inductance (uH) to produce:
 *   - I_peak required to store the selected energy in the coil
 *   - Blumlein (square) voltage step to reach I_peak in a 10 us window
 *   - Equivalent half-sine PFN capacitor (10 us half-cycle) and charge voltage
 * Also emits a small bus-current table for the 83.3 MW ship average power.
 *
 * Usage (defaults match the design note):
 *   npx tsx tools/needle-ipeak-worksheet.ts
 *   npx tsx tools/needle-ipeak-worksheet.ts --energy-kj 2,4,8 --L-uH 0.5,1,2 --tau-us 8 --bus-kv 5,15
 */

import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

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

type Inputs = {
  energies_kJ: number[];
  inductances_uH: number[];
  tau_us: number;
  pAvg_MW: number;
  bus_kV: number[];
  outPath: string;
  busOutPath: string;
  help: boolean;
};

const DEFAULTS = {
  ENERGIES_KJ: [1, 5, 10, 20, 40],
  INDUCTANCES_UH: [1, 5, 10, 20, 50, 100],
  TAU_US: 10,
  P_AVG_MW: 83.3,
  BUS_KV: [5, 10, 20, 40],
  OUT_PATH: "data/needle_Ipeak_worksheet.csv",
  BUS_OUT_PATH: "data/needle_bus_current_examples.csv",
};

function parseNumber(raw?: string | number): number | undefined {
  if (raw === undefined) return undefined;
  const n = typeof raw === "number" ? raw : Number(String(raw));
  return Number.isFinite(n) ? n : undefined;
}

function parseList(raw?: string): number[] | undefined {
  if (!raw) return undefined;
  const parts = raw.split(/[,;\/\s]+/).filter(Boolean);
  const values = parts.map((part) => Number(part)).filter((n) => Number.isFinite(n));
  return values.length ? values : undefined;
}

function parseArgs(argv: string[]): Inputs {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }

  const energies_kJ =
    parseList(args["energy-kj"] as string) ??
    parseList(args["E-kJ"] as string) ??
    DEFAULTS.ENERGIES_KJ;

  const inductances_uH =
    parseList(args["L-uH"] as string) ??
    parseList(args["L_uH"] as string) ??
    parseList(args["L"] as string) ??
    DEFAULTS.INDUCTANCES_UH;

  const tau_us = parseNumber(args["tau-us"] as string) ?? DEFAULTS.TAU_US;
  const pAvg_MW = parseNumber(args["p-avg-mw"] as string) ?? DEFAULTS.P_AVG_MW;
  const bus_kV = parseList(args["bus-kv"] as string) ?? DEFAULTS.BUS_KV;

  const outPath = (args["out"] as string) ?? DEFAULTS.OUT_PATH;
  const busOutPath = (args["bus-out"] as string) ?? DEFAULTS.BUS_OUT_PATH;
  const help = args["help"] === true || args["h"] === true;

  return { energies_kJ, inductances_uH, tau_us, pAvg_MW, bus_kV, outPath, busOutPath, help };
}

function round(n: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function generateWorksheetRows(energies_kJ: number[], inductances_uH: number[], tau_us: number): WorksheetRow[] {
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

function generateBusRows(bus_kV: number[], pAvg_MW: number): BusRow[] {
  const pAvg_W = pAvg_MW * 1e6;
  return bus_kV.map((kv) => ({
    V_bus_kV: round(kv, 6),
    I_bus_avg_A: round(pAvg_W / Math.max(kv * 1e3, 1e-9), 6),
  }));
}

function toCsv<T extends Record<string, number>>(rows: T[], columns: (keyof T)[]): string {
  const header = columns.join(",");
  const lines = rows.map((row) => columns.map((col) => row[col]).join(","));
  return [header, ...lines].join("\n");
}

function ensureDir(pathStr: string) {
  mkdirSync(dirname(pathStr), { recursive: true });
}

function printHelp() {
  console.log(`Needle Hull Mk.1 I_peak worksheet generator

Options:
  --energy-kj <list>   Comma/space list of coil energy per burst in kJ (default: ${DEFAULTS.ENERGIES_KJ.join(",")})
  --L-uH <list>        Comma/space list of inductances in uH (default: ${DEFAULTS.INDUCTANCES_UH.join(",")})
  --tau-us <number>    Pulse window to reach I_peak in microseconds (default: ${DEFAULTS.TAU_US})
  --p-avg-mw <number>  Ship average power for bus-current table (default: ${DEFAULTS.P_AVG_MW})
  --bus-kv <list>      Bus voltages (kV) for current table (default: ${DEFAULTS.BUS_KV.join(",")})
  --out <path>         Output CSV for the worksheet (default: ${DEFAULTS.OUT_PATH})
  --bus-out <path>     Output CSV for bus current examples (default: ${DEFAULTS.BUS_OUT_PATH})
  --help               Show this message
`);
}

function main() {
  const inputs = parseArgs(process.argv);
  if (inputs.help) {
    printHelp();
    return;
  }

  const worksheetRows = generateWorksheetRows(inputs.energies_kJ, inputs.inductances_uH, inputs.tau_us);
  const busRows = generateBusRows(inputs.bus_kV, inputs.pAvg_MW);

  const outPath = resolve(process.cwd(), inputs.outPath);
  const busOutPath = resolve(process.cwd(), inputs.busOutPath);
  ensureDir(outPath);
  ensureDir(busOutPath);

  const worksheetCsv = toCsv(worksheetRows, [
    "E_coil_per_burst_kJ",
    "L_coil_uH",
    "I_peak_kA",
    "V_required_Blumlein_kV",
    "C_PFN_uF",
    "V0_PFN_kV",
  ]);
  const busCsv = toCsv(busRows, ["V_bus_kV", "I_bus_avg_A"]);

  writeFileSync(outPath, worksheetCsv, "utf-8");
  writeFileSync(busOutPath, busCsv, "utf-8");

  console.log(`Needle Hull pulsed-power worksheet
  P_avg: ${inputs.pAvg_MW} MW
  tau: ${inputs.tau_us} us window to I_peak
  energies (kJ): ${inputs.energies_kJ.join(", ")}
  inductances (uH): ${inputs.inductances_uH.join(", ")}
  bus voltages (kV): ${inputs.bus_kV.join(", ")}
  rows: ${worksheetRows.length}
  written: ${outPath}
  bus table: ${busOutPath}
`);

  const preview = worksheetRows.slice(0, 3);
  if (preview.length) {
    console.log("Preview (first rows):");
    preview.forEach((row) => {
      console.log(
        `  E=${row.E_coil_per_burst_kJ} kJ, L=${row.L_coil_uH} uH -> I_pk=${row.I_peak_kA} kA, V_blumlein=${row.V_required_Blumlein_kV} kV, C_PFN=${row.C_PFN_uF} uF, V0=${row.V0_PFN_kV} kV`,
      );
    });
  }
}

main();
