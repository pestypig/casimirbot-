import { openDocPanel } from "@/lib/docs/openDocPanel";
import { DOC_MANIFEST, findDocEntry } from "@/lib/docs/docManifest";
import { getPanelDef } from "@/lib/desktop/panelRegistry";
import type { SettingsTab } from "@/hooks/useHelixStartSettings";
import { dispatchScientificCalculatorMathPicked } from "@/lib/scientific-calculator/events";
import {
  buildScientificCalculatorDebugSnapshot,
  formatScientificCalculatorDebugLog,
} from "@/lib/scientific-calculator/debugLog";
import { runScientificSolve } from "@/lib/scientific-calculator/solver";
import { runTheoryBadgePlaybackNow } from "@/lib/theory/theoryBadgePlaybackRunner";
import { solveTheoryCalculatorLoadoutNow } from "@/lib/theory/theoryCalculatorLoadoutRunner";
import { buildTheoryBadgeLocatorArtifact } from "@/lib/theory/theoryMapOverlay";
import { runStarSimRuntimeBadge } from "@shared/theory/starsim-runtime-adapter";
import { recordClipboardReceipt } from "@/lib/workstation/workstationClipboard";
import { useDocViewerStore } from "@/store/useDocViewerStore";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";
import { useScientificCalculatorLiveSourceStore } from "@/store/useScientificCalculatorLiveSourceStore";
import { useTheoryBadgeGraphPanelStore } from "@/store/useTheoryBadgeGraphPanelStore";
import { useTheoryMapOverlayStore } from "@/store/useTheoryMapOverlayStore";
import {
  useSituationRoomStore,
  selectSituationRoomEvents,
  type SituationRoom,
  type SituationRoomSource,
} from "@/store/useSituationRoomStore";
import {
  useSituationRoomJobStore,
  type SituationRoomJobKind,
  type SituationRoomJobInputTextPolicy,
  type SituationRoomJobOutputRenderPolicy,
} from "@/store/useSituationRoomJobStore";
import { useSituationRoomGraphStore } from "@/store/useSituationRoomGraphStore";
import {
  normalizeSituationRoomSetupActionArgs,
  setupSituationRoomFromPrompt,
} from "@/lib/workstation/situationRoomSetupActions";
import { useWorkstationClipboardStore } from "@/store/useWorkstationClipboardStore";
import { useWorkstationNotesStore } from "@/store/useWorkstationNotesStore";
import { useWorkstationProcessGraphStore } from "@/store/useWorkstationProcessGraphStore";
import { renderWorkstationProcessGraphSvg } from "@/lib/workstation/processGraph/renderProcessGraphSvg";
import type {
  SituationGraphLane,
  SituationGraphNodeColumn,
  SituationGraphNodeStatus,
  SituationGraphNodeType,
  TranslationPairNodeConfig,
} from "@shared/helix-situation-graph";
import type { HelixCalculatorSetupContext } from "@shared/helix-calculator-setup-context";
import type { TheoryBadgeV1 } from "@shared/contracts/theory-badge-graph.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "@shared/theory/nhm2-theory-badges";
import { buildCasimirCavityObjectBindings } from "@shared/theory/casimir-cavity-object-bindings";
import { buildCosmicDistanceObjectBindings } from "@shared/theory/cosmic-distance-object-bindings";
import { buildNhm2DiagnosticObjectBindings } from "@shared/theory/nhm2-diagnostic-object-bindings";
import { buildSolarSpectrumObservationBindings } from "@shared/theory/solar-spectrum-observation-bindings";
import { buildStarSimObjectBindings } from "@shared/theory/starsim-object-bindings";
import { buildTokamakPlasmaObjectBindings } from "@shared/theory/tokamak-plasma-object-bindings";
import {
  buildTheoryCalculatorLoadout,
} from "@shared/theory/theory-calculator-loadout";
import {
  isTheoryCalculatorLoadoutV1,
  type TheoryCalculatorLoadoutV1,
  type TheoryCalculatorObjectContextV1,
} from "@shared/contracts/theory-calculator-loadout.v1";
import {
  locateTheoryBadges,
  traceTheoryBadgeConnections,
} from "@shared/theory/theory-badge-overlap-locator";
import {
  PHYSICS_ATLAS_BLOCK_IDS,
  type PhysicsAtlasBlockId,
  type PhysicsAtlasBlockV1,
} from "@shared/contracts/physics-atlas.v1";
import { buildHelixPhysicsAtlasV1, PHYSICS_ATLAS_BLOCKS } from "@shared/theory/physics-atlas-blocks";
import { resolvePhysicsAtlasLens } from "@shared/theory/physics-atlas-lens";
import {
  buildDottieVoiceReceipt,
  HELIX_AGENT_COMMENTARY_SCHEMA,
  HELIX_DOTTIE_OBSERVER_SUBSCRIPTION_SCHEMA,
  HELIX_DOTTIE_VOICE_RECEIPT_SCHEMA,
  type HelixDottieObserverSubscriptionV1,
} from "@shared/helix-agent-commentary";
import { recordDottieVoiceDebugClip } from "@/lib/helix/dottie-voice-debug-clips";

export type HelixPanelActionRequest = {
  panel_id: string;
  action_id: string;
  args?: Record<string, unknown>;
};

export type HelixPanelActionExecutionResult = {
  ok: boolean;
  panel_id: string;
  action_id: string;
  artifact?: Record<string, unknown> | null;
  message?: string;
};

export type HelixPanelActionExecutionContext = {
  openPanel: (panelId: string, groupId?: string) => void;
  focusPanel: (panelId: string, groupId?: string) => void;
  closePanel: (panelId: string, groupId?: string) => void;
  openSettings: (tab?: SettingsTab) => void;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parensBalanced(value: string): boolean {
  let depth = 0;
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function stripCalculatorProseTail(value: string): string {
  return value
    .replace(/\s*,?\s*(?:then|and)\s+(?:explain|describe|interpret|summari[sz]e|tell|show|give|report)\b[\s\S]*$/i, "")
    .replace(/\s+(?:with|using|in)\s+(?:the\s+)?(?:scientific\s+)?calculator\b[\s\S]*$/i, "")
    .replace(/\s+(?:with\s+)?(?:steps?|show\s+work|trace)$/i, "")
    .trim();
}

function normalizeCalculatorActionLatex(value: string): string {
  const cleaned = stripCalculatorProseTail(value);
  const directiveTail = cleaned.match(/\b(?:solve|evaluate|compute|calculate|check|verify)\s+(.+)$/i)?.[1];
  const candidate = directiveTail ? stripCalculatorProseTail(directiveTail) : cleaned;
  const equation = candidate.match(/(?:[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?\s*\*\s*)?[A-Za-z_][A-Za-z0-9_]*(?:\s*\^\s*[-+]?\d+(?:\.\d+)?)?(?:\s*[+\-*/]\s*[-+()A-Za-z0-9_.*\/^\\\s]+)*\s*=\s*[-+()A-Za-z0-9_.*\/^\\\s]+/i)?.[0];
  if (equation) return equation.trim();
  if (candidate.includes("=")) return candidate;
  const arithmeticMatches = candidate.match(/[()+\-*/^\d.eE\s]+/g) ?? [];
  for (const match of arithmeticMatches) {
    const candidate = match.replace(/\s+/g, "").replace(/[.!?,"'`\]\)}]+$/g, "");
    if (!candidate || !/\d/.test(candidate) || !/[+\-*/^]/.test(candidate)) continue;
    if (!parensBalanced(candidate)) continue;
    if (/^[()+\-*/^\d.eE]+$/.test(candidate)) return candidate;
  }
  return candidate;
}

function isCalculatorActionExpression(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/\b(?:einstein\s+tensor|qi\s+guardrail|natario|warp\.?metric|adm|stress[-\s]?energy)\b/i.test(trimmed)) {
    return true;
  }
  if (/\\(?:frac|sqrt|lambda|sum|int)\b/i.test(trimmed)) return true;
  if (/[=+\-*/^]/.test(trimmed) && /[A-Za-z0-9]/.test(trimmed)) return true;
  return false;
}

function resolveCalculatorActionLatex(rawLatex: string | null, calculatorSetup: HelixCalculatorSetupContext | null): string | null {
  const setupExpression = calculatorSetup?.display_latex ?? calculatorSetup?.expression ?? null;
  const normalizedSetup = setupExpression ? normalizeCalculatorActionLatex(setupExpression) : null;
  const normalizedRaw = rawLatex ? normalizeCalculatorActionLatex(rawLatex) : null;
  if (isCalculatorActionExpression(normalizedSetup)) return normalizedSetup;
  if (isCalculatorActionExpression(normalizedRaw)) return normalizedRaw;
  return null;
}

function asCalculatorSetupContext(value: unknown): HelixCalculatorSetupContext | null {
  const record = asRecord(value);
  if (!record) return null;
  const expression = asNonEmptyString(record.expression);
  const displayLatex = asNonEmptyString(record.display_latex) ?? expression;
  const subgoal = asNonEmptyString(record.subgoal);
  if (!expression || !displayLatex || !subgoal) return null;
  return record as HelixCalculatorSetupContext;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "true" || trimmed === "yes" || trimmed === "y" || trimmed === "1") return true;
    if (trimmed === "false" || trimmed === "no" || trimmed === "n" || trimmed === "0") return false;
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => asNonEmptyString(entry))
      .filter((entry): entry is string => Boolean(entry));
  }
  const single = asNonEmptyString(value);
  return single ? [single] : [];
}

const dottieObserverSubscriptions = new Map<string, HelixDottieObserverSubscriptionV1>();

function boundedDottieMaxChars(value: unknown): number {
  const parsed = asNumber(value);
  if (!parsed) return 220;
  return Math.max(24, Math.min(500, Math.floor(parsed)));
}

function nextDottieObserverId(profile: string, targetRunId: string): string {
  return `observer:${slugify(profile) || "dottie"}:${slugify(targetRunId) || "run"}:${Date.now()}`;
}

function asTheoryCalculatorObjectContext(value: unknown): TheoryCalculatorObjectContextV1 | null {
  const record = asRecord(value);
  if (!record) return null;
  const kind = asNonEmptyString(record.kind);
  if (kind === "starsim_star") {
    const observables = asRecord(record.observables) ?? record;
    return buildStarSimObjectBindings({
      objectId: asNonEmptyString(record.objectId ?? record.object_id ?? observables.objectId ?? observables.object_id),
      label: asNonEmptyString(record.label),
      spectralType: asNonEmptyString(observables.spectralType ?? observables.spectral_type),
      objectClass: asNonEmptyString(observables.objectClass ?? observables.object_class),
      luminosity_Lsun: asNumber(observables.luminosity_Lsun ?? observables.luminosity),
      radius_Rsun: asNumber(observables.radius_Rsun ?? observables.radius),
      mass_Msun: asNumber(observables.mass_Msun ?? observables.mass),
      effectiveTemperature_K: asNumber(observables.effectiveTemperature_K ?? observables.effective_temperature_K),
      parallax_mas: asNumber(observables.parallax_mas),
      properMotionRa_masyr: asNumber(observables.properMotionRa_masyr ?? observables.proper_motion_ra_masyr),
      properMotionDec_masyr: asNumber(observables.properMotionDec_masyr ?? observables.proper_motion_dec_masyr),
      radialVelocity_kms: asNumber(observables.radialVelocity_kms ?? observables.radial_velocity_kms),
      r90_Rstar: asNumber(observables.r90_Rstar ?? observables.r90_rstar),
      distance_pc: asNumber(observables.distance_pc),
      gravitationalConstantNormalized: asNumber(observables.gravitationalConstantNormalized ?? observables.gravitational_constant_normalized),
      channelTemperature_K: asNumber(observables.channelTemperature_K ?? observables.channel_temperature_K),
      channelDensity_g_cm3: asNumber(observables.channelDensity_g_cm3 ?? observables.channel_density_g_cm3),
      magneticField_T: asNumber(observables.magneticField_T ?? observables.magnetic_field_T),
      spectralLineNm: asNumber(observables.spectralLineNm ?? observables.spectral_line_nm),
      source: "helix_ask",
    });
  }
  if (kind === "cosmic_distance_object") {
      const observables = asRecord(record.observables) ?? record;
      return buildCosmicDistanceObjectBindings({
      objectId: asNonEmptyString(record.objectId ?? record.object_id ?? observables.objectId ?? observables.object_id) ?? undefined,
      label: asNonEmptyString(record.label ?? observables.label) ?? undefined,
      lambda_rest: asNumber(observables.lambda_rest ?? observables.lambdaRest) ?? undefined,
      lambda_obs: asNumber(observables.lambda_obs ?? observables.lambdaObs) ?? undefined,
      parallax_mas: asNumber(observables.parallax_mas ?? observables.parallaxMas) ?? undefined,
      P_days: asNumber(observables.P_days ?? observables.period_days ?? observables.periodDays) ?? undefined,
      alpha: asNumber(observables.alpha) ?? undefined,
      beta: asNumber(observables.beta) ?? undefined,
      m_app: asNumber(observables.m_app ?? observables.apparent_magnitude ?? observables.apparentMagnitude) ?? undefined,
      M_abs: asNumber(observables.M_abs ?? observables.absolute_magnitude ?? observables.absoluteMagnitude) ?? undefined,
      z: asNumber(observables.z ?? observables.redshift) ?? undefined,
      H0_km_s_Mpc: asNumber(observables.H0_km_s_Mpc ?? observables.h0_km_s_mpc ?? observables.H0) ?? undefined,
      c_km_s: asNumber(observables.c_km_s ?? observables.c) ?? undefined,
      source: "helix_ask",
    });
  }
  if (kind === "solar_spectrum_observation") {
    const observables = asRecord(record.observables) ?? record;
    return buildSolarSpectrumObservationBindings({
      objectId: asNonEmptyString(record.objectId ?? record.object_id ?? observables.objectId ?? observables.object_id) ?? undefined,
      label: asNonEmptyString(record.label ?? observables.label) ?? undefined,
      lambda: asNumber(observables.lambda ?? observables.wavelength_m) ?? undefined,
      lambda0: asNumber(observables.lambda0 ?? observables.lambda_0 ?? observables.rest_wavelength_m) ?? undefined,
      lambda_obs: asNumber(observables.lambda_obs ?? observables.lambdaObs ?? observables.observed_wavelength_m) ?? undefined,
      T: asNumber(observables.T ?? observables.temperature_K) ?? undefined,
      R: asNumber(observables.R ?? observables.radius_m) ?? undefined,
      sigma: asNumber(observables.sigma) ?? undefined,
      b: asNumber(observables.b ?? observables.wien_b) ?? undefined,
      B: asNumber(observables.B ?? observables.magneticField_T ?? observables.magnetic_field_T) ?? undefined,
      g_eff: asNumber(observables.g_eff ?? observables.gEff) ?? undefined,
      h: asNumber(observables.h ?? observables.planck_h) ?? undefined,
      c: asNumber(observables.c ?? observables.speed_of_light) ?? undefined,
      mu_B: asNumber(observables.mu_B ?? observables.muB ?? observables.bohr_magneton) ?? undefined,
      delta_nu: asNumber(observables.delta_nu ?? observables.deltaNu) ?? undefined,
      P_rad: asNumber(observables.P_rad ?? observables.radiant_power_W ?? observables.radiantPower_W) ?? undefined,
      delta_t: asNumber(observables.delta_t ?? observables.duration_s ?? observables.duration) ?? undefined,
      source: "helix_ask",
    });
  }
  if (kind === "casimir_cavity_object") {
    const observables = asRecord(record.observables) ?? record;
    return buildCasimirCavityObjectBindings({
      objectId: asNonEmptyString(record.objectId ?? record.object_id ?? observables.objectId ?? observables.object_id) ?? undefined,
      label: asNonEmptyString(record.label ?? observables.label) ?? undefined,
      a: asNumber(observables.a ?? observables.gap_m ?? observables.gapMeters) ?? undefined,
      A_tile: asNumber(observables.A_tile ?? observables.tile_area_m2 ?? observables.tileArea_m2) ?? undefined,
      hbar_c: asNumber(observables.hbar_c ?? observables.hbarC) ?? undefined,
      c: asNumber(observables.c ?? observables.speed_of_light) ?? undefined,
      pi: asNumber(observables.pi) ?? undefined,
      E_area: asNumber(observables.E_area ?? observables.energy_per_area_J_m2) ?? undefined,
      E_tile: asNumber(observables.E_tile ?? observables.tile_energy_J) ?? undefined,
      absE_tile: asNumber(observables.absE_tile ?? observables.abs_tile_energy_J) ?? undefined,
      N_tiles: asNumber(observables.N_tiles ?? observables.tile_count) ?? undefined,
      U_static: asNumber(observables.U_static ?? observables.static_energy_J) ?? undefined,
      absU_static: asNumber(observables.absU_static ?? observables.abs_static_energy_J) ?? undefined,
      gammaGeo: asNumber(observables.gammaGeo ?? observables.gamma_geo) ?? undefined,
      Q_L: asNumber(observables.Q_L ?? observables.q_l ?? observables.quality_factor) ?? undefined,
      gamma_VdB: asNumber(observables.gamma_VdB ?? observables.gamma_vdb) ?? undefined,
      d_eff: asNumber(observables.d_eff ?? observables.duty_eff) ?? undefined,
      E_out: asNumber(observables.E_out ?? observables.output_energy_J) ?? undefined,
      L: asNumber(observables.L ?? observables.length_m) ?? undefined,
      n: asNumber(observables.n ?? observables.mode_n) ?? undefined,
      h: asNumber(observables.h ?? observables.planck_h) ?? undefined,
      f_n: asNumber(observables.f_n ?? observables.mode_frequency_Hz) ?? undefined,
      source: "helix_ask",
    });
  }
  if (kind === "nhm2_diagnostic_object") {
    const observables = asRecord(record.observables) ?? record;
    return buildNhm2DiagnosticObjectBindings({
      objectId: asNonEmptyString(record.objectId ?? record.object_id ?? observables.objectId ?? observables.object_id) ?? undefined,
      label: asNonEmptyString(record.label ?? observables.label) ?? undefined,
      t_shift: asNumber(observables.t_shift ?? observables.tShift) ?? undefined,
      delta_t_lapse: asNumber(observables.delta_t_lapse ?? observables.deltaTLapse) ?? undefined,
      E: asNumber(observables.E ?? observables.energy_J) ?? undefined,
      V: asNumber(observables.V ?? observables.volume_m3) ?? undefined,
      rho: asNumber(observables.rho ?? observables.energy_density_J_m3) ?? undefined,
      E_cycle: asNumber(observables.E_cycle ?? observables.cycle_energy_J) ?? undefined,
      T_cycle: asNumber(observables.T_cycle ?? observables.cycle_period_s) ?? undefined,
      P_avg: asNumber(observables.P_avg ?? observables.average_power_W) ?? undefined,
      source_required: asNumber(observables.source_required ?? observables.sourceRequired) ?? undefined,
      source_available: asNumber(observables.source_available ?? observables.sourceAvailable) ?? undefined,
      R_source: asNumber(observables.R_source ?? observables.source_residual) ?? undefined,
      qei_bound: asNumber(observables.qei_bound ?? observables.qeiBound) ?? undefined,
      qei_sample: asNumber(observables.qei_sample ?? observables.qeiSample) ?? undefined,
      qei_margin: asNumber(observables.qei_margin ?? observables.qeiMargin) ?? undefined,
      source: "helix_ask",
    });
  }
  if (kind === "tokamak_plasma_object") {
    const observables = asRecord(record.observables) ?? record;
    return buildTokamakPlasmaObjectBindings({
      objectId: asNonEmptyString(record.objectId ?? record.object_id ?? observables.objectId ?? observables.object_id) ?? undefined,
      label: asNonEmptyString(record.label ?? observables.label) ?? undefined,
      B_T: asNumber(observables.B_T ?? observables.b_T ?? observables.magnetic_field_T) ?? undefined,
      mu0: asNumber(observables.mu0) ?? undefined,
      p_B: asNumber(observables.p_B ?? observables.magnetic_pressure_Pa) ?? undefined,
      p_Pa: asNumber(observables.p_Pa ?? observables.pressure_Pa ?? observables.plasma_pressure_Pa) ?? undefined,
      n_m3: asNumber(observables.n_m3 ?? observables.density_m3) ?? undefined,
      T_eV: asNumber(observables.T_eV ?? observables.temperature_eV) ?? undefined,
      e_charge: asNumber(observables.e_charge) ?? undefined,
      P_in: asNumber(observables.P_in ?? observables.input_power_W) ?? undefined,
      P_loss: asNumber(observables.P_loss ?? observables.loss_power_W) ?? undefined,
      P_net: asNumber(observables.P_net ?? observables.net_power_W) ?? undefined,
      tau_E: asNumber(observables.tau_E ?? observables.energy_confinement_s) ?? undefined,
      W_th: asNumber(observables.W_th ?? observables.thermal_energy_J) ?? undefined,
      score: asNumber(observables.score ?? observables.precursor_score) ?? undefined,
      threshold: asNumber(observables.threshold) ?? undefined,
      precursor_margin: asNumber(observables.precursor_margin) ?? undefined,
      core_count: asNumber(observables.core_count) ?? undefined,
      edge_count: asNumber(observables.edge_count) ?? undefined,
      sol_count: asNumber(observables.sol_count) ?? undefined,
      total_count: asNumber(observables.total_count) ?? undefined,
      source: "helix_ask",
    });
  }
  if (kind === "manual_symbol_bindings" || kind === "generic_physics_object") {
    const variableBindings = asRecord(record.variableBindings ?? record.variable_bindings) ?? {};
    const normalizedBindings = Object.fromEntries(
      Object.entries(variableBindings)
        .map(([key, rawValue]) => [key, typeof rawValue === "number" || typeof rawValue === "string" ? rawValue : null])
        .filter((entry): entry is [string, string | number] => entry[1] !== null),
    );
      return {
        kind,
        objectId: asNonEmptyString(record.objectId ?? record.object_id),
        label: asNonEmptyString(record.label),
        observables: {},
        variableBindings: normalizedBindings,
        units: (asRecord(record.units) as Record<string, string> | null) ?? {},
        source: "helix_ask",
        assumptions: asStringArray(record.assumptions),
        claimBoundaryNotes: asStringArray(record.claim_boundary_notes ?? record.claimBoundaryNotes),
    };
  }
  return null;
}

function asVariableBindings(value: unknown): Record<string, string | number> {
  const record = asRecord(value);
  if (!record) return {};
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, rawValue]) => [key, typeof rawValue === "number" || typeof rawValue === "string" ? rawValue : null])
      .filter((entry): entry is [string, string | number] => entry[1] !== null),
  );
}

