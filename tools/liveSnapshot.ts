import type { PipelineSnapshot } from "../types/pipeline";

export interface LivePullOpts {
  origin?: string;
  maxWaitMs?: number;
  pollEveryMs?: number;
  requireTsTarget?: number;
  requireZetaRawMax?: number;
  requireDtBand?: [number, number];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveTsRatio = (snap: PipelineSnapshot): number | undefined => {
  const ts = snap.ts;
  const topTS = (snap as any)?.TS_ratio;

  // direct ratios
  const ratios = [
    ts?.ratio,
    (ts as any)?.TS_ratio,
    topTS,
  ].map((v) => (Number.isFinite(v as number) && (v as number) > 0 ? Number(v) : undefined));
  const direct = ratios.find((v) => v !== undefined);
  if (direct !== undefined) return direct;

  // tau_LC candidates
  const tauLC_ms_candidates = [
    ts?.tauLC_ms,
    (snap as any)?.tauLC_ms,
    (snap as any)?.tau_LC_ms,
    (snap as any)?.lightCrossing?.tauLC_ms,
    (snap as any)?.lightCrossing?.tau_LC_ms,
  ]
    .map((v) => (Number.isFinite(v as number) && (v as number) > 0 ? Number(v) : undefined))
    .filter((v): v is number => v !== undefined);
  const tauLC_ms = tauLC_ms_candidates[0];

  // tau_pulse candidates (ns)
  const tauPulse_ns_candidates = [
    ts?.tauPulse_ns,
    ts?.autoscale?.appliedBurst_ns,
    (snap as any)?.__ts_baseBurst_ms ? (snap as any).__ts_baseBurst_ms * 1e6 : undefined,
    (snap as any)?.lightCrossing?.burst_ns,
    (snap as any)?.lightCrossing?.burst_ms ? (snap as any).lightCrossing.burst_ms * 1e6 : undefined,
    (snap as any)?.burst_ns,
    (snap as any)?.burst_ms ? (snap as any).burst_ms * 1e6 : undefined,
  ]
    .map((v) => (Number.isFinite(v as number) && (v as number) > 0 ? Number(v) : undefined))
    .filter((v): v is number => v !== undefined);
  const tauPulse_ns = tauPulse_ns_candidates[0];

  if (Number.isFinite(tauLC_ms) && Number.isFinite(tauPulse_ns) && (tauPulse_ns as number) > 0) {
    return ((tauLC_ms as number) * 1e6) / (tauPulse_ns as number);
  }
  return undefined;
};

export async function pullSettledSnapshot(
  opts: LivePullOpts = {},
): Promise<{ snap: PipelineSnapshot; meta: Record<string, string | number | undefined> }> {
  const {
    origin = process.env.HELIX_API_BASE ?? "http://localhost:5173",
    maxWaitMs = 5000,
    pollEveryMs = 250,
    requireTsTarget = 100,
    requireZetaRawMax = 1.0,
    requireDtBand = [0.98, 1.02],
  } = opts;

  const deadline = Date.now() + Math.max(0, maxWaitMs);
  let last: PipelineSnapshot | null = null;
  let headers: Record<string, string | number | undefined> = {};
  const tsEpsilon = Math.max(1e-6, requireTsTarget * 1e-4); // tolerate tiny float error on target

  const gatingSettled = (gating?: string | null) =>
    gating === undefined || gating === null || gating === "idle" || gating === "ts_safe" || gating === "disabled";

  let lastResolvedTsRatio: number | undefined;
  let lastGating: string | undefined | null;
  let lastZeta: number | null | undefined;
  let lastDt: number | null | undefined;
  let lastTsEpsilon = tsEpsilon;
  let lastTsOk: boolean | undefined;
  let lastQiOk: boolean | undefined;
  let lastDtOk: boolean | undefined;
  let lastQiGating: string | undefined | null;

  while (Date.now() < deadline) {
    const res = await fetch(`${origin}/api/helix/pipeline`, {
      headers: { Accept: "application/json" },
    });
    const mockHeader = res.headers.get("X-Helix-Mock");
    const pidHeader = res.headers.get("X-Server-PID");
    headers = {
      "X-Helix-Mock": mockHeader ?? undefined,
      "X-Server-PID": pidHeader ?? undefined,
    };
    if (mockHeader === "1") {
      throw new Error("DEV mock detected (X-Helix-Mock:1); refusing to certify live snapshot.");
    }

    const snap = (await res.json()) as PipelineSnapshot;
    const resolvedTsRatio = resolveTsRatio(snap);
    let tsResolved: PipelineSnapshot["ts"] | undefined;
    if (snap.ts) {
      tsResolved = resolvedTsRatio ? ({ ...snap.ts, ratio: resolvedTsRatio } as PipelineSnapshot["ts"]) : snap.ts;
    } else if (resolvedTsRatio !== undefined) {
      tsResolved = { ratio: resolvedTsRatio } as unknown as PipelineSnapshot["ts"];
    }
    const snapResolved = tsResolved ? ({ ...snap, ts: tsResolved } as PipelineSnapshot) : snap;
    last = snapResolved;

    lastResolvedTsRatio = resolvedTsRatio;
    lastGating = (tsResolved as any)?.autoscale?.gating;
    lastZeta = (snapResolved.qiGuardrail?.marginRatioRaw ?? snapResolved.zetaRaw ?? snapResolved.zeta) as
      | number
      | null
      | undefined;
    lastDt = snapResolved.qiGuardrail?.sumWindowDt ?? null;
    lastQiGating = snapResolved.qiAutoscale?.gating;

    const ts = snapResolved.ts;
    const qi = snap.qiGuardrail;
    const tsOk =
      !!ts &&
      Number.isFinite(resolvedTsRatio) &&
      (resolvedTsRatio as number) + tsEpsilon >= requireTsTarget &&
      gatingSettled(ts.autoscale?.gating);

    const zetaRaw = qi?.marginRatioRaw ?? snapResolved.zetaRaw ?? snapResolved.zeta ?? null;
    const dt = qi?.sumWindowDt ?? null;
    const dtOk =
      dt == null ||
      (Number.isFinite(dt) && dt >= requireDtBand[0] && dt <= requireDtBand[1]);
    const qiGating = snapResolved.qiAutoscale?.gating;
    const qiOk =
      zetaRaw != null &&
      Number.isFinite(zetaRaw) &&
      (zetaRaw as number) < requireZetaRawMax &&
      (qiGating === "idle" ||
        qiGating === "disabled" ||
        qiGating === undefined ||
        (typeof qiGating === "string" && qiGating.includes("zeta_safe")));
    lastTsOk = tsOk;
    lastDtOk = dtOk;
    lastQiOk = qiOk;

    if (tsOk && qiOk && dtOk) {
      return { snap: snapResolved, meta: headers };
    }

    await sleep(pollEveryMs);
  }

  const reason = explainUnsettled(last, {
    tsRatio: lastResolvedTsRatio,
    gating: lastGating,
    zetaRaw: lastZeta,
    dt: lastDt,
    requireTsTarget,
    requireDtBand,
    tsEpsilon: lastTsEpsilon,
    tsOk: lastTsOk,
    qiOk: lastQiOk,
    dtOk: lastDtOk,
    qiGating: lastQiGating,
  });
  throw new Error(`Autoscale not settled for certification: ${reason}`);
}

function explainUnsettled(
  snap: PipelineSnapshot | null,
  opts?: {
    tsRatio?: number;
    gating?: string | null;
    zetaRaw?: number | null;
    dt?: number | null;
    requireTsTarget?: number;
    requireDtBand?: [number, number];
    tsEpsilon?: number;
    tsOk?: boolean;
    qiOk?: boolean;
    dtOk?: boolean;
    qiGating?: string | null;
  },
): string {
  if (!snap) return "no snapshot";
  const parts: string[] = [];

  const ts = snap.ts;
  const tsRatio = opts?.tsRatio ?? (snap ? resolveTsRatio(snap) : undefined);
  const gating = ts?.autoscale?.gating;
  const requireTsTarget = opts?.requireTsTarget ?? 100;
  const tsEpsilon = opts?.tsEpsilon ?? Math.max(1e-6, requireTsTarget * 1e-4);
  if (!ts) {
    parts.push("no TS telemetry");
  } else {
    if (!Number.isFinite(tsRatio)) parts.push("TS missing");
    else if ((tsRatio as number) + tsEpsilon < requireTsTarget) parts.push(`TS=${tsRatio}`);
    if (gating === "active") parts.push("TS_slewing");
    else if (!(gating === undefined || gating === null || gating === "idle" || gating === "ts_safe" || gating === "disabled")) {
      parts.push(`TS_gating=${gating}`);
    }
    if (snap.__ts_baseBurst_source === "duty_fallback") parts.push("baseBurst=duty_fallback");
  }

  const zetaRaw = opts?.zetaRaw ?? snap.qiGuardrail?.marginRatioRaw ?? snap.zetaRaw ?? snap.zeta ?? null;
  if (!(zetaRaw != null && Number.isFinite(zetaRaw) && (zetaRaw as number) < 1)) {
    parts.push(`zetaRaw=${zetaRaw}`);
  }
  const dt = opts?.dt ?? snap.qiGuardrail?.sumWindowDt ?? null;
  const [dtMin, dtMax] = opts?.requireDtBand ?? [0.98, 1.02];
  if (dt != null && !(dt >= dtMin && dt <= dtMax)) {
    parts.push(`sum_g_dt=${dt}`);
  }

  if (!parts.length) {
    const tsOk = opts?.tsOk;
    const qiOk = opts?.qiOk;
    const dtOk = opts?.dtOk;
    const qiGating = opts?.qiGating;
    parts.push(
      `unsettled(ts=${tsRatio ?? "n/a"}, gating=${gating ?? "n/a"}, zeta=${zetaRaw ?? "n/a"}, dt=${dt ?? "n/a"}, tsOk=${tsOk}, qiOk=${qiOk}, dtOk=${dtOk}, qiGating=${qiGating ?? "n/a"})`,
    );
  }

  return parts.join(", ");
}
