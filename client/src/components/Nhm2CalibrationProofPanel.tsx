import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VacuumContractBadge from "@/components/VacuumContractBadge";
import DriveGuardsPanel from "@/components/DriveGuardsPanel";
import PipelineProofPanel from "@/components/PipelineProofPanel";
import { WarpProofPanel } from "@/components/WarpProofPanel";
import { useNhm2SolveState } from "@/hooks/useNhm2SolveState";
import { cn } from "@/lib/utils";

const toneClass = {
  good: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  bad: "border-rose-500/40 bg-rose-500/10 text-rose-200",
} as const;

function SummaryCard(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{props.label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-100">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-slate-400">{props.hint}</div> : null}
    </div>
  );
}

export default function Nhm2CalibrationProofPanel() {
  const { state, vacuumContract } = useNhm2SolveState();

  return (
    <div className="h-full w-full overflow-auto bg-slate-950 p-4 text-slate-100">
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.3em] text-cyan-300">
            NHM2 Calibration + Proof
          </div>
          <div className="text-2xl font-semibold text-white">
            Deterministic calibration, guardrails, and proof evidence
          </div>
          <div className="max-w-3xl text-sm text-slate-400">
            This surface keeps the surviving verification tooling together. It is for deterministic
            evidence, not narrative explanation.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("border px-3 py-1 text-xs", toneClass[state.overall.tone])}>
            {state.overall.label}
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-200">
            {state.authority.solutionCategory}
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            {state.proof.stage ?? "stage n/a"}
          </Badge>
          <VacuumContractBadge contract={vacuumContract} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Certificate"
          value={state.contract.certificateStatus ?? "n/a"}
          hint={state.contract.certificateHash ?? "hash unavailable"}
        />
        <SummaryCard
          label="Guardrails"
          value={
            [state.contract.guardrails.fordRoman, state.contract.guardrails.thetaAudit].join(" / ")
          }
          hint={`TS ${state.contract.guardrails.tsRatio} | VdB ${state.contract.guardrails.vdbBand}`}
        />
        <SummaryCard
          label="Geometry parity"
          value={
            state.geometry.matchesAuthority == null
              ? "Awaiting live hull"
              : state.geometry.matchesAuthority
                ? "Authority match"
                : `Drift ${state.geometry.mismatchAxes.join("/")}`
          }
          hint={
            state.pipeline.geometryFallback.applied
              ? "fallback applied"
              : state.pipeline.geometryFallback.blocked
                ? "fallback blocked"
                : "authority-backed"
          }
        />
        <SummaryCard
          label="Proof strictness"
          value={state.proof.strictProxy ? "Strict proxy present" : "Strict proxy clear"}
          hint={state.proof.metricAdapterFamily ?? "metric adapter n/a"}
        />
      </div>

      <Card className="mt-4 border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="text-slate-100">Advanced deterministic surfaces</CardTitle>
          <CardDescription>
            Use these tabs when you need calibration detail, contract evidence, or proof-pack
            inspection that Helix Ask should cite but not replace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="guards" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-950/80">
              <TabsTrigger value="guards">Drive Guards</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline Proof</TabsTrigger>
              <TabsTrigger value="ledger">Warp Proof</TabsTrigger>
            </TabsList>
            <TabsContent value="guards" className="mt-4">
              <div className="rounded-xl border border-slate-800 bg-black/20 p-2">
                <DriveGuardsPanel />
              </div>
            </TabsContent>
            <TabsContent value="pipeline" className="mt-4">
              <div className="rounded-xl border border-slate-800 bg-black/20 p-2">
                <PipelineProofPanel />
              </div>
            </TabsContent>
            <TabsContent value="ledger" className="mt-4">
              <div className="rounded-xl border border-slate-800 bg-black/20 p-2">
                <WarpProofPanel />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