function asPhysicsAtlasBlockId(value: unknown): PhysicsAtlasBlockId | null {
  const text = asNonEmptyString(value);
  if (!text) return null;
  return PHYSICS_ATLAS_BLOCK_IDS.includes(text as PhysicsAtlasBlockId) ? (text as PhysicsAtlasBlockId) : null;
}

function asPhysicsAtlasBlockIds(...values: unknown[]): PhysicsAtlasBlockId[] {
  return Array.from(
    new Set(
      values.flatMap((value) =>
        asStringArray(value)
          .map(asPhysicsAtlasBlockId)
          .filter((blockId): blockId is PhysicsAtlasBlockId => Boolean(blockId)),
      ),
    ),
  );
}

function buildTheoryLoadoutFromActionArgs(args: Record<string, unknown>, graph: ReturnType<typeof buildNhm2TheoryBadgeGraphV1>): TheoryCalculatorLoadoutV1 {
  const existingLoadout = asRecord(args.loadout);
  if (existingLoadout && isTheoryCalculatorLoadoutV1(existingLoadout)) return existingLoadout;
  const targetBadgeId = asNonEmptyString(args.target_badge_id ?? args.targetBadgeId ?? args.badge_id ?? args.badgeId);
  const badgeIds = asStringArray(args.badge_ids ?? args.badgeIds ?? args.ids);
  const atlasBlockId = asPhysicsAtlasBlockId(args.atlas_block_id ?? args.atlasBlockId ?? args.block_id ?? args.blockId);
  const atlasBlock = atlasBlockId
    ? PHYSICS_ATLAS_BLOCKS.find((block: PhysicsAtlasBlockV1) => block.id === atlasBlockId)
    : null;
  const atlasBadgeIds = atlasBlock
    ? [...atlasBlock.primaryBadgeIds, ...atlasBlock.claimBoundaryBadgeIds].filter((badgeId: string) =>
        graph.badges.some((badge: TheoryBadgeV1) => badge.id === badgeId),
      )
    : [];
  const selectedBadgeIds = badgeIds.length > 0 ? badgeIds : targetBadgeId ? [targetBadgeId] : atlasBadgeIds;
  const requestedMode = asNonEmptyString(args.mode);
  const mode =
    requestedMode === "dependency_path"
      ? "dependency_path"
      : requestedMode === "locator_matches"
        ? "locator_matches"
        : "selected_badges";
  const objectContext = asTheoryCalculatorObjectContext(args.object_context ?? args.objectContext);
  return buildTheoryCalculatorLoadout({
    graph,
    badgeIds: mode === "locator_matches" ? (badgeIds.length > 0 ? badgeIds : targetBadgeId ? [targetBadgeId] : []) : selectedBadgeIds,
    mode,
    source: "workstation_action",
    objectContext,
    variableBindings: asVariableBindings(args.variable_bindings ?? args.variableBindings),
    query: asNonEmptyString(args.query ?? args.text ?? args.prompt) ?? undefined,
    atlasBlockId: atlasBlockId ?? undefined,
    includeContextItems: asBoolean(args.include_context_items ?? args.includeContextItems) ?? true,
  });
}

function claimBoundaryNotesForBadges(
  badges: Array<{ id: string; claimBoundary?: { diagnosticOnly?: boolean; validationClaimAllowed?: boolean; physicalMechanismClaimAllowed?: boolean; promotionAllowed?: boolean } }>,
): string[] {
  const notes = new Set<string>();
  for (const badge of badges) {
    if (badge.claimBoundary?.diagnosticOnly) notes.add(`${badge.id}: diagnostic-only badge`);
    if (badge.claimBoundary?.validationClaimAllowed === false) notes.add(`${badge.id}: validation claim not allowed`);
    if (badge.claimBoundary?.physicalMechanismClaimAllowed === false) {
      notes.add(`${badge.id}: physical mechanism claim not allowed`);
    }
    if (badge.claimBoundary?.promotionAllowed === false) notes.add(`${badge.id}: promotion not allowed`);
  }
  return Array.from(notes);
}

