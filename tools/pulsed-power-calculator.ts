#!/usr/bin/env -S tsx

/**
 * Pulsed power worksheet helper.
 *
 * Computes I_peak, required V_bus, and current-density margin for a single load.
 * Defaults keep the repo's green-zone anchors in view:
 *   - P_avg = 83.3 MW
 *   - d_eff = 0.01 / 400 = 2.5e-5 (Ford-Roman ship-wide duty)
 *   - sector cadence = 1 kHz
 *
 * Usage:
 *   npx tsx tools/pulsed-power-calculator.ts --label midi --L-uH 0.5 --U 25 --tr-us 20 --area-mm2 40 --jc 2e9
 *   npx tsx tools/pulsed-power-calculator.ts --label sector --L-nH 50 --U 5 --tr-us 1 --eta 0.85
 *   npx tsx tools/pulsed-power-calculator.ts --label launcher --L-uH 2 --U 200 --tr-us 100 --area-mm2 120 --jc 1.4e9 --json
 */

export {};

type ParsedArgs = {
  label?: string;
  L_H?: number;
  U_J?: number;
  tr_s?: number;
  area_m2?: number;
  jc_A_m2?: number;
  margin?: number;
  etaPath?: number;
  pAvg_MW?: number;
  dEff?: number;
  sectorHz?: number;
  json?: boolean;
  help?: boolean;
};

type Calculation = {
  label: string;
  inputs: {
    inductance_H: number;
    energy_J: number;
    rise_s: number;
    area_m2?: number;
    jc_A_m2?: number;
    margin?: number;
    etaPath: number;
    pAvg_MW: number;
    dEff: number;
    sectorHz: number;
    energyFromPolicy_J: number;
    energySource: "explicit" | "policy";
  };
  derived: {
    iPeak_A: number;
    dIdt_A_per_us: number;
    busVoltage_V: number;
    currentDensity_A_m2?: number;
    jOverJc?: number;
    iAllowedAtMargin_A?: number;
  };
  policyCheck: {
    energyRatio_vs_policy: number;
    exceedsPolicy: boolean;
  };
};

const DEFAULTS = {
  P_AVG_MW: 83.3,
  D_EFF: 0.000025, // 0.01 / 400
  SECTOR_HZ: 1000,
  ETA: 1,
  MARGIN: 0.5,
} as const;

function parseArgs(argv: string[]): ParsedArgs {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    const isFlag = next === undefined || next.startsWith("--");
    if (isFlag) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }

  const num = (key: string): number | undefined => {
    const raw = args[key];
    if (raw === undefined) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };

  const label = typeof args.label === "string" ? (args.label as string) : undefined;

  const L_raw = num("L");
  const L_uH = num("L-uH") ?? num("L_uh") ?? num("Lmicro") ?? num("L_micro") ?? num("L-u") ?? num("LuH");
  const L_nH = num("L-nH") ?? num("L_nh") ?? num("Lnano") ?? num("L_nano") ?? num("L-n");
  const L_H = L_raw ?? (L_uH !== undefined ? L_uH / 1e6 : undefined) ?? (L_nH !== undefined ? L_nH / 1e9 : undefined);

  const U_J = num("U") ?? num("U_J");

  const tr_base = num("tr") ?? num("tr-s") ?? num("tr_s");
  const tr_ms = num("tr-ms") ?? num("tr_ms") ?? num("rise-ms") ?? num("rise_ms");
  const tr_us = num("tr-us") ?? num("tr_us") ?? num("rise-us") ?? num("rise_us");
  const tr_ns = num("tr-ns") ?? num("tr_ns") ?? num("rise-ns") ?? num("rise_ns");
  const tr_s =
    tr_base ??
    (tr_ms !== undefined ? tr_ms / 1e3 : undefined) ??
    (tr_us !== undefined ? tr_us / 1e6 : undefined) ??
    (tr_ns !== undefined ? tr_ns / 1e9 : undefined);

  const area_m2_explicit = num("area-m2") ?? num("area_m2");
  const area_mm2 = num("area-mm2") ?? num("area_mm2") ?? num("mm2");
  const area_cm2 = num("area-cm2") ?? num("area_cm2") ?? num("cm2");
  const area_m2 =
    area_m2_explicit ??
    (area_mm2 !== undefined ? area_mm2 * 1e-6 : undefined) ??
    (area_cm2 !== undefined ? area_cm2 * 1e-4 : undefined);

  const jc_A_m2 = num("jc") ?? num("Jc") ?? num("jc-A-m2") ?? num("jc_A_m2");
  const margin = num("margin");
  const etaPath = num("eta") ?? num("etaPath") ?? num("eta_path");
  const pAvg_MW = num("p-avg") ?? num("p_avg") ?? num("p-avg-mw") ?? num("p_avg_mw");
  const dEff = num("d-eff") ?? num("d_eff") ?? num("duty") ?? num("duty-fr");
  const sectorHz = num("sector-hz") ?? num("sector_hz") ?? num("f-sector") ?? num("f_sector");
  const json = args.json === true;
  const help = args.help === true || args.h === true;

  return { label, L_H, U_J, tr_s, area_m2, jc_A_m2, margin, etaPath, pAvg_MW, dEff, sectorHz, json, help };
}

