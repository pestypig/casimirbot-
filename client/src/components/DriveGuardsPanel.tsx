import { useMemo, useState } from "react";



import type { ReactNode } from "react";



import {



  Card,



  CardContent,



  CardDescription,



  CardHeader,



  CardTitle,



} from "@/components/ui/card";



import { Badge } from "@/components/ui/badge";



import { SUB_THRESHOLD_MARGIN, RHO_CUTOFF } from "@/lib/parametric-sweep";



import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";



import { DefinitionChip, useTermRegistry } from "@/components/DefinitionChip";



import {



  Activity,



  AlertTriangle,



  Atom,



  ChevronDown,



  ExternalLink,



  Gauge,



  LineChart,



  ShieldCheck,



  Sigma,



} from "lucide-react";







const SPEED_OF_LIGHT = 299_792_458; // m/s



const GRAVITATIONAL_CONSTANT = 6.6743e-11; // m^3 kg^-1 s^-2



const Q_BURST = 1e9; // storage factor used by the pipeline audit







type TilePoint = {



  phiDeg: number;



  rho: number;



  margin: number;



  stable: boolean;



  label: string;



};







type FirstReadItem = {
  key: string;
  chip: ReactNode;
  plain: string;
  lookFor: string;
  value: ReactNode;
  muted?: boolean;
};

type Reference = {
  label: string;
  href: string;
  citation: string;
};

type ProofBridgeCard = {
  key: string;
  title: string;
  observation: string;
  grSees: string;
  panel: string;
  href: string;
  reference: Reference;
};

type ProofProxyRow = {
  key: string;
  proof: string;
  statement: string;
  knob: ReactNode;
  reference: Reference;
};

const clamp = (value: number, min: number, max: number) =>



  Math.min(max, Math.max(min, value));







const toPercent = (value: number | undefined, digits = 2) =>

  Number.isFinite(value) ? `${(value! * 100).toFixed(digits)}%` : "n/a";



const toFixed = (value: number | undefined, digits = 2) =>

  Number.isFinite(value) ? value!.toFixed(digits) : "n/a";



const toSci = (value: number | undefined, digits = 2) => {

  if (!Number.isFinite(value) || value === 0) return value === 0 ? "0" : "n/a";

  return value!.toExponential(digits);

};

const firstFinite = (...values: Array<unknown>): number => {

  for (const value of values) {

    if (typeof value === "number" && Number.isFinite(value)) {

      return value;

    }

    if (typeof value === "string") {

      const parsed = Number(value);

      if (Number.isFinite(parsed)) {

        return parsed;

      }

    }

  }

  return NaN;

};





const modeTitle: Record<string, string> = {



  standby: "Standby",



  hover: "Hover",



  taxi: "Taxi",



  nearzero: "Near-Zero",



  cruise: "Cruise",



  emergency: "Emergency",



};







function buildTilePoints(rows: any[]): TilePoint[] {



  if (!Array.isArray(rows) || !rows.length) return [];



  const take = rows.slice(-160);



  return take



    .map((row) => {



      const phiDeg = Number.isFinite(row?.phi_deg) ? (row.phi_deg as number) : 0;



      const phiRad = (phiDeg * Math.PI) / 180;



      const rho = Number.isFinite(row?.pumpRatio)



        ? Math.abs(row.pumpRatio as number)



        : Number.isFinite(row?.rho)



        ? Math.abs(row.rho as number)



        : Number.isFinite(row?.lambda0)



        ? Math.abs(row.lambda0 as number)



        : 0;



      const margin = 1 - Math.abs(rho * Math.cos(phiRad));



      const stable = row?.stable !== false && row?.status !== "UNSTABLE";



      const label = `${row?.d_nm ?? "?"} nm @ ${phiDeg.toFixed(1)}?`;



      return {



        phiDeg,



        rho,



        margin,



        stable,



        label,



      };



    })



    .filter((row) => Number.isFinite(row.margin));



}







function tileSummary(points: TilePoint[]) {



  if (!points.length) {



    return {



      minMargin: NaN,



      clipped: 0,



      unstable: 0,



    };



  }



  let minMargin = Infinity;



  let clipped = 0;



  let unstable = 0;



  for (const point of points) {



    if (point.margin < minMargin) minMargin = point.margin;



    if (point.rho >= RHO_CUTOFF || point.margin <= SUB_THRESHOLD_MARGIN) clipped += 1;



    if (!point.stable) unstable += 1;



  }



  return {



    minMargin,



    clipped,



    unstable,



  };



}







function computeDutyEffective(pipeline: any): {



  dEff: number;



  burstLocal: number;



  sectorsLive: number;



  sectorsTotal: number;



} {



  const sectorsTotal = Math.max(



    1,



    Math.floor(



      Number(pipeline?.sectorsTotal ?? pipeline?.sectorCount ?? pipeline?.lightCrossing?.sectorCount ?? 400),



    ),



  );




  const sectorsLive = Math.max(



    1,



    Math.floor(



      Number(



        pipeline?.activeSectors ??



          pipeline?.sectorsConcurrent ??



          pipeline?.concurrentSectors ??



          pipeline?.sectorStrobing ?? 1,



      ),



    ),



  );



  const burstLocal = clamp(



    Number(pipeline?.localBurstFrac ?? pipeline?.dutyCycle ?? pipeline?.dutyBurst ?? 0),



    0,



    1,



  );



  const explicit = pipeline?.dutyEffectiveFR ?? pipeline?.dutyEffective_FR ?? pipeline?.dutyShip;



  const dEff = Number.isFinite(explicit)



    ? clamp(explicit as number, 0, 1)



    : clamp(burstLocal * (sectorsLive / sectorsTotal), 0, 1);



  return { dEff, burstLocal, sectorsLive, sectorsTotal };



}







function computeMass(pipeline: any, dEff: number) {



  const U_static = Number(pipeline?.U_static);



  const gammaGeo = Number(pipeline?.gammaGeo);



  const gammaVdB = Number(



    pipeline?.gammaVanDenBroeck_mass ?? pipeline?.gammaVanDenBroeck ?? pipeline?.gammaVdB,



  );



  const N_tiles = Number(



    pipeline?.N_tiles ?? pipeline?.tiles?.N_tiles ?? pipeline?.tiles?.total ?? pipeline?.totalTiles,



  );



  if (!Number.isFinite(U_static) || !Number.isFinite(gammaGeo) || !Number.isFinite(gammaVdB) || !Number.isFinite(N_tiles)) {



    return { mass: NaN, U_static, gammaGeo, gammaVdB, N_tiles };



  }



  const magnitude = Math.abs(U_static);



  const geoGain = Math.pow(gammaGeo, 3);



  const numerator = magnitude * geoGain * Q_BURST * gammaVdB * dEff * N_tiles;



  const mass = numerator / (SPEED_OF_LIGHT ** 2);



  return { mass, U_static, gammaGeo, gammaVdB, N_tiles };



}







function computeCurvatureProxy(pipeline: any, dEff: number) {



  const powerW = (() => {



    const fields = [pipeline?.P_avg_W, pipeline?.P_avg, pipeline?.power_W, pipeline?.P_avg_MW];



    for (const value of fields) {



      if (!Number.isFinite(value)) continue;



      if (value && typeof value === "number" && Math.abs(value) > 1e5) return value;



      if (value && typeof value === "number" && value > 0 && value < 1e4) {



        // treat MW value in MW units



        return value * 1e6;



      }



      if (value === 0) return 0;



    }



    return NaN;



  })();







  const hullArea = Number(



    pipeline?.hullArea_m2 ??



      pipeline?.tiles?.hullArea_m2 ??



      (Number.isFinite(pipeline?.tileArea_cm2) && Number.isFinite(pipeline?.N_tiles)



        ? (pipeline.tileArea_cm2 as number) * (pipeline.N_tiles as number) * 1e-4



        : undefined),



  );







  const gammaGeo = Number(pipeline?.gammaGeo);



  const geometryStorageGain = Number.isFinite(gammaGeo) ? Math.pow(gammaGeo, 3) * Q_BURST : NaN;



  const gammaVdB = Number(



    pipeline?.gammaVanDenBroeck_vis ?? pipeline?.gammaVanDenBroeck ?? pipeline?.gammaVdB,



  );



  const mathcalG = Number.isFinite(geometryStorageGain)



    ? geometryStorageGain * (Number.isFinite(gammaVdB) ? gammaVdB : 1)



    : NaN;







  if (!Number.isFinite(powerW) || !Number.isFinite(hullArea) || hullArea <= 0 || !Number.isFinite(mathcalG)) {



    return { kappa: NaN, powerW, hullArea, mathcalG, gammaGeo, gammaVdB };



  }







  const prefactor = (8 * Math.PI * GRAVITATIONAL_CONSTANT) / SPEED_OF_LIGHT ** 5;



  const kappa = prefactor * (powerW / hullArea) * dEff * mathcalG;



  return { kappa, powerW, hullArea, mathcalG, gammaGeo, gammaVdB };



}







