import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import {
  buildTheoryRuntimeMathTraceV1,
  type TheoryRuntimeMathStepV1,
  type TheoryRuntimeMathTraceV1,
} from "../../../../shared/contracts/theory-runtime-math-trace.v1";
import {
  buildTheoryRuntimeReceiptV1,
  type TheoryRuntimeGateStatus,
  type TheoryRuntimeReceiptStatus,
  type TheoryRuntimeReceiptV1,
} from "../../../../shared/contracts/theory-runtime-receipt.v1";
import type {
  TheoryRuntimeAdapter,
  TheoryRuntimeAdapterInput,
} from "./theory-runtime-adapter-types";

export const STARSIM_RUNTIME_ADAPTER_ID = "starsim.artifact_reader" as const;
export const STARSIM_LANE_ID = "stellar_evolution" as const;

const STARSIM_CORE_BADGE_IDS = [
  "starsim.observable.surface_temperature_proxy",
  "starsim.observable.surface_gravity",
  "starsim.observable.mean_density",
  "starsim.structure.core_temperature_proxy",
  "starsim.structure.core_density_proxy",
  "starsim.classifier.compactness_scale",
  "starsim.runtime.evaluate_fusion_microphysics",
  "starsim.claim_boundary.stage1_reduced_order_prior",
] as const;

const STARSIM_RESTORATION_BADGE_IDS = [
  "starsim.restoration.deep_mixing_mass_flux",
  "starsim.restoration.tachocline_downflow_setpoint",
  "starsim.restoration.core_hydrogen_balance",
  "starsim.restoration.lifetime_extension_proxy",
  "starsim.restoration.guardrail_constraints",
  "starsim.restoration.transition_hazard_proxy",
  "starsim.restoration.claim_boundary.planning_forecast_only",
] as const;

export const STARSIM_SUPPORTED_BADGE_IDS = [
  ...STARSIM_CORE_BADGE_IDS,
  ...STARSIM_RESTORATION_BADGE_IDS,
] as const;

export const STARSIM_ARTIFACT_PATTERNS = [
  "artifacts/starsim/**/*.json",
  "reports/**/*starsim*.json",
  "artifacts/**/*starsim*fusion*benchmark*.json",
  "artifacts/**/*starsim*solar*reference*.json",
  "artifacts/**/*starsim*mesa*.json",
  "artifacts/**/*deep*mix*.json",
  "artifacts/**/*solar*restoration*.json",
  "reports/**/*deep*mix*.json",
  "reports/**/*solar*restoration*.json",
  "artifacts/**/*opacity*.json",
  "artifacts/**/*fusion*microphysics*.json",
  "reports/**/*mesa*.json",
] as const;

const SCALAR_KEYS = [
  "M",
  "R",
  "L",
  "T_eff",
  "rho_mean",
  "g_surface",
  "compactness",
  "fusionMargin",
  "epsilon",
  "areaFraction",
  "f_area",
  "r_tach",
  "rho_tach",
  "Mdot_mix",
  "Mdot_burn_sun",
  "Mdot_burn",
  "v_r",
  "v_r_mm_yr",
  "L_sun_W",
  "Q_H",
  "X_c",
  "X_e",
  "M_c",
  "dXc_dt",
  "alpha",
  "M_env_H",
  "Delta_t_Myr",
  "dlnL_limit",
  "dlnL_abs",
  "dlnTc_limit",
  "dlnTc_abs",
  "luminosity_margin",
  "core_temp_margin",
  "seismicGrowth",
  "neutrinoDelta",
  "h0",
  "beta",
  "deficit",
  "h",
  "T",
  "P",
] as const;

const CONTEXT_KEYS = [
  "dominantFusionChannel",
  "opacityProvenance",
  "opticalDepthConvention",
  "opticalDepthStatus",
  "mesaResidual",
  "mesaResidualRms",
  "mesaResidualMax",
] as const;

