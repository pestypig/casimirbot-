import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Bolt,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Waves
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useDocViewerStore } from "@/store/useDocViewerStore";
import { usePanelTelemetryPublisher } from "@/lib/desktop/panelTelemetryBus";
import { cn } from "@/lib/utils";
import pulsedPowerDoc from "../../../docs/warp-pulsed-power.md?raw";

type RequiredField = "L" | "R" | "V" | "I" | "width" | "rep" | "ripple";

type LoadRow = {
  id: string;
  modulePath: string;
  L: string;
  R: string;
  V: string;
  I: string;
  width: string;
  rep: string;
  ripple: string;
  notes: string;
  missing: RequiredField[];
  status: "ready" | "blocked";
};

type ChecklistItem = {
  title: string;
  bullets: string[];
};

type PanelStatus = "missing" | "blocked" | "ready";

const REQUIRED_FIELDS: RequiredField[] = ["L", "R", "V", "I", "width", "rep", "ripple"];

const DOC_PATH = "/docs/warp-pulsed-power.md";

function normalizeCell(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isMissing(value: string): boolean {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized === "todo" || normalized.includes("todo") || normalized === "tbd";
}

function parseLoadMatrix(md: string): LoadRow[] {
  const lines = md.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.startsWith("| Load ID"));
  if (headerIndex === -1) return [];

  const rows: LoadRow[] = [];
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) break;
    const cells = line.split("|").slice(1, -1).map(normalizeCell);
    if (cells.length < 10) continue;
    const [id, modulePath, L, R, V, I, width, rep, ripple, notes] = cells;
    const fieldBag: Record<RequiredField, string> = { L, R, V, I, width, rep, ripple };
    const missing = REQUIRED_FIELDS.filter((key) => isMissing(fieldBag[key]));
    rows.push({
      id,
      modulePath,
      L,
      R,
      V,
      I,
      width,
      rep,
      ripple,
      notes,
      missing,
      status: missing.length === 0 ? "ready" : "blocked",
    });
  }
  return rows;
}

function extractBullets(md: string, headingMatch: string): string[] {
  const haystack = md.toLowerCase();
  const needle = headingMatch.toLowerCase();
  const startIndex = haystack.indexOf(needle);
  if (startIndex === -1) return [];

  const after = md.slice(startIndex + headingMatch.length).split(/\r?\n/);
  const bullets: string[] = [];
  let collecting = false;
  for (const raw of after) {
    const line = raw.trim();
    if (!collecting && line.startsWith("-")) {
      collecting = true;
    }
    if (!collecting) continue;
    if (!line || line.startsWith("**") || line.startsWith("##") || line.startsWith("###")) break;
    if (line.startsWith("-")) {
      bullets.push(line.replace(/^-+\s*/, "").trim());
    } else if (bullets.length > 0) {
      const last = bullets.pop() as string;
      bullets.push(`${last} ${line}`);
    }
  }
  return bullets;
}

function extractChecklist(md: string, headingMatch: string, stopHeading = "## 5"): ChecklistItem[] {
  const haystack = md.toLowerCase();
  const needle = headingMatch.toLowerCase();
  const stopNeedle = stopHeading.toLowerCase();
  const startIndex = haystack.indexOf(needle);
  if (startIndex === -1) return [];

  const after = md.slice(startIndex).split(/\r?\n/);
  const items: ChecklistItem[] = [];
  let current: ChecklistItem | null = null;
  for (const raw of after) {
    const line = raw.trim();
    if (line.toLowerCase().startsWith(stopNeedle) && current) {
      items.push(current);
      break;
    }
    if (/^\d+\./.test(line)) {
      if (current) items.push(current);
      current = { title: line.replace(/^\d+\.\s*/, ""), bullets: [] };
      continue;
    }
    if (line.startsWith("-") && current) {
      current.bullets.push(line.replace(/^-+\s*/, ""));
      continue;
    }
    if (line.startsWith(">") || line.startsWith("##") || line.startsWith("###")) {
      continue;
    }
  }
  if (current && !items.includes(current)) {
    items.push(current);
  }
  return items;
}

