import { readFileSync } from "node:fs";
import { z } from "zod";
import type { StarSimFusionProfileImport } from "../../../../shared/starsim-fusion-profile-import";
import { parseStarSimFusionProfileImport } from "../../../../shared/starsim-fusion-profile-import";

const R_SUN_CM = 6.957e10;
const M_SUN_G = 1.98847e33;

export const mesaParsedHistorySchema = z.object({
  schemaVersion: z.literal("starsim-mesa-history-parse.v1"),
  path: z.string(),
  finalAge_Gyr: z.number().optional(),
  luminosity_Lsun: z.number().optional(),
  radius_Rsun: z.number().optional(),
  effectiveTemperature_K: z.number().optional(),
  parserWarnings: z.array(z.string()),
});

export type MesaParsedHistory = z.infer<typeof mesaParsedHistorySchema>;

export type MesaProfileParseOptions = {
  path: string;
  objectId?: string;
  sourceRef?: string;
  sourceHash?: string;
  profileHash?: string;
  inlistHash?: string;
  historyHash?: string;
  mesaVersion?: string;
  network?: string;
  eos?: string;
  opacity?: string;
  metallicity_Z?: number;
  mixingLengthAlpha?: number;
  initialMass_Msun?: number;
  ratesSource?: string;
};

export type MesaProfileParseResult = {
  profile: StarSimFusionProfileImport;
  parserWarnings: string[];
};

export function parseMesaProfileFile(options: MesaProfileParseOptions): MesaProfileParseResult {
  const table = parseMesaTable(readFileSync(options.path, "utf8"));
  const warnings: string[] = [];
  const missing = (column: string) => !table.columns.includes(column);
  if (missing("eps_pp")) warnings.push("missing_eps_pp");
  if (missing("eps_cno")) warnings.push("missing_eps_cno");
  if (missing("eps_3alpha")) warnings.push("missing_eps_3alpha");
  if (!hasAny(table.columns, ["radius", "logR", "log_R"]) || !hasAny(table.columns, ["mass", "q"])) {
    throw new Error("MESA profile requires radius/logR and mass/q integration basis.");
  }
  const sorted = table.rows
    .map((row) => rowToShell(row, table.columns))
    .sort((a, b) => (a.enclosedMass_Msun ?? 0) - (b.enclosedMass_Msun ?? 0));
  if (sorted.some((shell) => !Number.isFinite(shell.radius_Rstar ?? NaN))) {
    throw new Error("MESA profile contains unusable numeric radius fields.");
  }
  const shells = sorted.map((shell, index, rows) => {
    const previousMass = index > 0 ? rows[index - 1].enclosedMass_Msun ?? 0 : 0;
    const enclosedMass = shell.enclosedMass_Msun ?? 0;
    const shellMass_g = Math.max((enclosedMass - previousMass) * M_SUN_G, 1);
    return {
      ...shell,
      shellIndex: index,
      shellMass_g,
    };
  });
  const totalLuminosity = lastFinite(table.rows.map((row) => get(row, table.columns, ["luminosity", "logL"])));
  const profile = parseStarSimFusionProfileImport({
    schemaVersion: "starsim-fusion-profile-import.v1",
    objectId: options.objectId ?? "Sun",
    source: "mesa_profile",
    sourceRef: options.sourceRef ?? options.path,
    sourceHash: options.sourceHash,
    stellarClass: {
      spectralType: "G2V",
      luminosityClass: "V",
      objectClass: "main_sequence",
    },
    global: {
      mass_Msun: options.initialMass_Msun ?? 1,
      radius_Rsun: 1,
      luminosity_Lsun: totalLuminosity ?? 1,
      effectiveTemperature_K: 5772,
      metallicity_feh: 0,
      age_Gyr: undefined,
    },
    mesaMetadata: {
      mesaVersion: options.mesaVersion,
      inlistHash: options.inlistHash,
      profileHash: options.profileHash ?? options.sourceHash ?? "unhashed-profile",
      historyHash: options.historyHash,
      network: options.network,
      eos: options.eos,
      opacity: options.opacity,
      metallicity_Z: options.metallicity_Z,
      mixingLengthAlpha: options.mixingLengthAlpha,
      initialMass_Msun: options.initialMass_Msun,
    },
    shells,
    hSpectralFit: { role: "calibration_only" },
    provenance: {
      reproducibilityStatus: "mesa_imported",
      qstRole: "stellar_quantum_microphysics_prior",
      claimIds: ["mesa_profile_parser_requires_integration_basis.v1"],
      citations: ["https://arxiv.org/abs/1009.1622"],
      caveats: [
        "Parsed MESA-like output for solar reference reproduction; parser warnings must be retained.",
        ...warnings,
      ],
    },
  });
  return { profile, parserWarnings: warnings };
}