type ParsedArtifact = {
  relativePath: string;
  data: unknown;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeKey(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function walk(value: unknown, visit: (key: string, entry: unknown, keyPath: string) => void, prefix = ""): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visit, `${prefix}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    visit(key, entry, keyPath);
    walk(entry, visit, keyPath);
  }
}

function aliasForScalarKey(key: string): (typeof SCALAR_KEYS)[number] | null {
  const normalized = normalizeKey(key);
  if (["m", "mass", "massmsun", "masssolar", "massm"].includes(normalized)) return "M";
  if (["r", "radius", "radiusrsun", "radiussolar", "radiusm"].includes(normalized)) return "R";
  if (["l", "luminosity", "luminositylsun"].includes(normalized)) return "L";
  if (["teff", "teffective", "effectivetemperature", "effectivetemperaturek"].includes(normalized)) return "T_eff";
  if (["rhomean", "meandensity", "meandensitygcm3"].includes(normalized)) return "rho_mean";
  if (["gsurface", "surfacegravity", "surfacegravityms2", "logg"].includes(normalized)) return "g_surface";
  if (["compactness", "compactnessscale"].includes(normalized)) return "compactness";
  if (["fusionmargin", "cnomargin", "ppmargin", "fusionstagemargin"].includes(normalized)) return "fusionMargin";
  if (["epsilon", "mixingstrength", "deepmixingepsilon"].includes(normalized)) return "epsilon";
  if (["areafraction", "beltfraction", "engagedareafraction"].includes(normalized)) return "areaFraction";
  if (["farea", "areafractionf", "actuatorareafraction"].includes(normalized)) return "f_area";
  if (["rtach", "rtachm", "tachoclineradius", "tachoclineradiusm"].includes(normalized)) return "r_tach";
  if (["rhotach", "rhotachkgm3", "tachoclinedensity", "tachoclinedensitykgm3"].includes(normalized)) return "rho_tach";
  if (["mdotmix", "mdotmixkgs", "mixingmassflux", "deepmixingmassflux"].includes(normalized)) return "Mdot_mix";
  if (["mdotburnsun", "mdotburnsunkgs", "solarburnrate", "solarhydrogenburnrate"].includes(normalized)) {
    return "Mdot_burn_sun";
  }
  if (["mdotburn", "mdotburnkgs", "hydrogenburnrate", "burnmassrate"].includes(normalized)) return "Mdot_burn";
  if (["vr", "vrmps", "radialdownflow", "downflowspeed", "tachoclinedownflow"].includes(normalized)) return "v_r";
  if (["vrmmyr", "vrmmperyr", "downflowmmyr"].includes(normalized)) return "v_r_mm_yr";
  if (["lsunw", "luminosityw", "solarluminosityw"].includes(normalized)) return "L_sun_W";
  if (["qh", "fusionenergyspecific", "hydrogenfusionenergyscale", "epsilonfusion"].includes(normalized)) return "Q_H";
  if (["xc", "corehydrogen", "corehydrogenfraction"].includes(normalized)) return "X_c";
  if (["xe", "envelopehydrogen", "envelopehydrogenfraction"].includes(normalized)) return "X_e";
  if (["mc", "coremass", "coremasskg"].includes(normalized)) return "M_c";
  if (["dxcdt", "corehydrogendrift", "corehydrogenfractionrate"].includes(normalized)) return "dXc_dt";
  if (["alpha", "accessiblefraction", "envelopefractionaccessible"].includes(normalized)) return "alpha";
  if (["menvh", "menvhydrogen", "envelopehydrogenmass", "envelopehydrogenmasskg"].includes(normalized)) return "M_env_H";
  if (["deltatmyr", "lifetimemyr", "lifetimeextensionmyr", "targetdeltatmyr"].includes(normalized)) {
    return "Delta_t_Myr";
  }
  if (["dlnllimit", "dlogllimit", "dloglpermyrmax"].includes(normalized)) return "dlnL_limit";
  if (["dlnlabs", "dloglabs", "dloglpermyrabs"].includes(normalized)) return "dlnL_abs";
  if (["dlntclimit", "dlogtclimit", "dlogtcpermyrmax"].includes(normalized)) return "dlnTc_limit";
  if (["dlntcabs", "dlogtcabs", "dlogtcpermyrabs"].includes(normalized)) return "dlnTc_abs";
  if (["luminositymargin", "dlnlmargin", "dloglmargin"].includes(normalized)) return "luminosity_margin";
  if (["coretempmargin", "coretemperaturemargin", "dlntcmargin", "dlogtcmargin"].includes(normalized)) {
    return "core_temp_margin";
  }
  if (["seismicgrowth", "seismicgrowthrate"].includes(normalized)) return "seismicGrowth";
  if (["neutrinodelta", "neutrinodrift"].includes(normalized)) return "neutrinoDelta";
  if (["h0", "hazardbaseline"].includes(normalized)) return "h0";
  if (["beta", "hazardbeta"].includes(normalized)) return "beta";
  if (["deficit", "xdeficit", "corehydrogendeficit"].includes(normalized)) return "deficit";
  if (["h", "hazard", "transitionhazard"].includes(normalized)) return "h";
  if (["t", "horizon", "horizongyr"].includes(normalized)) return "T";
  if (["p", "probability", "transitionprobability"].includes(normalized)) return "P";
  return null;
}

function aliasForContextKey(key: string): (typeof CONTEXT_KEYS)[number] | null {
  const normalized = normalizeKey(key);
  if (["dominantfusionchannel", "fusionchannel", "dominantchannel"].includes(normalized)) {
    return "dominantFusionChannel";
  }
  if (["opacityprovenance", "opacitysource", "opacitytable", "opacitymanifest"].includes(normalized)) {
    return "opacityProvenance";
  }
  if (["opticaldepthconvention", "tauconvention"].includes(normalized)) return "opticalDepthConvention";
  if (["opticaldepthstatus", "taustatus"].includes(normalized)) return "opticalDepthStatus";
  if (["mesaresidual"].includes(normalized)) return "mesaResidual";
  if (["mesaresidualrms", "rmsresidual"].includes(normalized)) return "mesaResidualRms";
  if (["mesaresidualmax", "maxresidual"].includes(normalized)) return "mesaResidualMax";
  return null;
}

function gateStatusFromValue(value: unknown): TheoryRuntimeGateStatus {
  if (isRecord(value)) {
    for (const key of ["status", "state", "verdict", "available", "present", "passed"]) {
      if (key in value) return gateStatusFromValue(value[key]);
    }
    return "unknown";
  }
  if (typeof value === "boolean") return value ? "pass" : "fail";
  if (typeof value === "number") return Number.isFinite(value) ? "pass" : "unknown";
  if (typeof value !== "string") return "unknown";
  const normalized = normalizeKey(value);
  if (["pass", "passed", "ok", "available", "present", "true", "ready", "stage1"].includes(normalized)) return "pass";
  if (["fail", "failed", "false", "missing", "invalid"].includes(normalized)) return "fail";
  if (["unknown", "unavailable", "notready", "none", "null"].includes(normalized)) return "not_ready";
  if (["notapplicable", "na"].includes(normalized)) return "not_applicable";
  return "unknown";
}

async function readArtifacts(projectRoot: string): Promise<ParsedArtifact[]> {
  const paths = await fg([...STARSIM_ARTIFACT_PATTERNS], {
    cwd: projectRoot,
    onlyFiles: true,
    dot: false,
    unique: true,
  });
  const artifacts: ParsedArtifact[] = [];
  for (const relativePath of paths) {
    const absolutePath = path.resolve(projectRoot, relativePath);
    const raw = await fs.readFile(absolutePath, "utf8");
    artifacts.push({
      relativePath: normalizeRelativePath(relativePath),
      data: JSON.parse(raw) as unknown,
    });
  }
  return artifacts;
}

function collectScalars(artifacts: ParsedArtifact[]): Record<string, number | string | boolean | null> {
  const scalars: Record<string, number | string | boolean | null> = {};
  for (const artifact of artifacts) {
    walk(artifact.data, (key, entry, keyPath) => {
      if (entry !== null && typeof entry !== "number" && typeof entry !== "string" && typeof entry !== "boolean") {
        return;
      }
      if (/gate|status|verdict/i.test(keyPath)) return;
      const scalarKey = aliasForScalarKey(key);
      if (scalarKey && typeof entry !== "number") return;
      if (scalarKey && !(scalarKey in scalars)) scalars[scalarKey] = entry;
      const contextKey = aliasForContextKey(key);
      if (contextKey && !(contextKey in scalars)) scalars[contextKey] = entry;
    });
  }
  return scalars;
}

function deriveScalarCuts(
  scalars: Record<string, number | string | boolean | null>,
): Record<string, number | string | boolean | null> {
  const derived: Record<string, number | string | boolean | null> = {};
  const G = 6.67430e-11;
  const c = 299_792_458;
  const TSun = 5772;
  const secondsPerYear = 31_557_600;
  if (typeof scalars.L === "number" && typeof scalars.R === "number" && !("T_eff" in scalars)) {
    derived.T_eff = TSun * (scalars.L / scalars.R ** 2) ** 0.25;
  }
  if (typeof scalars.M === "number" && typeof scalars.R === "number") {
    if (!("g_surface" in scalars)) derived.g_surface = (G * scalars.M) / scalars.R ** 2;
    if (!("rho_mean" in scalars)) derived.rho_mean = (3 * scalars.M) / (4 * Math.PI * scalars.R ** 3);
    if (!("compactness" in scalars)) derived.compactness = (G * scalars.M) / (scalars.R * c ** 2);
  }
  const areaFraction =
    typeof scalars.areaFraction === "number"
      ? scalars.areaFraction
      : typeof scalars.f_area === "number"
        ? scalars.f_area
        : undefined;
  if (
    typeof scalars.L_sun_W === "number" &&
    typeof scalars.Q_H === "number" &&
    scalars.Q_H !== 0 &&
    !("Mdot_burn" in scalars) &&
    !("Mdot_burn_sun" in scalars)
  ) {
    derived.Mdot_burn = scalars.L_sun_W / scalars.Q_H;
    derived.Mdot_burn_sun = derived.Mdot_burn;
  }
  const burnRate =
    typeof scalars.Mdot_burn_sun === "number"
      ? scalars.Mdot_burn_sun
      : typeof scalars.Mdot_burn === "number"
        ? scalars.Mdot_burn
        : typeof derived.Mdot_burn_sun === "number"
          ? derived.Mdot_burn_sun
          : undefined;
  if (typeof scalars.epsilon === "number" && typeof burnRate === "number" && !("Mdot_mix" in scalars)) {
    derived.Mdot_mix = scalars.epsilon * burnRate;
  }
  const mixRate = typeof scalars.Mdot_mix === "number" ? scalars.Mdot_mix : derived.Mdot_mix;
  if (
    typeof scalars.epsilon === "number" &&
    typeof burnRate === "number" &&
    typeof scalars.r_tach === "number" &&
    typeof scalars.rho_tach === "number" &&
    typeof areaFraction === "number" &&
    scalars.r_tach !== 0 &&
    scalars.rho_tach !== 0 &&
    areaFraction !== 0 &&
    !("v_r" in scalars)
  ) {
    derived.v_r =
      (scalars.epsilon * burnRate) /
      (4 * Math.PI * scalars.r_tach ** 2 * scalars.rho_tach * areaFraction);
  }
  const downflow = typeof scalars.v_r === "number" ? scalars.v_r : derived.v_r;
  if (typeof downflow === "number" && !("v_r_mm_yr" in scalars)) {
    derived.v_r_mm_yr = downflow * 1000 * secondsPerYear;
  }
  if (
    typeof mixRate === "number" &&
    typeof scalars.X_e === "number" &&
    typeof scalars.X_c === "number" &&
    typeof burnRate === "number" &&
    typeof scalars.M_c === "number" &&
    scalars.M_c !== 0 &&
    !("dXc_dt" in scalars)
  ) {
    derived.dXc_dt = (mixRate * (scalars.X_e - scalars.X_c) - burnRate) / scalars.M_c;
  }
  if (
    typeof scalars.alpha === "number" &&
    typeof scalars.M_env_H === "number" &&
    typeof burnRate === "number" &&
    burnRate !== 0 &&
    !("Delta_t_Myr" in scalars)
  ) {
    derived.Delta_t_Myr = (scalars.alpha * scalars.M_env_H) / (burnRate * secondsPerYear * 1e6);
  }
  if (
    typeof scalars.dlnL_limit === "number" &&
    typeof scalars.dlnL_abs === "number" &&
    !("luminosity_margin" in scalars)
  ) {
    derived.luminosity_margin = scalars.dlnL_limit - scalars.dlnL_abs;
  }
  if (
    typeof scalars.dlnTc_limit === "number" &&
    typeof scalars.dlnTc_abs === "number" &&
    !("core_temp_margin" in scalars)
  ) {
    derived.core_temp_margin = scalars.dlnTc_limit - scalars.dlnTc_abs;
  }
  if (
    typeof scalars.h0 === "number" &&
    typeof scalars.beta === "number" &&
    typeof scalars.deficit === "number" &&
    !("h" in scalars)
  ) {
    derived.h = scalars.h0 * Math.exp(scalars.beta * scalars.deficit);
  }
  const hazard = typeof scalars.h === "number" ? scalars.h : derived.h;
  if (typeof hazard === "number" && typeof scalars.T === "number" && !("P" in scalars)) {
    derived.P = 1 - Math.exp(-hazard * scalars.T);
  }
  return derived;
}

function hasKeyLike(artifacts: ParsedArtifact[], pattern: RegExp): boolean {
  return artifacts.some((artifact) => {
    let found = false;
    walk(artifact.data, (key, entry, keyPath) => {
      if (found) return;
      if (pattern.test(key) || pattern.test(keyPath)) found = true;
      if (typeof entry === "string" && pattern.test(entry)) found = true;
    });
    return found;
  });
}

function collectGates(
  artifacts: ParsedArtifact[],
  scalars: Record<string, number | string | boolean | null>,
  options: { restorationRequested?: boolean } = {},
): Record<string, TheoryRuntimeGateStatus> {
  const opacityPresent =
    hasKeyLike(artifacts, /opacityProvenance|opacitySource|opacityTable|opacityManifest/i) ||
    Boolean(scalars.opacityProvenance);
  const solarReferencePresent = hasKeyLike(artifacts, /solar.*reference|solar.*anchor|solar.*analog/i);
  const mesaReproAvailable = hasKeyLike(artifacts, /mesa|profile|history|repro/i);
  const fusionStageGate = Boolean(scalars.dominantFusionChannel || scalars.fusionMargin);
  const restorationPresent =
    hasKeyLike(artifacts, /deep.?mix|solar.?restoration|tachocline|red.?giant/i) ||
    Boolean(scalars.Mdot_mix || scalars.v_r || scalars.Delta_t_Myr || scalars.dXc_dt);
  const gates: Record<string, TheoryRuntimeGateStatus> = {
    reduced_order_prior: artifacts.length > 0 ? "pass" : "not_ready",
    opacity_provenance_present: opacityPresent ? "pass" : "not_ready",
    solar_reference_present: solarReferencePresent ? "pass" : "not_ready",
    mesa_repro_available: mesaReproAvailable ? "pass" : "not_ready",
    fusion_stage_gate: fusionStageGate ? "pass" : "not_ready",
    claim_boundary_stage1: "pass",
  };
  if (options.restorationRequested || restorationPresent) {
    gates.solar_restoration_branch = restorationPresent ? "pass" : "not_ready";
    gates.solar_restoration_planning_boundary = "pass";
  }
  return gates;
}

function receiptStatus(args: {
  artifactCount: number;
  parseFailed: boolean;
  gates: Record<string, TheoryRuntimeGateStatus>;
}): TheoryRuntimeReceiptStatus {
  if (args.parseFailed) return "failed";
  if (args.artifactCount === 0) return "not_run";
  if (Object.entries(args.gates).some(([key, status]) => key !== "claim_boundary_stage1" && status !== "pass")) {
    return "blocked";
  }
  return "completed";
}

function makeStep(input: Omit<TheoryRuntimeMathStepV1, "computedBy" | "warnings">): TheoryRuntimeMathStepV1 {
  return {
    ...input,
    computedBy: "static_reference_trace",
    warnings: [
      "Static reference trace only; no backend runtime executed.",
      "Scalar cuts may be sent to the scientific calculator.",
    ],
  };
}

export function buildStaticStarSimRuntimeTraceV1(input: TheoryRuntimeAdapterInput = {}): TheoryRuntimeMathTraceV1 {
  return buildTheoryRuntimeMathTraceV1({
    generatedAt: input.generatedAt ?? undefined,
    traceId: "static-starsim-runtime-trace",
    runtimeId: STARSIM_RUNTIME_ADAPTER_ID,
    graphId: input.graphId ?? "nhm2-theory-badge-graph",
    badgeIds: input.badgeIds?.length ? input.badgeIds : [...STARSIM_CORE_BADGE_IDS],
    request: {
      family: "starsim_runtime",
      target: "Static StarSim reduced-order reference chain",
      chart: "stage1_reduced_order_reference",
      assumptions: [
        "Reference notation only.",
        "No backend runtime executed.",
        "StarSim Stage 1 is a reduced-order astrophysical prior.",
      ],
    },
    steps: [
      makeStep({
        id: "surface-temperature-proxy",
        index: 1,
        title: "Surface Temperature Proxy",
        operatorKind: "scalar_cut",
        displayLatex: "T_{eff}=T_{sun}\\left(\\frac{L}{R^2}\\right)^{1/4}",
        expression: "T_eff = T_sun*(L/R^2)^(1/4)",
        inputSymbols: ["T_sun", "L", "R"],
        outputSymbols: ["T_eff"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "starsim-teff-cut",
            label: "Surface temperature proxy",
            expression: "T_eff = T_sun*(L/R^2)^(1/4)",
            displayLatex: "T_{eff}=T_{sun}\\left(\\frac{L}{R^2}\\right)^{1/4}",
            targetVariable: "T_eff",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "surface-gravity-proxy",
        index: 2,
        title: "Surface Gravity",
        operatorKind: "scalar_cut",
        displayLatex: "g_{surface}=\\frac{GM}{R^2}",
        expression: "g_surface = G*M/R^2",
        inputSymbols: ["G", "M", "R"],
        outputSymbols: ["g_surface"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "starsim-surface-gravity-cut",
            label: "Surface gravity",
            expression: "g_surface = G*M/R^2",
            displayLatex: "g_{surface}=\\frac{GM}{R^2}",
            targetVariable: "g_surface",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "mean-density-proxy",
        index: 3,
        title: "Mean Density",
        operatorKind: "scalar_cut",
        displayLatex: "\\rho_{mean}=\\frac{3M}{4\\pi R^3}",
        expression: "rho_mean = 3*M/(4*pi*R^3)",
        inputSymbols: ["M", "R"],
        outputSymbols: ["rho_mean"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "starsim-mean-density-cut",
            label: "Mean density",
            expression: "rho_mean = 3*M/(4*pi*R^3)",
            displayLatex: "\\rho_{mean}=\\frac{3M}{4\\pi R^3}",
            targetVariable: "rho_mean",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "compactness-proxy",
        index: 4,
        title: "Compactness",
        operatorKind: "scalar_cut",
        displayLatex: "C=\\frac{GM}{Rc^2}",
        expression: "compactness = G*M/(R*c^2)",
        inputSymbols: ["G", "M", "R", "c"],
        outputSymbols: ["compactness"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "starsim-compactness-cut",
            label: "Compactness",
            expression: "compactness = G*M/(R*c^2)",
            displayLatex: "C=\\frac{GM}{Rc^2}",
            targetVariable: "compactness",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "solar-restoration-mass-flux",
        index: 5,
        title: "Solar Restoration Mass Flux",
        operatorKind: "scalar_cut",
        displayLatex: "\\dot{M}_{mix}=\\epsilon\\dot{M}_{burn,sun}",
        expression: "Mdot_mix = epsilon*Mdot_burn_sun",
        inputSymbols: ["epsilon", "Mdot_burn_sun"],
        outputSymbols: ["Mdot_mix"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "starsim-restoration-mass-flux-cut",
            label: "Deep-mixing mass flux",
            expression: "Mdot_mix = epsilon*Mdot_burn_sun",
            displayLatex: "\\dot{M}_{mix}=\\epsilon\\dot{M}_{burn,sun}",
            targetVariable: "Mdot_mix",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "tachocline-downflow-setpoint",
        index: 6,
        title: "Tachocline Downflow Setpoint",
        operatorKind: "scalar_cut",
        displayLatex: "v_r=\\frac{\\epsilon\\dot{M}_{burn,sun}}{4\\pi r_{tach}^{2}\\rho_{tach}f_{area}}",
        expression: "v_r = epsilon*Mdot_burn_sun/(4*pi*r_tach^2*rho_tach*f_area)",
        inputSymbols: ["epsilon", "Mdot_burn_sun", "r_tach", "rho_tach", "f_area"],
        outputSymbols: ["v_r"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "starsim-restoration-downflow-cut",
            label: "Tachocline downflow setpoint",
            expression: "v_r = epsilon*Mdot_burn_sun/(4*pi*r_tach^2*rho_tach*f_area)",
            displayLatex: "v_r=\\frac{\\epsilon\\dot{M}_{burn,sun}}{4\\pi r_{tach}^{2}\\rho_{tach}f_{area}}",
            targetVariable: "v_r",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "core-hydrogen-balance",
        index: 7,
        title: "Core Hydrogen Balance Proxy",
        operatorKind: "scalar_cut",
        displayLatex: "\\frac{dX_c}{dt}=\\frac{\\dot{M}_{mix}(X_e-X_c)-\\dot{M}_{burn}}{M_c}",
        expression: "dXc_dt = (Mdot_mix*(X_e - X_c) - Mdot_burn)/M_c",
        inputSymbols: ["Mdot_mix", "X_e", "X_c", "Mdot_burn", "M_c"],
        outputSymbols: ["dXc_dt"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "starsim-restoration-core-h-balance-cut",
            label: "Core hydrogen balance",
            expression: "dXc_dt = (Mdot_mix*(X_e - X_c) - Mdot_burn)/M_c",
            displayLatex: "\\frac{dX_c}{dt}=\\frac{\\dot{M}_{mix}(X_e-X_c)-\\dot{M}_{burn}}{M_c}",
            targetVariable: "dXc_dt",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "solar-lifetime-extension-proxy",
        index: 8,
        title: "Solar Lifetime Extension Proxy",
        operatorKind: "scalar_cut",
        displayLatex: "\\Delta t_{Myr}\\approx\\frac{\\alpha M_{env,H}}{\\dot{M}_{burn,sun}(31557600)(10^6)}",
        expression: "Delta_t_Myr = alpha*M_env_H/(Mdot_burn_sun*31557600*1e6)",
        inputSymbols: ["alpha", "M_env_H", "Mdot_burn_sun"],
        outputSymbols: ["Delta_t_Myr"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "starsim-restoration-lifetime-cut",
            label: "Solar lifetime extension proxy",
            expression: "Delta_t_Myr = alpha*M_env_H/(Mdot_burn_sun*31557600*1e6)",
            displayLatex: "\\Delta t_{Myr}\\approx\\frac{\\alpha M_{env,H}}{\\dot{M}_{burn,sun}(31557600)(10^6)}",
            targetVariable: "Delta_t_Myr",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "solar-restoration-planning-boundary",
        index: 9,
        title: "Solar Restoration Planning Boundary",
        operatorKind: "gate_status",
        displayLatex: "\\mathrm{solar\\ restoration}=\\mathrm{planning\\ forecast\\ only}",
        expression: null,
        inputSymbols: ["restoration_receipt"],
        outputSymbols: ["planning_forecast_only"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [],
      }),
      makeStep({
        id: "stage1-runtime-boundary",
        index: 10,
        title: "Stage 1 Claim Boundary",
        operatorKind: "gate_status",
        displayLatex: "\\mathrm{StarSim}=\\mathrm{reduced\\ order\\ prior}",
        expression: null,
        inputSymbols: ["starsim_receipt"],
        outputSymbols: ["claim_boundary_stage1"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [],
      }),
    ],
    summary: {
      claimBoundaryNotes: [
        "StarSim Stage 1 is a reduced-order astrophysical prior, not a full stellar-evolution solve.",
        "Solar restoration rows are planning/forecast context only and do not establish feasible stellar intervention.",
      ],
    },
  });
}

function buildReceipt(input: {
  adapterInput: TheoryRuntimeAdapterInput;
  artifacts: ParsedArtifact[];
  parseError: string | null;
}): TheoryRuntimeReceiptV1 {
  const generatedAt = input.adapterInput.generatedAt ?? new Date().toISOString();
  const graphId = input.adapterInput.graphId ?? "nhm2-theory-badge-graph";
  const badgeIds = input.adapterInput.badgeIds?.length
    ? input.adapterInput.badgeIds
    : [...STARSIM_CORE_BADGE_IDS];
  const restorationRequested = Boolean(
    input.adapterInput.badgeIds?.some((badgeId) => badgeId.startsWith("starsim.restoration.")),
  );
  const baseScalars = input.parseError ? {} : collectScalars(input.artifacts);
  const scalars = {
    ...baseScalars,
    ...deriveScalarCuts(baseScalars),
  };
  const gates = input.parseError ? {} : collectGates(input.artifacts, scalars, { restorationRequested });
  const status = receiptStatus({
    artifactCount: input.artifacts.length,
    parseFailed: Boolean(input.parseError),
    gates,
  });
  const missingSignals = unique([
    input.parseError ? "artifact_parse_failed" : "",
    gates.reduced_order_prior !== "pass" ? "reduced_order_prior_missing" : "",
    gates.opacity_provenance_present !== "pass" ? "opacity_provenance_missing" : "",
    gates.solar_reference_present !== "pass" ? "solar_reference_missing" : "",
    gates.mesa_repro_available !== "pass" ? "mesa_repro_missing" : "",
    gates.fusion_stage_gate !== "pass" ? "fusion_stage_gate_missing" : "",
    gates.solar_restoration_branch && gates.solar_restoration_branch !== "pass"
      ? "solar_restoration_branch_missing"
      : "",
  ]);
  const warnings = unique([
    "Read-only StarSim artifact adapter; no backend runtime executed.",
    "StarSim Stage 1 is a reduced-order astrophysical prior, not a full stellar-evolution solve.",
    gates.solar_restoration_planning_boundary
      ? "Solar restoration rows are planning/forecast context only and do not establish feasible stellar intervention."
      : "",
    input.artifacts.length === 0 && !input.parseError ? "No StarSim artifacts were found." : "",
    input.parseError ?? "",
    gates.opacity_provenance_present !== "pass" ? "Opacity provenance is missing." : "",
    gates.solar_reference_present !== "pass" ? "Solar reference artifact is missing." : "",
    gates.mesa_repro_available !== "pass" ? "MESA reproduction artifact is missing." : "",
    gates.fusion_stage_gate !== "pass" ? "Fusion stage gate context is missing." : "",
    gates.solar_restoration_branch && gates.solar_restoration_branch !== "pass"
      ? "Solar restoration branch scalars are missing."
      : "",
  ]);

  return buildTheoryRuntimeReceiptV1({
    generatedAt,
    receiptId: `runtime:${STARSIM_RUNTIME_ADAPTER_ID}:${Date.now().toString(36)}`,
    runtimeId: STARSIM_RUNTIME_ADAPTER_ID,
    graphId,
    badgeIds,
    command: null,
    args: {
      adapter: STARSIM_RUNTIME_ADAPTER_ID,
      artifactPatterns: [...STARSIM_ARTIFACT_PATTERNS],
      requestedRuntimeId: input.adapterInput.runtimeId ?? null,
      scalarCuts: [
        "T_eff = T_sun*(L/R^2)^(1/4)",
        "g_surface = G*M/R^2",
        "rho_mean = 3*M/(4*pi*R^3)",
        "compactness = G*M/(R*c^2)",
        "fusion margin if present",
        "Mdot_mix = epsilon*Mdot_burn_sun",
        "v_r = epsilon*Mdot_burn_sun/(4*pi*r_tach^2*rho_tach*f_area)",
        "dXc_dt = (Mdot_mix*(X_e - X_c) - Mdot_burn)/M_c",
        "Delta_t_Myr = alpha*M_env_H/(Mdot_burn_sun*31557600*1e6)",
      ],
    },
    status,
    outputs: {
      artifacts: input.artifacts.map((artifact) => artifact.relativePath),
      scalars,
      units: {},
      gates,
      missingSignals,
      warnings,
    },
    provenance: {
      gitSha: null,
      startedAt: null,
      completedAt: generatedAt,
      durationMs: null,
    },
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: "reduced_order",
      promotionAllowed: false,
      promotionBlockedBy: unique(["stage1_reduced_order_prior_only", ...missingSignals]),
    },
  });
}

export async function readStarSimArtifacts(
  input: TheoryRuntimeAdapterInput = {},
): Promise<TheoryRuntimeReceiptV1> {
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  try {
    const artifacts = await readArtifacts(projectRoot);
    return buildReceipt({ adapterInput: input, artifacts, parseError: null });
  } catch (error) {
    return buildReceipt({
      adapterInput: input,
      artifacts: [],
      parseError: error instanceof Error ? error.message : "StarSim artifact parse failed.",
    });
  }
}

export const starSimRuntimeAdapter: TheoryRuntimeAdapter = {
  runtimeId: STARSIM_RUNTIME_ADAPTER_ID,
  family: "starsim_runtime",
  laneId: STARSIM_LANE_ID,
  capabilities: ["static_reference", "artifact_reader"],
  supportedBadgeIds: [...STARSIM_SUPPORTED_BADGE_IDS],
  canHandle: (input) =>
    input.runtimeId === STARSIM_RUNTIME_ADAPTER_ID ||
    input.laneId === STARSIM_LANE_ID ||
    Boolean(
      input.badgeIds?.some((badgeId) =>
        STARSIM_SUPPORTED_BADGE_IDS.includes(badgeId as typeof STARSIM_SUPPORTED_BADGE_IDS[number]),
      ),
    ),
  buildReferenceTrace: buildStaticStarSimRuntimeTraceV1,
  readArtifacts: readStarSimArtifacts,
};