function extractScope(md: string): string {
  const start = md.indexOf("## 1. Scope");
  if (start === -1) return "";
  const after = md.slice(start).split(/\r?\n/);
  const lines: string[] = [];
  for (const line of after.slice(1)) {
    if (line.startsWith("## ")) break;
    if (line.trim()) {
      lines.push(line.trim());
    }
  }
  return lines.slice(0, 4).join(" ");
}

function computeLoadCompleteness(rows: LoadRow[]) {
  const total = rows.length * REQUIRED_FIELDS.length;
  const missing = rows.reduce((count, row) => count + row.missing.length, 0);
  const filled = Math.max(0, total - missing);
  const completeness = total === 0 ? 0 : filled / total;
  const ready = rows.filter((row) => row.status === "ready").length;
  return { total, missing, completeness, ready };
}

function loadStatusForPrefix(rows: LoadRow[], prefix: string): "missing" | "blocked" | "ready" {
  const matches = rows.filter((row) => row.id.startsWith(prefix));
  if (!matches.length) return "missing";
  if (matches.some((row) => row.status === "blocked")) return "blocked";
  return "ready";
}

function statusBadgeTone(status: PanelStatus) {
  switch (status) {
    case "ready":
      return "bg-emerald-500/20 text-emerald-200 border-emerald-400/40";
    case "blocked":
      return "bg-amber-500/15 text-amber-200 border-amber-300/40";
    case "missing":
    default:
      return "bg-red-500/15 text-red-200 border-red-300/40";
  }
}

