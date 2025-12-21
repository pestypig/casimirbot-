import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FrontProofsLedger } from "./FrontProofsLedger";
import { NeedleCavityBubblePanel } from "./NeedleCavityBubblePanel";
import { MODE_CONFIGS, useEnergyPipeline, type EnergyPipelineState } from "@/hooks/use-energy-pipeline";
import { PLANCK_LUMINOSITY_W } from "@/lib/physics-const";
import { openDocPanel } from "@/lib/docs/openDocPanel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type PipelineStatus = {
  ok?: boolean;
  natarioConstraint?: boolean;
  dutyEffective_FR?: number;
  thetaScaleExpected?: number;
  thetaScale?: number;
  warp?: unknown;
  natario?: unknown;
  warpUniforms?: Record<string, number>;
  capturedAt?: string;
};

type GroundingSource = {
  kind?: string;
  id?: string;
  path?: string;
  extra?: unknown;
};

type ResonancePatchRef = {
  id: string;
  path: string;
  kind?: string;
  score?: number;
};

type PlanDebugPayload = {
  ok?: boolean;
  traceId?: string;
  goal?: string;
  personaId?: string;
  planDsl?: string;
  resonancePatchId?: string | null;
  resonancePatches?: ResonancePatchRef[];
  groundingSources?: GroundingSource[];
  createdAt?: string;
};

type GrAppendixSection = {
  level: string;
  title: string;
  gr: ReactNode[];
  code: ReactNode[];
  solved?: {
    equation: ReactNode;
    fields: (ctx: GrSolvedCtx) => ReactNode;
  }[];
};

type GrSolvedCtx = {
  p?: EnergyPipelineState | null;
  fmt: (value: number | null | undefined, digits?: number) => string;
  num: (value: unknown) => number | null;
  pos: (value: unknown, allowZero?: boolean) => number | null;
  resolveHullDims: (p?: EnergyPipelineState | null) =>
    | { Lx: number; Ly: number; Lz: number; source: string }
    | null;
};

type GrRecipeCopy = {
  summary?: ReactNode;
  items: { label: string; body: ReactNode }[];
};

const fmtNumber = (value: unknown, digits = 3) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "n/a";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e4)) return n.toExponential(Math.max(0, digits - 1));
  return n.toFixed(digits).replace(/\.?0+$/, "");
};

const fmtPower = (value: unknown) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "n/a";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)} MW`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)} kW`;
  return `${n.toFixed(1)} W`;
};

const GR_RECIPE_MINDSET = {
  headline: "GR recipe mindset: supply, shape, and what GR is allowed to notice",
  bullets: [
    "Where you can put curvature: hull proper surface area and shell geometry set the canvas you can paint with tiles.",
    "How hard you can push: per-tile Casimir energy ladders into aggregate power and power-per-area.",
    "What GR will actually respond to: fast strobes are coarse-grained over a light-crossing window so GR mainly sees the averaged <T_{mu nu}>, not every spike."
  ],
  footer:
    "Workflow: prepare geometry, prepare the source term, choose a bubble profile, then apply duty/gating so the averaged field stays stable and GR-visible."
};

const GR_RECIPE_CHECKLIST = [
  "Canvas is correct: hullArea_m2 and N_tiles come from the induced-metric area and tile packing/layers.",
  "Dipole shape exists before amplification: theta_GR flips fore/aft because it scales with beta * d/dx f.",
  "Drive ladder matches server audit: theta_scale_expected carries gamma_geo^3 * q * gammaV * d_eff on both server and client.",
  "Averaging story stays true: the HF strobe is cycle-averaged over tau_LC so kappa_drive is a proxy, not a raw solve.",
  "Warp-module sanity gates stay green: geometry, amplification, quantum-safety, and stability checks stay within guardrails."
];

const PACKING = 0.88; // PAPER_GEO.PACKING (server/energy-pipeline.ts)
const RADIAL_LAYERS = 10; // PAPER_GEO.RADIAL_LAYERS (server/energy-pipeline.ts)

