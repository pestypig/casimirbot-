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

export const TOKAMAK_RUNTIME_ADAPTER_ID = "tokamak.artifact_reader" as const;
export const TOKAMAK_LANE_ID = "tokamak_plasma" as const;

export const TOKAMAK_SUPPORTED_BADGE_IDS = [
  "tokamak.plasma.magnetic_pressure",
  "tokamak.plasma.thermal_pressure_proxy",
  "tokamak.plasma.beta_proxy",
  "tokamak.energy.power_balance",
  "tokamak.energy.confinement_time_proxy",
  "tokamak.precursor.score_margin",
  "tokamak.flux.core_fraction",
  "tokamak.flux.edge_fraction",
  "tokamak.runtime.energy_field",
  "tokamak.runtime.synthetic_diagnostics",
  "tokamak.runtime.precursor_report",
  "tokamak.claim_boundary.diagnostic_proxy",
] as const;

export const TOKAMAK_ARTIFACT_PATTERNS = [
  "artifacts/tokamak/**/*.json",
  "artifacts/**/*tokamak*energy*.json",
  "artifacts/**/*tokamak*synthetic*.json",
  "artifacts/**/*tokamak*diagnostic*.json",
  "artifacts/**/*tokamak*precursor*.json",
  "artifacts/**/*tokamak*flux*.json",
  "reports/**/*tokamak*.json",
  "reports/**/*precursor*.json",
] as const;

const SCALAR_KEYS = [
  "B_T",
  "n_m3",
  "T_eV",
  "p_B",
  "p_Pa",
  "beta",
  "P_net",
  "P_in",
  "P_loss",
  "W_th",
  "tau_E",
  "precursor_margin",
  "score",
  "threshold",
  "core_fraction",
  "edge_fraction",
  "core_count",
  "edge_count",
  "total_count",
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
  if (["bt", "b", "magneticfield", "magneticfieldt", "btoroidal", "toroidalfield"].includes(normalized)) {
    return "B_T";
  }
  if (["nm3", "ne", "density", "numberdensity", "electrondensity"].includes(normalized)) return "n_m3";
  if (["tev", "te", "temperatureev", "electrontemperatureev"].includes(normalized)) return "T_eV";
  if (["pb", "pmag", "magneticpressure", "magneticpressurepa"].includes(normalized)) return "p_B";
  if (["ppa", "p", "thermalpressure", "thermalpressurepa", "pressurepa"].includes(normalized)) return "p_Pa";
  if (["beta", "betan", "betap", "plasmabeta"].includes(normalized)) return "beta";
  if (["pnet", "netpower", "netpowerw"].includes(normalized)) return "P_net";
  if (["pin", "inputpower", "inputpowerw"].includes(normalized)) return "P_in";
  if (["ploss", "loss", "losspower", "losspowerw"].includes(normalized)) return "P_loss";
  if (["wth", "storedenergy", "thermalenergy", "storedthermalenergy"].includes(normalized)) return "W_th";
  if (["taue", "confinementtime", "confinementtimes", "energyconfinementtime"].includes(normalized)) return "tau_E";
  if (["precursormargin", "margin", "scoremargin"].includes(normalized)) return "precursor_margin";
  if (["score", "precursorscore"].includes(normalized)) return "score";
  if (["threshold", "precursorthreshold"].includes(normalized)) return "threshold";
  if (["corefraction", "fcore"].includes(normalized)) return "core_fraction";
  if (["edgefraction", "fedge"].includes(normalized)) return "edge_fraction";
  if (["corecount", "ncore"].includes(normalized)) return "core_count";
  if (["edgecount", "nedge"].includes(normalized)) return "edge_count";
  if (["totalcount", "ntotal", "validcount"].includes(normalized)) return "total_count";
  return null;
}

function gateStatusFromValue(value: unknown): TheoryRuntimeGateStatus {
  if (isRecord(value)) {
    for (const key of ["status", "state", "verdict", "available", "present", "passed", "inRange"]) {
      if (key in value) return gateStatusFromValue(value[key]);
    }
    return "unknown";
  }
  if (typeof value === "boolean") return value ? "pass" : "fail";
  if (typeof value === "number") return Number.isFinite(value) ? "pass" : "unknown";
  if (typeof value !== "string") return "unknown";
  const normalized = normalizeKey(value);
  if (["pass", "passed", "ok", "available", "present", "true", "ready", "inrange"].includes(normalized)) return "pass";
  if (["fail", "failed", "false", "missing", "invalid", "outrange", "outofrange"].includes(normalized)) return "fail";
  if (["unknown", "unavailable", "notready", "none", "null"].includes(normalized)) return "not_ready";
  if (["notapplicable", "na"].includes(normalized)) return "not_applicable";
  return "unknown";
}

