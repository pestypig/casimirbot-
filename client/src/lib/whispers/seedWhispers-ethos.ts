import type { WhisperSeed } from "./seedWhispers";
import { normalizeHash } from "./hashes";

type SeedContext = Parameters<WhisperSeed["when"]>[0];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const near = (value: number | undefined, target: number, epsilon = 5e-3) =>
  typeof value === "number" && Math.abs(value - target) <= epsilon;

const toNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const hasAnyHash = (ctx: SeedContext, ...hashes: string[]) => {
  const canonical = ctx.hash;
  return hashes.some((hash) => canonical === normalizeHash(hash));
};

const getConcurrentSectors = (ctx: SeedContext) =>
  toNumber(ctx.pipeline?.concurrentSectors ?? ctx.pipeline?.sectorsConcurrent ?? ctx.pipeline?.sectorStrobing);

const getTsRatio = (ctx: SeedContext) => toNumber(ctx.energy?.tsRatio);
const getZeta = (ctx: SeedContext) => toNumber(ctx.energy?.zeta);
const getDuty = (ctx: SeedContext) => toNumber(ctx.energy?.dutyEffectiveFR ?? ctx.pipeline?.dutyEffectiveFR);
const getTauLcMs = (ctx: SeedContext) => toNumber(ctx.pipeline?.tau_LC_ms);
const getBurstMs = (ctx: SeedContext) => toNumber(ctx.pipeline?.burst_ms);
const getPhaseWindows = (ctx: SeedContext) => toNumber(ctx.sweep?.phaseWindows);
const getSubThresholdMargin = (ctx: SeedContext) => toNumber(ctx.sweep?.subThresholdMargin);
const hasLinewidthCollapse = (ctx: SeedContext) => Boolean((ctx.sweep as { jitterCollapse?: boolean } | undefined)?.jitterCollapse);
const getSectorCount = (ctx: SeedContext) =>
  toNumber(
    ctx.energy?.sectorCount ??
      ctx.pipeline?.sectorCount ??
      ctx.pipeline?.sectors ??
      ctx.pipeline?.sectorsTotal ??
      ctx.spectrum?.sectors,
  );
const getGammaGeoValue = (ctx: SeedContext) =>
  toNumber(ctx.energy?.gammaGeo ?? ctx.pipeline?.gammaGeo ?? ctx.spectrum?.gamma_geo);
const getGammaVdB = (ctx: SeedContext) => toNumber(ctx.energy?.gammaVanDenBroeck ?? ctx.pipeline?.gammaVanDenBroeck);
const getQMechanical = (ctx: SeedContext) => toNumber(ctx.pipeline?.qMechanical);
const getEtaDce = (ctx: SeedContext) => toNumber(ctx.spectrum?.etaDCE);
const getSpectrumDuty = (ctx: SeedContext) => toNumber(ctx.spectrum?.duty ?? ctx.energy?.dutyEffectiveFR);
const getSpectrumSectors = (ctx: SeedContext) => toNumber(ctx.spectrum?.sectors ?? ctx.energy?.sectorCount);
const getAEff = (ctx: SeedContext) => toNumber(ctx.spectrum?.a_eff_nm);
const isGeometryView = (ctx: SeedContext) => Boolean(ctx.spectrum?.showGeom);
const isDceView = (ctx: SeedContext) => Boolean(ctx.spectrum?.showDCE);
const hasGuardClip = (ctx: SeedContext) => Boolean((ctx.sweep as { clipped?: boolean } | undefined)?.clipped);
const getTimelineTs = (ctx: SeedContext) => getTsRatio(ctx) ?? safeRatio(getTauLcMs(ctx), getBurstMs(ctx));
const getEpsilon = (ctx: SeedContext) => safeRatio(getBurstMs(ctx), getTauLcMs(ctx));

const safeRatio = (numerator: number | undefined, denominator: number | undefined) =>
  typeof numerator === "number" && typeof denominator === "number" && denominator !== 0 ? numerator / denominator : undefined;