export default function PulsedPowerDocPanel() {
  const viewDoc = useDocViewerStore((state) => state.viewDoc);
  const openDocPanel = () => {
    viewDoc(DOC_PATH);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-helix-panel", { detail: { id: "docs-viewer" } }));
    }
  };

  const loadRows = useMemo(() => parseLoadMatrix(pulsedPowerDoc), []);
  const scope = useMemo(() => extractScope(pulsedPowerDoc), []);
  const midiGates = useMemo(
    () => extractBullets(pulsedPowerDoc, "Helix gates (`midi_coil_pulse`"),
    [],
  );
  const panelGates = useMemo(
    () => extractBullets(pulsedPowerDoc, "Helix gates (`panel_discharge`"),
    [],
  );
  const launcherGates = useMemo(
    () => extractBullets(pulsedPowerDoc, "Helix gates (`launcher_stage_"),
    [],
  );
  const telemetryBullets = useMemo(
    () => extractBullets(pulsedPowerDoc, "### 3.4 Telemetry and sampling"),
    [],
  );
  const checklist = useMemo(
    () => extractChecklist(pulsedPowerDoc, "## 4. Protection checklist"),
    [],
  );
  const completeness = useMemo(() => computeLoadCompleteness(loadRows), [loadRows]);

  usePanelTelemetryPublisher(
    "pulsed-power-doc",
    () => ({
      kind: "docs",
      metrics: {
        loads: loadRows.length,
        loadsReady: completeness.ready,
        completeness: Number(completeness.completeness.toFixed(3)),
        missingCells: completeness.missing,
      },
      flags: { blocked: completeness.missing > 0 },
      strings: { doc: DOC_PATH },
      sourceIds: ["docs/warp-pulsed-power.md", "client/src/components/PulsedPowerDocPanel.tsx"],
    }),
    [loadRows, completeness.ready, completeness.completeness, completeness.missing],
  );

  const planCoverage = [
    {
      title: "midi_coil_pulse",
      status: loadStatusForPrefix(loadRows, "midi_coil"),
      bullets: midiGates,
      icon: Bolt,
    },
    {
      title: "panel_discharge",
      status: loadStatusForPrefix(loadRows, "sector_panel"),
      bullets: panelGates,
      icon: Waves,
    },
    {
      title: "launcher_stage_*",
      status: loadStatusForPrefix(loadRows, "launcher_stage"),
      bullets: launcherGates,
      icon: Activity,
    },
  ];

  const overallStatus =
    (completeness.missing === 0 && loadRows.length > 0
      ? "ready"
      : loadRows.length
        ? "blocked"
        : "missing") as PanelStatus;

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
            Warp Pulsed Power Grounding
          </p>
          <h1 className="text-2xl font-semibold text-white">Helix start panel</h1>
          <p className="text-sm text-slate-300">
            Doc-sourced guardrails from {DOC_PATH}. {scope || "Scope: generate timed, high-current pulses and bind them to Helix pipeline steps."}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1">Pipeline hooks: midi, panel, launcher</span>
            <span className="rounded-full bg-white/5 px-2 py-1">Guarded by Helix gates</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("border px-3 py-1 text-xs font-semibold uppercase", statusBadgeTone(overallStatus))}>
            {overallStatus === "ready" ? "Ready to fire" : overallStatus === "blocked" ? "Blocked by TODOs" : "No loads"}
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            className="border border-cyan-500/50 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
            onClick={openDocPanel}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Open full note
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-4 px-5 py-4">
          <SummaryBar completeness={completeness} />

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-4">
              <LoadMatrixCard rows={loadRows} />
              <GateDeck planCoverage={planCoverage} />
            </div>

            <div className="space-y-4">
              <ProtectionCard checklist={checklist} />
              <TelemetryCard bullets={telemetryBullets} />
              <QuickLinks onOpenDoc={openDocPanel} />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function SummaryBar({ completeness }: { completeness: ReturnType<typeof computeLoadCompleteness> }) {
  const pct = Math.round(completeness.completeness * 100);
  const missingLabel =
    completeness.missing === 0
      ? "All required cells filled"
      : `${completeness.missing} missing/TODO fields`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <div className="text-sm font-semibold text-white">Load matrix completeness</div>
        <div className="text-xs text-slate-300">
          {completeness.ready}/{completeness.total / REQUIRED_FIELDS.length || 0} loads ready | {missingLabel}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-800">
          <div
            className={cn(
              "h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 transition-all",
              pct === 0 && "bg-slate-600",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-sm font-semibold text-white tabular-nums">{pct}%</div>
      </div>
    </div>
  );
}

function LoadMatrixCard({ rows }: { rows: LoadRow[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 shadow-lg shadow-cyan-500/5">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Section 2</p>
          <h2 className="text-lg font-semibold text-white">Load matrix</h2>
          <p className="text-xs text-slate-400">Doc is the source of truth; TODO or blank blocks fire.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Bolt className="h-4 w-4 text-cyan-300" />
          Hardware pulse envelopes grounded here.
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="p-4 text-sm text-slate-300">No rows found in the doc.</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="min-w-[180px] text-slate-200">Load</TableHead>
                <TableHead>L (uH)</TableHead>
                <TableHead>R (mOhm)</TableHead>
                <TableHead>V_bus</TableHead>
                <TableHead>I_peak</TableHead>
                <TableHead>Pulse</TableHead>
                <TableHead>Rep rate</TableHead>
                <TableHead>Ripple</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "border-white/5 transition hover:bg-white/5",
                    row.status === "blocked" && "bg-amber-500/5",
                  )}
                >
                  <TableCell className="font-semibold text-white">
                    <div className="flex flex-col">
                      <span>{row.id}</span>
                      <span className="text-xs text-slate-400">{row.modulePath}</span>
                    </div>
                  </TableCell>
                  <TableCell className={missingTone(row, "L")}>{row.L || "--"}</TableCell>
                  <TableCell className={missingTone(row, "R")}>{row.R || "--"}</TableCell>
                  <TableCell className={missingTone(row, "V")}>{row.V || "--"}</TableCell>
                  <TableCell className={missingTone(row, "I")}>{row.I || "--"}</TableCell>
                  <TableCell className={missingTone(row, "width")}>{row.width || "--"}</TableCell>
                  <TableCell className={missingTone(row, "rep")}>{row.rep || "--"}</TableCell>
                  <TableCell className={missingTone(row, "ripple")}>{row.ripple || "--"}</TableCell>
                  <TableCell className="text-xs text-slate-300">{row.notes || "--"}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "border px-2 py-1 text-[11px] font-semibold uppercase",
                        row.status === "ready"
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                          : "border-amber-300/50 bg-amber-500/15 text-amber-100",
                      )}
                    >
                      {row.status === "ready" ? "Ready" : `${row.missing.length} TODO`}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function missingTone(row: LoadRow, key: RequiredField) {
  return cn(
    "text-sm",
    row.missing.includes(key as any)
      ? "text-amber-200 font-semibold"
      : "text-slate-200",
  );
}