function fmt(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return "n/a";
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  if (abs >= 1e4 || abs < 1e-2) return n.toExponential(digits - 1);
  return n.toFixed(Math.max(0, digits));
}

function compute(input: ParsedArgs): Calculation {
  if (!Number.isFinite(input.L_H ?? NaN)) {
    throw new Error("Missing inductance (use --L, --L-uH, or --L-nH).");
  }
  if (!Number.isFinite(input.tr_s ?? NaN)) {
    throw new Error("Missing rise time (use --tr-us/--tr-ms/--tr-s).");
  }

  const label = input.label ?? "load";
  const inductance_H = input.L_H as number;
  const rise_s = input.tr_s as number;
  const etaPath = input.etaPath ?? DEFAULTS.ETA;
  const pAvg_MW = input.pAvg_MW ?? DEFAULTS.P_AVG_MW;
  const dEff = input.dEff ?? DEFAULTS.D_EFF;
  const sectorHz = input.sectorHz ?? DEFAULTS.SECTOR_HZ;
  const margin = input.margin ?? DEFAULTS.MARGIN;

  const energyFromPolicy_J = (pAvg_MW * 1e6 * dEff) / Math.max(1e-9, sectorHz * Math.max(1e-6, etaPath));
  const energy_J = Number.isFinite(input.U_J ?? NaN) ? (input.U_J as number) : energyFromPolicy_J;
  const energySource: "explicit" | "policy" = Number.isFinite(input.U_J ?? NaN) ? "explicit" : "policy";

  if (!Number.isFinite(energy_J) || energy_J <= 0) {
    throw new Error("Energy per pulse must be positive. Provide --U or valid power/duty/sector inputs.");
  }

  const iPeak_A = Math.sqrt((2 * energy_J) / inductance_H);
  const dIdt = iPeak_A / Math.max(1e-12, rise_s);
  const busVoltage_V = inductance_H * dIdt;

  const area_m2 = input.area_m2;
  const jc = input.jc_A_m2;
  const currentDensity_A_m2 = area_m2 ? iPeak_A / area_m2 : undefined;
  const iAllowedAtMargin_A = area_m2 && jc ? jc * area_m2 * margin : undefined;
  const jOverJc = currentDensity_A_m2 && jc ? currentDensity_A_m2 / jc : undefined;

  const energyRatio_vs_policy = energy_J / Math.max(1e-12, energyFromPolicy_J);

  return {
    label,
    inputs: {
      inductance_H,
      energy_J,
      rise_s,
      area_m2,
      jc_A_m2: jc,
      margin,
      etaPath,
      pAvg_MW,
      dEff,
      sectorHz,
      energyFromPolicy_J,
      energySource,
    },
    derived: {
      iPeak_A,
      dIdt_A_per_us: dIdt / 1e6,
      busVoltage_V,
      currentDensity_A_m2,
      jOverJc,
      iAllowedAtMargin_A,
    },
    policyCheck: {
      energyRatio_vs_policy,
      exceedsPolicy: energyRatio_vs_policy > 1,
    },
  };
}