const GR_APPENDIX_SECTIONS: GrAppendixSection[] = [
  {
    level: "0",
    title: "Metric to induced area",
    gr: [
      <>
        Spacetime metric <code>ds^2 = g_{"{mu nu}"} dx^mu dx^nu</code>, spatial slice{" "}
        <code>dl^2 = gamma_{"{ij}"} dx^i dx^j</code>.
      </>,
      <>
        Induced surface metric <code>h_{"{ab}"}</code> with area element <code>dA = sqrt(det h) dxi^a dxi^b</code>.
      </>,
    ],
    code: [
      <>
        Hull area integrates <code>firstFundamentalForm</code> via <code>surfaceAreaEllipsoidMetric(...)</code> in{" "}
        <code>server/energy-pipeline.ts</code>.
      </>,
    ],
    solved: [
      {
        equation: (
          <>
            <code>R_geom (hull) = (Lx * Ly * Lz)^{"{1/3}"}</code>
          </>
        ),
        fields: ({ p, fmt, resolveHullDims }) => {
          const dims = resolveHullDims(p as any);
          const haveDims = Boolean(dims);
          const R = haveDims ? Math.cbrt(dims!.Lx * dims!.Ly * dims!.Lz) : null;
          return (
            <>
              {haveDims ? (
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold text-emerald-100">Hull dims</span>{" "}
                    <span className="text-[11px] text-slate-400">({dims!.source})</span>
                  </div>
                  <div className="font-mono text-emerald-100">
                    Lx={fmt(dims!.Lx)} m · Ly={fmt(dims!.Ly)} m · Lz={fmt(dims!.Lz)} m
                  </div>
                  <div className="text-emerald-100">
                    R_geom = {fmt(R)} m{" "}
                    <span className="text-[11px] text-slate-400">(volume-equivalent radius)</span>
                  </div>
                </div>
              ) : (
                <>Hull dims not present in snapshot (Lx/Ly/Lz); R_geom = n/a</>
              )}
              <br />
            </>
          );
        },
      },
      {
        equation: (
          <>
            <code>A_hull = &int; sqrt(det h) d^2xi, N_tiles ≈ floor(A_hull / A_tile) · (packing · radialLayers)</code>
          </>
        ),
        fields: ({ p, fmt, num, pos }) => {
          const A_hull =
            pos((p as any)?.hullArea_m2) ??
            pos((p as any)?.hullArea?.value) ??
            pos((p as any)?.tiles?.hullArea_m2);
          const tileAreaCm2 = pos((p as any)?.tileArea_cm2);
          const A_tile = tileAreaCm2 != null ? tileAreaCm2 * 1e-4 : null;
          const N_tiles = pos((p as any)?.N_tiles ?? (p as any)?.tiles?.total);
          const haveAll = A_hull != null && A_tile != null && N_tiles != null;
          return (
            <>
              {haveAll ? (
                <div className="space-y-1">
                  <div className="font-semibold text-emerald-100">Area & tiling</div>
                  <div className="font-mono text-emerald-100">
                    A_hull = {fmt(A_hull)} m² · A_tile = {fmt(A_tile, 4)} m² · N_tiles = {fmt(N_tiles)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    packing = {PACKING} · radial layers = {RADIAL_LAYERS}; pulled from <code>hullArea_m2</code>,{" "}
                    <code>tileArea_cm2</code>, <code>N_tiles</code>
                  </div>
                </div>
              ) : (
                <>Area / tiling fields unavailable in snapshot</>
              )}
            </>
          );
        },
      },
    ],
  },
  {
    level: "1",
    title: "Connection to Einstein tensor",
    gr: [
      <>
        Christoffel symbols{" "}
        <code>
          Gamma^rho_{"{mu nu}"} = 0.5 g^{"{rho sigma}"}(d_mu g_{"{nu sigma}"} + d_nu g_{"{mu sigma}"} - d_sigma g_{"{mu nu}"})
        </code>
        , Riemann -&gt; Ricci <code>R_{"{mu nu}"}</code> and scalar <code>R</code>.
      </>,
      <>
        Einstein tensor <code>G_{"{mu nu}"} = R_{"{mu nu}"} - 0.5 g_{"{mu nu}"} R</code>, field equation{" "}
        <code>G_{"{mu nu}"} = 8 pi G T_{"{mu nu}"}/c^4</code>.
      </>,
    ],
    code: [
      <>
        Phoenix copy uses <code>G_{"{mu nu}"} = 8 pi G * &lt;T_{"{mu nu}"}&gt;_{"{tau_LC}"}</code> as the coarse GR hook.
      </>,
      <>
        Curvature proxy <code>kappa_drive ~ (8 pi G / c^5) * (P/A) * d_eff * G_geom</code> appears in the Phoenix footer/docs.
      </>,
      <>
        kappa_drive is a power-density proxy (HF-averaged), not a full Einstein solve.
      </>,
      <>
        With <code>TS_ratio</code> ≈ 120 ≫ 1, GR sees ⟨T_{"{mu nu}"}⟩ over <code>tau_LC</code> (Isaacson HF regime); spikes are averaged.
      </>,
    ],
    solved: [
      {
        equation: (
          <>
            <code>&lt;T_{"{mu nu}"}&gt; -&gt; T00,T11,T22,T33 (cycle averaged)</code>
          </>
        ),
        fields: ({ p, fmt, num }) => {
          // Prefer the warp stress-energy tensor (can be anisotropic), then fall back to root stressEnergy
          const warpStress = (p as any)?.warp?.stressEnergyTensor;
          const stress = warpStress ?? (p as any)?.stressEnergy;
          const T00 = num((p as any)?.T00_avg ?? warpStress?.T00 ?? stress?.T00);
          const T11 = num((p as any)?.T11_avg ?? warpStress?.T11 ?? stress?.T11);
          const T22 = num((p as any)?.T22_avg ?? warpStress?.T22 ?? stress?.T22);
          const T33 = num((p as any)?.T33_avg ?? warpStress?.T33 ?? stress?.T33);
          const allMissing = [T00, T11, T22, T33].every((v) => v === null);
          const allZero = [T00, T11, T22, T33].every((v) => v === 0);
          return (
            <div className="space-y-1">
              <div className="font-semibold text-emerald-100">Cycle-averaged stress-energy</div>
              {allMissing ? (
                <div className="text-emerald-100">
                  Not provided in snapshot (pipeline did not emit <code>T_{"{mu nu}"}</code>)
                </div>
              ) : (
                <>
                  <div className="font-mono text-emerald-100">
                    T00={fmt(T00)} J/m³ · T11={fmt(T11)} J/m³ · T22={fmt(T22)} J/m³ · T33={fmt(T33)} J/m³
                  </div>
                  <div className="text-[11px] text-slate-400">
                    from <code>useEnergyPipeline</code>; units are SI J/m³ (c ≠ 1), so G_{"{mu nu}"} = 8πG T_{"{mu nu}"}/c⁴
                    {allZero ? " (value is zero; likely safed placeholder)" : ""}
                  </div>
                </>
              )}
            </div>
          );
        },
      },
      {
        equation: (
          <>
            <code>kappa_drive ~ (8 pi G / c^5) * (P_avg / A_hull) * d_eff * G_geom</code>
          </>
        ),
        fields: ({ p, fmt, num, pos }) => {
          const P_avg_MW = pos((p as any)?.P_avg_MW ?? (p as any)?.P_avg);
          const P_avg_W =
            pos((p as any)?.P_avg_W) ?? (P_avg_MW != null ? P_avg_MW * 1e6 : null);
          const A_hull =
            pos((p as any)?.hullArea_m2) ??
            pos((p as any)?.hullArea?.value) ??
            pos((p as any)?.tiles?.hullArea_m2);
          const d_eff = num((p as any)?.dutyEffectiveFR ?? (p as any)?.dutyEffective_FR);
          const gammaGeo = pos((p as any)?.gammaGeo);
          const G_geom = gammaGeo != null ? Math.pow(gammaGeo, 3) : null;
          return (
            <div className="space-y-1">
              <div className="font-semibold text-emerald-100">Curvature proxy inputs</div>
              <div className="font-mono text-emerald-100">
                P_avg={fmt(P_avg_W)} W · A_hull={fmt(A_hull)} m² · d_eff={fmt(d_eff)} · G_geom={fmt(G_geom)}
              </div>
              <div className="text-[11px] text-slate-400">G_geom = gammaGeo³ (geometry gain)</div>
              <div className="text-[11px] text-slate-400">
                pulled from <code>P_avg</code>, <code>hullArea_m2</code>, <code>dutyEffective_FR</code>,{" "}
                <code>gammaGeo^3</code>
              </div>
            </div>
          );
        },
      },
    ],
  },
  {
    level: "2",
    title: "3+1 split and York time",
    gr: [
      <>3+1 metric <code>ds^2 = -alpha^2 dt^2 + gamma_{"{ij}"}(dx^i + beta^i dt)(dx^j + beta^j dt)</code>.</>,
      <>
        Extrinsic curvature{" "}
        <code>K_{"{ij}"} = (1/(2 alpha))(nabla_i beta_j + nabla_j beta_i - d_t gamma_{"{ij}"})</code>; trace{" "}
        <code>theta_GR = K^i_{"{i}"}</code>. Hamiltonian constraint{" "}
        <code>R^(3) + K^2 - K_{"{ij}"} K^{"{ij}"} = 16 pi G rho</code>.
      </>,
    ],
    code: [
      <>
        Hull shader <code>kfast</code> uses flat <code>gamma_{"{ij}"}</code>, <code>alpha ~ 1</code>, and shift{" "}
        <code>beta</code> along <code>x</code> with profile <code>f(r_s)</code>.
      </>,
      <>
        In <code>client/src/components/Hull3DRenderer.ts</code> we compute <code>thetaGR = beta * df/dr_hat</code> and{" "}
        <code>rhoGR = (K^2 - K_{"{ij}"} K^{"{ij}"})/(16 pi)</code> (G=c=1) from the shader outputs.
      </>,
      <>
        <code>client/src/components/AlcubierrePanel.tsx</code> repeats the same constraint for the equatorial slice.
      </>,
    ],
    solved: [
      {
        equation: (
          <>
            <code>theta_GR ~ beta * (df/dr_s) * cos(phi)</code>
          </>
        ),
        fields: ({ p, fmt, num, pos }) => {
          const beta =
            num((p as any)?.bubble?.beta) ??
            num((p as any)?.beta) ??
            num((p as any)?.warp?.beta) ??
            num((p as any)?.warp?.bubble?.beta);
          const sigma =
            pos((p as any)?.bubble?.sigma) ??
            pos((p as any)?.sigma) ??
            pos((p as any)?.warp?.sigma) ??
            pos((p as any)?.warp?.bubble?.sigma);
          const thetaExpected = num((p as any)?.thetaScaleExpected ?? (p as any)?.thetaScale);
          const bubbleDisabled = (beta ?? 0) === 0 && (sigma ?? 0) === 0;
          return (
            <div className="space-y-1">
              <div className="font-semibold text-emerald-100">York-time inputs (snapshot)</div>
              <div className="font-mono text-emerald-100">
                beta={fmt(beta)} · sigma={fmt(sigma)} · thetaScaleExpected={fmt(thetaExpected)}
              </div>
              {bubbleDisabled ? (
                <div className="text-[11px] text-amber-300">Bubble disabled in snapshot (beta=0, sigma=0)</div>
              ) : null}
              <div className="text-[11px] text-slate-400">
                pulled from warp fields and <code>thetaScaleExpected</code> in <code>useEnergyPipeline</code>
              </div>
            </div>
          );
        },
      },
    ],
  },
  {
    level: "3",
    title: "Warp-bubble profile",
    gr: [
      <>
        Choose <code>f(r_s)</code> ~ 1 inside / 0 outside and shift <code>beta^x = -v_s f(r_s)</code>; on the equator{" "}
        <code>theta_GR ~ beta (df/dr_s) cos phi</code> (dipole).
      </>,
    ],
    code: [
      <>
        Planar panel uses <code>dTopHatDr</code> to build <code>thetaField_GR</code> ~ <code>beta * cos(phi) * dfdr</code>{" "}
        with gating in <code>AlcubierrePanel.tsx</code>.
      </>,
      <>Analytic wall check <code>theta_expected = beta * dfdr_peak_est</code> is displayed in the same panel.</>,
    ],
    solved: [
      {
        equation: (
          <>
            <code>f(r_s) ~ top-hat(sigma, R), df/dr_s from LUT</code>
          </>
        ),
        fields: ({ p, fmt, pos }) => {
          const sigma =
            pos((p as any)?.bubble?.sigma) ??
            pos((p as any)?.sigma) ??
            pos((p as any)?.warp?.sigma) ??
            pos((p as any)?.warp?.bubble?.sigma);
          const R =
            pos((p as any)?.bubble?.R) ??
            pos((p as any)?.bubble?.radius) ??
            pos((p as any)?.R) ??
            pos((p as any)?.radius);
          const bubbleDisabled = (sigma ?? 0) === 0 && (R ?? 0) === 0;
          return (
            <div className="space-y-1">
              <div className="font-semibold text-emerald-100">Warp profile (snapshot)</div>
              <div className="font-mono text-emerald-100">sigma={fmt(sigma)} · R_metric={fmt(R)}</div>
              {bubbleDisabled ? (
                <div className="text-[11px] text-amber-300">Bubble profile not configured in snapshot (sigma=R=0)</div>
              ) : null}
              <div className="text-[11px] text-slate-400">
                top-hat profile sampled in shader LUT; fields from <code>pipeline.sigma</code> and{" "}
                <code>pipeline.bubble.R</code>
              </div>
            </div>
          );
        },
      },
    ],
  },
  {
    level: "4",
    title: "Drive ladder (theta_drive)",
    gr: [<>Operational scalar <code>theta_drive = theta_GR * (gamma_geo^3 * Q * gamma_VdB) * duty/gate</code>.</>],
    code: [
      <>
        Hull shader multiplies <code>thetaGR</code> by <code>ampChain * gate * gateWF</code>; the planar field uses the same
        chain.
      </>,
      <>Server-side <code>thetaScaleExpected</code> already carries <code>gamma_geo^3 * q * gamma_VdB * d_eff</code>.</>,
    ],
    solved: [
      {
        equation: (
          <>
            <code>theta_expected = gamma_geo^3 * q * gamma_VdB * d_eff</code>
          </>
        ),
        fields: ({ p, fmt, num, pos }) => {
          const gammaGeo = pos((p as any)?.gammaGeo);
          const q = num((p as any)?.qSpoilingFactor ?? (p as any)?.q ?? (p as any)?.qSpoil);
          const gammaVdB =
            pos((p as any)?.gammaVanDenBroeck_mass) ??
            pos((p as any)?.gammaVanDenBroeck) ??
            pos((p as any)?.gamma_vdb);
          const d_eff = num((p as any)?.dutyEffectiveFR ?? (p as any)?.dutyEffective_FR);
          const thetaExpected = num((p as any)?.thetaScaleExpected);
          return (
            <div className="space-y-1">
              <div className="font-semibold text-emerald-100">Drive ladder inputs (snapshot)</div>
              <div className="font-mono text-emerald-100">
                gammaGeo={fmt(gammaGeo)} · q={fmt(q)} · gammaVdB={fmt(gammaVdB)} · d_eff={fmt(d_eff)}
              </div>
              <div className="text-emerald-100">
                thetaScaleExpected = {fmt(thetaExpected)}{" "}
                <span className="text-[11px] text-slate-400">(from <code>useEnergyPipeline</code>)</span>
              </div>
            </div>
          );
        },
      },
    ],
  },
  {
    level: "5",
    title: "Stress-energy to kappa_drive",
    gr: [
      <>
        Casimir density <code>E/A = -(pi^2 hbar c)/(720 a^3)</code>, per tile <code>U_static = (E/A) A_tile N</code>.
      </>,
      <>
        Modulated power feeds curvature proxy <code>kappa_drive ~ (8 pi G / c^5) * (P_avg / A_hull) * d_eff * G_geom</code>.
      </>,
    ],
    code: [
      <>
        Energy pipeline computes <code>P_avg</code> and hull area (via <code>surfaceAreaEllipsoidMetric</code>) and exposes
        them through the API.
      </>,
      <>
        Phoenix renders <code>kappa_drive(x)</code> from <code>P/A</code>, duty, and <code>gammaGeo</code> with a
        light-crossing average <code>tau_LC</code> per pixel.
      </>,
      <>Mode-dependent: P_target / P_cap and duty derive from <code>currentMode</code> guardrails.</>,
    ],
    solved: [
      {
        equation: (
          <>
            <code>U_static = chi_coupling * [-(pi^2 hbar c / 720) / a^3] * A_tile</code>
          </>
        ),
        fields: ({ p, fmt, pos, num }) => {
          const gap_nm = pos((p as any)?.gap_nm);
          const A_tile_cm2 = pos((p as any)?.tileArea_cm2);
          const A_tile = A_tile_cm2 != null ? A_tile_cm2 * 1e-4 : null;
          const U_static = num((p as any)?.U_static); // allow negative Casimir energy
          const chi = num((p as any)?.couplingChi);
          const missing = U_static === null || U_static === undefined;
          return (
            <div className="space-y-1">
              <div className="font-semibold text-emerald-100">Casimir per tile (snapshot)</div>
              {missing ? (
                <div className="text-emerald-100">U_static not provided in snapshot</div>
              ) : (
                <>
                  <div className="font-mono text-emerald-100">
                    gap={fmt(gap_nm)} nm · A_tile={fmt(A_tile, 4)} m² · U_static={fmt(U_static)} J
                  </div>
                  <div className="text-[11px] text-slate-400">
                    from <code>gap_nm</code>, <code>tileArea_cm2</code>, <code>U_static</code> in the pipeline payload
                    {chi != null ? ` · chi_coupling=${fmt(chi)}` : ""}
                  </div>
                </>
              )}
            </div>
          );
        },
      },
      {
        equation: (
          <>
            <code>P_avg, M_exotic, zeta, TS_ratio, gamma_VdB_guard</code>
          </>
        ),
        fields: ({ p, fmt, num, pos }) => {
          const P_avg_MW = pos((p as any)?.P_avg);
          const P_avg_W =
            pos((p as any)?.P_avg_W) ?? (P_avg_MW != null ? P_avg_MW * 1e6 : null);
          const planckRatio =
            P_avg_W != null && Number.isFinite(P_avg_W)
              ? P_avg_W / PLANCK_LUMINOSITY_W
              : null;
          const mode = (p as any)?.currentMode ?? (p as any)?.mode;
          const mechGuard = (p as any)?.mechGuard ?? {};
          const P_cap_W =
            num((p as any)?.P_cap_W ?? undefined) ??
            num(mechGuard?.pCap_W ?? undefined);
          const pApplied_W = num(mechGuard?.pApplied_W ?? undefined);
          const pShortfall_W = num(mechGuard?.pShortfall_W ?? undefined);
          const P_target_W =
            num((p as any)?.P_target_W ?? undefined) ??
            (mode ? num((MODE_CONFIGS as any)?.[mode as keyof typeof MODE_CONFIGS]?.powerTarget_W ?? undefined) : null);
          const M_exotic = pos((p as any)?.M_exotic);
          const zeta = num((p as any)?.zeta ?? undefined);
          const TS_ratio = num((p as any)?.TS_ratio ?? undefined);
          const gammaVdBGuard = (p as any)?.gammaVanDenBroeckGuard;
          const gammaLimit = pos(gammaVdBGuard?.limit ?? gammaVdBGuard?.gammaLimit);
          const dEff =
            num((p as any)?.dutyEffectiveFR ?? undefined) ??
            num((p as any)?.dutyEffective_FR ?? undefined) ??
            num((p as any)?.dutyShip ?? undefined);
          const dutyCycle = num((p as any)?.dutyCycle ?? undefined);
          const modeConfig = mode ? (MODE_CONFIGS as any)?.[mode as keyof typeof MODE_CONFIGS] : null;
          const localBurstFrac =
            num((p as any)?.localBurstFrac ?? undefined) ??
            num((p as any)?.dutyBurst ?? undefined) ??
            num((p as any)?.dutyGate ?? undefined) ??
            num((p as any)?.burstLocal ?? undefined) ??
            num(modeConfig?.localBurstFrac ?? undefined);
          const capped =
            (P_cap_W != null && P_avg_W != null && P_avg_W >= P_cap_W) || mechGuard?.status === "saturated";
          const fmtMw = (value: number | null | undefined) =>
            value == null || !Number.isFinite(value) ? "n/a" : `${fmt(value / 1e6)} MW`;
          const fmtMaybe = (value: number | null | undefined, digits = 3) =>
            value == null || !Number.isFinite(value) ? "n/a" : fmt(value, digits);
          return (
            <div className="space-y-1">
              <div className="font-semibold text-emerald-100">Power, mass, guards</div>
              <div className="font-mono text-emerald-100">
                P_avg={fmtMw(P_avg_W)}
                {capped ? (
                  <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                    Capped
                  </span>
                ) : null}
              </div>
              <div className="font-mono text-emerald-100">
                P/(c^5/G)={fmtMaybe(planckRatio, 3)}
              </div>
              <div className="font-mono text-emerald-100">
                P_target={fmtMw(P_target_W)} · P_cap={fmtMw(P_cap_W)} · mechGuard_status={mechGuard?.status ?? "n/a"}
              </div>
              <div className="font-mono text-emerald-100">
                pApplied={fmtMw(pApplied_W)} · pShortfall={fmtMw(pShortfall_W)}
              </div>
              <div className="font-mono text-emerald-100">
                d_eff={fmtMaybe(dEff)} · dutyCycle={fmtMaybe(dutyCycle ?? modeConfig?.dutyCycle)} · localBurstFrac=
                {fmtMaybe(localBurstFrac)}
              </div>
              <div className="font-mono text-emerald-100">
                M_exotic={fmtMaybe(M_exotic)} kg · zeta={fmtMaybe(zeta, 4)} · TS_ratio={fmtMaybe(TS_ratio)}
              </div>
              <div className="font-mono text-emerald-100">gammaVdB_limit={fmtMaybe(gammaLimit)}</div>
              <div className="text-[11px] text-slate-400">all fields from <code>useEnergyPipeline</code></div>
            </div>
          );
        },
      },
    ],
  },
];

const GR_RECIPE_COPY: Record<string, GrRecipeCopy> = {
  "0": {
    summary: <>Measure the hull canvas (induced area) and tile census that set every later denominator.</>,
    items: [
      {
        label: "In lay terms",
        body: (
          <>
            Before talking curvature, measure how much hull surface exists in the metric. More surface means more tiles
            (more available negative energy) but it can dilute P/A if power does not scale with area.
          </>
        )
      },
      {
        label: "How it matters to the solution",
        body: (
          <>A_hull feeds power density (P/A) and N_tiles sets the total energy/power budget that later ladders into kappa_drive and theta scaling.</>
        )
      },
      {
        label: "Code mirror",
        body: (
          <>
            Pipeline integrates the induced surface metric via <code>firstFundamentalForm</code>/
            <code>surfaceAreaEllipsoidMetric</code> into <code>hullArea_m2</code>, then tiles via packing + radial
            layers (PAPER_GEO) seeded from server hull dims.
          </>
        )
      }
    ]
  },
  "1": {
    summary: <>Decide what GR is allowed to notice via a coarse-grained source term.</>,
    items: [
      {
        label: "In lay terms",
        body: (
          <>
            Einstein says stress-energy drives curvature; here we build a drive-strength proxy and average it over the
            light-crossing window so fast strobing looks smooth to GR.
          </>
        )
      },
      {
        label: "How it matters to the solution",
        body: (
          <span>
            Time-scale separation keeps the bubble controllable: fast strobe -&gt; cycle-averaged T_{"{mu nu}"}, slow strobe -&gt; spiky/unstable.
          </span>
        )
      },
      {
        label: "Code mirror",
        body: (
          <>
            Phoenix UI spells out <code>tau_LC=d_hull/c</code>, <code>kappa_drive ~ (8piG/c^5)*(P/A)*d_eff*G_geom</code>, and the GR link
            <code>G_{"{mu nu}"} = 8 pi G &lt;T_{"{mu nu}"}&gt;_{"{tau_LC}"}</code> in the footer/docs.
          </>
        )
      }
    ]
  },
  "2": {
    summary: <>3+1 split and York-time / extrinsic curvature supply the raw dipole shape.</>,
    items: [
      {
        label: "In lay terms",
        body: (
          <>Expansion scalar theta from extrinsic curvature: negative in front (squeezing) and positive aft (expanding).</>
        )
      },
      {
        label: "How it matters to the solution",
        body: (
          <>Enforces paired dipole lobes and shell localization because df/dr drives the fore/aft sign flip.</>
        )
      },
      {
        label: "Code mirror",
        body: (
          <>
            Planar panel builds K_{"{ij}"} from <code>dTopHatDr</code> and forms a constraint scalar; the 3D hull shader returns{" "}
            <code>thetaGR</code>, which the renderer uses as the base field.
          </>
        )
      }
    ]
  },
  "3": {
    summary: <>Choose the bubble wall recipe (profile f and its derivative df/dr).</>,
    items: [
      {
        label: "In lay terms",
        body: (
          <>R sets bubble size, sigma sets wall sharpness, and df/dr is where the action concentrates; thinner walls spike gradients.</>
        )
      },
      {
        label: "How it matters to the solution",
        body: (
          <>Sharper sigma raises control difficulty and theta spikes; thicker walls are gentler but dilute the effect.</>
        )
      },
      {
        label: "Code mirror",
        body: (
          <>
            <code>dTopHatDr</code> drives both planar and 3D paths; the derivative is reused in the drive ladder and analytic wall checks.
          </>
        )
      }
    ]
  },
  "4": {
    summary: <>Apply the drive ladder: scale theta_GR with ampChain, duty, and sector gating.</>,
    items: [
      {
        label: "In lay terms",
        body: (
          <>Multiply the raw GR shape by geometry gain, VdB compression, spoiling/Q, effective duty, and sector gates; the balance lives here.</>
        )
      },
      {
        label: "How it matters to the solution",
        body: (
          <>Too much gain plus a sharp wall turns spiky; too little duty/gating underdrives the shell; gating preserves dipole parity and sane steering.</>
        )
      },
      {
        label: "Code mirror",
        body: (
          <>
            Hull shader multiplies <code>thetaGR</code> by <code>ampChain * gate * gateWF</code>; planar field mirrors it.{" "}
            <code>thetaScaleExpected</code> already carries <code>gamma_geo^3 * q * gammaVdB * d_eff</code> from the server.
          </>
        )
      }
    ]
  },
  "5": {
    summary: <>Convert tile physics into kappa_drive (power-density proxy).</>,
    items: [
      {
        label: "In lay terms",
        body: (
          <>Casimir per tile ladders to P_avg, divide by hull area for P/A, then apply duty and geometry gain to get the displayed kappa_drive heatmap.</>
        )
      },
      {
        label: "How it matters to the solution",
        body: (
          <>Larger hulls lower P/A unless power scales up; duty and geometry gain raise kappa_drive but are clamped by guardrails.</>
        )
      },
      {
        label: "Code mirror",
        body: (
          <>
            <code>calculateStaticCasimir</code> gives per-tile scaling; pipeline publishes P_avg and hull area, and Phoenix renders{" "}
            <code>kappa_drive = (8 pi G / c^5) * (P/A) * d_eff * G_geom</code> under the guard constraints.
          </>
        )
      }
    ]
  }
};

const PIPELINE_STATUS_URL = "/api/agi/pipeline/status";
const PLAN_DEBUG_URL = "/api/agi/pipeline/last-plan-debug";

export default function PipelineProofPanel() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [planDebug, setPlanDebug] = useState<PlanDebugPayload | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const { data: pipelineSnapshot } = useEnergyPipeline({
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });
  const mechanical = (pipelineSnapshot as any)?.mechanical ?? {};
  const modeKey = (pipelineSnapshot as any)?.currentMode as keyof typeof MODE_CONFIGS | undefined;
  const modelMode = (pipelineSnapshot as any)?.modelMode as EnergyPipelineState["modelMode"] | undefined;
  const gapUsed_nm = mechanical?.casimirGap_nm ?? (pipelineSnapshot as any)?.gap_nm;
  const gapGuard_nm = mechanical?.constrainedGap_nm ?? mechanical?.recommendedGap_nm;
  const gapRequested_nm = mechanical?.requestedGap_nm;
  const hasRequestedGap = Number.isFinite(Number(gapRequested_nm));
  const physicsCap_W = (pipelineSnapshot as any)?.physicsCap_W;
  const P_cap_W = (pipelineSnapshot as any)?.P_cap_W ?? (pipelineSnapshot as any)?.mechGuard?.pCap_W;
  const P_target_W =
    (pipelineSnapshot as any)?.P_target_W ??
    (modeKey ? (MODE_CONFIGS as any)[modeKey]?.powerTarget_W : undefined);
  const P_avg_W =
    (pipelineSnapshot as any)?.P_avg_W ??
    (Number.isFinite((pipelineSnapshot as any)?.P_avg)
      ? Number((pipelineSnapshot as any).P_avg) * 1e6
      : undefined);
  const safetyFactor = Number.isFinite(mechanical?.mechSafetyFactor) ? Number(mechanical.mechSafetyFactor) : null;
  const safetyMin = Number.isFinite(mechanical?.safetyFactorMin) ? Number(mechanical.safetyFactorMin) : null;
  const sigmaAllow_Pa = Number.isFinite(mechanical?.sigmaAllow_Pa) ? Number(mechanical.sigmaAllow_Pa) : null;
  const loadPressure_Pa = Number.isFinite(mechanical?.loadPressure_Pa) ? Number(mechanical.loadPressure_Pa) : null;
  const fmtGPa = (pa: number | null) =>
    pa == null ? "n/a" : `${fmtNumber(pa / 1e9, 3)} GPa`;

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    fetchPipelineStatus();
    fetchPlanDebug();
  };

  const fetchJson = async <T,>(url: string): Promise<T> => {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`status ${response.status}${text ? `: ${text.slice(0, 160)}` : ""}`);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`unexpected response (not JSON): ${text.slice(0, 160)}`);
    }
  };

  const fetchPipelineStatus = async () => {
    setStatusError(null);
    try {
      const payload = await fetchJson<PipelineStatus>(PIPELINE_STATUS_URL);
      setStatus(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(null);
      setStatusError(message);
    }
  };

  const fetchPlanDebug = async () => {
    setPlanError(null);
    try {
      const payload = await fetchJson<PlanDebugPayload>(PLAN_DEBUG_URL);
      setPlanDebug(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPlanDebug(null);
      setPlanError(message);
    }
  };

  const groundingSources = useMemo(() => planDebug?.groundingSources ?? [], [planDebug]);
  const resonancePatches = useMemo(() => planDebug?.resonancePatches ?? [], [planDebug]);

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Proof surface</p>
          <h1 className="text-xl font-semibold text-white">Pipeline Proof</h1>
          <p className="text-xs text-slate-400">Live pipeline truth + the evidence the planner used.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-md border border-cyan-400/60 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-5">
        <div className="mb-4">
          <FrontProofsLedger />
        </div>
        <div className="mb-4">
          <NeedleCavityBubblePanel />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <InfoCard title="Pipeline Status" subtitle={status?.capturedAt ? `Captured ${status.capturedAt}` : undefined}>
            {statusError ? (
              <ErrorText message={statusError} />
            ) : status ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <StatusBadge label="Natario constraint" value={status.natarioConstraint} />
                  <Metric label="DutyEffective_FR" value={status.dutyEffective_FR} />
                  <Metric label="thetaScaleExpected" value={status.thetaScaleExpected} />
                  <Metric label="thetaScale" value={status.thetaScale} />
                </div>
                {pipelineSnapshot ? (
                  <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs text-cyan-50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-cyan-100">
                        {modelMode === "raw"
                          ? "Profile: Mk.1 / raw (Casimir gap uses requested; mechanics not validated)"
                          : "Profile: lab / calibrated (Casimir gap uses mechanical guard; mechanics validated)"}
                      </p>
                      {modelMode ? (
                        <span className="rounded-md border border-cyan-400/60 bg-cyan-400/10 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-cyan-100">
                          {modelMode}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <div className="font-mono text-emerald-100">
                        gap_used={fmtNumber(gapUsed_nm, 3)} nm | guard_gap={fmtNumber(gapGuard_nm, 2)} nm
                        {hasRequestedGap ? ` | requested=${fmtNumber(gapRequested_nm, 3)} nm` : ""}
                      </div>
                      <div className="font-mono text-emerald-100">
                        P_target={fmtPower(P_target_W)} | physics_cap={fmtPower(physicsCap_W)} | P_cap={fmtPower(P_cap_W)} | P_avg={fmtPower(P_avg_W)}
                      </div>
                      <div className="font-mono text-emerald-100">
                        S_mech={fmtNumber(safetyFactor, 3)} {safetyMin != null ? `(min ${fmtNumber(safetyMin, 2)})` : ""} | sigma_allow={fmtGPa(sigmaAllow_Pa)} | P_load={fmtGPa(loadPressure_Pa)}
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-300">
                      {modelMode === "raw"
                        ? "Casimir ladder runs at the requested gap; mechanical sweep still surfaces guardGap/mech_status."
                        : "Casimir ladder honors the mechanical guard gap; sweep validates mechanics and surfaces guard status."}
                      {modelMode === "raw" ? " Raw/Mk.1 assumes diamond+DLC tile stack; see docs/needle-hull-materials.md." : ""}
                    </p>
                  </div>
                ) : null}
                <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900/80 p-3 text-xs text-slate-200">
                  {JSON.stringify(status, null, 2)}
                </pre>
              </div>
            ) : (
              <Placeholder text="Loading pipeline status…" />
            )}
          </InfoCard>

          <InfoCard
            title="Grounding Sources"
            subtitle={planDebug?.goal ? `Last goal: ${planDebug.goal}` : undefined}
          >
            {planError ? (
              <ErrorText message={planError} />
            ) : groundingSources.length ? (
              <ul className="space-y-2 text-sm">
                {groundingSources.map((source, idx) => (
                  <li key={`${source.kind ?? "src"}-${source.id ?? idx}-${source.path ?? idx}`}>
                    <GroundingRow source={source} />
                  </li>
                ))}
              </ul>
            ) : (
              <Placeholder text="No grounding data yet (debugSources off?)." />
            )}
          </InfoCard>
        </div>

        <InfoCard
          title="Last Plan & Resonance"
          subtitle={
            planDebug?.traceId
              ? `Trace ${planDebug.traceId}${planDebug.resonancePatchId ? ` · patch ${planDebug.resonancePatchId}` : ""}`
              : undefined
          }
        >
          {planError ? (
            <ErrorText message={planError} />
          ) : planDebug ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Plan DSL</h3>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900/80 p-3 text-xs text-slate-200">
                  {planDebug.planDsl ?? "n/a"}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Resonance Patch Nodes</h3>
                {resonancePatches.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {resonancePatches.map((patch) => (
                      <li
                    key={`${patch.id}-${patch.path}`}
                    className="flex items-center justify-between rounded-md border border-white/5 bg-slate-900/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-slate-100">{patch.path}</p>
                      <p className="text-[11px] text-slate-400">
                        {patch.id} {patch.kind ? `· ${patch.kind}` : ""}{" "}
                        {typeof patch.score === "number" ? `· score ${patch.score.toFixed(3)}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
                  </ul>
                ) : (
                  <Placeholder text="No resonance nodes captured for the last plan." />
                )}
              </div>
            </div>
          ) : (
            <Placeholder text="Waiting for the next plan run…" />
          )}
        </InfoCard>

        <InfoCard title="Appendix: GR ladder" subtitle="GR -> warp-bubble equation map">
          <AppendixGR pipeline={pipelineSnapshot as EnergyPipelineState | null | undefined} />
        </InfoCard>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/70 p-4 shadow-lg shadow-cyan-900/20">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">{subtitle}</p>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ label, value }: { label: string; value: unknown }) {
  const truthy = value === true;
  const falsy = value === false;
  const color = truthy ? "text-emerald-300 bg-emerald-500/10 ring-emerald-500/50" : falsy ? "text-amber-300 bg-amber-500/10 ring-amber-500/40" : "text-slate-200 bg-white/5 ring-white/15";
  const text = truthy ? "true" : falsy ? "false" : "n/a";
  return (
    <div className="rounded-lg border border-white/5 bg-white/5 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <span className={`mt-1 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold ring-1 ${color}`}>
        {text}
      </span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string | null | undefined }) {
  const display =
    typeof value === "number" ? value.toFixed(4) : typeof value === "string" ? value : value ?? "n/a";
  return (
    <div className="rounded-lg border border-white/5 bg-white/5 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-50">{display}</p>
    </div>
  );
}

function ErrorText({ message }: { message: string }) {
  return <div className="rounded-md border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">Error: {message}</div>;
}

function Placeholder({ text }: { text: string }) {
  return <div className="rounded-md border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-400">{text}</div>;
}

function GroundingRow({ source }: { source: GroundingSource }) {
  const { path, kind, id } = source;
  const label = path ?? id ?? "(unknown)";
  const actionable = Boolean(path);
  const actionLabel = kind === "doc" ? "Open" : "Copy";

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
      <div>
        <p className="text-sm text-slate-100">{label}</p>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          {kind ?? "unknown"} {id && !label.includes(id) ? `· ${id}` : ""}
        </p>
      </div>
      {actionable && (
        <button
          type="button"
          onClick={() => openGroundingSource(source)}
          className="rounded-md border border-cyan-400/60 bg-cyan-500/10 px-2 py-1 text-[12px] text-cyan-100 transition hover:bg-cyan-500/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function openGroundingSource(source: GroundingSource) {
  if (!source.path) return;
  if (source.kind === "doc") {
    openDocPanel(source.path);
    return;
  }
  // Fallback: copy the path for non-doc sources and open http(s) targets if present.
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(source.path);
  }
  if (typeof window !== "undefined" && /^https?:\/\//i.test(source.path)) {
    window.open(source.path, "_blank", "noopener");
  }
}

function AppendixGR({ pipeline }: { pipeline?: EnergyPipelineState | null }) {
  const fmt = (value: number | null | undefined, digits = 3): string => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "n/a";
    const abs = Math.abs(n);
    if (abs !== 0 && (abs < 1e-3 || abs >= 1e4)) return n.toExponential(Math.max(0, digits - 1));
    const fixed = n.toFixed(digits);
    return fixed.replace(/\.?0+$/, "");
  };

  const num = (value: unknown): number | null => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const pos = (value: unknown, allowZero = false): number | null => {
    const n = num(value);
    if (n === null) return null;
    if (n > 0) return n;
    if (allowZero && n === 0) return 0;
    return null;
  };

  const resolveHullDims = (p?: EnergyPipelineState | null) => {
    if (!p) return null;
    const hull: any = (p as any)?.hull ?? {};

    const directLx = pos(hull?.Lx_m) ?? pos((p as any)?.Lx_m);
    const directLy = pos(hull?.Ly_m) ?? pos((p as any)?.Ly_m);
      const directLz = pos(hull?.Lz_m) ?? pos((p as any)?.Lz_m);
      if (directLx != null && directLy != null && directLz != null) {
        return { Lx: directLx, Ly: directLy, Lz: directLz, source: "hull.Lx_m/Ly_m/Lz_m" };
      }

    const a = pos(hull?.a ?? (p as any)?.a);
    const b = pos(hull?.b ?? (p as any)?.b);
    const c = pos(hull?.c ?? (p as any)?.c);
    if (a != null && b != null && c != null) {
      return { Lx: 2 * a, Ly: 2 * b, Lz: 2 * c, source: "hull.a/b/c (semi-axes)" };
    }

    // Known Needle hull defaults when snapshot omits dims (1007 x 264 x 173 m)
    return { Lx: 1007, Ly: 264, Lz: 173, source: "default Needle hull (1007×264×173 m)" };
  };

  const solvedCtx: GrSolvedCtx = { p: pipeline, fmt, num, pos, resolveHullDims };
  const hasPipeline = Boolean(pipeline);
  const guardMode = (pipeline as any)?.currentMode ?? (pipeline as any)?.mode;
  const guardTarget_W =
    num((pipeline as any)?.P_target_W ?? undefined) ??
    (guardMode ? num((MODE_CONFIGS as any)?.[guardMode as keyof typeof MODE_CONFIGS]?.powerTarget_W ?? undefined) : null);
  const guardMech = (pipeline as any)?.mechGuard;
  const guardCap_W = num((pipeline as any)?.P_cap_W ?? guardMech?.pCap_W ?? undefined);
  const physicsCap_W = num((pipeline as any)?.physicsCap_W ?? undefined);
  const gapCasimir_nm =
    num((pipeline as any)?.gap_nm ?? undefined) ??
    num((pipeline as any)?.mechanical?.casimirGap_nm ?? undefined);
  const gapGuard_nm =
    num((pipeline as any)?.mechanical?.constrainedGap_nm ?? undefined) ??
    num((pipeline as any)?.mechanical?.recommendedGap_nm ?? undefined);
  const modelMode = (pipeline as any)?.modelMode as EnergyPipelineState["modelMode"] | undefined;
  const mechStatus = (pipeline as any)?.mechGuard?.status;
  const guardTS = num((pipeline as any)?.TS_ratio ?? undefined);
  const guardZeta = num((pipeline as any)?.zeta ?? undefined);
  const fmtMw = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "n/a";
    const n = num(value);
    return n === null ? "n/a" : `${fmt(n / 1e6)} MW`;
  };

  return (
    <div className="space-y-3 text-sm">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
        Values shown below are rendered from the live <code>useEnergyPipeline()</code> snapshot; no hand-entered numbers.
      </p>
      <p className="text-[11px] text-amber-200">
        Snapshot caveats: if warp inputs are zeroed, T_{"{mu nu}"} missing, or U_static=0, we treat them as safed defaults
        (standby / placeholder), not a physical solve. Check overallStatus/modelMode before quoting numbers.
      </p>
      <p className="text-[11px] text-cyan-200">
        This ladder uses a high-frequency GR proxy: GR sees ⟨T_{"{mu nu}"}⟩ over τ_LC with TS ≫ 1, so kappa_drive and theta_drive
        are effective curvature proxies, not a full Einstein solve.
      </p>
      <p className="text-[11px] text-cyan-300">
        Guardrails: Mode {guardMode ?? "n/a"} | modelMode={modelMode ?? "n/a"} | P_target={fmtMw(guardTarget_W)} | P_cap={fmtMw(guardCap_W)} | physicsCap={fmtMw(physicsCap_W)} | TS={guardTS == null ? "n/a" : fmt(guardTS)} | zeta={guardZeta == null ? "n/a" : fmt(guardZeta, 4)}
      </p>
      <p className="text-[11px] text-cyan-300">
        Gaps: casimir_gap={fmt(gapCasimir_nm, 3)} nm | mech_guard_gap={fmt(gapGuard_nm, 3)} nm{mechStatus ? ` | mech_status=${mechStatus}` : ""}
      </p>
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-slate-100">
        <p className="text-[11px] uppercase tracking-wide text-cyan-300">{GR_RECIPE_MINDSET.headline}</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-200">
          {GR_RECIPE_MINDSET.bullets.map((item, idx) => (
            <li key={`mindset-${idx}`} className="leading-snug">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-300">{GR_RECIPE_MINDSET.footer}</p>
      </div>
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-3 text-slate-100">
        <p className="text-[11px] uppercase tracking-wide text-emerald-300">Balance checklist</p>
        <ul className="mt-2 list-decimal space-y-1 pl-5 text-emerald-100">
          {GR_RECIPE_CHECKLIST.map((item, idx) => (
            <li key={`check-${idx}`} className="leading-snug">
              {item}
            </li>
          ))}
        </ul>
      </div>
      {!hasPipeline && (
        <p className="text-xs text-amber-200">
          Waiting for a live pipeline snapshot-solved values will appear once data arrives.
        </p>
      )}
      {GR_APPENDIX_SECTIONS.map((section) => {
        const recipe = GR_RECIPE_COPY[section.level];
        return (
          <div key={section.title} className="rounded-lg border border-white/5 bg-white/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Level {section.level}</p>
                <h3 className="text-sm font-semibold text-slate-100">{section.title}</h3>
              </div>
              {recipe ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 bg-white/5 text-xs font-semibold text-slate-100 hover:bg-white/10"
                    >
                      GR recipe
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[440px] space-y-2 border-white/10 bg-slate-950 text-slate-50"
                  >
                    <DropdownMenuLabel className="text-xs text-slate-200">
                      Level {section.level}: {section.title}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {recipe.summary ? (
                      <div className="px-2 text-[13px] leading-snug text-slate-100">{recipe.summary}</div>
                    ) : null}
                    {recipe.items.map((item, idx) => (
                      <div
                        key={`${section.level}-recipe-${idx}`}
                        className="rounded-md border border-white/5 bg-slate-900/70 px-2 py-1.5 text-xs leading-snug text-slate-100"
                      >
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">{item.label}</p>
                        <div className="mt-1 text-slate-100">{item.body}</div>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-white/5 bg-slate-900/50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">GR side</p>
                <ul className="mt-2 space-y-2 text-slate-200">
                  {section.gr.map((item, idx) => (
                    <li key={idx} className="leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-white/5 bg-slate-900/50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Code mirror</p>
                <ul className="mt-2 space-y-2 text-slate-200">
                  {section.code.map((item, idx) => (
                    <li key={idx} className="leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {section.solved?.length ? (
              <div className="mt-3 rounded-md border border-emerald-500/20 bg-emerald-900/20 p-3">
                <p className="text-[11px] uppercase tracking-wide text-emerald-300">Solved in pipeline (snapshot)</p>
                {hasPipeline ? (
                  <ul className="mt-2 space-y-2 text-emerald-100">
                    {section.solved.map((item, idx) => (
                      <li key={idx} className="leading-snug">
                        <div className="font-mono text-[12px] text-emerald-200">{item.equation}</div>
                        <div className="text-emerald-100">{item.fields(solvedCtx)}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-emerald-100">
                    Snapshot not loaded yet; values will populate once the pipeline response arrives.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