type GateDeckProps = {
  planCoverage: { title: string; status: PanelStatus; bullets: string[]; icon: LucideIcon }[];
};

function GateDeck({ planCoverage }: GateDeckProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 shadow-lg shadow-sky-500/5">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Helix gates</p>
          <h2 className="text-lg font-semibold text-white">Step-level guards pulled from doc</h2>
          <p className="text-xs text-slate-400">Each step must satisfy these before firing.</p>
        </div>
        <ShieldCheck className="h-5 w-5 text-emerald-300" />
      </div>
      <div className="grid gap-3 p-4 lg:grid-cols-3">
        {planCoverage.map((gate) => {
          const Icon = gate.icon;
          return (
            <div
              key={gate.title}
              className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-cyan-300" />
                  <div>
                    <div className="text-sm font-semibold text-white">{gate.title}</div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">Pipeline</div>
                  </div>
                </div>
                <Badge className={cn("border px-2 py-1 text-[11px] font-semibold uppercase", statusBadgeTone(gate.status))}>
                  {gate.status === "ready" ? "Ready" : gate.status === "blocked" ? "Incomplete" : "No row"}
                </Badge>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {gate.bullets.length === 0 ? (
                  <li className="text-slate-400">No bullet list found in the doc.</li>
                ) : (
                  gate.bullets.map((bullet, idx) => (
                    <li key={`${gate.title}-${idx}`} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-cyan-300" />
                      <span>{bullet}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProtectionCard({ checklist }: { checklist: ChecklistItem[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-emerald-500/5">
      <div className="flex items-center justify-between gap-3 pb-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Section 4</p>
          <h3 className="text-lg font-semibold text-white">Protection checklist</h3>
          <p className="text-xs text-slate-400">If any are false, pipeline should not advance.</p>
        </div>
        <ClipboardList className="h-5 w-5 text-emerald-300" />
      </div>
      <div className="space-y-3 text-sm text-slate-200">
        {checklist.length === 0 ? (
          <p className="text-slate-400">No checklist parsed from the doc.</p>
        ) : (
          checklist.map((item, idx) => (
            <div key={`${item.title}-${idx}`} className="rounded border border-white/5 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">{item.title}</span>
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
              </div>
              {item.bullets.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {item.bullets.map((bullet, i) => (
                    <li key={`${item.title}-bullet-${i}`} className="flex gap-2">
                      <span className="text-cyan-300">*</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TelemetryCard({ bullets }: { bullets: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 shadow-lg shadow-cyan-500/5">
      <div className="flex items-center justify-between gap-3 pb-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Section 3.4</p>
          <h3 className="text-lg font-semibold text-white">Telemetry and sampling</h3>
          <p className="text-xs text-slate-400">Baseline sensors and channel names from the note.</p>
        </div>
        <Activity className="h-5 w-5 text-cyan-300" />
      </div>
      <ul className="space-y-2 text-xs text-slate-200">
        {bullets.length === 0 ? (
          <li className="text-slate-400">No telemetry list found in the doc.</li>
        ) : (
          bullets.map((bullet, idx) => (
            <li key={`telemetry-${idx}`} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-cyan-300" />
              <span>{bullet}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function QuickLinks({ onOpenDoc }: { onOpenDoc: () => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-r from-cyan-900/50 via-slate-900 to-slate-950 p-4 shadow-lg shadow-cyan-500/10">
      <div className="flex items-center justify-between gap-3 pb-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-300">Grounding</p>
          <h3 className="text-lg font-semibold text-white">Doc link & anchors</h3>
          <p className="text-xs text-slate-300">Jump to the full markdown for edits or reviews.</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
          onClick={onOpenDoc}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Open doc
        </Button>
      </div>
      <div className="space-y-2 text-xs text-slate-200">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-amber-300" />
          <div>
            <div className="font-semibold text-white">Planner binding</div>
            <div className="text-slate-400">server/services/planner/grounding.ts lists this note.</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          <div>
            <div className="font-semibold text-white">Drive guards</div>
            <div className="text-slate-400">Helix gates must stay aligned with the doc bullets above.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