function printHelp(): void {
  console.log(`Pulsed-power calculator

Usage:
  npx tsx tools/pulsed-power-calculator.ts --L-uH 0.5 --U 25 --tr-us 20 [--area-mm2 40 --jc 2e9]

Required:
  --L, --L-uH, or --L-nH     Inductance
  --tr-us / --tr-ms / --tr-s Rise time to peak
  --U                        Energy per pulse (J). If omitted, uses policy P_avg/d_eff/sectorHz.

Optional:
  --label <name>             Label for the load
  --area-mm2 / --area-cm2    Superconductor cross-section for J calculation
  --jc <A/m^2>               Critical current density
  --margin <0..1>            J/Jc margin target (default 0.5)
  --eta <0..1>               PFN->load efficiency (default 1)
  --p-avg-mw <MW>            Ship average power (default 83.3)
  --d-eff <duty>             Effective ship duty (default 2.5e-5)
  --sector-hz <Hz>           Sector cadence (default 1000)
  --json                     Emit JSON instead of text
  --help                     This message
`);
}

function printResult(calc: Calculation): void {
  const { inputs, derived, policyCheck } = calc;
  console.log(`\n[${calc.label}] I_peak worksheet`);
  console.log(`  L: ${fmt(inputs.inductance_H * 1e6, 4)} uH`);
  console.log(`  U_pulse: ${fmt(inputs.energy_J, 4)} J (${inputs.energySource === "policy" ? "policy-derived" : "explicit"})`);
  console.log(`  t_rise: ${fmt(inputs.rise_s * 1e6, 4)} us`);
  console.log(`  I_peak: ${fmt(derived.iPeak_A, 4)} A`);
  console.log(`  dI/dt: ${fmt(derived.dIdt_A_per_us, 4)} A/us`);
  console.log(`  V_bus ~ L*dI/dt: ${fmt(derived.busVoltage_V, 4)} V`);
  console.log(`  Policy energy: ${fmt(inputs.energyFromPolicy_J, 4)} J (P_avg=${inputs.pAvg_MW} MW, d_eff=${inputs.dEff}, f_sector=${inputs.sectorHz} Hz, eta=${inputs.etaPath})`);
  console.log(`  Policy ratio: ${fmt(policyCheck.energyRatio_vs_policy, 4)}x ${policyCheck.exceedsPolicy ? "(exceeds policy energy)" : ""}`);

  if (inputs.area_m2) {
    const area_mm2 = inputs.area_m2 * 1e6;
    console.log(`  Area: ${fmt(area_mm2, 4)} mm^2`);
    console.log(`  J_peak: ${derived.currentDensity_A_m2 ? fmt(derived.currentDensity_A_m2, 4) : "n/a"} A/m^2`);
    if (inputs.jc_A_m2) {
      console.log(`  J/Jc: ${derived.jOverJc ? fmt(derived.jOverJc, 4) : "n/a"} (margin=${inputs.margin ?? DEFAULTS.MARGIN})`);
      if (derived.iAllowedAtMargin_A !== undefined) {
        console.log(`  I at margin (${inputs.margin ?? DEFAULTS.MARGIN}*Jc): ${fmt(derived.iAllowedAtMargin_A, 4)} A`);
      }
    }
  }
  console.log("");
}

async function main() {
  const parsed = parseArgs(process.argv);
  if (parsed.help) {
    printHelp();
    return;
  }
  try {
    const calc = compute(parsed);
    if (parsed.json) {
      console.log(JSON.stringify(calc, null, 2));
    } else {
      printResult(calc);
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    printHelp();
    process.exitCode = 1;
  }
}

main();