export default function DriveGuardsPanel() {



  const { data: pipeline, sweepResults } = useEnergyPipeline({ refetchInterval: 1500 });



  const pipe = pipeline as any;



  const [readMode, setReadMode] = useState(false);







  const { dEff, burstLocal, sectorsLive, sectorsTotal } = useMemo(



    () => computeDutyEffective(pipe),



    [pipe],



  );







  const tilePoints = useMemo(() => buildTilePoints(sweepResults), [sweepResults]);



  const tileStats = useMemo(() => tileSummary(tilePoints), [tilePoints]);







  const mass = useMemo(() => computeMass(pipe, dEff), [pipe, dEff]);



  const curvature = useMemo(() => computeCurvatureProxy(pipe, dEff), [pipe, dEff]);







  const powerDensity =

    Number.isFinite(curvature.powerW) && Number.isFinite(curvature.hullArea) && curvature.hullArea > 0

      ? curvature.powerW / curvature.hullArea

      : NaN;







  const zeta = Number(pipe?.zeta ?? pipe?.fordRoman?.value);



  const ts = (() => {



    if (Number.isFinite(pipe?.TS_ratio)) return pipe!.TS_ratio as number;



    if (Number.isFinite(pipe?.TS_long)) return pipe!.TS_long as number;



    const burst = Number(pipe?.lightCrossing?.burst_ms ?? pipe?.burst_ms);



    const dwell = Number(pipe?.lightCrossing?.dwell_ms ?? pipe?.dwell_ms);



    if (Number.isFinite(burst) && Number.isFinite(dwell) && dwell > 0) {



      const tauLC = Number(pipe?.lightCrossing?.tauLC_ms ?? pipe?.tau_LC_ms);



      if (Number.isFinite(tauLC) && tauLC > 0) {



        return (tauLC / dwell) * (dwell / burst);



      }



    }



    return NaN;



  })();







  const qMech = Number(pipe?.qMechanical ?? pipe?.qSpoilingFactor ?? pipe?.q);







  const gammaGeo = Number(pipe?.gammaGeo);



  const gammaVdB = Number(pipe?.gammaVanDenBroeck ?? pipe?.gammaVanDenBroeck_vis ?? pipe?.gammaVdB);







  const avgQL = useMemo(() => {



    if (!tilePoints.length) return NaN;



    let total = 0;



    let count = 0;



    for (const row of sweepResults ?? []) {



      const ql = Number(row?.QL ?? row?.QL_base);



      if (Number.isFinite(ql) && ql > 0) {



        total += ql;



        count += 1;



      }



    }



    return count > 0 ? total / count : NaN;



  }, [sweepResults, tilePoints.length]);







  const latestSweep = useMemo(() => {



    if (!Array.isArray(sweepResults) || sweepResults.length === 0) return undefined;



    return sweepResults[sweepResults.length - 1] as any;



  }, [sweepResults]);







  const latestRho = Number(



    latestSweep?.pumpRatio ?? latestSweep?.rho ?? latestSweep?.lambda0 ?? latestSweep?.lambdaEff,



  );



  const latestPhiDeg = Number(latestSweep?.pumpPhase_deg ?? latestSweep?.phi_deg);



  const latestPhiRad = Number.isFinite(latestPhiDeg) ? (latestPhiDeg * Math.PI) / 180 : NaN;



  const lambdaEff = Number.isFinite(latestRho) && Number.isFinite(latestPhiRad)



    ? latestRho * Math.cos(latestPhiRad)



    : NaN;



  const lambdaMargin = Number.isFinite(lambdaEff) ? 1 - Math.abs(lambdaEff) : NaN;



  const kappaEffMHz = Number(



    latestSweep?.kappaEff_MHz ??



      (Number.isFinite(latestSweep?.kappaEff_Hz)



        ? (latestSweep!.kappaEff_Hz as number) / 1e6



        : undefined),



  );



  const loadedQL = Number(latestSweep?.QL ?? latestSweep?.QL_base);



  const modulationDepthPct = Number(latestSweep?.modulationDepth_pct ?? latestSweep?.m ?? NaN);



  const epsilonQL =



    Number.isFinite(latestRho) && Number.isFinite(loadedQL) && loadedQL !== 0



      ? latestRho / loadedQL



      : Number.isFinite(latestRho) && Number.isFinite(avgQL) && avgQL !== 0



      ? latestRho / avgQL



      : NaN;







  const tauPulseUs = (() => {

    const candidateUs = firstFinite(

      pipe?.lightCrossing?.burst_us,

      pipe?.burst_us,

      pipe?.pulse_us,

      pipe?.tau_pulse_us,

      pipe?.lightCrossing?.tauPulse_us,

      pipe?.lightCrossing?.pulse_us,

    );

    if (Number.isFinite(candidateUs)) return candidateUs;

    const candidateMs = firstFinite(

      pipe?.lightCrossing?.burst_ms,

      pipe?.burst_ms,

      pipe?.pulse_ms,

      pipe?.tau_pulse_ms,

      pipe?.lightCrossing?.pulse_ms,

    );

    if (Number.isFinite(candidateMs)) return candidateMs * 1000;

    const candidateNs = firstFinite(

      pipe?.lightCrossing?.burst_ns,

      pipe?.burst_ns,

      pipe?.pulse_ns,

      pipe?.tau_pulse_ns,

    );

    if (Number.isFinite(candidateNs)) return candidateNs / 1000;

    return NaN;

  })();



  const tauLCUs = (() => {

    const candidateUs = firstFinite(

      pipe?.lightCrossing?.tauLC_us,

      pipe?.tau_LC_us,

      pipe?.lightCrossing_us,

      pipe?.lightCrossing?.lightCrossing_us,

    );

    if (Number.isFinite(candidateUs)) return candidateUs;

    const candidateMs = firstFinite(

      pipe?.lightCrossing?.tauLC_ms,

      pipe?.tau_LC_ms,

      pipe?.lightCrossing_ms,

      pipe?.lightCrossing?.lightCrossing_ms,

    );

    if (Number.isFinite(candidateMs)) return candidateMs * 1000;

    const candidateNs = firstFinite(

      pipe?.lightCrossing?.tauLC_ns,

      pipe?.tau_LC_ns,

    );

    if (Number.isFinite(candidateNs)) return candidateNs / 1000;

    return NaN;

  })();



  const epsilonFromTimes =

    Number.isFinite(tauPulseUs) && Number.isFinite(tauLCUs) && tauLCUs > 0

      ? tauPulseUs / tauLCUs

      : NaN;



  const epsilonEffective = Number.isFinite(epsilonFromTimes) ? epsilonFromTimes : epsilonQL;



  const epsilonDisplay = Number.isFinite(epsilonEffective) ? toSci(epsilonEffective, 2) : "n/a";



  const tsDisplay =

    Number.isFinite(ts) && ts > 0

      ? (ts >= 100 ? ts.toFixed(0) : ts.toFixed(1))

      : "n/a";



  const averagingStatus = (() => {

    if (!Number.isFinite(ts) || !Number.isFinite(epsilonEffective)) {

      return { state: "unknown" as const, message: "Awaiting telemetry" };

    }

    if (ts >= 50 && epsilonEffective <= 0.05) {

      return { state: "ok" as const, message: "GR sees <T_mu nu>" };

    }

    if (ts >= 10 && epsilonEffective <= 0.2) {

      return { state: "warn" as const, message: "Borderline; widen spacing" };

    }

    return { state: "fail" as const, message: "Invalid; average breaks" };

  })();



  const averagingBadgeTone =

    {

      ok: "border-emerald-400/60 bg-emerald-500/10 text-emerald-200",

      warn: "border-amber-400/60 bg-amber-500/10 text-amber-200",

      fail: "border-rose-400/60 bg-rose-500/10 text-rose-200",

      unknown: "border-slate-700 bg-slate-900/60 text-slate-300",

    }[averagingStatus.state];



  const averagingBadgeText =

    Number.isFinite(epsilonEffective) && Number.isFinite(ts)

      ? `epsilon ${epsilonDisplay}, TS ${tsDisplay} -> ${averagingStatus.message}`

      : "Awaiting duty & light-crossing telemetry";



  const averagingBadgeSubtext =

    Number.isFinite(tauPulseUs) && Number.isFinite(tauLCUs)

      ? `tau_pulse ${toSci(tauPulseUs, 2)} us, tau_LC ${toSci(tauLCUs, 2)} us`

      : "Need tau_pulse and tau_LC from Spectrum Tuner";



  const kappaMuted = averagingStatus.state === "fail";



  const zetaOk = Number.isFinite(zeta) && zeta <= 1;



  const lambdaEffDisplay = Number.isFinite(lambdaEff) ? toFixed(lambdaEff, 3) : "n/a";



  const lambdaMarginDisplay = Number.isFinite(lambdaMargin) ? toPercent(lambdaMargin, 2) : "n/a";



  const rhoGuardDisplay = Number.isFinite(latestRho) ? toFixed(Math.abs(latestRho), 3) : "n/a";



  const paramGuardOk =

    Number.isFinite(lambdaMargin) &&

    lambdaMargin > SUB_THRESHOLD_MARGIN &&

    Number.isFinite(lambdaEff) &&

    Math.abs(lambdaEff) < 1 &&

    Number.isFinite(latestRho) &&

    Math.abs(latestRho) < RHO_CUTOFF;



  const kappaBodyCandidate = firstFinite(

    pipe?.kappaBody,

    pipe?.kappa_body,

    pipe?.curvatureLedger?.kappa_body,

    pipe?.ledger?.kappa_body,

    pipe?.ledger?.body?.kappa,

    pipe?.body?.kappa,

    pipe?.body?.kappa_body,

    pipe?.bodyBenchmark?.kappa,

  );



  const bodyDensityCandidate = firstFinite(

    pipe?.rhoBody,

    pipe?.body?.rho,

    pipe?.ledger?.body?.rho,

    pipe?.bodyDensity_kg_m3,

    pipe?.body?.density,

  );



  const kappaBodyDerived =

    Number.isFinite(bodyDensityCandidate)

      ? ((8 * Math.PI * GRAVITATIONAL_CONSTANT) / (3 * SPEED_OF_LIGHT ** 2)) * bodyDensityCandidate

      : NaN;



  const kappaBody = Number.isFinite(kappaBodyCandidate) ? kappaBodyCandidate : kappaBodyDerived;



  const kappaDriveDisplay = Number.isFinite(curvature.kappa) ? toSci(curvature.kappa, 2) : "n/a";



  const kappaBodyDisplay = Number.isFinite(kappaBody) ? toSci(kappaBody, 2) : "n/a";



  const kappaRatio =

    Number.isFinite(curvature.kappa) && Number.isFinite(kappaBody) && kappaBody !== 0

      ? curvature.kappa / kappaBody

      : NaN;



  const kappaRatioDisplay = Number.isFinite(kappaRatio) ? toSci(kappaRatio, 2) : "n/a";



  const ratioBadgeClass =

    kappaMuted || !Number.isFinite(kappaRatio) || !zetaOk

      ? "border-slate-700 bg-slate-900/40 text-slate-500"

      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";



  const natarioTheta = Number(pipe?.thetaScaleExpected ?? pipe?.thetaCal ?? pipe?.thetaRaw);







  const mathNarrative = pipe?.equations ?? {};







  const mode = (pipe?.currentMode ?? "hover") as string;







  const registerTerm = useTermRegistry();



  const renderTerm = (termId: string, fallback: ReactNode, className?: string) => {



    const { term, showDefinition } = registerTerm(termId);



    if (!term) return fallback ?? null;



    return (



      <DefinitionChip



        term={term}



        showDefinition={showDefinition}



        className={className}



      />



    );



  };







  const gapNm = Number(



    pipe?.gap_nm ??



      pipe?.gap ??



      pipe?.gapNominal_nm ??



      pipe?.tiles?.gap_nm ??



      pipe?.geometry?.gap_nm,



  );



  const sagNm = Number(



    pipe?.sag_nm ??



      pipe?.sag ??



      pipe?.bowlSag_nm ??



      pipe?.geometry?.sag_nm ??



      pipe?.geometry?.sag,



  );



  const aEffNm = Number.isFinite(gapNm)



    ? Number.isFinite(sagNm)



      ? Math.max(gapNm - sagNm, 0)



      : gapNm



    : NaN;



  const lambdaCutNm = Number.isFinite(aEffNm) ? aEffNm * 2 : NaN;







  const rhoDisplay = Number.isFinite(latestRho) ? Math.abs(latestRho) : NaN;



  const lambdaAbs = Number.isFinite(lambdaEff) ? Math.abs(lambdaEff) : NaN;



  const marginDisplay = Number.isFinite(tileStats.minMargin) ? tileStats.minMargin : lambdaMargin;







  const makeSymbol = (text: string) => (



    <span className="font-mono text-[11px] text-cyan-200">{text}</span>



  );







  const geometryFirstRead: FirstReadItem[] = [



    {



      key: "gap",



      chip: renderTerm("a", makeSymbol("a")),



      plain: "Plate gap sets the spectral cutoff and static Casimir pressure.",



      lookFor:



        "Look for: when sag increases, a_eff drops, the cutoff shifts right, and pressure magnitude rises.",



      value: Number.isFinite(gapNm) ? `${gapNm.toFixed(0)} nm` : "? ",



    },



    {



      key: "sag",



      chip: renderTerm("t", makeSymbol("t")),



      plain: "Sag engages the bowl and reduces the effective gap.",



      lookFor: "Look for: higher sag lowers a_eff; geometry gain rises accordingly.",



      value: Number.isFinite(sagNm) ? `${sagNm.toFixed(1)} nm` : "? ",



    },



    {



      key: "a_eff",



      chip: renderTerm("a_eff", makeSymbol("a_eff")),



      plain: "Effective gap a_eff = a - t drives spectral cutoff and static pressure.",



      lookFor: "Look for: a_eff dropping moves the cutoff and boosts static pressure.",



      value: Number.isFinite(aEffNm) ? `${aEffNm.toFixed(1)} nm` : "? ",



    },



    {



      key: "gamma_geo",



      chip: renderTerm("gamma_geo", makeSymbol("?_geo")),



      plain: "Geometry gain amplifies per-tile energy at fixed materials.",



      lookFor: "Look for: ?_geo > 1 whenever the bowl is engaged.",



      value: Number.isFinite(gammaGeo) ? gammaGeo.toFixed(2) : "? ",



    },



    {



      key: "lambda_cut",



      chip: makeSymbol("?_cut(eq)"),



      plain: "Equivalent wavelength cutoff ?_cut = 2 a_eff keeps long modes out.",



      lookFor: "Look for: cutoff readout tracks twice the live a_eff.",



      value: Number.isFinite(lambdaCutNm) ? `${lambdaCutNm.toFixed(1)} nm` : "? ",



    },



  ];







  const tileFirstRead: FirstReadItem[] = [



    {



      key: "QL",



      chip: renderTerm("Q_L", makeSymbol("Q_L")),



      plain: "Loaded Q sets ? = f0 / Q_L and the tile linewidth.",



      lookFor: "Look for: higher Q_L narrows linewidth; tile gain rises at the same depth.",



      value: Number.isFinite(avgQL) ? avgQL.toFixed(0) : "? ",



    },



    {



      key: "epsilon",



      chip: renderTerm("epsilon", makeSymbol("?")),



      plain: "Modulation depth m is transduced to ? = ?!?m before thresholds.",



      lookFor: "Look for: UI converts percent depth to ? automatically before guarding.",



      value: Number.isFinite(epsilonEffective) ? epsilonEffective.toExponential(2) : "? ",



    },



    {



      key: "rho",



      chip: renderTerm("rho", makeSymbol("?")),



      plain: "Normalized coupling ? is the master threshold knob.",



      lookFor: `Look for: guard trips once ? ?0? ${RHO_CUTOFF}.`,



      value: Number.isFinite(rhoDisplay) ? rhoDisplay.toFixed(3) : "? ",



    },



    {



      key: "lambda",



      chip: renderTerm("lambda", makeSymbol("?")),



      plain: "Effective gain ? = ?0 cos?  must stay under one.",



      lookFor: "Look for: margin ?0? 2% keeps damping positive; ? crossing 1 is runaway.",



      value: Number.isFinite(lambdaAbs) ? lambdaAbs.toFixed(3) : "? ",



    },



    {



      key: "kappa_eff",



      chip: renderTerm("kappa_eff", makeSymbol("?_eff")),



      plain: "Effective linewidth ?_eff = ?(1 - ? cos? ) stays above floor.",



      lookFor: "Look for: collapse warning if ?_eff trends to zero.",



      value: Number.isFinite(kappaEffMHz) ? `${kappaEffMHz.toFixed(2)} MHz` : "? ",



    },



    {



      key: "guard",



      chip: makeSymbol("runaway"),



      plain: `Runaway guard enforces ? < ${RHO_CUTOFF} and margin ?0? ${toPercent(



        SUB_THRESHOLD_MARGIN,



        1,



      )}.`,



      lookFor: "Look for: tiles hatch/gray as ? approaches the cap or margin shrinks below 2%.",



      value: Number.isFinite(marginDisplay) ? toPercent(marginDisplay, 2) : "? ",



    },



  ];







  const averagingFirstRead: FirstReadItem[] = [



    {



      key: "d_eff",



      chip: renderTerm("d_eff", makeSymbol("d_eff")),



      plain: "Ship-wide duty after sectoring is what GR samples.",



      lookFor: "Look for: badge falls as sector count rises; modes move d_eff immediately.",



      value: toPercent(dEff, 3),



    },



    {



      key: "TS",



      chip: renderTerm("TS", makeSymbol("TS")),



      plain: "TS = ? _LC / ? _pulse; TS >> 1 validates the averaging regime.",



      lookFor: "Look for: GR sees the average once TS is well above one.",



      value: Number.isFinite(ts) ? ts.toFixed(1) : "? ",



    },



    {



      key: "zeta",



      chip: renderTerm("zeta", makeSymbol("?")),



      plain: "Ford? Roman guard limits duty via ? ?0? 1.",



      lookFor: "Look for: solver freezes duty as ? approaches one.",



      value: Number.isFinite(zeta) ? toFixed(zeta, 3) : "? ",



    },



  ];







  const driveFirstRead: FirstReadItem[] = [



    {



      key: "kappa_drive",



      chip: renderTerm("kappa_drive", makeSymbol("?_drive")),



      plain: "(8?G/c^5)(P/A) * d_eff * G gives the cycle-averaged curvature proxy.",



      lookFor: "Look for: green zone solved when ?_drive sits inside ledger bounds.",



      value: kappaDriveDisplay,

      muted: kappaMuted,



    },



    {



      key: "q_mech",



      chip: makeSymbol("q_mech"),



      plain: "Mechanical stroke sanity stays at or below unity.",



      lookFor: "Look for: q_mech ?0? 1 keeps actuators inside safe stroke.",



      value: Number.isFinite(qMech) ? qMech.toFixed(2) : "? ",



    },



    {



      key: "gamma_vdb",



      chip: makeSymbol("?_VdB"),



      plain: "Pocket gain folds in Van Den Broeck geometry.",



      lookFor: "Look for: 10^5 ?0? ?_VdB ?0? 10^6 in the green zone.",



      value: Number.isFinite(gammaVdB) ? gammaVdB.toExponential(2) : "? ",



    },



    {



      key: "green_zone",



      chip: renderTerm("green_zone", makeSymbol("green")),



      plain: "Green zone defines { q ?0? 1, ?_VdB in band, ? ?0? 1, TS >> 1 }.",



      lookFor: "Look for: badges stay green when all guards hold simultaneously.",



      value:



        Number.isFinite(qMech) &&



        qMech <= 1 &&



        Number.isFinite(gammaVdB) &&



        gammaVdB >= 1e5 &&



        gammaVdB <= 1e6 &&



        Number.isFinite(zeta) &&



        zeta <= 1 &&



        Number.isFinite(ts) &&



        ts > 10



          ? "?S "



          : "check",



    },



  ];







  const energyFirstRead: FirstReadItem[] = [



    {



      key: "M_minus",



      chip: makeSymbol("M_-"),



      plain: "Duty-averaged exotic mass sums tile energy across the ship.",



      lookFor:



        "Look for: more duty or more active Casimir area raises M_- while guards hold.",



      value: Number.isFinite(mass.mass) ? `${mass.mass.toExponential(3)} kg` : "? ",



    },



  ];







  const proofReferences: Record<string, Reference> = {
    expansion: {
      label: "[1]",
      href: "https://doi.org/10.1086/300499",
      citation: "Riess et al. 1998, AJ 116, 1009",
    },
    waves: {
      label: "[2]",
      href: "https://doi.org/10.1103/PhysRevLett.116.061102",
      citation: "Abbott et al. 2016, Phys. Rev. Lett. 116, 061102",
    },
    shift: {
      label: "[3]",
      href: "https://doi.org/10.1038/nature03007",
      citation: "Ciufolini & Pavlis 2004, Nature 431, 958",
    },
  };




  const proofBridgeCards: ProofBridgeCard[] = [

    {

      key: "expansion",

      title: "Expansion (FLRW)",

      observation: "Distances stretch even when comoving matter coasts.",

      grSees: "Average density and pressure set the metric scale factor.",

      panel: "kappa_body yardstick -> compare against kappa_drive via E_potato.",

      href: "#ledger-step-b",
      reference: proofReferences.expansion,

    },



    {

      key: "waves",

      title: "Gravitational waves (geodesic deviation)",

      observation: "LIGO clocks feel transient strains - space oscillates.",

      grSees: "High-frequency sources average into an effective stress tensor.",

      panel: "Averaging badge (epsilon, TS) keeps the proxy lawful.",

      href: "#ledger-averaging",
      reference: proofReferences.waves,

    },



    {

      key: "shift",

      title: "Frame-dragging (shift)",

      observation: "Mass currents tilt inertial frames (Lense-Thirring).",

      grSees: "Momentum flow sources the shift vector in GR.",

      panel: "zeta guard + d_eff + kappa_drive feed the shift budget.",

      href: "#ledger-shift",
      reference: proofReferences.shift,

    },



  ];



  const proofProxyRows: ProofProxyRow[] = [

    {

      key: "expansion",

      proof: "Expansion",

      statement: "rho -> kappa_body",

      knob: (

        <a className="text-cyan-300 hover:text-cyan-200" href="#ledger-step-b">

          kappa_body badge

        </a>

      ),

      reference: proofReferences.expansion,

    },



    {

      key: "waves",

      proof: "Gravitational waves",

      statement: "HF source -> <T_mu nu>",

      knob: (

        <a className="text-cyan-300 hover:text-cyan-200" href="#ledger-averaging">

          Averaging badge (epsilon, TS)

        </a>

      ),

      reference: proofReferences.waves,

    },



    {

      key: "shift",

      proof: "Frame-dragging",

      statement: "Momentum flow -> shift",

      knob: (

        <a className="text-cyan-300 hover:text-cyan-200" href="#ledger-shift">

          zeta, d_eff, kappa_drive

        </a>

      ),

      reference: proofReferences.shift,

    },



  ];



  const averagingBadgeIcon = (() => {

    switch (averagingStatus.state) {

      case "ok":

        return <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />;

      case "warn":

        return <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />;

      case "fail":

        return <Activity className="h-3.5 w-3.5 text-rose-300" />;

      default:

        return <Atom className="h-3.5 w-3.5 text-slate-300" />;

    }

  })();




  const describeEquation = (key: string, fallback: string, explanation: string) => {



    if (readMode) {



      return (



        (mathNarrative?.[`${key}_readable`] as string) ??



        (mathNarrative?.[`${key}_read`] as string) ??



        (mathNarrative?.[`${key}_text`] as string) ??



        explanation



      );



    }



    return (mathNarrative?.[key] as string) ?? fallback;



  };







  return (



    <Card className="bg-slate-900/60 border-slate-800 text-slate-100">



      <CardHeader className="space-y-3">



        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-cyan-200">



          <ShieldCheck className="h-5 w-5" />



          Cycle-Averaged Drive Budget



        </CardTitle>



        <CardDescription className="text-slate-400">



          {readMode



            ? "First-read ladder: narrative chips introduce each guardrail, why it matters, and what success looks like."



            : "Unified guard panel linking geometry, parametric gain, averaging, and the curvature ledger."}



        </CardDescription>



        <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-4 space-y-3">



          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">



            <p className="text-sm text-slate-200">



              <span className="font-semibold text-cyan-200">Thesis:</span>{" "}



              <em>



                Spacetime is a dynamical medium. We see it stretch (cosmic expansion), shear (frame-dragging), and ring (gravitational waves). In GR, what controls those deformations is the stress-energy that null geodesics sample, and when actuation is much faster than light-crossing, GR responds to the cycle-average &lt;T_mu nu&gt;. That is the bridge from "space is movable" to our drive proxy.



              </em>



            </p>



            <div



              id="ledger-averaging"



              className={`flex w-full max-w-sm flex-col gap-1 rounded-md border px-3 py-2 text-xs ${averagingBadgeTone}`}



            >



              <div className="flex items-center gap-2 uppercase tracking-wide text-[11px]">



                {averagingBadgeIcon}



                <span>Averaging valid</span>



              </div>



              <div className="font-mono text-[11px]">{averagingBadgeText}</div>



              <div className="text-[11px] text-slate-300">{averagingBadgeSubtext}</div>



            </div>



          </div>



          <p className="text-xs text-slate-300">



            <strong>Why this is allowed:</strong> GR already lets space change shape and flow. When the actuation timescale is much shorter than light-crossing (epsilon &lt;&lt; 1, TS &gt;&gt; 1), null rays integrate many strobes and the field equations respond to the average stress-energy <span className="font-mono">&lt;T_mu nu&gt;</span>. Our panel therefore reports <span className="font-mono">kappa_drive</span> from the cycle-averaged flux, gated by tile sub-threshold physics and the quantum-inequality margin zeta.



          </p>



          <div className="grid gap-3 md:grid-cols-2">



            <GuardBadge



              label="Parametric pump guard"



              ok={paramGuardOk}



              value={



                Number.isFinite(lambdaEff) && Number.isFinite(lambdaMargin)



                  ? `lambda0 cos(phi) ${lambdaEffDisplay} / margin ${lambdaMarginDisplay}`



                  : "Parametric sweep idle"



              }



              description={`Keep |lambda0 cos(phi)| < 1 with ${toPercent(SUB_THRESHOLD_MARGIN, 2)} margin; rho cutoff ${toFixed(RHO_CUTOFF, 2)}.`}



              readMode={readMode}



              readValue={



                Number.isFinite(lambdaMargin)



                  ? `Margin ${lambdaMarginDisplay}; rho ${rhoGuardDisplay}; cutoff ${toFixed(RHO_CUTOFF, 2)}`



                  : "Awaiting sweep telemetry."



              }



              readDescription="Sweep helpers enforce rho cutoff 0.9 and margin 0.02 so tiles stay sub-threshold before averaging."



            />



            <GuardBadge



              label="QI margin"



              ok={zetaOk}



              value={Number.isFinite(zeta) ? `zeta = ${toFixed(zeta, 3)}` : "zeta unknown"}



              description="Ford-Roman sampling guard keeps zeta <= 1 before trusting the proxy."



              readMode={readMode}



              readValue={



                Number.isFinite(zeta)



                  ? `Quantum-inequality margin ${toFixed(zeta, 3)}; solver freezes duty at one.`



                  : "Quantum-inequality margin unavailable."



              }



              readDescription="Ledger Step C3: duty gating holds zeta <= 1 so the cycle-average stays lawful."



            />



          </div>



        </div>



        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">



          <button



            type="button"



            onClick={() => setReadMode((prev) => !prev)}



            aria-pressed={readMode}



            className={`flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold transition ${



              readMode



                ? "border-emerald-400/80 bg-emerald-500/20 text-emerald-200"



                : "border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"



            }`}



          >



            {readMode ? "Read mode on" : "Read mode"}



          </button>



          <Badge className="bg-slate-800 text-slate-200">



            {readMode ? `Mode profile ${modeTitle[mode] ?? mode}` : `Mode: ${modeTitle[mode] ?? mode}`}



          </Badge>



          <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">



            {readMode ? `Average duty ${toPercent(dEff, 3)}` : `d_eff ${toPercent(dEff, 3)}`}



          </Badge>



          <Badge className={`${zetaOk ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border border-amber-500/40 bg-amber-500/10 text-amber-300"}`}>



            {readMode ? `Ford-Roman ratio ${toFixed(zeta, 3)}` : `zeta ${toFixed(zeta, 3)}`}



          </Badge>



          <Badge className={`border ${averagingBadgeTone}`}>



            {readMode ? `Timescale ${tsDisplay} / eps ${epsilonDisplay}` : `TS ${tsDisplay} / eps ${epsilonDisplay}`}



          </Badge>



          <Badge className="bg-slate-800 text-slate-200">



            {readMode



              ? `Tiles engaged ${Number.isFinite(mass.N_tiles) ? mass.N_tiles.toLocaleString() : "n/a"}`



              : `N_tiles ${Number.isFinite(mass.N_tiles) ? mass.N_tiles.toLocaleString() : "? "}`}



          </Badge>



        </div>



      </CardHeader>



      <CardContent className="space-y-6">


        <section className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 space-y-4">

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">

            <LineChart className="h-4 w-4 text-cyan-300" />

            Proof -&gt; Proxy Bridge

          </div>

          <div className="grid gap-3 md:grid-cols-3">

            {proofBridgeCards.map((card) => (

              <a

                key={card.key}

                href={card.href}

                className="group rounded-lg border border-slate-800/70 bg-slate-900/40 p-3 text-left transition hover:border-cyan-500/60 hover:bg-slate-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"

              >

                <div className="text-[11px] uppercase tracking-wide text-slate-400">{card.title}</div>

                <p className="mt-2 text-xs text-slate-300">{card.observation}</p>

                <p className="mt-2 text-[11px] text-slate-400">What GR sees -&gt; {card.grSees}</p>

                <p className="mt-1 text-[11px] text-cyan-300">What the panel uses -&gt; {card.panel}</p>

                <p className="mt-2 text-[10px] text-slate-500">

                  Reference {card.reference.label}{" "}

                  <a

                    className="text-cyan-300 underline-offset-2 hover:text-cyan-200 hover:underline"

                    href={card.reference.href}

                    rel="noreferrer noopener"

                    target="_blank"

                  >

                    {card.reference.citation}

                  </a>

                </p>

              </a>

            ))}

          </div>

          <div className="space-y-1 text-xs text-slate-300">

            <p><strong>Space is dynamical.</strong> Expansion, waves, and dragging show that geometry itself moves.</p>

            <p><strong>GR reacts to averages when actuation is quick.</strong> epsilon &lt;&lt; 1 and TS &gt;&gt; 1 put us in the cycle-average regime.</p>

            <p><strong>Our knobs map to those averages.</strong> Duty, sectoring, and guards feed the same variables the ledger exposes.</p>

          </div>

          <div className="overflow-hidden rounded-lg border border-slate-800/70 bg-slate-900/40">

            <table className="w-full text-xs">

              <thead className="bg-slate-900/60 text-slate-300">

                <tr>

                  <th className="px-3 py-2 text-left font-semibold">Observable proof</th>

                  <th className="px-3 py-2 text-left font-semibold">GR statement</th>

                  <th className="px-3 py-2 text-left font-semibold">Panel knob / badge</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-800/60">

                {proofProxyRows.map((row) => (

                  <tr key={row.key} className="text-slate-300">

                    <td className="px-3 py-2 align-top text-slate-200">

                      <div className="font-semibold">{row.proof}</div>

                      <div className="mt-1 text-[10px] font-normal text-slate-500">

                        Reference {row.reference.label}{" "}

                        <a

                          className="text-cyan-300 underline-offset-2 hover:text-cyan-200 hover:underline"

                          href={row.reference.href}

                          rel="noreferrer noopener"

                          target="_blank"

                        >

                          {row.reference.citation}

                        </a>

                      </div>

                    </td>

                    <td className="px-3 py-2">{row.statement}</td>

                    <td className="px-3 py-2 text-cyan-300">{row.knob}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div

            id="ledger-step-b"

            className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-4"

          >

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">

                  Speed from kappa ratio

                </div>

                <p className="mt-1 text-xs text-slate-300">

                  If averaging is valid and zeta &le; 1, E_potato = kappa_drive / kappa_body entering the ledger's green band marks the engineering condition for steering a local rest region.

                </p>

              </div>

              <div className={`rounded-md border px-4 py-2 text-right font-mono text-sm ${ratioBadgeClass}`}>

                <div>E_potato</div>

                <div className="text-base">{kappaRatioDisplay}</div>

              </div>

            </div>

            <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-400">

              <span>kappa_drive {kappaDriveDisplay} 1/m^2</span>

              <span>kappa_body {kappaBodyDisplay} 1/m^2</span>

            </div>

          </div>

        </section>






        {readMode ? (



          <section className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">



            <div className="flex flex-col gap-1">



              <h3 className="text-sm font-semibold text-slate-100">First-read ladder</h3>



              <p className="text-xs text-slate-300">



                Introduce each knob when it appears, name why it matters, and show what success looks like before



                moving on.



              </p>



            </div>



            <div className="mt-4 grid gap-4 lg:grid-cols-2">



              <div className="space-y-4">



                <div>



                  <h4 className="text-xs font-semibold uppercase tracking-wide text-cyan-200">



                    Geometry &amp; spectrum



                  </h4>



                  <ul className="mt-2 space-y-2">



                    {geometryFirstRead.map((item) => (



                      <li



                        key={item.key}



                        className="rounded-lg border border-slate-800/70 bg-slate-900/60 p-3 text-xs text-slate-300"



                      >



                        <div className="flex items-start justify-between gap-2">



                          <div className="flex flex-1 items-start gap-2">



                            <div>{item.chip}</div>



                            <span>{item.plain}</span>



                          </div>



                          <span className={`font-mono text-[11px] ${item.muted ? "text-slate-500" : "text-slate-200"}`}>

                            {item.value}

                          </span>



                        </div>



                        <p className="mt-1 text-[11px] text-slate-400">{item.lookFor}</p>



                      </li>



                    ))}



                  </ul>



                </div>



                <div>



                  <h4 className="text-xs font-semibold uppercase tracking-wide text-cyan-200">



                    Parametric DCE tile



                  </h4>



                  <ul className="mt-2 space-y-2">



                    {tileFirstRead.map((item) => (



                      <li



                        key={item.key}



                        className="rounded-lg border border-slate-800/70 bg-slate-900/60 p-3 text-xs text-slate-300"



                      >



                        <div className="flex items-start justify-between gap-2">



                          <div className="flex flex-1 items-start gap-2">



                            <div>{item.chip}</div>



                            <span>{item.plain}</span>



                          </div>



                          <span className="font-mono text-[11px] text-slate-200">{item.value}</span>



                        </div>



                        <p className="mt-1 text-[11px] text-slate-400">{item.lookFor}</p>



                      </li>



                    ))}



                  </ul>



                </div>



              </div>



              <div className="space-y-4">



                <div>



                  <h4 className="text-xs font-semibold uppercase tracking-wide text-cyan-200">



                    Time slicing &amp; GR averaging



                  </h4>



                  <ul className="mt-2 space-y-2">



                    {averagingFirstRead.map((item) => (



                      <li



                        key={item.key}



                        className="rounded-lg border border-slate-800/70 bg-slate-900/60 p-3 text-xs text-slate-300"



                      >



                        <div className="flex items-start justify-between gap-2">



                          <div className="flex flex-1 items-start gap-2">



                            <div>{item.chip}</div>



                            <span>{item.plain}</span>



                          </div>



                          <span className="font-mono text-[11px] text-slate-200">{item.value}</span>



                        </div>



                        <p className="mt-1 text-[11px] text-slate-400">{item.lookFor}</p>



                      </li>



                    ))}



                  </ul>



                </div>



                <div>



                  <h4 className="text-xs font-semibold uppercase tracking-wide text-cyan-200">



                    Drive proxy &amp; green zone



                  </h4>



                  <ul className="mt-2 space-y-2">



                    {driveFirstRead.map((item) => (



                      <li



                        key={item.key}



                        className="rounded-lg border border-slate-800/70 bg-slate-900/60 p-3 text-xs text-slate-300"



                      >



                        <div className="flex items-start justify-between gap-2">



                          <div className="flex flex-1 items-start gap-2">



                            <div>{item.chip}</div>



                            <span>{item.plain}</span>



                          </div>



                          <span className="font-mono text-[11px] text-slate-200">{item.value}</span>



                        </div>



                        <p className="mt-1 text-[11px] text-slate-400">{item.lookFor}</p>



                      </li>



                    ))}



                  </ul>



                </div>



                <div>



                  <h4 className="text-xs font-semibold uppercase tracking-wide text-cyan-200">



                    Energy bookkeeping



                  </h4>



                  <ul className="mt-2 space-y-2">



                    {energyFirstRead.map((item) => (



                      <li



                        key={item.key}



                        className="rounded-lg border border-slate-800/70 bg-slate-900/60 p-3 text-xs text-slate-300"



                      >



                        <div className="flex items-start justify-between gap-2">



                          <div className="flex items-start gap-2">



                            <div>{item.chip}</div>



                            <span>{item.plain}</span>



                          </div>



                          <span className="font-mono text-[11px] text-slate-200">{item.value}</span>



                        </div>



                        <p className="mt-1 text-[11px] text-slate-400">{item.lookFor}</p>



                      </li>



                    ))}



                  </ul>



                </div>



              </div>



            </div>



          </section>



        ) : null}







        <BetweenPanels show={readMode} title="Geometry -> Tile">
          <p>
            With the GR side in hand, the tile array supplies the source -- but only while every resonator stays comfortably sub-threshold.
          </p>
        </BetweenPanels>



        {/* Band A: Tile thresholds */}



        <section className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 shadow-inner">



          <div className="flex items-start justify-between gap-3">



            <div>



              <h3 className="text-sm font-semibold text-slate-100">Tile thresholds</h3>



              <p className="text-xs text-slate-400">



                {readMode



                  ? "Margin shows how far each tile is from the runaway boundary; staying above the guard floor keeps modulation stable."



                  : `Margin to runaway computed from live sweep (1 - |??cos? |). Guardrails: margin ?0? ${toPercent(



                      SUB_THRESHOLD_MARGIN,



                      1,



                    )}; ? < ${RHO_CUTOFF}.`}



              </p>



            </div>



            <Badge



              className={`${



                Number.isFinite(tileStats.minMargin) && tileStats.minMargin > SUB_THRESHOLD_MARGIN



                  ? "bg-emerald-500/10 text-emerald-300"



                  : "bg-amber-500/10 text-amber-300"



              }`}



            >



              {readMode ? `Closest margin ${toPercent(tileStats.minMargin, 2)}` : `min margin ${toPercent(tileStats.minMargin, 2)}`}



            </Badge>



          </div>



          <div className="mt-4 grid gap-4 md:grid-cols-[180px,1fr]">



            <div className="flex flex-col items-center gap-3">



              <svg viewBox="0 0 120 120" className="h-36 w-36 rounded-lg bg-slate-900/80">



                <defs>



                  <linearGradient id="tileGrad" x1="0%" x2="0%" y1="0%" y2="100%">



                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.8} />



                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.8} />



                  </linearGradient>



                </defs>



                <rect x={0} y={0} width={120} height={120} fill="#0f172a" rx={6} />



                <line x1={0} y1={96} x2={120} y2={96} stroke="#1e293b" strokeWidth={0.75} />



                <line x1={24} y1={0} x2={24} y2={120} stroke="#1e293b" strokeWidth={0.75} />



                {tilePoints.map((point, idx) => {



                  const phiNorm = ((point.phiDeg % 360) + 360) % 360;



                  const x = (phiNorm / 360) * 100 + 10;



                  const y = 100 - clamp(point.rho, 0, 1) * 90;



                  const color = point.margin <= SUB_THRESHOLD_MARGIN || point.rho >= RHO_CUTOFF ? "#f97316" : "url(#tileGrad)";



                  return <circle key={idx} cx={x} cy={y} r={2.4} fill={color} opacity={point.stable ? 0.85 : 0.4} />;



                })}



              </svg>



              <div className="w-full">



                <div className="text-[11px] uppercase tracking-wide text-slate-400">Distance to edge</div>



                <div className="mt-1 h-2 w-full rounded-full bg-slate-800">



                  <div



                    className={`${



                      Number.isFinite(tileStats.minMargin) && tileStats.minMargin > SUB_THRESHOLD_MARGIN



                        ? "bg-emerald-500"



                        : "bg-amber-500"



                    } h-full rounded-full transition-all`}



                    style={{ width: `${clamp((tileStats.minMargin ?? 0) / 0.2, 0, 1) * 100}%` }}



                  />



                </div>



              </div>



            </div>



            <div className="grid gap-3 text-xs text-slate-300 md:grid-cols-2">



              <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">



                <div className="flex items-center gap-2 text-slate-200">



                  <Gauge className="h-4 w-4 text-cyan-300" />



                  Sweep snapshot



                </div>



                <dl className="mt-2 space-y-1">



                  <div className="flex justify-between">



                    <dt>Samples</dt>



                    <dd>{readMode ? `${tilePoints.length} live sweep samples` : tilePoints.length}</dd>



                  </div>



                  <div className="flex justify-between">



                    <dt>Guard hits</dt>



                    <dd>



                      {readMode



                        ? `${tileStats.clipped} tiles breached the guard thresholds`



                        : tileStats.clipped}



                    </dd>



                  </div>



                  <div className="flex justify-between">



                    <dt>Unstable</dt>



                    <dd>



                      {readMode ? `${tileStats.unstable} samples flagged unstable` : tileStats.unstable}



                    </dd>



                  </div>



                </dl>



              </div>



              <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">



                <div className="flex items-center gap-2 text-slate-200">



                  <Atom className="h-4 w-4 text-emerald-300" />



                  Gains &amp; guards



                </div>



                <ul className="mt-2 space-y-1">



                  <li>



                    {readMode



                      ? Number.isFinite(gammaGeo)



                        ? `Geometric gain lifts stored energy by ${Math.pow(gammaGeo!, 3).toExponential(3)} when cubed.`



                        : "Geometric gain unavailable."



                      : `?_geo = ${toFixed(gammaGeo, 1)}`}



                  </li>



                  <li>



                    {readMode



                      ? Number.isFinite(avgQL)



                        ? `Average loaded Q sits at ${avgQL.toFixed(0)}, keeping resonators inside the green zone.`



                        : "Average loaded Q unavailable."



                      : `Q_L avg = ${Number.isFinite(avgQL) ? avgQL.toFixed(0) : "? "}`}



                  </li>



                  <li>



                    {readMode



                      ? `Rho guard trips once the sweep passes ${RHO_CUTOFF}, preventing drive gain spikes.`



                      : `? cutoff = ${RHO_CUTOFF}`}



                  </li>



                  <li>



                    {readMode



                      ? `Margin floor enforces a minimum headroom of ${toPercent(SUB_THRESHOLD_MARGIN, 1)} for every tile.`



                      : `Margin floor = ${toPercent(SUB_THRESHOLD_MARGIN, 1)}`}



                  </li>



                </ul>



              </div>



            </div>



          </div>



          <div className="mt-3 text-[11px] text-slate-400">



            {readMode



              ? "Use the sweep to confirm every tile keeps enough headroom; any red marker means immediate retuning before the guard is fully tripped."



              : "Sweep data mirrors the Spectrum Tuner guard constants; a red badge signals tiles clipped or within the configured margin."}



          </div>



          <p className="mt-3 text-[11px] text-slate-400">
            Averaging (TS &gt;&gt; 1) says GR samples T_mu nu as a cycle-average; the Ford-Roman guard (zeta &lt;= 1) sets how much we may present, and q_mech &lt;= 1 keeps the hardware honest.
          </p>



        </section>







        <BetweenPanels show={readMode} title="Tile -> Guards">



          <p>



            Parametric gain wants to run away; we ride the ridge but never cross it: margin ?0? 2%, ? &lt; {RHO_CUTOFF}, and



            ?_eff stays above floor.



          </p>



        </BetweenPanels>







        {/* Band B: Averaging lever */}



        <section className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4">



          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">



            <div>



              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">



                <Activity className="h-4 w-4 text-cyan-300" />



                Averaging lever



              </h3>



              <p



                className={`text-xs ${readMode ? "text-slate-300" : "font-mono text-cyan-200"}`}



              >



                {describeEquation(



                  "d_eff",



                  "d_eff = d_burst ? S_live / S_total",



                  "Effective duty equals burst duty multiplied by the share of sectors that stay lit.",



                )}



              </p>



            </div>



            <div className="flex flex-wrap gap-2 text-xs">



              <Badge className="bg-slate-800 text-slate-200">



                {readMode ? `Live sectors ${sectorsLive}` : `S_live = ${sectorsLive}`}



              </Badge>



              <Badge className="bg-slate-800 text-slate-200">



                {readMode ? `Total sectors ${sectorsTotal}` : `S_total = ${sectorsTotal}`}



              </Badge>



              <Badge className="bg-slate-800 text-slate-200">



                {readMode



                  ? `Local burst duty ${toPercent(burstLocal, 2)}`



                  : `d_burst(local) = ${toPercent(burstLocal, 2)}`}



              </Badge>



            </div>



          </div>



          <p className="mt-2 text-xs text-slate-300">



            {readMode



              ? "When fewer sectors stay active, d_eff shrinks and the drive contributes less exotic mass. Emergency mode adds sectors; Standby turns them all off."



              : "Mode policy selects live sectors, so d_eff tracks operational mode linearly. Cruise narrows S_live, Emergency widens it, and Standby zeroes d_eff."}



          </p>



        </section>







        <BetweenPanels show={readMode} title="Guards -> Averaging">



          <p>



            Strobing spreads local spikes over time. GR only couples to the cycle-average when TS &gt;&gt; 1, and quantum



            inequalities cap the duty via <span className="font-mono">?</span>.



          </p>



        </BetweenPanels>







        {/* Band C: Power ?   Exotic mass */}



        <section className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">



          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">



            <div>



              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">



                <Sigma className="h-4 w-4 text-indigo-300" />



                Power ?   exotic mass



              </h3>



              <p



                className={`text-xs ${readMode ? "text-slate-300" : "font-mono text-cyan-200"}`}



              >



                {describeEquation(



                  "M_exotic",



                  "M = [U_static ? ?_geo^3 ? Q_burst ? ?_VdB ? d_eff] ? N_tiles / c?",



                  "Exotic mass bookkeeping multiplies stored energy by geometric and Van Den Broeck gains, then scales by duty and tile count.",



                )}



              </p>



            </div>



            <Badge className="bg-emerald-500/10 text-emerald-300">



              {readMode



                ? `Exotic mass budget ${Number.isFinite(mass.mass) ? `${mass.mass.toExponential(3)} kg` : "n/a"}`



                : `M? 9 = ${Number.isFinite(mass.mass) ? `${mass.mass.toExponential(3)} kg` : "? "}`}



            </Badge>



          </div>



          <div className="mt-3 grid gap-3 text-xs text-slate-300 md:grid-cols-2">



            <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">



              <div className="text-[11px] uppercase tracking-wide text-slate-400">Inputs</div>



              <ul className="mt-1 space-y-1">



                <li>



                  {readMode



                    ? Number.isFinite(mass.U_static)



                      ? `Static energy magnitude contributes ${Math.abs(mass.U_static!).toExponential(3)} J before gains.`



                      : "Static energy input unavailable."



                    : `|U_static| = ${Number.isFinite(mass.U_static) ? Math.abs(mass.U_static).toExponential(3) : "? "} J`}



                </li>



                <li>



                  {readMode



                    ? Number.isFinite(mass.gammaGeo)



                      ? `Geometric storage gain cubed: ${Math.pow(mass.gammaGeo!, 3).toExponential(3)}.`



                      : "Geometric gain pending."



                    : `?_geo? = ${Number.isFinite(mass.gammaGeo) ? Math.pow(mass.gammaGeo!, 3).toExponential(3) : "? "}`}



                </li>



                <li>



                  {readMode



                    ? `Burst storage bank stays fixed at ${Q_BURST.toExponential(1)}, acting like a capacitor multiplier.`



                    : `Q_burst = ${Q_BURST.toExponential(1)}`}



                </li>



                <li>



                  {readMode



                    ? Number.isFinite(mass.gammaVdB)



                      ? `Van Den Broeck geometry multiplies the pocket by ${mass.gammaVdB!.toExponential(3)}.` 



                      : "Van Den Broeck gain unavailable."



                    : `?_VdB = ${Number.isFinite(mass.gammaVdB) ? mass.gammaVdB!.toExponential(3) : "? "}`}



                </li>



              </ul>



            </div>



            <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">



              <div className="text-[11px] uppercase tracking-wide text-slate-400">Operations</div>



              <ul className="mt-1 space-y-1">



                <li>



                  {readMode



                    ? `Effective duty currently ${toPercent(dEff, 3)}; higher duty scales exotic mass linearly.`



                    : `d_eff = ${toPercent(dEff, 3)}`}



                </li>



                <li>



                  {readMode



                    ? Number.isFinite(mass.N_tiles)



                      ? `${mass.N_tiles.toLocaleString()} tiles contribute to the budget.`



                      : "Tile count unavailable."



                    : `N_tiles = ${Number.isFinite(mass.N_tiles) ? mass.N_tiles.toLocaleString() : "? "}`}



                </li>



                <li>



                  {readMode



                    ? Number.isFinite(curvature.powerW)



                      ? `Average drive power feeds ${ (curvature.powerW! / 1e6).toFixed(3)} MW into the pocket.`



                      : "Average drive power unavailable."



                    : `P_avg = ${Number.isFinite(curvature.powerW) ? `${(curvature.powerW! / 1e6).toFixed(3)} MW` : "? "}`}



                </li>



                <li>



                  {readMode



                    ? `Mechanical spoiling must stay ?0? 1; current estimate ${toFixed(qMech, 2)}.`



                    : `q_mech ?0? 1 ?   ${toFixed(qMech, 2)}`}



                </li>



              </ul>



              <p className="mt-2 text-[11px] text-slate-400">



                {readMode



                  ? "Adjusting mode shifts d_eff and the exotic mass tally proportionally; the Ford? Roman guard caps the climb near unity."



                  : "Mode switches change d_eff, shifting M? 9 proportionally until ? ?   1."}



              </p>



            </div>



          </div>



        </section>







        <BetweenPanels show={readMode} title="Averaging -> Drive proxy">



          <p>



            With units and averages aligned, curvature density from the drive sits on the same axis as nature's? so we can



            talk in one <span className="font-mono">?</span>.



          </p>



        </BetweenPanels>







        {/* Band D: Curvature proxy */}



        <section className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">



          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">



            <div>



              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">



                <LineChart className="h-4 w-4 text-sky-300" />



                Curvature proxy &amp; Natario budget



              </h3>



              <p



                className={`text-xs ${readMode ? "text-slate-300" : "font-mono text-cyan-200"}`}



              >



                {describeEquation(



                  "kappa_proxy",



                  "? ?0? (8?G/cu) ? (P_avg/A) ? d_eff ? ? ?",



                  "Curvature proxy scales average power by duty and geometry gains, normalized by hull area.",



                )}



              </p>



            </div>



            <Badge className={kappaMuted ? "bg-slate-800 text-slate-400" : "bg-emerald-500/10 text-emerald-300"}>



              {readMode ? `Curvature proxy ${kappaDriveDisplay}` : `?_drive ?0? ${kappaDriveDisplay}`}



            </Badge>



          </div>



          <div className="mt-3 grid gap-3 text-xs text-slate-300 md:grid-cols-3">



            <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">



              <div className="text-[11px] uppercase tracking-wide text-slate-400">Inputs</div>



              <ul className="mt-1 space-y-1">



                <li>



                  {readMode



                    ? Number.isFinite(curvature.powerW)



                      ? `Average power injected: ${curvature.powerW!.toExponential(3)} W.`



                      : "Average power unavailable."



                    : `P_avg = ${Number.isFinite(curvature.powerW) ? `${curvature.powerW!.toExponential(3)} W` : "? "}`}



                </li>



                <li>



                  {readMode



                    ? Number.isFinite(curvature.hullArea)



                      ? `Hull exchange area: ${curvature.hullArea!.toFixed(0)} m?.`



                      : "Hull area unavailable."



                    : `A = ${Number.isFinite(curvature.hullArea) ? `${curvature.hullArea!.toFixed(0)} m?` : "? "}`}



                </li>



                <li>



                  {readMode



                    ? Number.isFinite(curvature.mathcalG)



                      ? `Composite geometry gain ? ? = ${toSci(curvature.mathcalG, 3)}.`



                      : "Composite geometry gain unavailable."



                    : `? ? = ${Number.isFinite(curvature.mathcalG) ? toSci(curvature.mathcalG, 3) : "? "}`}



                </li>



              </ul>



            </div>



            <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">



              <div className="text-[11px] uppercase tracking-wide text-slate-400">Natario audit</div>



              <ul className="mt-1 space-y-1">



                <li>



                  {readMode



                    ? Number.isFinite(natarioTheta)



                      ? `Server-calculated ? ?0? ${natarioTheta.toExponential(3)}; this tracks Natario volume targets.`



                      : "? estimate unavailable."



                    : `? (server) = ${Number.isFinite(natarioTheta) ? natarioTheta.toExponential(3) : "? "}`}



                </li>



                <li>



                  {readMode



                    ? "Audit ties ? to the geometric and Van Den Broeck gains multiplied by ??ad_eff."



                    : "?_geo? q ?_VdB ??ad_eff (? audit)"}



                </li>



                <li>



                  {readMode



                    ? "Shift budget grows with duty and geometry until the Ford? Roman guard halts it."



                    : "Shift budget rises ?? d_eff and ? ? until ? caps it."}



                </li>



              </ul>



            </div>



            <div className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">



              <div className="text-[11px] uppercase tracking-wide text-slate-400">Interpretation</div>





              <p>

                {readMode

                  ? "Keep power per area steady to preserve curvature density; d_eff adjustments show up instantly."

                  : "More tiles increase M_- linearly; keeping P_avg/A fixed preserves curvature density. Mode changes appear immediately through d_eff."

                }

              </p>

            </div>



          </div>



        </section>







        <BetweenPanels show={readMode} title="Proxy -> Objective">

          <p>

            {`Green-zone means the drive is physical and effective: q <= 1, gamma in band, zeta <= 1, TS >> 1. That's where "move a state of rest" starts to be budgetable.`}

          </p>

        </BetweenPanels>

        {readMode ? (

          <section className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">

            <h4 className="text-xs font-semibold uppercase tracking-wide text-cyan-200">What success looks like</h4>

            <ul className="mt-2 space-y-1 text-xs text-slate-200">

              <li>[OK] Tile safety: margin to lambda = 1 &gt;= 2%, rho &lt; 0.9, no linewidth collapse.</li>

              <li>[OK] Averaging valid: TS &gt;&gt; 1; badge shows "GR sees the average."</li>

              <li>{`[OK] QI guard held: zeta <= 1; duty increases stop at the cap.`}</li>

              <li>{`[OK] Green-zone mechanics: q_mech <= 1, 1e5 <= gamma_VdB <= 1e6.`}</li>

              <li>[Trend] Drive curvature budgeted: kappa_drive from (P/A), d_eff, and geometry gains.</li>

              <li>

                [Go] Operational takeaway: increasing total active tile area (more Casimir volume at the same a_eff)

                raises the duty-averaged negative energy M_- you can carry at the same guards.

              </li>

            </ul>

            <p className="mt-3 text-[11px] text-slate-300">

              Modes raise or lower d_eff. Because kappa_drive is proportional to (P/A), d_eff, and the geometry gain stack,

              the same ship power yields more or less moveable state of rest depending on duty and geometry and the total

              tile area caps how much negative energy you can carry while keeping zeta &lt;= 1 and TS &gt;&gt; 1.

            </p>

          </section>

        ) : null}



        {/* Band E: Guards */}



        <section className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">



          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">



            <ShieldCheck className="h-4 w-4 text-emerald-300" />



            Guard summary



          </h3>



          <div className="mt-3 grid gap-3 text-xs text-slate-300 md:grid-cols-2 lg:grid-cols-3">



            <GuardBadge



              label="Ford-Roman"



              ok={Number.isFinite(zeta) && zeta <= 1}



              value={`? = ${toFixed(zeta, 3)}`}



              description="QI budget keeps ? <= 1 by policy."



              readMode={readMode}



              readValue={



                Number.isFinite(zeta)



                  ? `Ford-Roman ratio ${toFixed(zeta, 3)}; staying at or below 1 keeps exotic matter requests lawful.`



                  : "Ford-Roman ratio unavailable."



              }



              readDescription="? approaching 1 means the auto-solver has frozen duty; change area (A) or Q_L to climb safely."



            />



            <GuardBadge



              label="Averaging"



              ok={Number.isFinite(ts) && ts > 10}



              value={Number.isFinite(ts) ? `TS = ${ts.toFixed(1)}` : "TS unavailable"}



              description="TS >> 1 ensures GR samples the cycle-average source."



              readMode={readMode}



              readValue={



                Number.isFinite(ts)



                  ? `Timescale ratio ${ts.toFixed(1)}; large values mean spacetime only feels the averaged source.`



                  : "Timescale ratio unavailable."



              }



              readDescription="TS too small; lengthen pulse spacing or shrink tile size until TS >> 1."



            />



            <GuardBadge



              label="Mechanical"



              ok={Number.isFinite(qMech) && qMech <= 1}



              value={Number.isFinite(qMech) ? `q_mech = ${qMech.toFixed(2)}` : "q_mech unknown"}



              description="?0?50 pm stroke keeps mechanical spoilage under unity."



              readMode={readMode}



              readValue={



                Number.isFinite(qMech)



                  ? `Mechanical spoilage ${qMech.toFixed(2)}; below 1 means actuators stay within safe stroke.`



                  : "Mechanical spoilage estimate unavailable."



              }



              readDescription="Protects ferrite stacks and prevents phase jitter from hardware backlash."



            />



            <GuardBadge



              label="Tile margin"



              ok={Number.isFinite(tileStats.minMargin) && tileStats.minMargin > SUB_THRESHOLD_MARGIN}



              value={Number.isFinite(tileStats.minMargin) ? `min margin ${toPercent(tileStats.minMargin, 2)}` : "no sweep"}



              description={`Guard trips when 1 - |? cos? | <= ${toPercent(SUB_THRESHOLD_MARGIN, 1)}.`}



              readMode={readMode}



              readValue={



                Number.isFinite(tileStats.minMargin)



                  ? `Closest tile margin ${toPercent(tileStats.minMargin, 2)}; falling below the floor risks runaway.`



                  : "Tile margin unknown."



              }



              readDescription="Margin to lambda = 1 is under 2%. Reduce depth or phase-detune."



            />



            <GuardBadge



              label="Green zone"



              ok={



                Number.isFinite(avgQL) &&



                avgQL > 1e5 &&



                Number.isFinite(gammaVdB) &&



                gammaVdB >= 1e5 &&



                gammaVdB <= 1e6



              }



              value={`Q_L ?0? ${Number.isFinite(avgQL) ? avgQL.toFixed(0) : "? "}, ?_VdB = ${



                Number.isFinite(gammaVdB) ? gammaVdB.toExponential(2) : "? "



              }`}



              description="Ledger safe band: Q_L > 10u, ?_VdB ??? [10u, 10v]."



              readMode={readMode}



              readValue={`Resonator health: ${



                Number.isFinite(avgQL) ? `Q_L ?0? ${avgQL.toFixed(0)}` : "Q_L unavailable"



              } & ${Number.isFinite(gammaVdB) ? `?_VdB = ${gammaVdB.toExponential(2)}` : "?_VdB unavailable"}.`}



              readDescription="Keeps tiles inside the ledger's green band so curvature density stays serviceable."



            />



            <GuardBadge



              label="Burst duty"



              ok={dEff > 0 && dEff < 1}



              value={`d_eff ${toPercent(dEff, 3)}`}



              description="Only live sectors contribute to the averaged source; Standby ?!  d_eff = 0."



              readMode={readMode}



              readValue={`Effective duty ${toPercent(



                dEff,



                3,



              )}; toggling modes raises or lowers the averaged source immediately.`}



              readDescription="Shows how much of the drive cycle is actually contributing to curvature."



            />



          </div>



        </section>



      </CardContent>



    </Card>



  );



}







function BetweenPanels({



  show,



  title,



  children,



}: {



  show: boolean;



  title: ReactNode;



  children: ReactNode;



}) {



  if (!show) return null;



  return (



    <div className="rounded-lg border border-slate-800/60 bg-slate-950/30 px-3 py-2">



      <div className="text-[11px] uppercase tracking-wide text-slate-400">{title}</div>



      <div className="mt-1 text-xs leading-relaxed text-slate-300">{children}</div>



    </div>



  );



}







function GuardBadge({



  label,



  ok,



  value,



  description,



  readMode,



  readValue,



  readDescription,



}: {



  label: string;



  ok: boolean;



  value: ReactNode;



  description: string;



  readMode: boolean;



  readValue?: ReactNode;



  readDescription?: string;



}) {



  const displayValue = readMode && readValue ? readValue : value;



  const displayDescription = readMode && readDescription ? readDescription : description;



  return (



    <div className={`rounded-lg border p-3 ${ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>



      <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">



        {ok ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />}



        {label}



      </div>



      <div className="mt-1 font-mono text-[11px] text-slate-200">{displayValue}</div>



      <p className="mt-1 text-[11px] text-slate-400">{displayDescription}</p>



    </div>



  );



}







