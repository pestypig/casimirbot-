import { useMemo } from "react";
import { useEnergyPipeline } from "./use-energy-pipeline";

export const LEDGER_GUARD_THRESHOLD = 0.005;

export interface CycleLedgerRow {
  cycle: number;
  t0_ns: number;
  t1_ns: number;
  bus: number;
  sink: number;
  rev: number;
  dE: number;
  dS: number;
}

export interface CycleLedgerSummary {
  rows: CycleLedgerRow[];
  ratioSeries: number[];
  latest: CycleLedgerRow | null;
  ratio: number | null;
  ok: boolean | null;
  cycleNs: number | null;
  cycleMs: number | null;
  source: "server" | "client" | "none";
}

const EMPTY_SUMMARY: CycleLedgerSummary = {
  rows: [],
  ratioSeries: [],
  latest: null,
  ratio: null,
  ok: null,
  cycleNs: null,
  cycleMs: null,
  source: "none",
};

export function useCycleLedger(): CycleLedgerSummary {
  const { data: ep } = useEnergyPipeline();

  const gateAnalytics = ep?.gateAnalytics ?? null;
  const ledger = gateAnalytics?.ledger ?? [];
  const gateAnalyticsWithCycle = gateAnalytics as typeof gateAnalytics & {
    cycleLedger?: unknown;
  };
  const rawCycleLedger = gateAnalyticsWithCycle?.cycleLedger;
  const cycleLedgerInput = Array.isArray(rawCycleLedger)
    ? (rawCycleLedger as CycleLedgerRow[])
    : undefined;
  const lightCrossing = (ep?.lightCrossing ?? null) as
    | { burst_ms?: number | null }
    | null;
  const cycleBasisMs =
    (typeof lightCrossing?.burst_ms === "number"
      ? lightCrossing?.burst_ms
      : undefined) ??
    (typeof ep?.sectorPeriod_ms === "number" ? ep?.sectorPeriod_ms : undefined) ??
    (typeof ep?.burst_ms === "number" ? ep?.burst_ms : undefined);

  return useMemo((): CycleLedgerSummary => {
    const cycleLedgerRows = cycleLedgerInput;
    const cycleNs =
      typeof cycleBasisMs === "number" && Number.isFinite(cycleBasisMs) && cycleBasisMs > 0
        ? Math.round(cycleBasisMs * 1e6)
        : null;

    if ((!cycleLedgerRows || cycleLedgerRows.length === 0) && (!ledger || ledger.length === 0)) {
      return {
        ...EMPTY_SUMMARY,
        cycleNs,
        cycleMs: cycleNs ? cycleNs / 1e6 : null,
      };
    }

    let rows: CycleLedgerRow[] = [];
    let source: CycleLedgerSummary["source"] = "none";

    if (cycleLedgerRows && cycleLedgerRows.length > 0) {
      rows = cycleLedgerRows
        .map((row) => ({
          cycle: Number.isFinite(row.cycle) ? row.cycle : 0,
          t0_ns: Number.isFinite(row.t0_ns) ? row.t0_ns : 0,
          t1_ns: Number.isFinite(row.t1_ns) ? row.t1_ns : 0,
          bus: Number.isFinite(row.bus) ? row.bus : 0,
          sink: Number.isFinite(row.sink) ? row.sink : 0,
          rev: Number.isFinite(row.rev) ? row.rev : Number.isFinite(row.bus) ? row.bus : 0,
          dE: Number.isFinite(row.dE) ? row.dE : (Number.isFinite(row.bus) ? row.bus : 0) - (Number.isFinite(row.sink) ? row.sink : 0),
          dS: Number.isFinite(row.dS) ? row.dS : 0,
        }))
        .sort((a, b) => a.cycle - b.cycle);
      source = "server";
    } else if (Array.isArray(ledger) && ledger.length > 0 && cycleNs) {
      const origin = Math.floor((ledger[0]?.t_ns ?? 0) / cycleNs) * cycleNs;
      const buckets = new Map<number, { t0_ns: number; t1_ns: number; bus: number; sink: number }>();
      for (const entry of ledger) {
        if (!entry || typeof entry !== "object") continue;
        const t_ns =
          typeof entry.t_ns === "number" && Number.isFinite(entry.t_ns) ? entry.t_ns : origin;
        const cycleIndex = Math.floor((t_ns - origin) / cycleNs);
        const t0_ns = origin + cycleIndex * cycleNs;
        const t1_ns = t0_ns + cycleNs;
        const bucket =
          buckets.get(cycleIndex) ?? { t0_ns, t1_ns, bus: 0, sink: 0 };
        const joules =
          typeof entry.joules === "number" && Number.isFinite(entry.joules)
            ? entry.joules
            : 0;
        const reversible =
          typeof entry.reversible === "boolean" ? entry.reversible : false;
        if (reversible) {
          bucket.bus += joules;
        } else {
          bucket.sink += joules;
        }
        buckets.set(cycleIndex, bucket);
      }
      rows = Array.from(buckets.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([cycle, bucket]) => ({
          cycle,
          t0_ns: bucket.t0_ns,
          t1_ns: bucket.t1_ns,
          bus: bucket.bus,
          sink: bucket.sink,
          rev: bucket.bus,
          dE: bucket.bus - bucket.sink,
          dS: 0,
        }));
      source = "client";
    }

    const ratioSeries = rows.map((row) => {
      const denom = Math.abs(row.bus) + Math.abs(row.sink);
      if (!Number.isFinite(denom) || denom <= 0) return 0;
      const ratio = Math.abs(row.dE) / denom;
      return Number.isFinite(ratio) ? ratio : 0;
    });
    const latest = rows.length ? rows[rows.length - 1] : null;
    const ratio = ratioSeries.length ? ratioSeries[ratioSeries.length - 1] : null;
    const ok =
      ratio !== null && Number.isFinite(ratio)
        ? ratio <= LEDGER_GUARD_THRESHOLD
        : null;

    return {
      rows,
      ratioSeries,
      latest,
      ratio,
      ok,
      source,
      cycleNs,
      cycleMs: cycleNs ? cycleNs / 1e6 : null,
    };
  }, [cycleBasisMs, cycleLedgerInput, ledger]);
}