export function parseMesaHistoryFile(path: string): MesaParsedHistory {
  const table = parseMesaTable(readFileSync(path, "utf8"));
  const last = table.rows.at(-1);
  return mesaParsedHistorySchema.parse({
    schemaVersion: "starsim-mesa-history-parse.v1",
    path,
    finalAge_Gyr: last ? get(last, table.columns, ["star_age"]) : undefined,
    luminosity_Lsun: last ? get(last, table.columns, ["luminosity", "log_L"]) : undefined,
    radius_Rsun: last ? get(last, table.columns, ["radius", "log_R"]) : undefined,
    effectiveTemperature_K: last ? get(last, table.columns, ["Teff", "log_Teff"]) : undefined,
    parserWarnings: [],
  });
}

function parseMesaTable(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const headerIndex = lines.findIndex((line) => /[A-Za-z_]/.test(line) && !/^[\d\s.+\-Ee]+$/.test(line));
  if (headerIndex < 0) throw new Error("MESA table header not found.");
  const columns = lines[headerIndex].split(/\s+/);
  const rows = lines.slice(headerIndex + 1).map((line) => {
    const values = line.split(/\s+/).map((value) => Number(value));
    if (values.length !== columns.length || values.some((value) => !Number.isFinite(value))) {
      throw new Error("MESA table contains nonnumeric or incomplete row fields.");
    }
    return values;
  });
  if (rows.length === 0) throw new Error("MESA table contains no numeric rows.");
  return { columns, rows };
}

function rowToShell(row: number[], columns: string[]) {
  const radius = get(row, columns, ["radius"]);
  const logR = get(row, columns, ["logR", "log_R"]);
  const enclosedMass = get(row, columns, ["mass"]);
  const q = get(row, columns, ["q"]);
  const epsPp = get(row, columns, ["eps_pp"]);
  const epsCno = get(row, columns, ["eps_cno"]);
  const epsTripleAlpha = get(row, columns, ["eps_3alpha", "eps_3_alpha"]);
  const epsNuc = get(row, columns, ["eps_nuc"]) ?? sumDefined([epsPp, epsCno, epsTripleAlpha]);
  return {
    shellIndex: 0,
    radius_Rstar: radius ?? (logR !== undefined ? Math.pow(10, logR) : undefined),
    radius_cm:
      radius !== undefined
        ? radius * R_SUN_CM
        : logR !== undefined
          ? Math.pow(10, logR) * R_SUN_CM
          : undefined,
    enclosedMass_Msun: enclosedMass ?? q,
    temperature_K: expMaybeLog(get(row, columns, ["temperature", "logT", "log_T"])),
    density_g_cm3: expMaybeLog(get(row, columns, ["density", "logRho", "log_Rho"])),
    pressure_dyn_cm2: expMaybeLog(get(row, columns, ["pressure", "logP", "log_P"])),
    luminosity_Lsun: get(row, columns, ["luminosity", "logL", "log_L"]),
    epsNuc_erg_g_s: epsNuc,
    epsPp_erg_g_s: epsPp,
    epsCno_erg_g_s: epsCno,
    epsTripleAlpha_erg_g_s: epsTripleAlpha,
    hydrogenMassFraction: get(row, columns, ["h1", "x_mass_fraction_H", "hydrogen"]),
    heliumMassFraction: get(row, columns, ["he4", "y_mass_fraction_He", "helium"]),
    metallicityMassFraction: get(row, columns, ["z", "metallicity"]),
  };
}

function get(row: number[], columns: string[], names: string[]) {
  for (const name of names) {
    const index = columns.indexOf(name);
    if (index >= 0) {
      const value = row[index];
      if (name.startsWith("log")) return Math.pow(10, value);
      return value;
    }
  }
  return undefined;
}

function hasAny(columns: string[], names: string[]) {
  return names.some((name) => columns.includes(name));
}

function expMaybeLog(value?: number) {
  return value;
}

function sumDefined(values: Array<number | undefined>) {
  const filtered = values.filter((value): value is number => value !== undefined);
  return filtered.length > 0 ? filtered.reduce((acc, value) => acc + value, 0) : undefined;
}

function lastFinite(values: Array<number | undefined>) {
  return values.filter((value): value is number => value !== undefined).at(-1);
}