async function readArtifacts(projectRoot: string): Promise<ParsedArtifact[]> {
  const paths = await fg([...TOKAMAK_ARTIFACT_PATTERNS], {
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
    });
  }
  return scalars;
}

function deriveScalarCuts(
  scalars: Record<string, number | string | boolean | null>,
): Record<string, number | string | boolean | null> {
  const derived: Record<string, number | string | boolean | null> = {};
  const mu0 = 4 * Math.PI * 1e-7;
  const eCharge = 1.602176634e-19;
  if (typeof scalars.B_T === "number" && !("p_B" in scalars)) {
    derived.p_B = scalars.B_T ** 2 / (2 * mu0);
  }
  if (typeof scalars.n_m3 === "number" && typeof scalars.T_eV === "number" && !("p_Pa" in scalars)) {
    derived.p_Pa = scalars.n_m3 * scalars.T_eV * eCharge;
  }
  const pPa = typeof scalars.p_Pa === "number" ? scalars.p_Pa : derived.p_Pa;
  const pB = typeof scalars.p_B === "number" ? scalars.p_B : derived.p_B;
  if (typeof pPa === "number" && typeof pB === "number" && pB !== 0 && !("beta" in scalars)) {
    derived.beta = pPa / pB;
  }
  if (typeof scalars.P_in === "number" && typeof scalars.P_loss === "number" && !("P_net" in scalars)) {
    derived.P_net = scalars.P_in - scalars.P_loss;
  }
  if (typeof scalars.W_th === "number" && typeof scalars.P_loss === "number" && scalars.P_loss !== 0 && !("tau_E" in scalars)) {
    derived.tau_E = scalars.W_th / scalars.P_loss;
  }
  if (typeof scalars.score === "number" && typeof scalars.threshold === "number" && !("precursor_margin" in scalars)) {
    derived.precursor_margin = scalars.score - scalars.threshold;
  }
  if (typeof scalars.core_count === "number" && typeof scalars.total_count === "number" && scalars.total_count !== 0) {
    derived.core_fraction = scalars.core_count / scalars.total_count;
  }
  if (typeof scalars.edge_count === "number" && typeof scalars.total_count === "number" && scalars.total_count !== 0) {
    derived.edge_fraction = scalars.edge_count / scalars.total_count;
  }
  return derived;
}

function hasKeyLike(artifacts: ParsedArtifact[], pattern: RegExp): boolean {
  return artifacts.some((artifact) => {
    if (pattern.test(artifact.relativePath)) return true;
    let found = false;
    walk(artifact.data, (key, entry, keyPath) => {
      if (found) return;
      if (pattern.test(key) || pattern.test(keyPath)) found = true;
      if (typeof entry === "string" && pattern.test(entry)) found = true;
    });
    return found;
  });
}

function explicitGate(artifacts: ParsedArtifact[], patterns: RegExp[]): TheoryRuntimeGateStatus | null {
  for (const artifact of artifacts) {
    let status: TheoryRuntimeGateStatus | null = null;
    walk(artifact.data, (key, entry, keyPath) => {
      if (status) return;
      if (patterns.some((pattern) => pattern.test(key) || pattern.test(keyPath))) {
        status = gateStatusFromValue(entry);
      }
    });
    if (status) return status;
  }
  return null;
}

function collectGates(
  artifacts: ParsedArtifact[],
  scalars: Record<string, number | string | boolean | null>,
): Record<string, TheoryRuntimeGateStatus> {
  const betaGate = explicitGate(artifacts, [/betainrange/i, /beta.*gate/i]);
  const betaMin = typeof scalars.beta_min === "number" ? scalars.beta_min : null;
  const betaMax = typeof scalars.beta_max === "number" ? scalars.beta_max : null;
  const betaInRange =
    betaGate ??
    (typeof scalars.beta === "number" && (betaMin !== null || betaMax !== null)
      ? (betaMin === null || scalars.beta >= betaMin) && (betaMax === null || scalars.beta <= betaMax)
        ? "pass"
        : "fail"
      : typeof scalars.beta === "number"
        ? "not_applicable"
        : "not_ready");
  const precursorGate =
    explicitGate(artifacts, [/precursormargingate/i, /precursor.*gate/i]) ??
    (typeof scalars.precursor_margin === "number"
      ? scalars.precursor_margin >= 0
        ? "pass"
        : "fail"
      : "not_ready");

  return {
    diagnostic_artifact_present: artifacts.length > 0 ? "pass" : "not_ready",
    beta_in_range: betaInRange,
    precursor_margin_gate: precursorGate,
    synthetic_diagnostics_present: hasKeyLike(artifacts, /synthetic.*diagnostic|bolometry|interferometry|probe/i)
      ? "pass"
      : "not_ready",
    claim_boundary_diagnostic_proxy: "pass",
  };
}

