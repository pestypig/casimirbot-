import { useMemo } from "react";
import { Bolt, Gauge, ShieldCheck, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";

type ModeKey = "hover" | "taxi" | "nearzero" | "cruise" | "emergency" | "standby";

const BUS_POLICY: Record<ModeKey, { V_bus_kV: number; P_target_W: number; label: string }> = {
  hover:     { V_bus_kV: 17, P_target_W: 83.3e6, label: "hover" },
  taxi:      { V_bus_kV: 17, P_target_W: 83.3e6, label: "taxi" },
  nearzero:  { V_bus_kV: 17, P_target_W: 5e6,    label: "nearzero" },
  cruise:    { V_bus_kV: 17, P_target_W: 40e6,   label: "cruise" },
  emergency: { V_bus_kV: 30, P_target_W: 297.5e6, label: "emergency" },
  standby:   { V_bus_kV: 0,  P_target_W: 0,       label: "standby" }
};

const CURRENT_LIMITS_A = {
  midi: 31_623,
  sector: 31_623,
  launcher: 14_142
} as const;

function fmtPowerMW(value?: number | null) {
  if (!Number.isFinite(value as number)) return "—";
  const mw = (value as number) / 1e6;
  return `${mw.toFixed(1)} MW`;
}

function fmtCurrentKA(value?: number | null) {
  if (!Number.isFinite(value as number)) return "—";
  return `${((value as number) / 1e3).toFixed(2)} kA`;
}

function fmtVoltageKV(value?: number | null) {
  if (!Number.isFinite(value as number)) return "—";
  return `${(value as number).toFixed(1)} kV`;
}

export default function BusVoltagePanel() {
  const { data: pipeline } = useEnergyPipeline({ refetchInterval: 1000 });

  const live = useMemo(() => {
    const positive = (value: unknown) => {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };

    const mode = (pipeline?.currentMode ?? "hover") as ModeKey;
    const policy = BUS_POLICY[mode] ?? BUS_POLICY.hover;
    const policyCurrent_A = policy.V_bus_kV > 0 ? policy.P_target_W / (policy.V_bus_kV * 1e3) : 0;

    const V_kV = positive(pipeline?.busVoltage_kV) ?? policy.V_bus_kV;

    const P_raw_W =
      positive((pipeline as any)?.P_avg_W) ??
      (() => {
        const mw = positive((pipeline as any)?.P_avg_MW ?? (pipeline as any)?.P_avg);
        return mw !== undefined ? mw * 1e6 : undefined;
      })() ??
      (() => {
        const I = positive((pipeline as any)?.busCurrent_A);
        return I !== undefined && V_kV > 0 ? I * V_kV * 1e3 : undefined;
      })();

    const P_W = P_raw_W ?? policy.P_target_W;

    const I_raw_A =
      positive((pipeline as any)?.busCurrent_A) ??
      (V_kV > 0 && P_W > 0 ? P_W / (V_kV * 1e3) : undefined);

    const I_A = I_raw_A ?? policyCurrent_A;

    return {
      mode,
      policy,
      power_W: P_W,
      voltage_kV: V_kV,
      current_A: I_A,
      policyCurrent_A,
    };
  }, [pipeline]);

  const policyRows = useMemo(() => {
    const entries = Object.entries(BUS_POLICY) as Array<[ModeKey, { V_bus_kV: number; P_target_W: number; label: string }]>;
    return entries.map(([mode, cfg]) => {
      const I_A = cfg.V_bus_kV > 0 ? cfg.P_target_W / (cfg.V_bus_kV * 1e3) : 0;
      return { mode, ...cfg, current_A: I_A };
    });
  }, []);

  const margin_vs_launcher = CURRENT_LIMITS_A.launcher - live.current_A;
  const maxNominalCurrent_kA = policyRows
    .filter((row) => row.mode !== "emergency" && row.mode !== "standby")
    .reduce((max, row) => Math.max(max, row.current_A / 1e3), 0);

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Helix start: bus program</p>
          <h1 className="text-2xl font-semibold text-white">Bus Voltage</h1>
          <p className="text-sm text-slate-300">
            17 kV rail for all 83 MW modes, 30 kV for emergency. Currents ride along as P/V so the bus stays well under the pulsed ceilings.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1">Targets from MODE_POLICY</span>
            <span className="rounded-full bg-white/5 px-2 py-1">Ceilings: 31.6 kA (sector/midi), 14.1 kA (launcher)</span>
          </div>
        </div>
        <Badge className="w-fit border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase text-emerald-100">
          Live mode: {live.mode}
        </Badge>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-4 px-5 py-4">
          <Card className="border-white/10 bg-gradient-to-r from-cyan-900/40 via-slate-900 to-slate-950 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Bolt className="h-5 w-5 text-cyan-300" />
                Live bus snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Bus voltage" value={fmtVoltageKV(live.voltage_kV)} hint="pipeline.busVoltage_kV" />
              <Stat label="Bus current" value={fmtCurrentKA(live.current_A)} hint="pipeline.busCurrent_A" />
              <Stat label="Power (avg)" value={fmtPowerMW(live.power_W)} hint="P_avg_W live or mode target" />
              <Stat label="Policy band" value={`${fmtVoltageKV(live.policy.V_bus_kV)} • ${fmtCurrentKA(live.policyCurrent_A)}`} hint="per-mode target" />
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-white/10 bg-slate-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Gauge className="h-5 w-5 text-sky-300" />
                  Mode policy (P_target / V_bus → I_bus)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-300">Mode</TableHead>
                      <TableHead className="text-slate-300">P_target</TableHead>
                      <TableHead className="text-slate-300">V_bus</TableHead>
                      <TableHead className="text-slate-300">I_bus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policyRows.map((row) => (
                      <TableRow key={row.mode} className="border-slate-800">
                        <TableCell className="font-semibold capitalize text-white">
                          {row.mode}{row.mode === live.mode ? <Badge className="ml-2 bg-emerald-500/20 text-emerald-200 border-emerald-400/40">live</Badge> : null}
                        </TableCell>
                        <TableCell className="text-slate-200">{fmtPowerMW(row.P_target_W)}</TableCell>
                        <TableCell className="text-slate-200">{fmtVoltageKV(row.V_bus_kV)}</TableCell>
                        <TableCell className="text-slate-200">{fmtCurrentKA(row.current_A)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  Guardrail check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-200">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-emerald-200">Nominal</p>
                  <p className="font-semibold text-white">{maxNominalCurrent_kA.toFixed(2)} kA @ 17 kV</p>
                  <p className="text-xs text-emerald-100/80">
                    All 83 MW modes land under launcher ceiling (14.1 kA) by &gt;
                    {(CURRENT_LIMITS_A.launcher / 1e3 - maxNominalCurrent_kA).toFixed(1)} kA.
                  </p>
                </div>
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-cyan-200">Emergency</p>
                  <p className="font-semibold text-white">{fmtCurrentKA(policyRows.find((r) => r.mode === "emergency")?.current_A)}</p>
                  <p className="text-xs text-cyan-100/80">297.5 MW @ 30 kV → ~9.9 kA, still below launcher (14.1 kA) with {(margin_vs_launcher / 1e3).toFixed(1)} kA margin.</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300">
                    <Waves className="h-4 w-4" /> Servo intent
                  </p>
                  <p className="text-xs text-slate-300">
                    `busVoltage_kV` → HV rail setpoint; `busCurrent_A` → continuous ship load. Both travel with the pipeline snapshot for HUD/servos without touching ampChain or θ-gain.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
      {hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}