export const ETHOS_SEEDS: WhisperSeed[] = [
  {
    id: "H-E1",
    hashes: ["#mode-switch"],
    tone: "quiet",
    mode: "speak",
    title: "Choose the garden you tend.",
    body:
      "Mode only changes how we sample, not what the physics allows. Duty and TS stay governed by light-crossing and sectoring; averages still feed the proxy.",
    when: (ctx) => hasAnyHash(ctx, "#mode-switch") && Boolean(ctx.pipeline?.currentMode),
    score: (ctx) => {
      const mode = String(ctx.pipeline?.currentMode ?? "").toLowerCase();
      const weights: Record<string, number> = {
        standby: 0.2,
        hover: 0.4,
        taxi: 0.55,
        nearzero: 0.75,
        cruise: 0.85,
        emergency: 1,
      };
      const weight = weights[mode] ?? 0.5;
      return 0.55 + 0.35 * clamp01(weight);
    },
  },
  {
    id: "H-E2",
    hashes: ["#light-speed-timeline"],
    tone: "quiet",
    mode: "both",
    title: "Let light cross more than once.",
    body:
      "With TS >> 1, GR hears cycle-averaged sources. Keep pulse width << light-crossing to stay in the high-frequency limit.",
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#light-speed-timeline")) return false;
      const ts = getTimelineTs(ctx);
      return typeof ts === "number" && ts >= 10;
    },
    score: (ctx) => {
      const ts = getTimelineTs(ctx);
      if (typeof ts !== "number") return 0.6;
      return 0.6 + 0.3 * clamp01(Math.min(ts, 200) / 200);
    },
  },
  {
    id: "H-E3",
    hashes: ["#time-lapse-demo"],
    tone: "celebrate",
    mode: "bubble",
    title: "Blur the flicker into law.",
    body:
      "Small epsilon means many updates per light-crossing. That legitimizes replacing instantaneous rho with rho_bar in the equations.",
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#time-lapse-demo")) return false;
      const epsilon = getEpsilon(ctx);
      return typeof epsilon === "number" && epsilon <= 0.05;
    },
    score: (ctx) => {
      const epsilon = getEpsilon(ctx);
      if (typeof epsilon !== "number") return 0.6;
      return 0.65 + 0.25 * clamp01(Math.max(0, 0.05 - epsilon) / 0.05);
    },
  },
  {
    id: "FC-E1",
    hashes: ["#fractional-coherence-rail"],
    tone: "quiet",
    mode: "both",
    title: "Coherence is a budget.",
    body:
      "Spread effort over sectors: d_eff = d_local / S. Same total intent, safer instantaneous samples.",
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#fractional-coherence-rail")) return false;
      const duty = getDuty(ctx);
      const sectors = getSectorCount(ctx);
      return typeof duty === "number" && typeof sectors === "number" && sectors >= 100;
    },
    score: (ctx) => {
      const duty = getDuty(ctx) ?? 6e-5;
      const sectors = getSectorCount(ctx) ?? 100;
      const dutyScore = clamp01(Math.max(0, 6e-5 - duty) / 6e-5);
      const sectorScore = clamp01(Math.max(0, sectors - 100) / 200);
      return 0.6 + 0.25 * (0.4 * dutyScore + 0.6 * sectorScore);
    },
  },
  {
    id: "FC-E2",
    hashes: ["#fractional-coherence-grid"],
    tone: "celebrate",
    mode: "bubble",
    title: "Many small hands move a mountain.",
    body:
      "High S keeps Ford-Roman satisfied while pocket gain tracks with geometry and Q.",
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#fractional-coherence-grid")) return false;
      const duty = getDuty(ctx);
      const sectors = getSectorCount(ctx);
      if (typeof duty !== "number" || typeof sectors !== "number") return false;
      if (sectors < 200 || duty > 3e-5) return false;
      const gamma = getGammaVdB(ctx);
      return typeof gamma !== "number" || (gamma >= 1e5 && gamma <= 1e6);
    },
    score: (ctx) => {
      const duty = getDuty(ctx) ?? 2.5e-5;
      const sectors = getSectorCount(ctx) ?? 200;
      const gamma = getGammaVdB(ctx);
      const dutyScore = clamp01(Math.max(0, 3e-5 - duty) / 3e-5);
      const sectorScore = clamp01(Math.max(0, sectors - 200) / 200);
      const gammaScore =
        typeof gamma === "number"
          ? clamp01((Math.min(Math.max(gamma, 1e5), 1e6) - 1e5) / 9e5)
          : 0.6;
      return 0.6 + 0.3 * (0.4 * dutyScore + 0.4 * sectorScore + 0.2 * gammaScore);
    },
  },
  {
    id: "G-E1",
    hashes: ["#warp-shell"],
    tone: "quiet",
    mode: "bubble",
    title: "Shape first, then push.",
    body:
      "Concavity sets gamma_geo = a / a_eff. Move cutoff with geometry; everything else only reshapes lines.",
    when: (ctx) => hasAnyHash(ctx, "#warp-shell") && typeof getGammaGeoValue(ctx) === "number",
    score: (ctx) => {
      const gamma = getGammaGeoValue(ctx) ?? 20;
      return 0.6 + 0.3 * clamp01(Math.min(gamma, 60) / 60);
    },
  },
  {
    id: "G-E2",
    hashes: ["#light-speed-timeline"],
    tone: "celebrate",
    mode: "speak",
    title: "Let the cone homogenize.",
    body:
      "Once light outruns actuation, averaging is legit and the curvature proxy is defensible.",
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#light-speed-timeline")) return false;
      const ts = getTimelineTs(ctx);
      return typeof ts === "number" && ts >= 25;
    },
    score: (ctx) => {
      const ts = getTimelineTs(ctx) ?? 25;
      return 0.65 + 0.3 * clamp01(Math.min(ts - 25, 150) / 150);
    },
  },
  {
    id: "S-E1",
    hashes: ["#drive-guards", "#ledger-step-b"],
    tone: "warn",
    mode: "both",
    title: "Enough is enough.",
    body:
      "You're within 10% of the QI envelope. Raise sectors or lower duty; keep zeta <= 1.",
    action: "Open ledger (Step B)",
    deepen: [{ label: "Ledger - Step B", href: "/warp#step-b" }],
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#drive-guards", "#ledger-step-b")) return false;
      const duty = getDuty(ctx);
      if (typeof duty !== "number") return false;
      const ratio = duty / 3e-5;
      return ratio >= 0.9;
    },
    score: (ctx) => {
      const duty = getDuty(ctx) ?? 3e-5;
      const ratio = duty / 3e-5;
      return 0.6 + 0.35 * clamp01((ratio - 0.9) / 0.4);
    },
  },
  {
    id: "S-E2",
    hashes: ["#energy-control"],
    tone: "quiet",
    mode: "bubble",
    title: "Presence before action.",
    body:
      "Hold q <= 1, keep gamma_VdB in band, and let the solver nudge d_eff before touching Q.",
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#energy-control")) return false;
      const gamma = getGammaVdB(ctx);
      const q = getQMechanical(ctx);
      if (typeof gamma === "number" && (gamma < 1e5 || gamma > 1e6)) return false;
      return typeof q !== "number" || q <= 1;
    },
    score: (ctx) => {
      const gamma = getGammaVdB(ctx) ?? 1e5;
      const q = getQMechanical(ctx) ?? 1;
      const gammaScore = clamp01((Math.min(Math.max(gamma, 1e5), 1e6) - 1e5) / 9e5);
      const qScore = clamp01(Math.max(0, 1.05 - q) / 0.15);
      return 0.55 + 0.3 * (0.6 * gammaScore + 0.4 * qScore);
    },
  },
  {
    id: "S-E3",
    hashes: ["#compliance-hud"],
    tone: "celebrate",
    mode: "bubble",
    title: "Green means go slowly.",
    body:
      "Conditions favor the averaged proxy. Proceed with small deltas and re-check the badges.",
    action: "Open papers",
    deepen: [{ label: "Papers", href: "/api/papers" }],
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#compliance-hud")) return false;
      const ts = getTimelineTs(ctx);
      const zeta = getZeta(ctx);
      const badge = String((ctx.pipeline as { qiBadge?: string } | null)?.qiBadge ?? "ok").toLowerCase();
      return typeof ts === "number" && ts > 10 && typeof zeta === "number" && zeta <= 0.8 && badge === "ok";
    },
    score: (ctx) => {
      const ts = getTimelineTs(ctx) ?? 10;
      const zeta = getZeta(ctx) ?? 0.8;
      const tsScore = clamp01(Math.min(ts, 200) / 200);
      const zetaScore = clamp01(Math.max(0, 0.8 - zeta) / 0.4);
      return 0.65 + 0.25 * (0.6 * tsScore + 0.4 * zetaScore);
    },
  },
  {
    id: "D-S1",
    hashes: ["#spectrum"],
    tone: "celebrate",
    mode: "both",
    title: "Cutoff kissed.",
    body:
      "You've landed at a_eff ~ 0.984 nm. Modes shift blue by gamma_geo; ports and roughness only spoil Q - polish if needed.",
    when: (ctx) => hasAnyHash(ctx, "#spectrum") && isGeometryView(ctx) && near(getAEff(ctx), 0.984, 5e-4),
    score: (ctx) => {
      const delta = Math.abs((getAEff(ctx) ?? 0.984) - 0.984);
      return 0.65 + 0.25 * clamp01(Math.max(0, 5e-4 - delta) / 5e-4);
    },
  },
  {
    id: "D-S2",
    hashes: ["#spectrum"],
    tone: "celebrate",
    mode: "bubble",
    title: "Rings answer the bell.",
    body:
      "Strong DCE proxy - first-order sidebands track +/- Omega. Keep port loss down to preserve gain.",
    when: (ctx) => hasAnyHash(ctx, "#spectrum") && isDceView(ctx) && (getEtaDce(ctx) ?? 0) >= 0.15,
    score: (ctx) => {
      const eta = getEtaDce(ctx) ?? 0.15;
      return 0.6 + 0.3 * clamp01(Math.max(0, Math.min(eta, 0.6) - 0.15) / 0.45);
    },
  },
  {
    id: "D-S3",
    hashes: ["#vacuum-gap-sweep", "#sweep"],
    tone: "warn",
    mode: "speak",
    title: "Leaf's edge.",
    body:
      "Phase/gap point within 2% of threshold. Favor windows with redundant phi to keep kappa_eff away from the floor.",
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#vacuum-gap-sweep", "#sweep")) return false;
      const margin = getSubThresholdMargin(ctx);
      return typeof margin === "number" && margin <= 0.02;
    },
    score: (ctx) => {
      const margin = getSubThresholdMargin(ctx) ?? 0.02;
      return 0.6 + 0.35 * clamp01((0.02 - margin) / 0.02);
    },
  },
  {
    id: "D-S4",
    hashes: ["#vacuum-gap-sweep", "#sweep"],
    tone: "warn",
    mode: "both",
    title: "Breath narrows.",
    body:
      "Effective linewidth hit floor - reduce depth or detune slightly; collapse hides true gain.",
    when: (ctx) => hasAnyHash(ctx, "#vacuum-gap-sweep", "#sweep") && hasLinewidthCollapse(ctx),
    score: () => 0.7,
  },
  {
    id: "D-S5",
    hashes: ["#vacuum-gap-sweep", "#sweep"],
    tone: "quiet",
    mode: "bubble",
    title: "The cup is full.",
    body:
      "Displayed gain is capped by guardrails. Back off or widen the window; don't read cap as physics.",
    when: (ctx) => hasAnyHash(ctx, "#vacuum-gap-sweep", "#sweep") && hasGuardClip(ctx),
    score: () => 0.6,
  },
  {
    id: "D-S6",
    hashes: ["#spectrum", "#energy"],
    tone: "celebrate",
    mode: "bubble",
    title: "Average the river.",
    body:
      "Small global duty over many sectors makes the same river safer to sample.",
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#spectrum", "#energy")) return false;
      const duty = getDuty(ctx) ?? getSpectrumDuty(ctx);
      const sectors = getSectorCount(ctx) ?? getSpectrumSectors(ctx);
      return typeof duty === "number" && duty <= 3e-5 && typeof sectors === "number" && sectors >= 200;
    },
    score: (ctx) => {
      const duty = getDuty(ctx) ?? getSpectrumDuty(ctx) ?? 3e-5;
      const sectors = getSectorCount(ctx) ?? getSpectrumSectors(ctx) ?? 200;
      const dutyScore = clamp01(Math.max(0, 3e-5 - duty) / 3e-5);
      const sectorScore = clamp01(Math.max(0, sectors - 200) / 200);
      return 0.6 + 0.3 * (0.5 * dutyScore + 0.5 * sectorScore);
    },
  },
  {
    id: "C-E1",
    hashes: ["#mainframe-terminal"],
    tone: "quiet",
    mode: "bubble",
    title: "Ask, measure, repeat.",
    body:
      "Every run logs TS, zeta, and margins. Keep hypotheses falsifiable; watch the scaling rules in the ledger.",
    when: (ctx) => hasAnyHash(ctx, "#mainframe-terminal"),
    score: (ctx) => (ctx.pipeline || ctx.signals ? 0.65 : 0.55),
  },
  {
    id: "C-E2",
    hashes: ["#mission-planner"],
    tone: "quiet",
    mode: "speak",
    title: "Plan inside the green.",
    body:
      "Hold P_avg fixed, enforce q <= 1, zeta <= 1, TS >> 1; size A and Q to stay in band before you chase gamma.",
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#mission-planner")) return false;
      const ts = getTimelineTs(ctx);
      const zeta = getZeta(ctx);
      return typeof ts === "number" && ts >= 10 && typeof zeta === "number" && zeta <= 0.9;
    },
    score: (ctx) => {
      const ts = getTimelineTs(ctx) ?? 10;
      const zeta = getZeta(ctx) ?? 0.9;
      const tsScore = clamp01(Math.min(ts - 10, 150) / 150);
      const zetaScore = clamp01(Math.max(0, 0.9 - zeta) / 0.4);
      return 0.6 + 0.3 * (0.6 * tsScore + 0.4 * zetaScore);
    },
  },
  {
    id: "W-E1",
    hashes: ["#why"],
    tone: "quiet",
    mode: "both",
    title: "Measure craft by nature.",
    body:
      "Compare kappa_drive to kappa_body from density; dimensionless E_potato keeps us honest. Open the ledger to see the math.",
    action: "Open ledger (Step B)",
    deepen: [{ label: "Ledger - Step B", href: "/warp#step-b" }],
    when: (ctx) => hasAnyHash(ctx, "#why") && Boolean(ctx.energy || ctx.pipeline),
    score: (ctx) => {
      const gamma = getGammaGeoValue(ctx) ?? 20;
      const zeta = getZeta(ctx) ?? 0.9;
      const gammaScore = clamp01(Math.min(gamma, 50) / 50);
      const zetaScore = clamp01(Math.max(0, 1 - zeta) / 0.4);
      return 0.6 + 0.25 * (0.6 * gammaScore + 0.4 * zetaScore);
    },
  },
  {
    id: "W-E2",
    hashes: ["#why"],
    tone: "quiet",
    mode: "bubble",
    title: "Hold the claim lightly.",
    body:
      "When epsilon isn't tiny, treat kappa_drive as a proxy, not a promise. Improve TS, then re-read the comparison.",
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#why")) return false;
      const ts = getTimelineTs(ctx);
      return typeof ts === "number" && ts >= 5 && ts < 10;
    },
    score: (ctx) => {
      const ts = getTimelineTs(ctx) ?? 5;
      return 0.6 + 0.25 * clamp01((10 - ts) / 5);
    },
  },
  {
    id: "X-P1",
    hashes: ["#spectrum", "#sweep", "#energy"],
    tone: "quiet",
    mode: "bubble",
    title: "Bowls hold the wind.",
    body:
      "Concave geometry amplifies storage and shapes cutoff; pair with Q discipline to make sidebands useful.",
    when: (ctx) => {
      if (!hasAnyHash(ctx, "#spectrum", "#sweep", "#energy")) return false;
      const gamma = getGammaGeoValue(ctx);
      const eta = getEtaDce(ctx);
      const duty = getDuty(ctx) ?? getSpectrumDuty(ctx);
      return typeof gamma === "number" && gamma >= 20 && typeof eta === "number" && eta >= 0.15 && typeof duty === "number" && duty <= 8e-5;
    },
    score: (ctx) => {
      const gamma = getGammaGeoValue(ctx) ?? 20;
      const eta = getEtaDce(ctx) ?? 0.15;
      const duty = getDuty(ctx) ?? getSpectrumDuty(ctx) ?? 8e-5;
      const gammaScore = clamp01(Math.min(gamma - 20, 60) / 60);
      const etaScore = clamp01(Math.max(0, Math.min(eta, 0.6) - 0.15) / 0.45);
      const dutyScore = clamp01(Math.max(0, 8e-5 - duty) / 8e-5);
      return 0.55 + 0.3 * (0.4 * gammaScore + 0.35 * etaScore + 0.25 * dutyScore);
    },
  },
  {
    id: "X-P2",
    hashes: ["#compliance-hud", "#why"],
    tone: "quiet",
    mode: "bubble",
    title: "Stand on shoulders.",
    body:
      "Method cards cite the sources. Open Papers for GR averaging, QI sampling, and the proxy rationale.",
    action: "Open papers",
    deepen: [{ label: "Papers", href: "/api/papers" }],
    when: (ctx) => hasAnyHash(ctx, "#compliance-hud", "#why"),
    score: () => 0.5,
  },
];