function receiptStatus(args: {
  artifactCount: number;
  parseFailed: boolean;
  gates: Record<string, TheoryRuntimeGateStatus>;
}): TheoryRuntimeReceiptStatus {
  if (args.parseFailed) return "failed";
  if (args.artifactCount === 0) return "not_run";
  if (
    Object.entries(args.gates).some(
      ([key, status]) =>
        key !== "claim_boundary_diagnostic_proxy" &&
        key !== "beta_in_range" &&
        status !== "pass" &&
        status !== "not_applicable",
    )
  ) {
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

export function buildStaticTokamakRuntimeTraceV1(input: TheoryRuntimeAdapterInput = {}): TheoryRuntimeMathTraceV1 {
  return buildTheoryRuntimeMathTraceV1({
    generatedAt: input.generatedAt ?? undefined,
    traceId: "static-tokamak-runtime-trace",
    runtimeId: TOKAMAK_RUNTIME_ADAPTER_ID,
    graphId: input.graphId ?? "nhm2-theory-badge-graph",
    badgeIds: input.badgeIds?.length ? input.badgeIds : [...TOKAMAK_SUPPORTED_BADGE_IDS],
    request: {
      family: "tokamak_runtime",
      target: "Static Tokamak diagnostic proxy reference chain",
      chart: "tokamak_diagnostic_proxy_reference",
      assumptions: [
        "Reference notation only.",
        "No backend runtime executed.",
        "Tokamak rows are diagnostic/proxy helpers and do not establish operational control.",
      ],
    },
    steps: [
      makeStep({
        id: "magnetic-pressure-cut",
        index: 1,
        title: "Magnetic Pressure",
        operatorKind: "scalar_cut",
        displayLatex: "p_B=\\frac{B_T^2}{2\\mu_0}",
        expression: "p_B = B_T^2/(2*mu0)",
        inputSymbols: ["B_T", "mu0"],
        outputSymbols: ["p_B"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "tokamak-magnetic-pressure-cut",
            label: "Magnetic pressure",
            expression: "p_B = B_T^2/(2*mu0)",
            displayLatex: "p_B=\\frac{B_T^2}{2\\mu_0}",
            targetVariable: "p_B",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "beta-proxy-cut",
        index: 2,
        title: "Plasma Beta Proxy",
        operatorKind: "scalar_cut",
        displayLatex: "\\beta=\\frac{p}{p_B}",
        expression: "beta = p_Pa/p_B",
        inputSymbols: ["p_Pa", "p_B"],
        outputSymbols: ["beta"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "tokamak-beta-cut",
            label: "Beta proxy",
            expression: "beta = p_Pa/p_B",
            displayLatex: "\\beta=\\frac{p}{p_B}",
            targetVariable: "beta",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "confinement-time-cut",
        index: 3,
        title: "Energy Confinement Time",
        operatorKind: "scalar_cut",
        displayLatex: "\\tau_E=\\frac{W_{th}}{P_{loss}}",
        expression: "tau_E = W_th/P_loss",
        inputSymbols: ["W_th", "P_loss"],
        outputSymbols: ["tau_E"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "tokamak-confinement-time-cut",
            label: "Energy confinement time",
            expression: "tau_E = W_th/P_loss",
            displayLatex: "\\tau_E=\\frac{W_{th}}{P_{loss}}",
            targetVariable: "tau_E",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "precursor-margin-cut",
        index: 4,
        title: "Precursor Margin",
        operatorKind: "scalar_cut",
        displayLatex: "m_{precursor}=score-threshold",
        expression: "precursor_margin = score - threshold",
        inputSymbols: ["score", "threshold"],
        outputSymbols: ["precursor_margin"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [
          {
            id: "tokamak-precursor-margin-cut",
            label: "Precursor margin",
            expression: "precursor_margin = score - threshold",
            displayLatex: "m_{precursor}=score-threshold",
            targetVariable: "precursor_margin",
            calculatorArtifactV1: null,
          },
        ],
      }),
      makeStep({
        id: "diagnostic-proxy-boundary",
        index: 5,
        title: "Diagnostic Proxy Claim Boundary",
        operatorKind: "gate_status",
        displayLatex: "\\mathrm{diagnostic\\ proxy\\ only}",
        expression: null,
        inputSymbols: ["tokamak_receipt"],
        outputSymbols: ["claim_boundary_diagnostic_proxy"],
        status: "computed",
        artifactRef: null,
        scalarCuts: [],
      }),
    ],
    summary: {
      claimBoundaryNotes: [
        "Tokamak scalar rows are diagnostic/proxy helpers and do not establish plasma stability.",
        "No operational/control claim is allowed from this adapter.",
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
    : [...TOKAMAK_SUPPORTED_BADGE_IDS];
  const baseScalars = input.parseError ? {} : collectScalars(input.artifacts);
  const scalars = {
    ...baseScalars,
    ...deriveScalarCuts(baseScalars),
  };
  const gates = input.parseError ? {} : collectGates(input.artifacts, scalars);
  const status = receiptStatus({
    artifactCount: input.artifacts.length,
    parseFailed: Boolean(input.parseError),
    gates,
  });
  const missingSignals = unique([
    input.parseError ? "artifact_parse_failed" : "",
    gates.diagnostic_artifact_present !== "pass" ? "diagnostic_artifact_missing" : "",
    gates.beta_in_range === "fail" ? "beta_out_of_range" : "",
    gates.beta_in_range === "not_ready" ? "beta_context_missing" : "",
    gates.precursor_margin_gate !== "pass" ? "precursor_margin_not_ready" : "",
    gates.synthetic_diagnostics_present !== "pass" ? "synthetic_diagnostics_missing" : "",
  ]);
  const warnings = unique([
    "Read-only Tokamak artifact adapter; no backend runtime executed.",
    "Tokamak rows are diagnostic/proxy helpers, not operational/control claims.",
    input.artifacts.length === 0 && !input.parseError ? "No Tokamak artifacts were found." : "",
    input.parseError ?? "",
    gates.beta_in_range === "not_ready" ? "Beta context is missing." : "",
    gates.beta_in_range === "fail" ? "Beta is outside the configured range." : "",
    gates.precursor_margin_gate !== "pass" ? "Precursor margin gate is not ready or failed." : "",
    gates.synthetic_diagnostics_present !== "pass" ? "Synthetic diagnostics artifact is missing." : "",
  ]);

  return buildTheoryRuntimeReceiptV1({
    generatedAt,
    receiptId: `runtime:${TOKAMAK_RUNTIME_ADAPTER_ID}:${Date.now().toString(36)}`,
    runtimeId: TOKAMAK_RUNTIME_ADAPTER_ID,
    graphId,
    badgeIds,
    command: null,
    args: {
      adapter: TOKAMAK_RUNTIME_ADAPTER_ID,
      artifactPatterns: [...TOKAMAK_ARTIFACT_PATTERNS],
      requestedRuntimeId: input.adapterInput.runtimeId ?? null,
      scalarCuts: [
        "p_B = B_T^2/(2*mu0)",
        "beta = p_Pa/p_B",
        "tau_E = W_th/P_loss",
        "precursor_margin = score - threshold",
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
      maximumTier: "diagnostic",
      promotionAllowed: false,
      promotionBlockedBy: unique(["diagnostic_proxy_only", "no_operational_control_claim", ...missingSignals]),
    },
  });
}

export async function readTokamakArtifacts(
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
      parseError: error instanceof Error ? error.message : "Tokamak artifact parse failed.",
    });
  }
}

export const tokamakRuntimeAdapter: TheoryRuntimeAdapter = {
  runtimeId: TOKAMAK_RUNTIME_ADAPTER_ID,
  family: "tokamak_runtime",
  laneId: TOKAMAK_LANE_ID,
  capabilities: ["static_reference", "artifact_reader"],
  supportedBadgeIds: [...TOKAMAK_SUPPORTED_BADGE_IDS],
  canHandle: (input) =>
    input.runtimeId === TOKAMAK_RUNTIME_ADAPTER_ID ||
    input.laneId === TOKAMAK_LANE_ID ||
    Boolean(
      input.badgeIds?.some((badgeId) =>
        TOKAMAK_SUPPORTED_BADGE_IDS.includes(badgeId as typeof TOKAMAK_SUPPORTED_BADGE_IDS[number]),
      ),
    ),
  buildReferenceTrace: buildStaticTokamakRuntimeTraceV1,
  readArtifacts: readTokamakArtifacts,
};