function postSituationThreadBinding(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/thread-binding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postSituationGoalSession(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/goal-session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postLiveAnswerEnvironment(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/live-answer-environment/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postLiveWorkstationPipeline(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/live-workstation-pipeline/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postLiveEnvironmentControl(path: string, body?: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => undefined);
}

function normalizeLiveCommentaryCadence(value: unknown): string {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  if (
    text === "off" ||
    text === "milestones_only" ||
    text === "anomalies_and_milestones" ||
    text === "windowed_companion" ||
    text === "active_dialogue" ||
    text === "continuous_debug"
  ) {
    return text;
  }
  if (text === "risk_and_progress" || text === "progress_and_risk") return "anomalies_and_milestones";
  if (text === "codex" || text === "codex_style" || text === "dialogue") return "active_dialogue";
  return "milestones_only";
}

function normalizeLiveCommentaryStatus(value: unknown, cadence: string): "active" | "paused" | "stopped" {
  const text = asNonEmptyString(value)?.toLowerCase();
  if (text === "active" || text === "paused" || text === "stopped") return text;
  return cadence === "off" ? "paused" : "active";
}

function normalizeLiveCommentaryVoiceMode(value: unknown): string | undefined {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  if (text === "text_only" || text === "voice_on_confirm" || text === "critical_voice" || text === "direct_address_only") {
    return text;
  }
  return undefined;
}

function postLiveCommentarySession(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/live-commentary/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postLiveCommentarySessionWhenEnvironmentReady(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  const explicitEnvironmentId = asNonEmptyString(body.environment_id);
  if (explicitEnvironmentId) {
    postLiveCommentarySession(body);
    return;
  }
  const threadId = asNonEmptyString(body.thread_id) ?? "helix-ask:desktop";
  const attempt = (remaining: number): void => {
    void fetch(`/api/agi/situation/live-answer-environment?thread_id=${encodeURIComponent(threadId)}&limit=1`)
      .then((response) => response.json())
      .then((payload: unknown) => {
        const record = asRecord(payload);
        const environment = asRecord(record?.environment);
        const environmentId = asNonEmptyString(environment?.environment_id);
        if (environmentId) {
          postLiveCommentarySession({ ...body, environment_id: environmentId });
          return;
        }
        if (remaining > 0) {
          globalThis.setTimeout(() => attempt(remaining - 1), 250);
        }
      })
      .catch(() => {
        if (remaining > 0) globalThis.setTimeout(() => attempt(remaining - 1), 250);
      });
  };
  attempt(12);
}

function postLiveAgenticReviewRequest(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/live-agentic-review/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postLiveAgenticReviewRequestWhenEnvironmentReady(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  const explicitEnvironmentId = asNonEmptyString(body.environment_id);
  if (explicitEnvironmentId) {
    postLiveAgenticReviewRequest(body);
    return;
  }
  const threadId = asNonEmptyString(body.thread_id) ?? "helix-ask:desktop";
  const attempt = (remaining: number): void => {
    void fetch(`/api/agi/situation/live-answer-environment?thread_id=${encodeURIComponent(threadId)}&limit=1`)
      .then((response) => response.json())
      .then((payload: unknown) => {
        const record = asRecord(payload);
        const environment = asRecord(record?.environment);
        const environmentId = asNonEmptyString(environment?.environment_id);
        if (environmentId) {
          postLiveAgenticReviewRequest({ ...body, environment_id: environmentId });
          return;
        }
        if (remaining > 0) globalThis.setTimeout(() => attempt(remaining - 1), 250);
      })
      .catch(() => {
        if (remaining > 0) globalThis.setTimeout(() => attempt(remaining - 1), 250);
      });
  };
  attempt(12);
}

function postCompanionPolicy(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/companion-policy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postSituationMissionMemoryRefresh(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/mission-memory/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postInterjectionInvestigation(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/interjection-investigator/review-latest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function normalizeSituationJobKind(value: unknown): SituationRoomJobKind | null {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  if (!text) return null;
  if (text === "translation") return "translate";
  if (text === "summary") return "rolling_summary";
  if (text === "actions" || text === "todos" || text === "todo") return "action_items";
  if (
    text === "translate" ||
    text === "rolling_summary" ||
    text === "action_items" ||
    text === "prompt_composer"
  ) {
    return text;
  }
  return null;
}

function normalizeSituationInputTextPolicy(value: unknown): SituationRoomJobInputTextPolicy | undefined {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return text === "transcript_text" || text === "source_text_preferred" || text === "source_text_only"
    ? text
    : undefined;
}

function normalizeSituationOutputRenderPolicy(value: unknown): SituationRoomJobOutputRenderPolicy | undefined {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return text === "target_language" || text === "native_language" || text === "dual" ? text : undefined;
}

function normalizeSituationGraphNodeType(value: unknown): SituationGraphNodeType | null {
  const text = asNonEmptyString(value);
  const allowed = new Set<SituationGraphNodeType>([
    "source.audio.mic",
    "source.audio.display",
    "source.screen",
    "speaker.identity",
    "speaker.filter",
    "transcript.buffer",
    "language.detect",
    "translate",
    "helix.reason",
    "helix.interjection_gate",
    "output.voice",
    "output.panel",
    "output.note",
    "output.history",
  ]);
  return text && allowed.has(text as SituationGraphNodeType) ? (text as SituationGraphNodeType) : null;
}

function normalizeSituationGraphColumn(value: unknown): SituationGraphNodeColumn | undefined {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return text === "sources" || text === "speakers" || text === "jobs" || text === "outputs" || text === "helix"
    ? text
    : undefined;
}

function normalizeSituationGraphStatus(value: unknown): SituationGraphNodeStatus | undefined {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return text === "idle" || text === "active" || text === "running" || text === "blocked" || text === "complete" || text === "error"
    ? text
    : undefined;
}

function normalizeSituationGraphLane(value: unknown): SituationGraphLane | null {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return text === "audio" ||
    text === "speaker_identity" ||
    text === "transcript" ||
    text === "translation" ||
    text === "context" ||
    text === "command" ||
    text === "voice_output" ||
    text === "receipt" ||
    text === "monitor_signal"
    ? text
    : null;
}

function resolveSituationRoom(args: Record<string, unknown>, options?: { createIfMissing?: boolean }): SituationRoom | null {
  const situationState = useSituationRoomStore.getState();
  const explicitRoomId = asNonEmptyString(args.room_id ?? args.roomId);
  if (explicitRoomId && situationState.rooms[explicitRoomId]) return situationState.rooms[explicitRoomId];

  const title = asNonEmptyString(args.title ?? args.room_title ?? args.roomTitle ?? args.label);
  if (title) {
    const normalizedTitle = title.toLowerCase();
    const foundId = situationState.room_order.find((roomId) => {
      const room = situationState.rooms[roomId];
      return room?.title.trim().toLowerCase() === normalizedTitle;
    });
    if (foundId) return situationState.rooms[foundId] ?? null;
  }

  if (situationState.active_room_id && situationState.rooms[situationState.active_room_id]) {
    return situationState.rooms[situationState.active_room_id];
  }

  const firstRoomId = situationState.room_order[0];
  if (firstRoomId && situationState.rooms[firstRoomId]) return situationState.rooms[firstRoomId];

  return options?.createIfMissing
    ? useSituationRoomStore.getState().createRoom(title ?? "Situation Room")
    : null;
}

function resolveSituationSourceIds(room: SituationRoom, args: Record<string, unknown>): string[] {
  const situationState = useSituationRoomStore.getState();
  const requested = asStringArray(args.source_ids ?? args.sourceIds ?? args.source_id ?? args.sourceId);
  if (requested.length > 0) return requested.filter((sourceId) => Boolean(situationState.sources[sourceId]));
  return room.source_ids.filter((sourceId) => Boolean(situationState.sources[sourceId]));
}

function summarizeSituationRoom(room: SituationRoom): Record<string, unknown> {
  const state = useSituationRoomStore.getState();
  const sources = room.source_ids
    .map((sourceId) => state.sources[sourceId])
    .filter((source): source is SituationRoomSource => Boolean(source));
  return {
    room_id: room.room_id,
    title: room.title,
    status: room.status,
    source_count: sources.length,
    event_count: room.event_ids.length,
    transcript_count: selectSituationRoomEvents(state, room.room_id).filter(
      (event) => event.event_type === "voice_transcript",
    ).length,
    sources: sources.map((source) => ({
      source_id: source.source_id,
      label: source.label,
      status: source.status,
      capture_source: source.capture_source,
      chunk_index: source.chunk_index,
    })),
  };
}

function buildDeterministicNoteId(title: string, existingIds: string[]): string {
  const base = slugify(title) || "untitled-note";
  const stem = `note:${base}`;
  if (!existingIds.includes(stem)) return stem;
  let index = 2;
  while (existingIds.includes(`${stem}-${index}`)) index += 1;
  return `${stem}-${index}`;
}

function normalizeDocRoute(value: string): string {
  const normalized = value.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized) return "";
  return `/${normalized.startsWith("docs/") ? normalized : `docs/${normalized}`}`.replace(/\/{2,}/g, "/");
}

function tokenizeDocTopic(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !["the", "doc", "docs", "document", "paper", "latest", "newest", "recent"].includes(token));
}

function searchDocManifest(query: string, limit = 8) {
  const tokens = tokenizeDocTopic(query);
  if (tokens.length === 0) return [];
  return DOC_MANIFEST
    .map((entry) => {
      const searchText = entry.searchText.toLowerCase();
      const score = tokens.reduce((sum, token) => sum + (searchText.includes(token) ? 1 : 0), 0);
      return { entry, score: score + (/\blatest\b/i.test(entry.relativePath) ? 0.25 : 0) };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.route.localeCompare(b.entry.route))
    .slice(0, Math.max(1, Math.min(24, limit)));
}

function resolveNoteId(args: Record<string, unknown>, options?: { allowActiveFallback?: boolean }): string | null {
  const notesState = useWorkstationNotesStore.getState();
  const directId = asNonEmptyString(args.note_id ?? args.id);
  if (directId && notesState.notes[directId]) return directId;
  const targetTitle = asNonEmptyString(args.title ?? args.note_title ?? args.name);
  if (targetTitle) {
    const needle = targetTitle.trim().toLowerCase();
    const foundId = notesState.order.find((id) => {
      const note = notesState.notes[id];
      return note?.title?.trim().toLowerCase() === needle;
    });
    if (foundId) return foundId;
  }
  if (options?.allowActiveFallback && notesState.active_note_id && notesState.notes[notesState.active_note_id]) {
    return notesState.active_note_id;
  }
  return null;
}

function requireConfirmation(
  request: HelixPanelActionRequest,
  panelId: string,
  actionId: string,
  actionLabel: string,
): HelixPanelActionExecutionResult | null {
  const args = asRecord(request.args) ?? {};
  const confirmed = asBoolean(args.confirmed ?? args.confirm ?? args.approved);
  if (confirmed === true) return null;
  return {
    ok: false,
    panel_id: panelId,
    action_id: actionId,
    message: `${actionLabel} requires confirmation. Re-run with args.confirmed=true.`,
    artifact: {
      requires_confirmation: true,
      action_id: actionId,
    },
  };
}

function buildWorkspaceActionReceipt(panelId: string, actionId: string): Record<string, unknown> {
  return {
    kind: "workspace_action_receipt",
    schema: "helix.workspace_action_receipt.v1",
    panel_id: panelId,
    action_id: actionId,
    status: "completed",
    state_observed: true,
    assistant_answer: false,
    raw_content_included: false,
  };
}

function buildRuntimeDocsObservationArtifact(args: {
  actionId: "summarize_doc" | "summarize_section" | "explain_paper" | "locate_in_doc";
  path: string;
  anchor: string | null;
  selectedText: string | null;
  query: string | null;
  decisionRef: string | null;
}): Record<string, unknown> {
  const route = normalizeDocRoute(args.path);
  const entry = findDocEntry(route);
  const observationScope = args.decisionRef ? "runtime_selected_capability" : "manual_panel_action";
  if (args.actionId === "locate_in_doc") {
    const hasSelectedMatch =
      Boolean(args.selectedText) &&
      Boolean(args.query) &&
      args.selectedText!.toLowerCase().includes(args.query!.toLowerCase());
    return {
      schema: "helix.doc_location_matches.v1",
      kind: "doc_location_matches",
      source: "docs_viewer_runtime_adapter",
      decision_ref: args.decisionRef,
      observation_scope: observationScope,
      runtime_owned: Boolean(args.decisionRef),
      path: route,
      title: entry?.title ?? null,
      anchor: args.anchor,
      query: args.query,
      matches: hasSelectedMatch
        ? [
            {
              path: route,
              anchor: args.anchor,
              snippet: args.selectedText,
              source: "selected_text",
            },
          ]
        : [],
      adapter_note: hasSelectedMatch
        ? "Matched against selected text in the current Docs Viewer context."
        : "Docs Viewer adapter returned a same-turn location observation without launching a nested Ask turn.",
      same_turn_observation: true,
      nested_ask_launch: false,
      launched_prompt: false,
      manual_ui_launch_only: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  const selectedTextSummary = args.selectedText
    ? args.selectedText.length > 360
      ? `${args.selectedText.slice(0, 357)}...`
      : args.selectedText
    : null;
  const modeLabel =
    args.actionId === "summarize_section"
      ? "section summary"
      : args.actionId === "explain_paper"
        ? "paper explanation"
        : "document summary";
  return {
    schema: "helix.doc_summary.v1",
    kind: "doc_summary",
    source: "docs_viewer_runtime_adapter",
    decision_ref: args.decisionRef,
    observation_scope: observationScope,
    runtime_owned: Boolean(args.decisionRef),
    mode: args.actionId,
    path: route,
    title: entry?.title ?? null,
    anchor: args.anchor,
    selected_text: selectedTextSummary,
    summary_text: selectedTextSummary
      ? `${modeLabel}: ${selectedTextSummary}`
      : `${modeLabel}: ${entry?.title ?? route}`,
    adapter_note: "Docs Viewer adapter returned a same-turn doc summary observation without launching a nested Ask turn.",
    same_turn_observation: true,
    nested_ask_launch: false,
    launched_prompt: false,
    manual_ui_launch_only: false,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function executeHelixPanelAction(
  request: HelixPanelActionRequest,
  context: HelixPanelActionExecutionContext,
): HelixPanelActionExecutionResult {
  const panelId = request.panel_id?.trim();
  const actionId = request.action_id?.trim().toLowerCase();
  if (!panelId || !actionId) {
    return {
      ok: false,
      panel_id: request.panel_id || "",
      action_id: request.action_id || "",
      message: "panel_id and action_id are required.",
    };
  }

  if (actionId === "open") {
    context.openPanel(panelId, undefined);
    context.focusPanel(panelId, undefined);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: buildWorkspaceActionReceipt(panelId, actionId),
    };
  }

  if (actionId === "focus") {
    context.focusPanel(panelId, undefined);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: buildWorkspaceActionReceipt(panelId, actionId),
    };
  }

  if (actionId === "close") {
    context.closePanel(panelId, undefined);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: buildWorkspaceActionReceipt(panelId, actionId),
    };
  }

  if (panelId === "workstation-process-graph") {
    const args = asRecord(request.args) ?? {};
    const graphStore = useWorkstationProcessGraphStore.getState();
    const maxNodes = asNumber(args.max_nodes ?? args.maxNodes) ?? undefined;
    const scope = asNonEmptyString(args.scope)?.toLowerCase();
    const includeTimeline = asBoolean(args.include_timeline ?? args.includeTimeline) ?? true;
    const includeArtifacts = asBoolean(args.include_artifacts ?? args.includeArtifacts) ?? true;

    if (actionId === "get_snapshot") {
      if (scope === "compact" || scope === "context_pack") {
        return {
          ok: true,
          panel_id: panelId,
          action_id: actionId,
          artifact: graphStore.getContextPack({
            maxActive: maxNodes,
            maxArtifacts: asNumber(args.max_artifacts ?? args.maxArtifacts) ?? undefined,
            maxTimeline: includeTimeline ? asNumber(args.max_timeline ?? args.maxTimeline) ?? undefined : 0,
          }) as unknown as Record<string, unknown>,
          message: "Returned compact workstation process graph context pack.",
        };
      }
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: graphStore.getSnapshotArtifact({ maxNodes, includeTimeline, includeArtifacts }) as unknown as Record<string, unknown>,
        message: "Returned workstation process graph snapshot.",
      };
    }

    if (actionId === "get_context_pack") {
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: graphStore.getContextPack({
          maxActive: maxNodes,
          maxArtifacts: asNumber(args.max_artifacts ?? args.maxArtifacts) ?? undefined,
          maxTimeline: includeTimeline ? asNumber(args.max_timeline ?? args.maxTimeline) ?? undefined : 0,
        }) as unknown as Record<string, unknown>,
        message: "Returned compact workstation process graph context pack.",
      };
    }

    if (actionId === "query_snapshot") {
      const query = asNonEmptyString(args.query ?? args.filter);
      if (!query) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-process-graph.query_snapshot requires query.",
        };
      }
      const snapshot = graphStore.getSnapshotArtifact({ maxNodes, includeTimeline, includeArtifacts });
      const needle = query.toLowerCase();
      const nodes = snapshot.nodes.filter((node) =>
        [node.id, node.kind, node.label, node.status, node.panelId, node.traceId, node.jobId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle)),
      );
      const nodeIds = new Set(nodes.map((node) => node.id));
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          ...snapshot,
          query,
          nodes,
          edges: snapshot.edges.filter((edge) => nodeIds.has(edge.from) || nodeIds.has(edge.to)),
          timeline: snapshot.timeline.filter((entry) =>
            [entry.label, entry.traceId, ...(entry.nodeIds ?? [])]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(needle)),
          ),
        },
        message: `Returned process graph query snapshot for "${query}".`,
      };
    }

    if (actionId === "focus_node") {
      const nodeId = asNonEmptyString(args.node_id ?? args.nodeId);
      if (!nodeId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-process-graph.focus_node requires node_id.",
        };
      }
      graphStore.focusNode(nodeId);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: { kind: "workstation_process_graph_view_receipt", focused_node_id: nodeId },
        message: `Focused process graph node ${nodeId}.`,
      };
    }

    if (actionId === "filter_view") {
      const filter = asNonEmptyString(args.filter ?? args.query);
      graphStore.filterView(filter ?? undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: { kind: "workstation_process_graph_view_receipt", filter: filter ?? null },
        message: filter ? `Filtered process graph by "${filter}".` : "Cleared process graph filter.",
      };
    }

    if (actionId === "export_svg") {
      const mode = asNonEmptyString(args.mode) === "ambient" ? "ambient" : "panel";
      const graph = graphStore.graph;
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "workstation_process_graph_svg",
          schemaVersion: "helix.workstation.process_graph.svg/v1",
          sessionId: graph.sessionId,
          generatedAt: new Date().toISOString(),
          mode,
          svg: renderWorkstationProcessGraphSvg({
            graph,
            density: mode,
            labels: mode === "ambient" ? "minimal" : "full",
            maxNodes: maxNodes ?? (mode === "ambient" ? 18 : 160),
          }),
        },
        message: "Exported process graph SVG.",
      };
    }

    if (actionId === "clear_historical") {
      graphStore.clearHistorical();
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: { kind: "workstation_process_graph_view_receipt", cleared_historical: true },
        message: "Pruned historical process graph state.",
      };
    }
  }

  if (panelId === "docs-viewer" && (actionId === "open_doc" || actionId === "open_doc_by_path")) {
    const args = asRecord(request.args) ?? {};
    const path = asNonEmptyString(args.path ?? args.doc_path ?? args.target);
    const anchor = asNonEmptyString(args.anchor);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.open_doc requires a path.",
      };
    }
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    const route = normalizeDocRoute(path);
    openDocPanel(anchor ? { path: route, anchor } : { path: route });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { path: route, anchor: anchor ?? null },
      message: `Opened document: ${route}`,
    };
  }

  if (panelId === "docs-viewer" && actionId === "open_latest_doc_by_topic") {
    const args = asRecord(request.args) ?? {};
    const topic = asNonEmptyString(args.topic ?? args.query ?? args.target);
    const providedPath = asNonEmptyString(args.path ?? args.doc_path);
    if (!topic && !providedPath) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.open_latest_doc_by_topic requires a topic or resolved path.",
      };
    }
    const route =
      providedPath ? normalizeDocRoute(providedPath) : searchDocManifest(topic ?? "", 1)[0]?.entry.route ?? null;
    if (!route) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        artifact: { topic: topic ?? null, candidates: [] },
        message: `No local docs matched topic: ${topic ?? "unknown"}.`,
      };
    }
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    openDocPanel({ path: route });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { topic: topic ?? null, path: route },
      message: topic ? `Opened latest ${topic} document: ${route}` : `Opened document: ${route}`,
    };
  }

  if (panelId === "docs-viewer" && actionId === "search_docs") {
    const args = asRecord(request.args) ?? {};
    const query = asNonEmptyString(args.query ?? args.topic ?? args.target);
    if (!query) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.search_docs requires query.",
      };
    }
    const limitRaw = typeof args.limit === "number" ? args.limit : 8;
    const matches = searchDocManifest(query, limitRaw).map(({ entry }) => ({
      path: entry.route,
      title: entry.title,
    }));
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { query, matches },
      message: matches.length
        ? `Found ${matches.length} doc(s): ${matches.map((entry) => entry.path).join(", ")}`
        : `No docs matched: ${query}`,
    };
  }

  if (panelId === "docs-viewer" && actionId === "open_doc_and_read") {
    const args = asRecord(request.args) ?? {};
    const path = asNonEmptyString(args.path ?? args.doc_path ?? args.target);
    const anchor = asNonEmptyString(args.anchor);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.open_doc_and_read requires a path.",
      };
    }
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    openDocPanel(anchor ? { path, anchor, autoRead: true } : { path, autoRead: true });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { path, anchor: anchor ?? null, autoRead: true },
    };
  }

  if (panelId === "docs-viewer" && actionId === "open_directory") {
    useDocViewerStore.getState().viewDirectory();
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { mode: "directory" },
    };
  }

  if (panelId === "docs-viewer" && (actionId === "identify_current_doc" || actionId === "verify_active_doc")) {
    const store = useDocViewerStore.getState();
    const path = asNonEmptyString(store.currentPath);
    const anchor = asNonEmptyString(store.anchor);
    const entry = findDocEntry(path);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: {
        path: path ?? null,
        anchor: anchor ?? null,
        mode: store.mode,
        title: entry?.title ?? null,
        has_doc_context: Boolean(path),
      },
      message: path ? `Current document: ${path}` : "No active document in Docs Viewer.",
    };
  }

  if (
    panelId === "docs-viewer" &&
    (actionId === "summarize_doc" || actionId === "summarize_section" || actionId === "explain_paper" || actionId === "locate_in_doc")
  ) {
    const args = asRecord(request.args) ?? {};
    const store = useDocViewerStore.getState();
    const path =
      asNonEmptyString(args.path ?? args.doc_path ?? args.target) ??
      asNonEmptyString(store.currentPath);
    const anchor = asNonEmptyString(args.anchor) ?? asNonEmptyString(store.anchor);
    const selectedText = asNonEmptyString(args.selected_text ?? args.selection_text ?? args.selection);
    const query = asNonEmptyString(args.query ?? args.topic ?? args.find);
    const decisionRef = asNonEmptyString(args.agent_step_decision_ref ?? args.decision_ref ?? args.runtime_decision_ref);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "No active docs context to summarize/explain.",
      };
    }
    if (actionId === "locate_in_doc" && !query) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.locate_in_doc requires query.",
      };
    }
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: buildRuntimeDocsObservationArtifact({
        actionId,
        path,
        anchor,
        selectedText,
        query,
        decisionRef: decisionRef ?? null,
      }),
      message:
        actionId === "summarize_section"
          ? "Returned same-turn document section summary observation."
          : actionId === "explain_paper"
            ? "Returned same-turn paper explanation observation."
            : actionId === "locate_in_doc"
              ? "Returned same-turn document location observation."
              : "Returned same-turn document summary observation.",
    };
  }

  if (panelId === "agi-essence-console" && actionId === "open_settings") {
    const args = asRecord(request.args) ?? {};
    const tabRaw = asNonEmptyString(args.tab);
    const tab: SettingsTab = tabRaw === "knowledge" ? "knowledge" : "preferences";
    context.openSettings(tab);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { tab },
    };
  }

  if (panelId === "workstation-notes") {
    const args = asRecord(request.args) ?? {};
    const notesState = useWorkstationNotesStore.getState();
    if (actionId === "create_note") {
      const title = asNonEmptyString(args.title ?? args.name) ?? "Untitled note";
      const topic = asNonEmptyString(args.topic) ?? title;
      const body = asNonEmptyString(args.body) ?? "";
      const explicitId = asNonEmptyString(args.note_id);
      const noteId =
        explicitId && !notesState.notes[explicitId]
          ? explicitId
          : buildDeterministicNoteId(title, Object.keys(notesState.notes));
      const note = notesState.upsertWorkflowNote({
        id: noteId,
        title,
        topic,
        body,
        citations: [],
        snippets: [],
      });
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: note.id,
          title: note.title,
          active_note_id: note.id,
          created: true,
        },
      };
    }

    if (actionId === "append_to_note") {
      const text = asNonEmptyString(args.text ?? args.content ?? args.append);
      if (!text) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-notes.append_to_note requires text.",
        };
      }
      let noteId = resolveNoteId(args, { allowActiveFallback: true });
      let created = false;
      if (!noteId) {
        const createIfMissing = asBoolean(args.create_if_missing ?? args.createIfMissing) === true;
        const fallbackTitle = asNonEmptyString(args.title ?? args.name);
        if (!createIfMissing) {
          return {
            ok: false,
            panel_id: panelId,
            action_id: actionId,
            message: "Note target unresolved. Provide note_id/title, select an active note, or explicitly set create_if_missing=true.",
            artifact: {
              kind: "note_mutation_failure",
              schema: "helix.note_mutation_failure.v1",
              error_code: "note_target_unresolved",
              requires_user_input: ["note_id", "title"],
              mutation_applied: false,
              requested_action: "append_to_note",
              requested_text: text,
            },
          };
        }
        const fallback = notesState.upsertWorkflowNote({
          id: buildDeterministicNoteId(fallbackTitle ?? "Untitled note", Object.keys(notesState.notes)),
          title: fallbackTitle ?? "Untitled note",
          topic: asNonEmptyString(args.topic) ?? "general",
          body: "",
          citations: [],
          snippets: [],
        });
        noteId = fallback.id;
        created = true;
      }
      const current = useWorkstationNotesStore.getState().notes[noteId];
      const nextBody = current?.body ? `${current.body.replace(/\s+$/g, "")}\n${text}` : text;
      notesState.updateNoteBody(noteId, nextBody);
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      const updated = useWorkstationNotesStore.getState().notes[noteId];
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          title: updated?.title ?? null,
          appended_text: text,
          body_length: updated?.body.length ?? nextBody.length,
          created_note: created,
        },
      };
    }

    if (actionId === "create_live_note_sink" || actionId === "append_live_note_chunk") {
      const title = asNonEmptyString(args.title) ?? "Live source note";
      const topic = asNonEmptyString(args.topic) ?? "live-source";
      const noteId = asNonEmptyString(args.note_id) ?? buildDeterministicNoteId(title, Object.keys(notesState.notes));
      const chunk = asNonEmptyString(args.chunk_text ?? args.text) ?? "";
      const traceId = asNonEmptyString(args.trace_id) ?? `live-note:${noteId}:${Date.now()}`;
      const note = actionId === "append_live_note_chunk"
        ? notesState.appendLiveNoteChunk({
            note_id: noteId,
            title,
            topic,
            chunk_text: chunk,
            trace_id: traceId,
            citation: {
              id: `citation:${traceId}`,
              path: `live-pipeline://${traceId}`,
              heading: "Live pipeline transform",
              start_offset: 0,
              end_offset: chunk.length,
            },
            snippet: {
              id: `snippet:${traceId}`,
              citation_id: `citation:${traceId}`,
              excerpt: chunk.slice(0, 240),
            },
          })
        : notesState.upsertWorkflowNote({
            id: noteId,
            title,
            topic,
            body: "",
            citations: [],
            snippets: [],
            trace_id: traceId,
          });
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_output_sink_receipt",
          schema: "helix.live_output_sink_receipt.v1",
          sink_id: `sink:${note.id}`,
          pipeline_id: asNonEmptyString(args.pipeline_id) ?? "client_live_note_sink",
          target_id: note.id,
          ok: true,
          action: actionId === "append_live_note_chunk" ? "append" : "replace_section",
          written_chars: actionId === "append_live_note_chunk" ? chunk.length : 0,
          source_event_ids: [],
          evidence_refs: [`note:${note.id}`, `trace:${traceId}`],
          raw_transcript_included: false,
        },
        message: actionId === "append_live_note_chunk" ? `Appended live chunk to ${note.title}.` : `Created live note sink ${note.title}.`,
      };
    }

    if (actionId === "set_active_note") {
      const noteId = resolveNoteId(args);
      if (!noteId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "Note not found. Provide note_id or note title.",
        };
      }
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      const note = useWorkstationNotesStore.getState().notes[noteId];
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          title: note?.title ?? null,
          active_note_id: noteId,
        },
      };
    }

    if (actionId === "rename_note") {
      const nextTitle = asNonEmptyString(args.title ?? args.new_title ?? args.to_title ?? args.name);
      if (!nextTitle) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-notes.rename_note requires title.",
        };
      }
      const lookupArgs: Record<string, unknown> = {
        ...args,
        title: args.from_title ?? args.note_title ?? args.note_name ?? args.title ?? args.name,
      };
      const noteId = resolveNoteId(lookupArgs, { allowActiveFallback: true });
      if (!noteId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "Note not found. Provide note_id or existing note title.",
        };
      }
      notesState.renameNote(noteId, nextTitle);
      notesState.setActiveNote(noteId);
      const renamed = useWorkstationNotesStore.getState().notes[noteId];
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          title: renamed?.title ?? nextTitle,
        },
      };
    }

    if (actionId === "delete_note") {
      const confirmationResult = requireConfirmation(
        request,
        panelId,
        actionId,
        "workstation-notes.delete_note",
      );
      if (confirmationResult) return confirmationResult;
      const noteId = resolveNoteId(args, { allowActiveFallback: true });
      if (!noteId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "Note not found. Provide note_id or note title.",
        };
      }
      const previous = useWorkstationNotesStore.getState().notes[noteId];
      notesState.deleteNote(noteId);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          deleted_note_id: noteId,
          deleted_title: previous?.title ?? null,
          active_note_id: useWorkstationNotesStore.getState().active_note_id ?? null,
        },
      };
    }

    if (actionId === "list_notes") {
      const snapshot = useWorkstationNotesStore.getState();
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          active_note_id: snapshot.active_note_id ?? null,
          count: snapshot.order.length,
          notes: snapshot.order
            .map((id) => snapshot.notes[id])
            .filter(Boolean)
            .map((note) => ({
              note_id: note.id,
              title: note.title,
              topic: note.topic,
              updated_at: note.updated_at,
            })),
        },
      };
    }
  }

  const situationSourceActionIds = new Set([
    "attach_display_audio_source",
    "attach_mic_audio_source",
    "save_room_as_note",
    "attach_room_to_helix_ask",
    "stop_room",
  ]);

  if (panelId === "situation-room-sources" || (panelId === "situation-room-pipelines" && situationSourceActionIds.has(actionId))) {
    const args = asRecord(request.args) ?? {};
    const situationState = useSituationRoomStore.getState();
    const unifiedPanelId = "situation-room-pipelines";

    if (actionId === "attach_display_audio_source") {
      const room = resolveSituationRoom(args, { createIfMissing: true });
      if (!room) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No situation room is available for the display audio source.",
        };
      }
      context.openPanel(unifiedPanelId, undefined);
      context.focusPanel(unifiedPanelId, undefined);
      const label = asNonEmptyString(args.label ?? args.source_label ?? args.sourceLabel) ?? undefined;
      void useSituationRoomStore.getState().attachDisplayAudioSource(room.room_id, label);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          ...summarizeSituationRoom(room),
          capture_picker_requested: true,
          label: label ?? null,
        },
        message: `Opening display picker for ${room.title}.`,
      };
    }

    if (actionId === "attach_mic_audio_source") {
      const room = resolveSituationRoom(args, { createIfMissing: true });
      if (!room) {
        return {
          ok: false,
          panel_id: unifiedPanelId,
          action_id: actionId,
          message: "No situation room is available for the microphone source.",
        };
      }
      context.openPanel(unifiedPanelId, undefined);
      context.focusPanel(unifiedPanelId, undefined);
      const label = asNonEmptyString(args.label ?? args.source_label ?? args.sourceLabel) ?? undefined;
      void useSituationRoomStore.getState().attachMicAudioSource(room.room_id, label);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          ...summarizeSituationRoom(room),
          mic_permission_requested: true,
          label: label ?? null,
          capture_source: "mic",
        },
        message: `Requesting microphone permission for ${room.title}.`,
      };
    }

    if (actionId === "save_room_as_note") {
      const room = resolveSituationRoom(args);
      if (!room) {
        return {
          ok: false,
          panel_id: unifiedPanelId,
          action_id: actionId,
          message: "No situation room is available to save.",
        };
      }
      const note = situationState.saveRoomAsNote(room.room_id);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: Boolean(note),
        panel_id: unifiedPanelId,
        action_id: actionId,
        artifact: {
          ...summarizeSituationRoom(useSituationRoomStore.getState().rooms[room.room_id] ?? room),
          note_id: note?.id ?? null,
          note_title: note?.title ?? null,
        },
        message: note ? `Saved situation room "${room.title}" as a note.` : "Situation room save failed.",
      };
    }

    if (actionId === "attach_room_to_helix_ask") {
      const room = resolveSituationRoom(args);
      if (!room) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No situation room is available to attach.",
        };
      }
      const sourceId = asNonEmptyString(args.source_id ?? args.sourceId);
      situationState.attachRoomToHelixAsk(room.room_id, sourceId ?? undefined);
      return {
        ok: true,
        panel_id: unifiedPanelId,
        action_id: actionId,
        artifact: {
          ...summarizeSituationRoom(room),
          attached_source_id: sourceId ?? null,
        },
        message: `Attached situation room "${room.title}" to Helix Ask.`,
      };
    }

    if (actionId === "stop_room") {
      const room = resolveSituationRoom(args);
      if (!room) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No situation room is available to stop.",
        };
      }
      situationState.stopRoom(room.room_id);
      return {
        ok: true,
        panel_id: unifiedPanelId,
        action_id: actionId,
        artifact: summarizeSituationRoom(useSituationRoomStore.getState().rooms[room.room_id] ?? room),
        message: `Stopped active sources for "${room.title}".`,
      };
    }
  }

  if (panelId === "situation-room-pipelines") {
    const args = asRecord(request.args) ?? {};
    const jobState = useSituationRoomJobStore.getState();

    if (actionId === "setup_from_prompt") {
      const setupArgs = normalizeSituationRoomSetupActionArgs(args);
      const receipt = setupSituationRoomFromPrompt(setupArgs);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      if (receipt.setup_status === "needs_capture_permission") {
        context.openPanel("situation-room-pipelines", undefined);
        context.focusPanel("situation-room-pipelines", undefined);
      }
      return {
        ok: receipt.ok,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "situation_room_setup_execution_receipt",
          ...receipt,
        } as unknown as Record<string, unknown>,
        message: receipt.message,
      };
    }

    if (actionId === "create_job") {
      const room = resolveSituationRoom(args);
      const kind = normalizeSituationJobKind(args.kind ?? args.job_kind ?? args.jobKind ?? args.type);
      if (!room || !kind) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: !room
            ? "No situation room is available for a source job."
            : "situation-room-pipelines.create_job requires kind.",
          artifact: {
            missing: [!room ? "room_id" : "", !kind ? "kind" : ""].filter(Boolean),
          },
        };
      }
      const sourceIds = resolveSituationSourceIds(room, args);
      const attachmentPolicy = asNonEmptyString(args.attachment_policy ?? args.attachmentPolicy) ?? "manual_only";
      const contextInjection =
        asNonEmptyString(args.context_injection ?? args.contextInjection) ?? "explicit_attachment_only";
      const job = jobState.createJob({
        room_id: room.room_id,
        kind,
        source_ids: sourceIds,
        title: asNonEmptyString(args.title ?? args.job_title ?? args.jobTitle) ?? undefined,
        target_language: asNonEmptyString(args.target_language ?? args.targetLanguage ?? args.language) ?? undefined,
        native_language: asNonEmptyString(args.native_language ?? args.nativeLanguage) ?? undefined,
        input_text_policy: normalizeSituationInputTextPolicy(args.input_text_policy ?? args.inputTextPolicy),
        output_render_policy: normalizeSituationOutputRenderPolicy(args.output_render_policy ?? args.outputRenderPolicy),
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          job_id: job.job_id,
          room_id: job.room_id,
          kind: job.kind,
          source_ids: job.source_ids,
          target_language: job.target_language ?? null,
          native_language: job.native_language ?? null,
          input_text_policy: job.input_text_policy,
          output_render_policy: job.output_render_policy,
          attachment_policy: attachmentPolicy,
          context_injection: contextInjection,
          derived_outputs_auto_attach: false,
          command_lane_enabled: false,
        },
        message: `Created ${job.kind} job for "${room.title}".`,
      };
    }

    if (actionId === "run_job") {
      const jobId = asNonEmptyString(args.job_id ?? args.jobId);
      if (!jobId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.run_job requires job_id.",
        };
      }
      const outputs = jobState.processJobNow(jobId);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: Boolean(jobState.jobs[jobId]),
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          job_id: jobId,
          output_count: outputs.length,
          output_ids: outputs.map((output) => output.output_id),
        },
        message: jobState.jobs[jobId] ? `Processed job ${jobId}.` : `Unknown situation room job: ${jobId}`,
      };
    }

    if (actionId === "attach_job_to_helix_ask") {
      const jobId = asNonEmptyString(args.job_id ?? args.jobId);
      if (!jobId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.attach_job_to_helix_ask requires job_id.",
        };
      }
      jobState.attachJobToHelixAsk(jobId);
      return {
        ok: Boolean(useSituationRoomJobStore.getState().jobs[jobId]),
        panel_id: panelId,
        action_id: actionId,
        artifact: { job_id: jobId },
        message: `Attached job ${jobId} to Helix Ask.`,
      };
    }

    if (actionId === "save_job_as_note") {
      const jobId = asNonEmptyString(args.job_id ?? args.jobId);
      if (!jobId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.save_job_as_note requires job_id.",
        };
      }
      const note = jobState.saveJobAsNote(jobId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: Boolean(note),
        panel_id: panelId,
        action_id: actionId,
        artifact: { job_id: jobId, note_id: note?.id ?? null, note_title: note?.title ?? null },
        message: note ? `Saved job ${jobId} as a note.` : `No output available to save for job ${jobId}.`,
      };
    }

    if (actionId === "stop_job") {
      const jobId = asNonEmptyString(args.job_id ?? args.jobId);
      if (!jobId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.stop_job requires job_id.",
        };
      }
      jobState.stopJob(jobId);
      return {
        ok: Boolean(useSituationRoomJobStore.getState().jobs[jobId]),
        panel_id: panelId,
        action_id: actionId,
        artifact: { job_id: jobId, status: useSituationRoomJobStore.getState().jobs[jobId]?.status ?? null },
        message: `Stopped job ${jobId}.`,
      };
    }

    const graphState = useSituationRoomGraphStore.getState();

    if (actionId === "create_graph_from_recipe") {
      const recipeId = asNonEmptyString(args.recipe_id ?? args.recipeId);
      const bindings = asRecord(args.bindings) ?? {};
      if (!recipeId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.create_graph_from_recipe requires recipe_id.",
          artifact: { missing: ["recipe_id"] },
        };
      }
      const room = resolveSituationRoom({ ...args, ...bindings });
      const sourceIds =
        asStringArray(args.source_ids ?? args.sourceIds).length > 0
          ? asStringArray(args.source_ids ?? args.sourceIds)
          : asStringArray(bindings.source_ids ?? bindings.sourceIds);
      const receipt = graphState.createGraphFromRecipe({
        recipe_id: recipeId,
        room_id: asNonEmptyString(args.room_id ?? args.roomId) ?? room?.room_id ?? undefined,
        source_ids: sourceIds.length > 0 ? sourceIds : undefined,
        bindings,
        title: asNonEmptyString(args.title ?? args.graph_title ?? args.graphTitle) ?? undefined,
      });
      if (receipt.ok) {
        context.openPanel(panelId, undefined);
        context.focusPanel(panelId, undefined);
      }
      return {
        ok: receipt.ok,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "situation_room_graph_execution_receipt",
          ...receipt,
        },
        message: receipt.ok
          ? `Created ${receipt.recipe_id ?? recipeId} graph ${receipt.graph_id}.`
          : `Could not create ${recipeId}: missing ${receipt.missing_bindings.join(", ") || "recipe"}.`,
      };
    }

    if (actionId === "create_graph") {
      const room = resolveSituationRoom(args);
      if (!room) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No situation room is available for a graph.",
          artifact: { missing: ["room_id"] },
        };
      }
      const graph = graphState.createGraph({
        room_id: room.room_id,
        title: asNonEmptyString(args.title ?? args.graph_title ?? args.graphTitle) ?? `${room.title} graph`,
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          graph_id: graph.graph_id,
          room_id: graph.room_id,
          title: graph.title,
          node_count: graph.nodes.length,
          edge_count: graph.edges.length,
          attachment_policy: "manual_only",
          context_injection: "explicit_attachment_only",
        },
        message: `Created graph "${graph.title}" for "${room.title}".`,
      };
    }

    if (actionId === "add_node") {
      const graphId = asNonEmptyString(args.graph_id ?? args.graphId);
      const type = normalizeSituationGraphNodeType(args.type ?? args.node_type ?? args.nodeType);
      const title = asNonEmptyString(args.title ?? args.label);
      if (!graphId || !type || !title) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.add_node requires graph_id, type, and title.",
          artifact: {
            missing: [!graphId ? "graph_id" : "", !type ? "type" : "", !title ? "title" : ""].filter(Boolean),
          },
        };
      }
      const node = graphState.addNode({
        graph_id: graphId,
        type,
        title,
        column: normalizeSituationGraphColumn(args.column),
        status: normalizeSituationGraphStatus(args.status),
        source_id: asNonEmptyString(args.source_id ?? args.sourceId) ?? undefined,
        speaker_id: asNonEmptyString(args.speaker_id ?? args.speakerId) ?? undefined,
        job_id: asNonEmptyString(args.job_id ?? args.jobId) ?? undefined,
      });
      return {
        ok: Boolean(node),
        panel_id: panelId,
        action_id: actionId,
        artifact: { graph_id: graphId, node_id: node?.node_id ?? null },
        message: node ? `Added ${type} node to graph ${graphId}.` : `Unknown situation room graph: ${graphId}`,
      };
    }

    if (actionId === "connect_nodes") {
      const graphId = asNonEmptyString(args.graph_id ?? args.graphId);
      const fromNodeId = asNonEmptyString(args.from_node_id ?? args.fromNodeId);
      const toNodeId = asNonEmptyString(args.to_node_id ?? args.toNodeId);
      const lane = normalizeSituationGraphLane(args.lane);
      if (!graphId || !fromNodeId || !toNodeId || !lane) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.connect_nodes requires graph_id, from_node_id, to_node_id, and lane.",
          artifact: {
            missing: [
              !graphId ? "graph_id" : "",
              !fromNodeId ? "from_node_id" : "",
              !toNodeId ? "to_node_id" : "",
              !lane ? "lane" : "",
            ].filter(Boolean),
          },
        };
      }
      const edge = graphState.connectNodes({
        graph_id: graphId,
        from_node_id: fromNodeId,
        from_port: asNonEmptyString(args.from_port ?? args.fromPort) ?? undefined,
        to_node_id: toNodeId,
        to_port: asNonEmptyString(args.to_port ?? args.toPort) ?? undefined,
        lane,
      });
      return {
        ok: Boolean(edge),
        panel_id: panelId,
        action_id: actionId,
        artifact: { graph_id: graphId, edge_id: edge?.edge_id ?? null },
        message: edge ? `Connected graph lane ${lane}.` : `Could not connect nodes in graph ${graphId}.`,
      };
    }

    if (actionId === "create_translation_pair") {
      const room = resolveSituationRoom(args);
      const speakerAId = asNonEmptyString(args.speaker_a_id ?? args.speakerAId);
      const speakerBId = asNonEmptyString(args.speaker_b_id ?? args.speakerBId);
      const speakerALanguage = asNonEmptyString(args.speaker_a_native_language ?? args.speakerANativeLanguage);
      const speakerBLanguage = asNonEmptyString(args.speaker_b_native_language ?? args.speakerBNativeLanguage);
      if (!room || !speakerAId || !speakerBId || !speakerALanguage || !speakerBLanguage) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message:
            "situation-room-pipelines.create_translation_pair requires a room and two speaker ids/native languages.",
          artifact: {
            missing: [
              !room ? "room_id" : "",
              !speakerAId ? "speaker_a_id" : "",
              !speakerBId ? "speaker_b_id" : "",
              !speakerALanguage ? "speaker_a_native_language" : "",
              !speakerBLanguage ? "speaker_b_native_language" : "",
            ].filter(Boolean),
          },
        };
      }
      const renderPolicy =
        normalizeSituationOutputRenderPolicy(args.render_policy ?? args.renderPolicy) ?? "dual";
      const rawVoiceOutput = asNonEmptyString(args.voice_output ?? args.voiceOutput);
      const voiceOutput: TranslationPairNodeConfig["voice_output"] =
        rawVoiceOutput === "on_confirm" || rawVoiceOutput === "auto_when_direct_addressed"
          ? rawVoiceOutput
          : "off";
      const result = graphState.createTranslationPair({
        graph_id: asNonEmptyString(args.graph_id ?? args.graphId) ?? undefined,
        room_id: room.room_id,
        speaker_a_id: speakerAId,
        speaker_b_id: speakerBId,
        speaker_a_native_language: speakerALanguage,
        speaker_b_native_language: speakerBLanguage,
        source_ids: resolveSituationSourceIds(room, args),
        render_policy: renderPolicy,
        voice_output: voiceOutput,
        title: asNonEmptyString(args.title ?? args.label) ?? undefined,
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: Boolean(result),
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          graph_id: result?.graph.graph_id ?? null,
          node_id: result?.node.node_id ?? null,
          job_ids: result?.job_ids ?? [],
          attachment_policy: "manual_only",
          context_injection: "explicit_attachment_only",
          command_lane_enabled: false,
        },
        message: result
          ? `Created two-way translation graph for ${speakerAId} and ${speakerBId}.`
          : "Could not create translation pair.",
      };
    }

    if (actionId === "attach_graph_to_helix_ask") {
      const graphId = asNonEmptyString(args.graph_id ?? args.graphId);
      if (!graphId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.attach_graph_to_helix_ask requires graph_id.",
        };
      }
      graphState.attachGraphToHelixAsk(graphId);
      const graph = useSituationRoomGraphStore.getState().graphs[graphId];
      return {
        ok: Boolean(graph),
        panel_id: panelId,
        action_id: actionId,
        artifact: { graph_id: graphId, node_count: graph?.nodes.length ?? 0, edge_count: graph?.edges.length ?? 0 },
        message: graph ? `Attached graph ${graphId} to Helix Ask.` : `Unknown situation room graph: ${graphId}`,
      };
    }

    if (actionId === "attach_standby_to_helix_thread") {
      const room = resolveSituationRoom(args);
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId);
      if (!room || !threadId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          artifact: {
            kind: "situation_thread_binding_receipt",
            ok: false,
            missing: [!room ? "room_id" : "", !threadId ? "thread_id" : ""].filter(Boolean),
          },
          message: !room
            ? "No situation room is available to bind to Helix Ask."
            : "situation-room-pipelines.attach_standby_to_helix_thread requires thread_id.",
        };
      }
      const sourceIds = resolveSituationSourceIds(room, args);
      const bindingRequest = {
        room_id: room.room_id,
        source_id: asNonEmptyString(args.source_id ?? args.sourceId) ?? sourceIds[0] ?? null,
        graph_id: asNonEmptyString(args.graph_id ?? args.graphId) ?? null,
        world_id: asNonEmptyString(args.world_id ?? args.worldId) ?? "minecraft:minehut",
        thread_id: threadId,
        turn_id: asNonEmptyString(args.turn_id ?? args.turnId) ?? null,
        session_id: asNonEmptyString(args.session_id ?? args.sessionId) ?? null,
        trace_id: asNonEmptyString(args.trace_id ?? args.traceId) ?? null,
        mode: "standby_receipts",
        append_policy:
          asNonEmptyString(args.append_policy ?? args.appendPolicy) === "all_receipts_debug"
            ? "all_receipts_debug"
            : "salient_only",
      };
      postSituationThreadBinding(bindingRequest);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "situation_thread_binding_receipt",
          ok: true,
          binding_request: bindingRequest,
          context_policy: "explicit_attachment_only",
          command_lane_enabled: false,
        },
        message: `Submitted standby receipt binding for ${room.title}.`,
      };
    }

    if (actionId === "start_situation_goal_session") {
      const room = resolveSituationRoom(args);
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const roomId = asNonEmptyString(args.room_id ?? args.roomId) ?? room?.room_id ?? "room:minecraft-minehut";
      const sourceIdsFromRoom = room ? resolveSituationSourceIds(room, args) : [];
      const worldEventSourceMissing =
        args.world_event_source_status === "configured_missing" ||
        args.no_world_event_source === true ||
        args.source_id === null ||
        args.sourceId === null;
      const sourceId =
        worldEventSourceMissing
          ? null
          : asNonEmptyString(args.source_id ?? args.sourceId) ?? sourceIdsFromRoom[0] ?? "source:minecraft-server";
      const sourceIds = Array.from(
        new Set([
          ...asStringArray(args.source_ids ?? args.sourceIds),
          ...(sourceId ? [sourceId] : []),
        ].filter(Boolean)),
      );
      const worldId = worldEventSourceMissing ? null : asNonEmptyString(args.world_id ?? args.worldId) ?? "minecraft:minehut";
      const existingGraphId = asNonEmptyString(args.graph_id ?? args.graphId) ?? graphState.active_graph_id_by_room[roomId];
      const graphReceipt = existingGraphId
        ? null
        : graphState.createGraphFromRecipe({
            recipe_id: "minecraft_world_monitor",
            room_id: roomId,
            source_ids: sourceIds,
            bindings: {
              room_id: roomId,
              source_ids: sourceIds,
              standby_mode: "high_salience",
              world_id: worldId,
            },
            title: "Minecraft world monitor",
          });
      const graphId = existingGraphId ?? (graphReceipt?.ok ? graphReceipt.graph_id : null);
      if (graphId) {
        graphState.attachGraphToHelixAsk(graphId);
      }
      const appendPolicy =
        asNonEmptyString(args.append_policy ?? args.appendPolicy) === "episodes_and_salience"
          ? "episodes_and_salience"
          : asNonEmptyString(args.append_policy ?? args.appendPolicy) === "callouts_only"
            ? "callouts_only"
            : "salient_only";
      const standbyMode =
        asNonEmptyString(args.standby_mode ?? args.standbyMode) === "voice_on_confirm"
          ? "voice_on_confirm"
          : asNonEmptyString(args.standby_mode ?? args.standbyMode) === "critical_voice"
            ? "critical_voice"
            : asNonEmptyString(args.standby_mode ?? args.standbyMode) === "direct_address_only"
              ? "direct_address_only"
              : asNonEmptyString(args.standby_mode ?? args.standbyMode) === "off"
                ? "off"
                : "text_only";
      const bindingRequest = {
        room_id: roomId,
        source_id: sourceId,
        graph_id: graphId,
        world_id: worldId,
        thread_id: threadId,
        turn_id: asNonEmptyString(args.turn_id ?? args.turnId) ?? null,
        session_id: asNonEmptyString(args.session_id ?? args.sessionId) ?? null,
        trace_id: asNonEmptyString(args.trace_id ?? args.traceId) ?? null,
        mode: "standby_receipts",
        append_policy: "salient_only",
      };
      const sessionRequest = {
        thread_id: threadId,
        room_id: roomId,
        source_ids: sourceIds,
        graph_id: graphId,
        world_id: worldId,
        objective:
          asNonEmptyString(args.objective) ??
          "Monitor my Minecraft session and surface danger or meaningful progress.",
        standby_mode: standbyMode,
        append_policy: appendPolicy,
      };
      postSituationThreadBinding(bindingRequest);
      postSituationGoalSession(sessionRequest);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "situation_goal_session_receipt",
          ok: true,
          session_request: sessionRequest,
          binding_request: bindingRequest,
          graph_receipt: graphReceipt,
          context_policy: "explicit_attachment_only",
          command_lane_enabled: false,
        },
        message: worldEventSourceMissing
          ? "Started a visible situation goal session without a world-event source."
          : `Started a visible situation goal session for ${worldId}.`,
      };
    }

    if (actionId === "create_live_answer_environment") {
      const room = resolveSituationRoom(args);
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const objective =
        asNonEmptyString(args.objective) ??
        "Create a live answer environment for this source.";
      const roomId = asNonEmptyString(args.room_id ?? args.roomId) ?? room?.room_id ?? undefined;
      const worldEventSourceMissing =
        args.world_event_source_status === "configured_missing" ||
        args.no_world_event_source === true ||
        args.source_id === null ||
        args.sourceId === null;
      const sourceIds = Array.from(
        new Set([
          ...asStringArray(args.source_ids ?? args.sourceIds),
          ...(worldEventSourceMissing ? [] : asStringArray(args.source_id ?? args.sourceId)),
          ...(worldEventSourceMissing || !room ? [] : resolveSituationSourceIds(room, args)),
        ].filter(Boolean)),
      );
      const request = {
        thread_id: threadId,
        objective,
        room_id: roomId,
        source_ids: sourceIds,
        graph_id: asNonEmptyString(args.graph_id ?? args.graphId) ?? undefined,
        preset: asNonEmptyString(args.preset) ?? "custom",
        line_schema: Array.isArray(args.line_schema) ? args.line_schema : undefined,
        mode: asNonEmptyString(args.mode) ?? "text_only",
        source_config:
          args.source_config && typeof args.source_config === "object"
            ? args.source_config as Record<string, unknown>
            : undefined,
      };
      postLiveAnswerEnvironment(request);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_answer_environment_receipt",
          ok: true,
          request,
          context_policy: "compact_context_pack_only",
          deterministic_content_role: "observation_not_assistant_answer",
          command_lane_enabled: false,
        },
        message: `Created a live answer environment for ${objective}.`,
      };
    }

    if (actionId === "set_live_commentary_policy") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const cadence = normalizeLiveCommentaryCadence(args.cadence ?? args.commentary_cadence ?? args.commentaryCadence);
      const status = normalizeLiveCommentaryStatus(args.status, cadence);
      const voiceMode = normalizeLiveCommentaryVoiceMode(args.voice_mode ?? args.voiceMode);
      const environmentId = asNonEmptyString(args.environment_id ?? args.environmentId);
      const request = {
        thread_id: threadId,
        environment_id: environmentId ?? undefined,
        cadence,
        status,
        ...(voiceMode ? { voice_mode: voiceMode } : {}),
      };
      postLiveCommentarySessionWhenEnvironmentReady(request);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_commentary_session_receipt",
          ok: true,
          request,
          pending_environment_resolution: !environmentId,
          context_policy: "compact_context_pack_only",
          raw_logs_included: false,
          deterministic_content_role: "observation_not_assistant_answer",
        },
        message: environmentId
          ? `Set live commentary cadence to ${cadence}.`
          : `Queued live commentary setup for the active ${threadId} environment.`,
      };
    }

    if (actionId === "request_agentic_review") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const environmentId = asNonEmptyString(args.environment_id ?? args.environmentId);
      const question =
        asNonEmptyString(args.question) ??
        "Review the latest compact live environment state.";
      const trigger = asNonEmptyString(args.trigger) ?? "manual_button";
      const request = {
        thread_id: threadId,
        environment_id: environmentId ?? undefined,
        question,
        trigger,
      };
      postLiveAgenticReviewRequestWhenEnvironmentReady(request);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_agentic_review_receipt",
          ok: true,
          request,
          pending_environment_resolution: !environmentId,
          context_policy: "compact_context_pack_only",
          raw_logs_included: false,
          deterministic_content_role: "observation_not_assistant_answer",
        },
        message: environmentId
          ? "Requested an agentic review for the live environment."
          : `Queued an agentic review request for the active ${threadId} environment.`,
      };
    }

    if (actionId === "set_companion_policy") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const companionMode = asNonEmptyString(args.companion_mode ?? args.companionMode) ?? "active_companion";
      const commentaryMode = asNonEmptyString(args.commentary_mode ?? args.commentaryMode) ?? "anomalies_and_milestones";
      const request = {
        thread_id: threadId,
        voice_input_active: asBoolean(args.voice_input_active ?? args.voiceInputActive) ?? true,
        voice_output_enabled: asBoolean(args.voice_output_enabled ?? args.voiceOutputEnabled) ?? false,
        companion_mode: companionMode,
        commentary_mode: commentaryMode,
        direct_address_names: asStringArray(args.direct_address_names ?? args.directAddressNames).length
          ? asStringArray(args.direct_address_names ?? args.directAddressNames)
          : ["helix", "dottie"],
      };
      postCompanionPolicy(request);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "companion_policy_receipt",
          ok: true,
          request,
          context_policy: "compact_context_pack_only",
          raw_audio_included: false,
          raw_transcript_included: false,
          deterministic_content_role: "observation_not_assistant_answer",
        },
        message: `Set companion mode to ${companionMode}.`,
      };
    }

    if (actionId === "observer.attach") {
      const targetRunId = asNonEmptyString(args.target_run_id ?? args.targetRunId);
      const observerProfile = asNonEmptyString(args.observer_profile ?? args.observerProfile);
      if (!targetRunId || !observerProfile) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.observer.attach requires target_run_id and observer_profile.",
        };
      }
      const observerId = nextDottieObserverId(observerProfile, targetRunId);
      const subscription: HelixDottieObserverSubscriptionV1 = {
        schema: HELIX_DOTTIE_OBSERVER_SUBSCRIPTION_SCHEMA,
        observer_id: observerId,
        observer_profile: observerProfile,
        target_run_id: targetRunId,
        target_agent_id: asNonEmptyString(args.target_agent_id ?? args.targetAgentId) ?? "agent:helix_ask",
        target_turn_id: asNonEmptyString(args.target_turn_id ?? args.targetTurnId),
        thread_id: asNonEmptyString(args.thread_id ?? args.threadId),
        voice_mode: asNonEmptyString(args.voice_mode ?? args.voiceMode) ?? "voice_on_confirm",
        max_chars: boundedDottieMaxChars(args.max_chars ?? args.maxChars),
        event_filter: asStringArray(args.event_filter ?? args.eventFilter).length
          ? asStringArray(args.event_filter ?? args.eventFilter)
          : [HELIX_AGENT_COMMENTARY_SCHEMA],
        status: "active",
        authority: "witness_only",
        can_execute_tools: false,
        assistant_answer: false,
        raw_reasoning_included: false,
      };
      dottieObserverSubscriptions.set(observerId, subscription);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "dottie_observer_subscription_receipt",
          ok: true,
          subscription,
          context_policy: "compact_context_pack_only",
          deterministic_content_role: "observation_not_assistant_answer",
          raw_logs_included: false,
          raw_transcript_included: false,
          raw_reasoning_included: false,
        },
        message: `Attached ${observerProfile} as a witness-only observer.`,
      };
    }

    if (actionId === "observer.detach") {
      const observerId = asNonEmptyString(args.observer_id ?? args.observerId);
      if (!observerId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.observer.detach requires observer_id.",
        };
      }
      const existing = dottieObserverSubscriptions.get(observerId);
      const subscription: HelixDottieObserverSubscriptionV1 = existing
        ? { ...existing, status: "detached" }
        : {
            schema: HELIX_DOTTIE_OBSERVER_SUBSCRIPTION_SCHEMA,
            observer_id: observerId,
            observer_profile: asNonEmptyString(args.observer_profile ?? args.observerProfile) ?? "auntie_dottie",
            target_run_id: asNonEmptyString(args.target_run_id ?? args.targetRunId) ?? "unknown",
            target_agent_id: "agent:helix_ask",
            target_turn_id: null,
            thread_id: asNonEmptyString(args.thread_id ?? args.threadId),
            voice_mode: "voice_on_confirm",
            max_chars: 220,
            event_filter: [HELIX_AGENT_COMMENTARY_SCHEMA],
            status: "detached",
            authority: "witness_only",
            can_execute_tools: false,
            assistant_answer: false,
            raw_reasoning_included: false,
          };
      dottieObserverSubscriptions.set(observerId, subscription);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "dottie_observer_subscription_receipt",
          ok: true,
          subscription,
          deterministic_content_role: "observation_not_assistant_answer",
          raw_reasoning_included: false,
        },
        message: `Detached observer ${observerId}.`,
      };
    }

    if (actionId === "observer.query") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId);
      const targetRunId = asNonEmptyString(args.target_run_id ?? args.targetRunId);
      const observerProfile = asNonEmptyString(args.observer_profile ?? args.observerProfile);
      const subscriptions = Array.from(dottieObserverSubscriptions.values()).filter((subscription) => {
        if (threadId && subscription.thread_id !== threadId) return false;
        if (targetRunId && subscription.target_run_id !== targetRunId) return false;
        if (observerProfile && subscription.observer_profile !== observerProfile) return false;
        return true;
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "dottie_observer_query_receipt",
          ok: true,
          subscriptions,
          count: subscriptions.length,
          deterministic_content_role: "observation_not_assistant_answer",
          raw_reasoning_included: false,
        },
        message: `Found ${subscriptions.length} observer subscription${subscriptions.length === 1 ? "" : "s"}.`,
      };
    }

    if (actionId === "voice_delivery.propose_from_trace") {
      const sourceEventId = asNonEmptyString(args.source_event_id ?? args.sourceEventId);
      if (!sourceEventId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.voice_delivery.propose_from_trace requires source_event_id.",
        };
      }
      const sourceText = asNonEmptyString(args.source_text ?? args.sourceText);
      const observerId = asNonEmptyString(args.observer_id ?? args.observerId) ?? "observer:dottie:unassigned";
      if (!sourceText) {
        const suppressedReceipt = {
          kind: "dottie_voice_receipt",
          schema: HELIX_DOTTIE_VOICE_RECEIPT_SCHEMA,
          observer_id: observerId,
          source_event_id: sourceEventId,
          source_event_schema: asNonEmptyString(args.source_event_schema ?? args.sourceEventSchema) ?? HELIX_AGENT_COMMENTARY_SCHEMA,
          spoken: false,
          assistant_answer: false,
          authority: "witness_only",
          suppression_reason: "missing_source_text",
          deterministic_content_role: "observation_not_assistant_answer",
          raw_reasoning_included: false,
        };
        recordDottieVoiceDebugClip({
          receipt: suppressedReceipt,
          voiceMode: asNonEmptyString(args.voice_mode ?? args.voiceMode),
          status: "suppressed",
          suppressionReason: "missing_source_text",
        });
        return {
          ok: true,
          panel_id: panelId,
          action_id: actionId,
          artifact: suppressedReceipt,
          message: "Dottie voice proposal suppressed because no public source text was provided.",
        };
      }
      const receipt = buildDottieVoiceReceipt({
        observer_id: observerId,
        target_agent_id: asNonEmptyString(args.target_agent_id ?? args.targetAgentId),
        target_turn_id: asNonEmptyString(args.target_turn_id ?? args.targetTurnId),
        source_event_id: sourceEventId,
        source_event_schema: asNonEmptyString(args.source_event_schema ?? args.sourceEventSchema),
        source_text: sourceText,
        max_chars: boundedDottieMaxChars(args.max_chars ?? args.maxChars),
        spoken: false,
      });
      recordDottieVoiceDebugClip({
        receipt,
        voiceMode: asNonEmptyString(args.voice_mode ?? args.voiceMode),
        status: "proposed",
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "dottie_voice_receipt",
          ok: true,
          proposed: true,
          ...receipt,
          deterministic_content_role: "observation_not_assistant_answer",
        },
        message: "Prepared a witness-only Dottie voice proposal from the source event.",
      };
    }

    if (actionId === "create_live_workstation_pipeline") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const objective =
        asNonEmptyString(args.objective) ??
        "Create a live workstation pipeline.";
      const request = {
        thread_id: threadId,
        objective,
        source_ids: Array.from(new Set([
          ...asStringArray(args.source_ids ?? args.sourceIds),
          ...asStringArray(args.source_id ?? args.sourceId),
        ])),
        environment_id: asNonEmptyString(args.environment_id ?? args.environmentId) ?? undefined,
        mode: asNonEmptyString(args.mode) ?? "text_only",
        line_schema: Array.isArray(args.line_schema) ? args.line_schema : undefined,
      };
      postLiveWorkstationPipeline(request);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_workstation_pipeline_receipt",
          ok: true,
          request,
          context_policy: "compact_context_pack_only",
          raw_logs_included: false,
          raw_transcript_included: false,
          deterministic_content_role: "observation_not_assistant_answer",
        },
        message: `Created a live workstation pipeline for ${objective}.`,
      };
    }

    if (
      actionId === "pause_live_workstation_pipeline" ||
      actionId === "resume_live_workstation_pipeline" ||
      actionId === "stop_live_workstation_pipeline" ||
      actionId === "set_pipeline_transform" ||
      actionId === "set_pipeline_sink" ||
      actionId === "attach_pipeline_to_live_answer_environment"
    ) {
      const pipelineId = asNonEmptyString(args.pipeline_id ?? args.pipelineId);
      if (!pipelineId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: `${actionId} requires pipeline_id.`,
        };
      }
      const actionPath =
        actionId === "pause_live_workstation_pipeline"
          ? "pause"
          : actionId === "resume_live_workstation_pipeline"
            ? "resume"
            : actionId === "stop_live_workstation_pipeline"
              ? "stop"
              : null;
      if (actionPath) {
        postLiveEnvironmentControl(`/api/agi/situation/live-workstation-pipeline/${encodeURIComponent(pipelineId)}/${actionPath}`);
      }
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_workstation_pipeline_receipt",
          ok: true,
          pipeline_id: pipelineId,
          request: args,
          raw_logs_included: false,
          raw_transcript_included: false,
          context_policy: "compact_context_pack_only",
        },
        message: `Queued ${actionId.replace(/_/g, " ")} for ${pipelineId}.`,
      };
    }

    if (
      actionId === "pause_live_answer_environment" ||
      actionId === "resume_live_answer_environment" ||
      actionId === "stop_live_answer_environment" ||
      actionId === "set_live_line_schema" ||
      actionId === "set_live_answer_line_schema" ||
      actionId === "attach_live_source"
    ) {
      const environmentId = asNonEmptyString(args.environment_id ?? args.environmentId);
      if (!environmentId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: `${actionId} requires environment_id.`,
        };
      }
      if (actionId === "pause_live_answer_environment") {
        postLiveEnvironmentControl(`/api/agi/situation/live-answer-environment/${encodeURIComponent(environmentId)}/pause`);
      } else if (actionId === "resume_live_answer_environment") {
        postLiveEnvironmentControl(`/api/agi/situation/live-answer-environment/${encodeURIComponent(environmentId)}/resume`);
      } else if (actionId === "stop_live_answer_environment") {
        postLiveEnvironmentControl(`/api/agi/situation/live-answer-environment/${encodeURIComponent(environmentId)}/stop`);
      } else if (actionId === "set_live_line_schema" || actionId === "set_live_answer_line_schema") {
        postLiveEnvironmentControl(`/api/agi/situation/live-answer-environment/${encodeURIComponent(environmentId)}/line-schema`, {
          line_schema: Array.isArray(args.line_schema) ? args.line_schema : [],
        });
      } else {
        const sourceId = asNonEmptyString(args.source_id ?? args.sourceId);
        postLiveEnvironmentControl("/api/agi/situation/live-source/event", {
          source_id: sourceId ?? "source:manual-feed",
          environment_id: environmentId,
          thread_id: asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop",
          kind: asNonEmptyString(args.kind) ?? asNonEmptyString(args.source_family) ?? "manual_feed",
          panel_id: asNonEmptyString(args.panel_id) ?? panelId,
          event_type: "source_attached",
          payload: {
            attached: true,
            source_id: sourceId ?? "source:manual-feed",
          },
          evidence_refs: [`live_answer_environment:${environmentId}:source_attached`],
        });
      }
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: actionId === "attach_live_source" ? "workstation_live_source_receipt" : "live_answer_environment_receipt",
          ok: true,
          environment_id: environmentId,
          request: args,
          deterministic: true,
          model_invoked: false,
          context_role: "observation_not_assistant_answer",
        },
        message: `Queued ${actionId.replace(/_/g, " ")} for ${environmentId}.`,
      };
    }

    if (
      actionId === "live-source.set_rate" ||
      actionId === "pause_live_source" ||
      actionId === "resume_live_source" ||
      actionId === "stop_live_source" ||
      actionId === "set_live_source_tick_rate"
    ) {
      const sourceId = asNonEmptyString(args.source_id ?? args.sourceId);
      if (!sourceId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: `${actionId} requires source_id.`,
        };
      }
      if (actionId === "live-source.set_rate") {
        const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
        const cadenceMs = typeof args.cadence_ms === "number" ? args.cadence_ms : 15_000;
        const captureMode = asNonEmptyString(args.capture_mode ?? args.captureMode) ?? "interval";
        postLiveEnvironmentControl("/api/agi/situation/live-source/producer/set-cadence", {
          source_id: sourceId,
          producer_id: asNonEmptyString(args.producer_id ?? args.producerId) ?? undefined,
          thread_id: threadId,
          environment_id: asNonEmptyString(args.environment_id ?? args.environmentId) ?? undefined,
          pipeline_id: asNonEmptyString(args.pipeline_id ?? args.pipelineId) ?? undefined,
          modality: asNonEmptyString(args.modality) ?? "visual_frame",
          capture_mode: captureMode,
          cadence_ms: cadenceMs,
          client_stream_confirmed: args.client_stream_confirmed === true,
        });
        return {
          ok: true,
          panel_id: panelId,
          action_id: actionId,
          artifact: {
            kind: "visual_producer_cadence_receipt",
            schema: "helix.visual_producer_cadence_receipt.v1",
            ok: true,
            action_id: "situation-room.live-source.set_rate",
            source_id: sourceId,
            producer_id: asNonEmptyString(args.producer_id ?? args.producerId) ?? null,
            thread_id: threadId,
            cadence_ms: cadenceMs,
            capture_mode: captureMode,
            raw_content_included: false,
            assistant_answer: false,
            context_policy: "compact_context_pack_only",
          },
          message: `Queued visual source cadence ${Math.round(cadenceMs / 1000)}s for ${sourceId}.`,
        };
      }
      const actionPath =
        actionId === "pause_live_source"
          ? "pause"
          : actionId === "resume_live_source"
            ? "resume"
            : actionId === "stop_live_source"
              ? "stop"
              : "tick-rate";
      postLiveEnvironmentControl(`/api/agi/situation/live-source/${encodeURIComponent(sourceId)}/${actionPath}`, {
        tick_rate_ms: typeof args.tick_rate_ms === "number" ? args.tick_rate_ms : undefined,
      });
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "workstation_live_source_receipt",
          ok: true,
          source_id: sourceId,
          action_id: actionId,
          thread_id: asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop",
          raw_logs_included: false,
          context_policy: "compact_context_pack_only",
        },
        message: `Queued ${actionId.replace(/_/g, " ")} for ${sourceId}.`,
      };
    }

    if (actionId === "mission_memory.refresh") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const body = {
        thread_id: threadId,
        room_id: asNonEmptyString(args.room_id ?? args.roomId) ?? null,
        session_id: asNonEmptyString(args.session_id ?? args.sessionId) ?? null,
      };
      postSituationMissionMemoryRefresh(body);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "mission_memory_update",
          ok: true,
          request: body,
          deterministic: true,
          model_invoked: false,
          context_policy: "compact_context_only",
        },
        message: "Requested a compact mission memory refresh.",
      };
    }

    if (actionId === "interjection_investigator.review_latest") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const body = {
        thread_id: threadId,
        trigger: asNonEmptyString(args.trigger) ?? "manual_review",
        room_id: asNonEmptyString(args.room_id ?? args.roomId) ?? null,
        session_id: asNonEmptyString(args.session_id ?? args.sessionId) ?? null,
      };
      postInterjectionInvestigation(body);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "interjection_decision",
          ok: true,
          request: body,
          deterministic_gate: true,
          model_invoked: false,
          allowed_outputs: ["silent_keep_in_context", "show_text", "voice_on_confirm", "request_user_input"],
        },
        message: "Requested deterministic interjection review for the latest mission state.",
      };
    }

    if (
      actionId === "episode_timeline.summarize_window" ||
      actionId === "situation_context.attach_to_ask" ||
      actionId.startsWith("goal_ledger.") ||
      actionId === "callout_policy.set_mode" ||
      actionId === "voice_delivery.confirm_speak"
    ) {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind:
            actionId === "episode_timeline.summarize_window"
              ? "situation_episode_summary"
              : actionId === "situation_context.attach_to_ask"
                ? "situation_context_pack"
                : actionId.startsWith("goal_ledger.")
                  ? "situation_goal_ledger_receipt"
                  : actionId === "callout_policy.set_mode"
                    ? "standby_callout_policy_receipt"
                    : "standby_callout_delivery_receipt",
          ok: true,
          thread_id: threadId,
          request: args,
          command_lane_enabled: false,
          minecraft_actions_enabled: false,
        },
        message: `Recorded ${actionId} as a bounded Situation Room tool request.`,
      };
    }
  }

  if (panelId === "workstation-clipboard-history") {
    const args = asRecord(request.args) ?? {};
    const clipboardState = useWorkstationClipboardStore.getState();
    if (actionId === "read_clipboard") {
      const latest = clipboardState.receipts[0] ?? null;
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        void navigator.clipboard
          .readText()
          .then((text) => {
            recordClipboardReceipt({
              direction: "read",
              text,
              source: "workstation-clipboard-history.read_clipboard",
            });
          })
          .catch(() => undefined);
      }
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          text: latest?.text ?? "",
          receipt_id: latest?.id ?? null,
          source: latest ? "history" : "empty",
        },
      };
    }

    if (actionId === "write_clipboard") {
      const text = asNonEmptyString(args.text ?? args.content ?? args.value);
      if (!text) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-clipboard-history.write_clipboard requires text.",
        };
      }
      const source = asNonEmptyString(args.source) ?? "workstation-clipboard-history.write_clipboard";
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(text).catch(() => undefined);
      }
      recordClipboardReceipt({
        direction: "write",
        text,
        source,
      });
      const latest = useWorkstationClipboardStore.getState().receipts[0] ?? null;
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          text,
          receipt_id: latest?.id ?? null,
          direction: "write",
        },
      };
    }

    if (actionId === "clear_history") {
      const confirmationResult = requireConfirmation(
        request,
        panelId,
        actionId,
        "workstation-clipboard-history.clear_history",
      );
      if (confirmationResult) return confirmationResult;
      const cleared = clipboardState.receipts.length;
      clipboardState.clearReceipts();
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          cleared_count: cleared,
          remaining_count: 0,
        },
      };
    }

    if (actionId === "copy_receipt_to_clipboard") {
      const requestedReceiptId = asNonEmptyString(args.receipt_id);
      const receipt =
        (requestedReceiptId
          ? clipboardState.receipts.find((entry) => entry.id === requestedReceiptId)
          : clipboardState.receipts[0]) ?? null;
      if (!receipt) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No clipboard receipt available to copy.",
        };
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(receipt.text).catch(() => undefined);
      }
      recordClipboardReceipt({
        direction: "write",
        text: receipt.text,
        source: "workstation-clipboard-history.copy_receipt_to_clipboard",
        meta: { from_receipt_id: receipt.id },
      });
      const latest = useWorkstationClipboardStore.getState().receipts[0] ?? null;
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          from_receipt_id: receipt.id,
          to_receipt_id: latest?.id ?? null,
          text: receipt.text,
        },
      };
    }

    if (actionId === "copy_receipt_to_note") {
      const requestedReceiptId = asNonEmptyString(args.receipt_id);
      const receipt =
        (requestedReceiptId
          ? clipboardState.receipts.find((entry) => entry.id === requestedReceiptId)
          : clipboardState.receipts[0]) ?? null;
      if (!receipt) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No clipboard receipt available to append to a note.",
        };
      }
      const noteLookup: Record<string, unknown> = {
        note_id: args.note_id,
        title: args.note_title ?? args.title,
      };
      let noteId = resolveNoteId(noteLookup, { allowActiveFallback: true });
      if (!noteId) {
        const notesSnapshot = useWorkstationNotesStore.getState();
        const created = notesSnapshot.upsertWorkflowNote({
          id: buildDeterministicNoteId("Untitled note", Object.keys(notesSnapshot.notes)),
          title: "Untitled note",
          topic: "clipboard",
          body: "",
          citations: [],
          snippets: [],
        });
        noteId = created.id;
      }
      const notesState = useWorkstationNotesStore.getState();
      const current = notesState.notes[noteId];
      const nextBody = current?.body
        ? `${current.body.replace(/\s+$/g, "")}\n${receipt.text}`
        : receipt.text;
      notesState.updateNoteBody(noteId, nextBody);
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          from_receipt_id: receipt.id,
          appended_text: receipt.text,
          body_length: useWorkstationNotesStore.getState().notes[noteId]?.body.length ?? nextBody.length,
        },
      };
    }

    if (actionId === "copy_selection_to_note") {
      const selectionText =
        typeof window !== "undefined" && typeof window.getSelection === "function"
          ? window.getSelection()?.toString().trim() ?? ""
          : "";
      const fallbackReceipt = clipboardState.receipts[0] ?? null;
      const text = selectionText || fallbackReceipt?.text || "";
      if (!text.trim()) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No selected text or clipboard receipt available to copy into note.",
        };
      }
      if (selectionText) {
        recordClipboardReceipt({
          direction: "copy",
          text: selectionText,
          source: "workstation-clipboard-history.copy_selection_to_note",
        });
      }
      const noteLookup: Record<string, unknown> = {
        note_id: args.note_id,
        title: args.note_title ?? args.title,
      };
      let noteId = resolveNoteId(noteLookup, { allowActiveFallback: true });
      if (!noteId) {
        const notesSnapshot = useWorkstationNotesStore.getState();
        const created = notesSnapshot.upsertWorkflowNote({
          id: buildDeterministicNoteId("Untitled note", Object.keys(notesSnapshot.notes)),
          title: "Untitled note",
          topic: "selection",
          body: "",
          citations: [],
          snippets: [],
        });
        noteId = created.id;
      }
      const notesState = useWorkstationNotesStore.getState();
      const current = notesState.notes[noteId];
      const nextBody = current?.body ? `${current.body.replace(/\s+$/g, "")}\n${text}` : text;
      notesState.updateNoteBody(noteId, nextBody);
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          appended_text: text,
          source: selectionText ? "selection" : "clipboard_receipt",
          body_length: useWorkstationNotesStore.getState().notes[noteId]?.body.length ?? nextBody.length,
        },
      };
    }
  }

  if (panelId === "theory-badge-graph") {
    const args = asRecord(request.args) ?? {};
    const graph = buildNhm2TheoryBadgeGraphV1();
    const badgesById = new Map(graph.badges.map((badge) => [badge.id, badge]));
    const incomingByTarget = new Map<string, typeof graph.edges>();
    const outgoingBySource = new Map<string, typeof graph.edges>();
    for (const edge of graph.edges) {
      incomingByTarget.set(edge.to, [...(incomingByTarget.get(edge.to) ?? []), edge]);
      outgoingBySource.set(edge.from, [...(outgoingBySource.get(edge.from) ?? []), edge]);
    }

    if (actionId === "open") {
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "theory_badge_graph_panel_receipt",
          graph_id: graph.graphId,
          badge_count: graph.badges.length,
          edge_count: graph.edges.length,
        },
      };
    }

    if (actionId === "list_physics_atlas" || actionId === "list_atlas_blocks") {
      const atlas = buildHelixPhysicsAtlasV1({ graph });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      const compactBlocks = atlas.blocks.map((block: PhysicsAtlasBlockV1) => ({
        id: block.id,
        title: block.title,
        glyph: block.glyph,
        status: block.status,
        subjects: block.subjects,
        primary_badge_ids: block.primaryBadgeIds,
        calculator_examples: block.calculatorExamples,
        runtime_actions: block.runtimeActions,
        claim_boundary_notes: block.claimBoundaryNotes,
      }));
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: actionId === "list_atlas_blocks" ? "physics_atlas_blocks" : "physics_atlas",
          schemaVersion: atlas.schemaVersion,
          artifact_v1: atlas,
          graph_id: graph.graphId,
          blocks: compactBlocks,
        },
      };
    }

    if (actionId === "select_atlas_block" || actionId === "focus_atlas_block") {
      const blockId = asPhysicsAtlasBlockId(args.block_id ?? args.blockId ?? args.atlas_block_id ?? args.atlasBlockId);
      if (!blockId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: `theory-badge-graph.${actionId} requires a valid atlas_block_id.`,
        };
      }
      const atlas = buildHelixPhysicsAtlasV1({ graph });
      const block = atlas.blocks.find((candidate: PhysicsAtlasBlockV1) => candidate.id === blockId);
      if (!block) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No atlas block lens matched the request.",
        };
      }
      const lens = resolvePhysicsAtlasLens({ graph, atlas, blockId });
      if (asBoolean(args.overlay) ?? true) {
        useTheoryBadgeGraphPanelStore.getState().setActiveAtlasLensId(blockId);
        useTheoryMapOverlayStore.getState().setSelectionOverlay({
          selectedBadgeIds: lens.centerBadgeIds,
          highlightedBadgeIds: lens.highlightedBadgeIds,
          highlightedEdgeIds: lens.highlightedEdgeIds,
          claimBoundaryNotes: lens.claimBoundaryNotes,
        });
        context.openPanel(panelId, undefined);
        context.focusPanel(panelId, undefined);
      }
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "physics_atlas_lens",
          graph_id: graph.graphId,
          block_id: blockId,
          block,
          lens,
          highlighted_badge_ids: lens.highlightedBadgeIds,
          highlighted_edge_ids: lens.highlightedEdgeIds,
          calculator_examples: lens.calculatorExamples,
          badge_count: lens.highlightedBadgeIds.length,
          edge_count: lens.highlightedEdgeIds.length,
          calculator_example_count: lens.calculatorExamples.length,
          claim_boundary_notes: lens.claimBoundaryNotes,
        },
      };
    }

    if (actionId === "locate_context") {
      const source =
        asNonEmptyString(args.source) === "scientific_calculator" ||
        asNonEmptyString(args.source) === "helix_ask" ||
        asNonEmptyString(args.source) === "playback"
          ? (asNonEmptyString(args.source) as "scientific_calculator" | "helix_ask" | "playback")
          : "manual";
      const locator = buildTheoryBadgeLocatorArtifact({
        graph,
        input: {
          query: asNonEmptyString(args.query ?? args.text ?? args.prompt) ?? undefined,
          expression: asNonEmptyString(args.expression) ?? undefined,
          subjects: asStringArray(args.subjects),
          symbols: asStringArray(args.symbols),
          unitSignatures: asStringArray(args.unit_signatures ?? args.unitSignatures),
          repoPaths: asStringArray(args.repo_paths ?? args.repoPaths),
          equationFamilies: asStringArray(args.equation_families ?? args.equationFamilies),
          simulationOwners: asStringArray(args.simulation_owners ?? args.simulationOwners),
          atlasBlockIds: asPhysicsAtlasBlockIds(
            args.atlas_block_ids ?? args.atlasBlockIds,
            args.atlas_block_id ?? args.atlasBlockId ?? args.block_id ?? args.blockId,
          ),
          source,
          limit: asNumber(args.limit) ?? undefined,
        },
      });
      if (asBoolean(args.overlay) ?? true) {
        useTheoryMapOverlayStore.getState().setLocatorOverlay(locator);
        context.openPanel(panelId, undefined);
        context.focusPanel(panelId, undefined);
      }
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "theory_badge_locator",
          schemaVersion: locator.schemaVersion,
          artifact_v1: locator,
          graph_id: graph.graphId,
          matches: locator.matches,
          overlay: locator.overlay,
          recommended_actions: locator.recommendedActions,
          claim_boundary_notes: locator.claimBoundaryNotes,
        },
      };
    }

    if (actionId === "lookup_badges") {
      const matches = locateTheoryBadges({
        graph,
        input: {
          query: asNonEmptyString(args.query ?? args.text ?? args.prompt) ?? undefined,
          subjects: asStringArray(args.subjects),
          symbols: asStringArray(args.symbols),
          unitSignatures: asStringArray(args.unit_signatures ?? args.unitSignatures),
          repoPaths: asStringArray(args.repo_paths ?? args.repoPaths),
          equationFamilies: asStringArray(args.equation_families ?? args.equationFamilies),
          simulationOwners: asStringArray(args.simulation_owners ?? args.simulationOwners),
          atlasBlockIds: asPhysicsAtlasBlockIds(
            args.atlas_block_ids ?? args.atlasBlockIds,
            args.atlas_block_id ?? args.atlasBlockId ?? args.block_id ?? args.blockId,
          ),
          limit: asNumber(args.limit) ?? undefined,
        },
      });
      const matchedBadges = matches
        .map((match) => badgesById.get(match.badgeId))
        .filter((entry): entry is TheoryBadgeV1 => Boolean(entry));
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "theory_badge_lookup",
          graph_id: graph.graphId,
          matches,
          claim_boundary_notes: claimBoundaryNotesForBadges(matchedBadges),
        },
      };
    }

    if (actionId === "get_badge_context") {
      const badgeId = asNonEmptyString(args.badge_id ?? args.badgeId ?? args.id);
      const badge = badgeId ? badgesById.get(badgeId) : null;
      if (!badgeId || !badge) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "theory-badge-graph.get_badge_context requires a valid badge_id.",
        };
      }
      const includeNeighbors = asBoolean(args.include_neighbors ?? args.includeNeighbors) ?? true;
      const includePayloads = asBoolean(args.include_payloads ?? args.includePayloads) ?? true;
      const upstreamBadges = includeNeighbors
        ? (incomingByTarget.get(badge.id) ?? [])
            .map((edge) => badgesById.get(edge.from))
            .filter((entry): entry is TheoryBadgeV1 => Boolean(entry))
        : [];
      const downstreamBadges = includeNeighbors
        ? (outgoingBySource.get(badge.id) ?? [])
            .map((edge) => badgesById.get(edge.to))
            .filter((entry): entry is TheoryBadgeV1 => Boolean(entry))
        : [];
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "theory_badge_context",
          graph_id: graph.graphId,
          badge,
          upstream_badges: upstreamBadges,
          downstream_badges: downstreamBadges,
          calculator_payloads: includePayloads ? badge.calculatorPayloads : [],
          units: badge.units,
          assumptions: badge.assumptions,
          source_refs: badge.sourceRefs,
          claim_boundary: badge.claimBoundary,
          claim_boundary_notes: claimBoundaryNotesForBadges([badge, ...upstreamBadges, ...downstreamBadges]),
        },
      };
    }

    if (actionId === "load_payloads_to_calculator") {
      const badgeId = asNonEmptyString(args.badge_id ?? args.badgeId);
      const badge = badgeId ? badgesById.get(badgeId) : null;
      if (!badgeId || !badge) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "theory-badge-graph.load_payloads_to_calculator requires a valid badge_id.",
        };
      }
      const requestedPayloadIds = asStringArray(args.payload_ids ?? args.payloadIds);
      const loadMode = asNonEmptyString(args.load_mode ?? args.loadMode) === "all" ? "all" : "primary";
      const selectedPayloads =
        requestedPayloadIds.length > 0
          ? badge.calculatorPayloads.filter((payload) => requestedPayloadIds.includes(payload.id))
          : loadMode === "all"
            ? badge.calculatorPayloads
            : badge.calculatorPayloads.slice(0, 1);
      const compoundRunId = asNonEmptyString(args.compound_run_id ?? args.compoundRunId);
      const scientificState = useScientificCalculatorStore.getState();
      const loadedPayloads = selectedPayloads.map((payload) => {
        scientificState.ingestLatex(payload.displayLatex || payload.expression, {
          sourcePath: `theory://${graph.graphId}/${badge.id}/${payload.id}`,
          anchor: payload.id,
          source: "workstation_action",
          calculatorSetup: payload.setupContext ?? null,
          compoundRunId,
          compoundSubgoalId: `${badge.id}:${payload.id}`,
        });
        return {
          badge_id: badge.id,
          payload_id: payload.id,
          expression: payload.expression,
          display_latex: payload.displayLatex,
        };
      });
      context.openPanel("scientific-calculator", undefined);
      context.focusPanel("scientific-calculator", undefined);
      return {
        ok: loadedPayloads.length > 0,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "theory_badge_calculator_loadout",
          graph_id: graph.graphId,
          badge_id: badge.id,
          loaded_payloads: loadedPayloads,
          calculator_focused: true,
        },
        message: loadedPayloads.length > 0 ? undefined : "No calculator payloads matched the request.",
      };
    }

    if (actionId === "trace_badges") {
      const badgeIds = asStringArray(args.badge_ids ?? args.badgeIds ?? args.ids);
      if (badgeIds.length === 0) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "theory-badge-graph.trace_badges requires badge_ids.",
        };
      }
      const trace = traceTheoryBadgeConnections({ graph, badgeIds });
      if (asBoolean(args.overlay) ?? true) {
        useTheoryMapOverlayStore.getState().setSelectionOverlay({
          selectedBadgeIds: trace.selectedBadgeIds,
          highlightedBadgeIds: trace.connectingBadgeIds,
          highlightedEdgeIds: trace.pathSegments.flatMap((segment) => segment.edgeIds),
          claimBoundaryNotes: trace.claimBoundaryNotes,
        });
      }
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: trace.selectedBadgeIds.length > 0,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "theory_badge_connection_trace",
          graph_id: graph.graphId,
          selected_badge_ids: trace.selectedBadgeIds,
          connecting_badge_ids: trace.connectingBadgeIds,
          connecting_edge_ids: trace.pathSegments.flatMap((segment) => segment.edgeIds),
          shared_ancestor_ids: trace.sharedAncestorIds,
          shared_subjects: trace.sharedSubjects,
          shared_symbols: trace.sharedSymbols,
          shared_unit_signatures: trace.sharedUnitSignatures,
          path_segments: trace.pathSegments,
          claim_boundary_notes: trace.claimBoundaryNotes,
          warnings: trace.warnings,
        },
      };
    }

    if (actionId === "clear_overlay") {
      useTheoryMapOverlayStore.getState().clearOverlay();
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "theory_badge_overlay_cleared",
          graph_id: graph.graphId,
        },
      };
    }

    if (
      actionId === "build_calculator_loadout" ||
      actionId === "load_calculator_loadout" ||
      actionId === "solve_calculator_loadout"
    ) {
      const loadout = buildTheoryLoadoutFromActionArgs(args, graph);
      if (loadout.targetBadgeIds.length === 0) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: `${panelId}.${actionId} requires badge_ids, badge_id, target_badge_id, or a valid loadout.`,
        };
      }
      if (actionId === "build_calculator_loadout") {
        return {
          ok: true,
          panel_id: panelId,
          action_id: actionId,
          artifact: {
            kind: "theory_calculator_loadout",
            artifact_v1: loadout,
            graph_id: graph.graphId,
            scalar_count: loadout.summary.scalarCount,
            context_count: loadout.summary.contextCount,
            claim_boundary_notes: loadout.claimBoundaryNotes,
          },
        };
      }

      const scientificState = useScientificCalculatorStore.getState();
      scientificState.setTheoryLoadout(loadout);
      const firstScalar = loadout.items.find((item) => item.kind === "calculator_payload");
      if (firstScalar) scientificState.loadTheoryLoadoutItem(firstScalar.index);
      const solveScope = asNonEmptyString(args.solve_scope ?? args.solveScope) === "all_scalar_and_runtime"
        ? "all_scalar_and_runtime"
        : "all_scalar";
      const finalLoadout =
        actionId === "solve_calculator_loadout"
          ? solveTheoryCalculatorLoadoutNow(loadout, {
              solveScope,
              runRuntime: solveScope === "all_scalar_and_runtime",
            })
          : useScientificCalculatorStore.getState().lastTheoryLoadout ?? loadout;
      context.openPanel("scientific-calculator", undefined);
      context.focusPanel("scientific-calculator", undefined);
      return {
        ok: finalLoadout.summary.scalarCount > 0 || finalLoadout.summary.contextCount > 0,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: actionId === "solve_calculator_loadout" ? "theory_calculator_loadout_solve" : "theory_calculator_loadout_loaded",
          artifact_v1: finalLoadout,
          graph_id: graph.graphId,
          loaded_scalar_count: finalLoadout.summary.scalarCount,
          context_count: finalLoadout.summary.contextCount,
          solved_count: finalLoadout.summary.solvedCount,
          runtime_receipt_count: finalLoadout.summary.runtimeReceiptCount,
          failed_count: finalLoadout.summary.failedCount,
          claim_boundary_notes: finalLoadout.claimBoundaryNotes,
          calculator_focused: true,
        },
      };
    }

    if (actionId === "run_runtime_badge") {
      const badgeId = asNonEmptyString(args.badge_id ?? args.badgeId);
      const objectContext = asTheoryCalculatorObjectContext(args.object_context ?? args.objectContext);
      if (!badgeId || !badgesById.has(badgeId) || !objectContext) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "theory-badge-graph.run_runtime_badge requires a valid badge_id and object_context.",
        };
      }
      const receipt = runStarSimRuntimeBadge({
        badgeId,
        objectContext,
        includeRawEvaluation: asBoolean(args.include_raw_evaluation ?? args.includeRawEvaluation) ?? false,
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "starsim_runtime_receipt",
          artifact_v1: receipt,
          badge_id: badgeId,
          dominant_fusion_channel: receipt.outputSummary.dominantFusionChannel,
          fusion_zone_mode: receipt.outputSummary.fusionZoneMode,
          claim_boundary_notes: receipt.claimBoundaryNotes,
        },
      };
    }

    if (actionId === "run_badge_path") {
      const targetBadgeId = asNonEmptyString(args.target_badge_id ?? args.targetBadgeId ?? args.badge_id ?? args.badgeId);
      if (!targetBadgeId || !badgesById.has(targetBadgeId)) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "theory-badge-graph.run_badge_path requires a valid target_badge_id.",
        };
      }
      const playback = runTheoryBadgePlaybackNow({
        graph,
        targetBadgeId,
        source: "workstation_action",
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: playback.summary.ok,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "theory_badge_playback",
          graph_id: graph.graphId,
          target_badge_id: targetBadgeId,
          artifact_v1: playback,
          solved_count: playback.summary.solvedCount,
          skipped_count: playback.summary.skippedCount,
          failed_count: playback.summary.failedCount,
        },
      };
    }
  }

  if (panelId === "scientific-calculator") {
    const args = asRecord(request.args) ?? {};
    const scientificState = useScientificCalculatorStore.getState();
    const calculatorSetup = asCalculatorSetupContext(args.calculator_setup ?? args.setup_context ?? args.setup);
    const compoundRunId = asNonEmptyString(args.compound_run_id ?? args.run_id ?? args.turn_id);
    const compoundSubgoalId = asNonEmptyString(args.compound_subgoal_id ?? args.subgoal_id);

    if (actionId === "ingest_latex") {
      const rawLatex = asNonEmptyString(args.latex ?? args.expression ?? args.text);
      let latex = rawLatex === "$clipboard" ? rawLatex : resolveCalculatorActionLatex(rawLatex, calculatorSetup);
      if (rawLatex === "$clipboard" && typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        // Non-blocking clipboard fallback for deterministic action calls.
        void navigator.clipboard.readText().then((clipboardText) => {
          const trimmed = clipboardText.trim();
          if (!trimmed) return;
          scientificState.ingestLatex(trimmed, {
            sourcePath: "clipboard",
            anchor: null,
            source: "clipboard",
            calculatorSetup,
          });
          dispatchScientificCalculatorMathPicked({
            latex: trimmed,
            sourcePath: "clipboard",
          });
        });
      }
      if (!latex || latex === "$clipboard") {
        return {
          ok: rawLatex === "$clipboard",
          panel_id: panelId,
          action_id: actionId,
          message:
            rawLatex === "$clipboard"
              ? "Attempting clipboard ingest for scientific-calculator."
              : "scientific-calculator.ingest_latex requires a calculator expression, not prose.",
        };
      }
      const sourcePath = asNonEmptyString(args.source_path ?? args.path ?? args.source);
      const anchor = asNonEmptyString(args.anchor);
      const entry = scientificState.ingestLatex(latex, {
        sourcePath,
        anchor,
        source: "workstation_action",
        calculatorSetup,
        compoundRunId,
        compoundSubgoalId,
      });
      dispatchScientificCalculatorMathPicked({
        latex: entry.latex,
        sourcePath: entry.sourcePath,
        anchor: entry.anchor,
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      const latestDebugEvents = useScientificCalculatorStore.getState().debugEvents;
      const ingestDebugEvent =
        latestDebugEvents.find((event) => event.action_id === "ingest_latex" && event.source === "workstation_action") ??
        latestDebugEvents[0] ??
        null;
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          latex: entry.latex,
          source_path: entry.sourcePath,
          anchor: entry.anchor,
          calculator_setup: entry.calculatorSetup ?? null,
          history_id: entry.id,
          debug_event: ingestDebugEvent,
          debug_log_tail: buildScientificCalculatorDebugSnapshot(latestDebugEvents, 8),
        },
      };
    }

    if (actionId === "solve_expression" || actionId === "solve_with_steps") {
      const rawLatexArg = asNonEmptyString(args.latex ?? args.expression ?? args.text);
      const latexArg = resolveCalculatorActionLatex(rawLatexArg, calculatorSetup);
      if (rawLatexArg && !latexArg) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "scientific-calculator.solve_expression requires a calculator expression, not prose.",
        };
      }
      const latex = latexArg ?? scientificState.currentLatex;
      if (!latex.trim()) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No calculator input available to solve.",
        };
      }
      if (latexArg) {
        scientificState.ingestLatex(latexArg, {
          sourcePath: asNonEmptyString(args.source_path ?? args.path ?? args.source),
          anchor: asNonEmptyString(args.anchor),
          source: "workstation_action",
          calculatorSetup,
          compoundRunId,
          compoundSubgoalId,
        });
      }
      const solveResult = runScientificSolve(latex, actionId === "solve_with_steps");
      scientificState.setSolveResult(solveResult, {
        actionId: actionId === "solve_with_steps" ? "solve_with_steps" : "solve_expression",
        source: "workstation_action",
        calculatorSetup,
        compoundRunId,
        compoundSubgoalId,
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      const latestCalculatorState = useScientificCalculatorStore.getState();
      return {
        ok: solveResult.ok,
        panel_id: panelId,
        action_id: actionId,
        message: solveResult.ok ? undefined : solveResult.error ?? "Solve failed.",
        artifact: {
          mode: solveResult.mode,
          normalized_expression: solveResult.normalized_expression,
          result_text: solveResult.result_text,
          result_latex: solveResult.result_latex ?? "",
          calculator_setup: calculatorSetup,
          result_unit: calculatorSetup?.result_unit ?? null,
          result_quantity: calculatorSetup?.result_quantity ?? calculatorSetup?.quantity ?? null,
          result_dimension: calculatorSetup?.result_dimension ?? null,
          result_dimension_signature: calculatorSetup?.result_dimension_signature ?? null,
          unit_system: calculatorSetup?.unit_system ?? null,
          input_units: calculatorSetup?.input_units ?? null,
          unit_options: calculatorSetup?.unit_options ?? [],
          assumptions: calculatorSetup?.assumptions ?? [],
          variable: solveResult.variable,
          steps_count: solveResult.steps.length,
          steps: solveResult.steps,
          artifact_v1: solveResult.artifact_v1 ?? null,
          result_kind: solveResult.artifact_v1?.result.kind ?? null,
          confidence: solveResult.artifact_v1?.quality.confidence ?? null,
          fallback_reason: solveResult.artifact_v1?.quality.fallbackReason ?? null,
          trace: solveResult.trace,
          route: solveResult.trace.route,
          engine: solveResult.trace.engine,
          sourceOfTruth: solveResult.trace.sourceOfTruth,
          capabilityClass: solveResult.trace.capabilityClass,
          warnings: solveResult.trace.warnings,
          error: solveResult.error ?? null,
          debug_event: latestCalculatorState.debugEvents[0] ?? null,
          debug_log_tail: buildScientificCalculatorDebugSnapshot(latestCalculatorState.debugEvents, 8),
        },
      };
    }

    if (actionId === "copy_result") {
      const resultText = scientificState.lastSolve?.result_text?.trim();
      if (!resultText) {
        const debugEvent = scientificState.recordDebugEvent({
          action_id: "copy_result",
          source: "workstation_action",
          ok: false,
          message: "No calculator result available to copy.",
        });
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No calculator result available to copy.",
          artifact: {
            debug_event: debugEvent,
            debug_log_tail: buildScientificCalculatorDebugSnapshot(useScientificCalculatorStore.getState().debugEvents, 8),
          },
        };
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(resultText).catch(() => undefined);
      }
      const debugEvent = scientificState.recordDebugEvent({
        action_id: "copy_result",
        source: "workstation_action",
        ok: true,
        input_latex: scientificState.lastSolve?.input_latex,
        result_text: resultText,
        normalized_expression: scientificState.lastSolve?.normalized_expression,
        trace_id: scientificState.lastSolve?.trace.traceId ?? null,
        route: scientificState.lastSolve?.trace.route ?? null,
        engine: scientificState.lastSolve?.trace.engine ?? null,
        message: "result_copied",
      });
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          copied: true,
          text: resultText,
          trace: scientificState.lastSolve?.trace ?? null,
          debug_event: debugEvent,
          debug_log_tail: buildScientificCalculatorDebugSnapshot(useScientificCalculatorStore.getState().debugEvents, 8),
        },
      };
    }

    if (actionId === "copy_debug_log") {
      const beforeCopy = useScientificCalculatorStore.getState().debugEvents;
      const debugText = formatScientificCalculatorDebugLog(beforeCopy);
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(debugText).catch(() => undefined);
      }
      const debugEvent = scientificState.recordDebugEvent({
        action_id: "copy_debug_log",
        source: "workstation_action",
        ok: true,
        message: "debug_log_copied",
      });
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          copied: true,
          text: debugText,
          debug_event: debugEvent,
          debug_log_tail: buildScientificCalculatorDebugSnapshot(useScientificCalculatorStore.getState().debugEvents, 8),
        },
      };
    }

    if (actionId === "clear_workspace") {
      scientificState.clear({ source: "workstation_action" });
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          cleared: true,
          debug_event: useScientificCalculatorStore.getState().debugEvents[0] ?? null,
          debug_log_tail: buildScientificCalculatorDebugSnapshot(useScientificCalculatorStore.getState().debugEvents, 8),
        },
      };
    }

    if (
      actionId === "start_equation_live_source" ||
      actionId === "start_prime_stream" ||
      actionId === "restart_live_source" ||
      actionId === "stop_live_source" ||
      actionId === "emit_live_tick"
    ) {
      const liveSource = useScientificCalculatorLiveSourceStore.getState();
      const requestedEquation = asNonEmptyString(args.equation ?? args.latex ?? args.expression ?? args.text);
      const calculatorSetup = asCalculatorSetupContext(args.calculator_setup ?? args.setup_context ?? args.setup);
      const requestedEquationContext =
        asNonEmptyString(args.equation_context ?? args.equationContext ?? args.context) ??
        calculatorSetup?.subgoal ??
        null;
      const streamInput = {
        environmentId: asNonEmptyString(args.environment_id ?? args.environmentId),
        sourceId: asNonEmptyString(args.source_id ?? args.sourceId),
        tickRateMs: typeof args.tick_rate_ms === "number" ? args.tick_rate_ms : undefined,
        maxTicks: typeof args.max_ticks === "number" ? args.max_ticks : undefined,
        start: typeof args.start === "number" ? args.start : undefined,
      };
      if (actionId === "start_equation_live_source") {
        void liveSource.startEquationLiveSource({
          ...streamInput,
          equation: requestedEquation ? normalizeCalculatorActionLatex(requestedEquation) : undefined,
          equationContext: requestedEquationContext,
          calculatorSetup,
          mode: "current_equation",
        });
      } else if (actionId === "start_prime_stream") {
        void liveSource.startPrimeStream(streamInput);
      } else if (actionId === "restart_live_source") {
        void liveSource.restartPrimeStream();
      } else if (actionId === "stop_live_source") {
        liveSource.stopPrimeStream();
      } else {
        void liveSource.emitNextTick();
      }
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      const latestLiveSource = useScientificCalculatorLiveSourceStore.getState();
      const latestPayload =
        latestLiveSource.latestTick?.payload && typeof latestLiveSource.latestTick.payload === "object"
          ? latestLiveSource.latestTick.payload as Record<string, unknown>
          : null;
      return {
        ok: latestLiveSource.status !== "error",
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "workstation_live_source_receipt",
          mode: actionId === "start_equation_live_source" ? "current_equation" : latestLiveSource.mode,
          source_id: latestLiveSource.sourceId || streamInput.sourceId || null,
          environment_id: latestLiveSource.environmentId || streamInput.environmentId || null,
          status: latestLiveSource.status,
          seq: latestLiveSource.mode === "current_equation" ? latestLiveSource.equationState.seq : latestLiveSource.state.seq,
          requested_equation: requestedEquation ? normalizeCalculatorActionLatex(requestedEquation) : null,
          source_equation: latestLiveSource.sourceEquation || (requestedEquation ? normalizeCalculatorActionLatex(requestedEquation) : null),
          equation_context: latestLiveSource.equationContext || requestedEquationContext || null,
          latest_result_text: typeof latestPayload?.result_text === "string" ? latestPayload.result_text : null,
          latest_tick: latestLiveSource.latestTick,
          live_workbench_expression: latestLiveSource.liveWorkbenchExpression,
          live_solve_steps: latestLiveSource.liveSolveSteps,
          active_live_step_id: latestLiveSource.activeLiveStepId,
          calculator_setup: latestLiveSource.calculatorSetup ?? calculatorSetup ?? null,
          result_unit: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.result_unit ?? null,
          result_quantity: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.result_quantity ?? (latestLiveSource.calculatorSetup ?? calculatorSetup)?.quantity ?? null,
          result_dimension: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.result_dimension ?? null,
          result_dimension_signature: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.result_dimension_signature ?? null,
          unit_system: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.unit_system ?? null,
          input_units: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.input_units ?? null,
          unit_options: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.unit_options ?? [],
          assumptions: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.assumptions ?? [],
          evidence_refs: latestLiveSource.latestTick
            ? [`calculator:live:${latestLiveSource.latestTick.trace.calculator_trace_id}`]
            : requestedEquation
              ? [`calculator:requested:${normalizeCalculatorActionLatex(requestedEquation)}`]
              : [],
          deterministic: true,
          model_invoked: false,
          context_role: "observation_not_assistant_answer",
          debug_log_tail: latestLiveSource.debugLog.slice(0, 12),
        },
      };
    }
  }

  if (!getPanelDef(panelId)) {
    return {
      ok: false,
      panel_id: panelId,
      action_id: actionId,
      message: `Unknown panel: ${panelId}`,
    };
  }

  return {
    ok: false,
    panel_id: panelId,
    action_id: actionId,
    message: `Action not supported for panel: ${panelId}.${actionId}`,
  };
}
