import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type GrAgentLoopAttemptAudit = {
  iteration: number;
  label?: string;
  params?: Record<string, unknown>;
  residuals: {
    H_rms?: number;
    M_rms?: number;
    H_maxAbs?: number;
    M_maxAbs?: number;
  };
  gateStatus: "pass" | "fail" | "unknown";
  certificateStatus: string;
  pass: boolean;
  accepted: boolean;
};

type GrAgentLoopParamChange = {
  key: string;
  from?: unknown;
  to?: unknown;
  delta?: number;
  change: "added" | "removed" | "changed";
};

type GrAgentLoopPatch = {
  fromIteration: number;
  toIteration: number;
  fromLabel?: string;
  toLabel?: string;
  accepted?: boolean;
  changes: GrAgentLoopParamChange[];
};

type GrAgentLoopRunRecord = {
  id: string;
  seq: number;
  ts: string;
  durationMs: number;
  accepted: boolean;
  acceptedIteration?: number;
  attempts: GrAgentLoopAttemptAudit[];
  patches?: GrAgentLoopPatch[];
};

type GrAgentLoopRunsResponse = {
  runs: GrAgentLoopRunRecord[];
  limit?: number;
};

const RESIDUAL_KEYS = ["H_rms", "M_rms", "H_maxAbs", "M_maxAbs"] as const;
type ResidualKey = (typeof RESIDUAL_KEYS)[number];

const formatResidualValue = (value?: number) => {
  if (!Number.isFinite(value)) return "--";
  const v = value as number;
  return Math.abs(v) < 1e-3 || Math.abs(v) > 1e3 ? v.toExponential(2) : v.toFixed(4);
};

const formatDurationMs = (value?: number) => {
  if (!Number.isFinite(value)) return "n/a";
  return `${Math.round(value as number)} ms`;
};

const formatTimestamp = (value?: string) => {
  if (!value) return "n/a";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return parsed.toLocaleTimeString();
};

const formatParamValue = (value: unknown) => {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "n/a";
    const abs = Math.abs(value);
    return abs !== 0 && (abs < 1e-3 || abs > 1e3)
      ? value.toExponential(2)
      : value.toFixed(4);
  }
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  try {
    const json = JSON.stringify(value);
    if (!json) return "n/a";
    return json.length > 60 ? `${json.slice(0, 57)}...` : json;
  } catch {
    return "unprintable";
  }
};

const formatParamsSummary = (params?: Record<string, unknown>) => {
  if (!params || Object.keys(params).length === 0) return "no params";
  const entries = Object.entries(params);
  const shown = entries.slice(0, 4).map(
    ([key, value]) => `${key}=${formatParamValue(value)}`,
  );
  if (entries.length > 4) {
    shown.push(`+${entries.length - 4} more`);
  }
  return shown.join(" ");
};

const formatParamChange = (change: GrAgentLoopParamChange) => {
  if (change.change === "added") {
    return `${change.key}: +${formatParamValue(change.to)}`;
  }
  if (change.change === "removed") {
    return `${change.key}: -${formatParamValue(change.from)}`;
  }
  const delta =
    typeof change.delta === "number"
      ? ` (${change.delta >= 0 ? "+" : ""}${change.delta.toFixed(4)})`
      : "";
  return `${change.key}: ${formatParamValue(change.from)} -> ${formatParamValue(
    change.to,
  )}${delta}`;
};

const buildSparkline = (values: number[], width = 140, height = 30) => {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, idx) => {
    const x = (idx / Math.max(1, values.length - 1)) * width;
    const y = height - ((value - min) / span) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return { path: `M${points.join(" L")}` };
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const flattenParams = (
  value: unknown,
  prefix = "",
  map: Map<string, unknown> = new Map(),
): Map<string, unknown> => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      const next = prefix ? `${prefix}[${index}]` : `[${index}]`;
      flattenParams(entry, next, map);
    });
    return map;
  }
  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, entry]) => {
      const next = prefix ? `${prefix}.${key}` : key;
      flattenParams(entry, next, map);
    });
    return map;
  }
  if (prefix) {
    map.set(prefix, value);
  }
  return map;
};

const diffParams = (
  from?: Record<string, unknown>,
  to?: Record<string, unknown>,
): GrAgentLoopParamChange[] => {
  const fromMap = flattenParams(from);
  const toMap = flattenParams(to);
  const keys = new Set<string>([...fromMap.keys(), ...toMap.keys()]);
  const changes: GrAgentLoopParamChange[] = [];
  keys.forEach((key) => {
    const hasFrom = fromMap.has(key);
    const hasTo = toMap.has(key);
    const fromValue = hasFrom ? fromMap.get(key) : undefined;
    const toValue = hasTo ? toMap.get(key) : undefined;
    if (hasFrom && hasTo && Object.is(fromValue, toValue)) {
      return;
    }
    const change: GrAgentLoopParamChange = {
      key,
      from: fromValue,
      to: toValue,
      change: hasFrom && !hasTo ? "removed" : !hasFrom && hasTo ? "added" : "changed",
    };
    if (typeof fromValue === "number" && typeof toValue === "number") {
      change.delta = toValue - fromValue;
    }
    changes.push(change);
  });
  return changes;
};

const selectPrimaryAttempt = (run: GrAgentLoopRunRecord) =>
  run.attempts.find((attempt) => attempt.accepted) ??
  run.attempts[run.attempts.length - 1] ??
  null;

export default function GrAgentLoopLearningPanel() {
  const { data, isFetching, isError } = useQuery({
    queryKey: ["/api/helix/gr-agent-loop?limit=30"],
    refetchInterval: 6000,
  });
  const runs = ((data as GrAgentLoopRunsResponse | undefined)?.runs ?? []).filter(
    Boolean,
  );
  const [compareFromId, setCompareFromId] = useState<string>("");
  const [compareToId, setCompareToId] = useState<string>("");

  useEffect(() => {
    if (!runs.length) return;
    const defaultTo = runs[0]?.id ?? "";
    const defaultFrom = runs[1]?.id ?? runs[0]?.id ?? "";
    if (!compareToId || !runs.find((run) => run.id === compareToId)) {
      setCompareToId(defaultTo);
    }
    if (!compareFromId || !runs.find((run) => run.id === compareFromId)) {
      setCompareFromId(defaultFrom);
    }
  }, [runs, compareFromId, compareToId]);

  const acceptedHistory = useMemo(() => {
    return runs
      .map((run) => {
        const attempt = run.attempts.find((entry) => entry.accepted);
        return attempt ? { run, attempt } : null;
      })
      .filter(Boolean)
      .slice(0, 8) as Array<{ run: GrAgentLoopRunRecord; attempt: GrAgentLoopAttemptAudit }>;
  }, [runs]);

  const failureBacklog = useMemo(() => {
    const failures = runs.flatMap((run) =>
      run.attempts
        .filter((attempt) => !attempt.pass || attempt.gateStatus !== "pass")
        .map((attempt) => ({ run, attempt })),
    );
    return failures.slice(0, 8);
  }, [runs]);

  const patchHistory = useMemo(() => {
    const patches = runs.flatMap((run) =>
      (run.patches ?? []).map((patch) => ({ run, patch })),
    );
    return patches.slice(0, 8);
  }, [runs]);

  const residualSeries = useMemo(() => {
    const base = RESIDUAL_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: [] as Array<number | undefined> }),
      {} as Record<ResidualKey, Array<number | undefined>>,
    );
    const chronological = [...runs].reverse();
    for (const run of chronological) {
      const acceptedAttempt = run.attempts.find((attempt) => attempt.accepted);
      if (!acceptedAttempt) continue;
      for (const key of RESIDUAL_KEYS) {
        base[key].push(acceptedAttempt.residuals?.[key]);
      }
    }
    return base;
  }, [runs]);

  const gateSeries = useMemo(() => {
    const chronological = [...runs].reverse();
    return chronological.flatMap((run) =>
      run.attempts.map((attempt) =>
        attempt.gateStatus === "pass" ? 1 : attempt.gateStatus === "unknown" ? 0.5 : 0,
      ),
    );
  }, [runs]);

  const gateSpark = buildSparkline(gateSeries);
  const gatePassRate =
    gateSeries.length > 0
      ? `${((gateSeries.filter((value) => value === 1).length / gateSeries.length) * 100).toFixed(1)}%`
      : "n/a";

  const compareRuns = useMemo(() => {
    const from = runs.find((run) => run.id === compareFromId) ?? null;
    const to = runs.find((run) => run.id === compareToId) ?? null;
    const fromAttempt = from ? selectPrimaryAttempt(from) : null;
    const toAttempt = to ? selectPrimaryAttempt(to) : null;
    const paramChanges = diffParams(fromAttempt?.params, toAttempt?.params);
    const residualChanges = RESIDUAL_KEYS.map((key) => {
      const fromVal = fromAttempt?.residuals?.[key];
      const toVal = toAttempt?.residuals?.[key];
      const delta =
        Number.isFinite(fromVal) && Number.isFinite(toVal)
          ? (toVal as number) - (fromVal as number)
          : undefined;
      return { key, fromVal, toVal, delta };
    });
    return { from, to, fromAttempt, toAttempt, paramChanges, residualChanges };
  }, [runs, compareFromId, compareToId]);

  return (
    <div className="h-full w-full overflow-auto bg-slate-950/80 p-4 text-slate-100">
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            <span>GR Loop Learning</span>
            <Badge variant="outline" className="text-[10px]">
              {isFetching ? "refreshing" : "live"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Failure backlog, patch ladder, comparison view, and accepted config history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="text-[11px] text-rose-300">
              Failed to load GR agent loop learning data.
            </div>
          ) : runs.length === 0 ? (
            <div className="text-[11px] text-slate-500">No GR agent loop runs yet.</div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-500">
                    <span>Residual trends (accepted)</span>
                    <Badge variant="outline" className="text-[9px] uppercase">
                      {acceptedHistory.length} runs
                    </Badge>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {RESIDUAL_KEYS.map((key) => {
                      const cleaned = residualSeries[key].filter(
                        (value): value is number => Number.isFinite(value),
                      );
                      const sparkline = buildSparkline(cleaned);
                      const last = cleaned.length ? cleaned[cleaned.length - 1] : undefined;
                      return (
                        <div
                          key={key}
                          className="rounded border border-slate-800/70 bg-slate-900/60 px-3 py-2"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{key}</span>
                            <span className="font-mono text-slate-200">
                              {formatResidualValue(last)}
                            </span>
                          </div>
                          {sparkline ? (
                            <svg
                              viewBox="0 0 140 30"
                              className="mt-2 h-7 w-full text-cyan-300"
                              role="img"
                              aria-label={`${key} residual trend`}
                            >
                              <path d={sparkline.path} fill="none" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          ) : (
                            <div className="mt-2 text-[10px] text-slate-500">No data</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-500">
                    <span>Gate trend</span>
                    <Badge variant="outline" className="text-[9px] uppercase">
                      pass {gatePassRate}
                    </Badge>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Attempts tracked: {gateSeries.length}
                  </div>
                  {gateSpark ? (
                    <svg
                      viewBox="0 0 140 30"
                      className="mt-3 h-7 w-full text-emerald-300"
                      role="img"
                      aria-label="gate pass trend"
                    >
                      <path d={gateSpark.path} fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ) : (
                    <div className="mt-3 text-[10px] text-slate-500">No gate data</div>
                  )}
                  <div className="mt-3 rounded border border-slate-800/60 bg-slate-900/60 p-2 text-[10px] text-slate-400">
                    Green runs indicate gate pass; yellow marks unknown; red marks fail.
                  </div>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Accepted config history
                  </div>
                  <div className="mt-2 space-y-2 font-mono text-[10px] text-slate-300">
                    {acceptedHistory.length === 0 ? (
                      <div className="text-slate-500">No accepted runs.</div>
                    ) : (
                      acceptedHistory.map(({ run, attempt }) => (
                        <div key={run.id} className="space-y-1 rounded border border-slate-800/60 bg-slate-900/60 p-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-400">#{run.seq}</span>
                            <span className="text-emerald-300">accepted</span>
                            <span className="text-slate-500">{formatDurationMs(run.durationMs)}</span>
                            <span className="text-slate-500">{formatTimestamp(run.ts)}</span>
                            <span className="text-slate-500">gate {attempt.gateStatus}</span>
                          </div>
                          <div className="text-slate-200">{formatParamsSummary(attempt.params)}</div>
                          <div className="text-slate-500">
                            cert {attempt.certificateStatus}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Failure backlog
                  </div>
                  <div className="mt-2 space-y-2 font-mono text-[10px] text-slate-300">
                    {failureBacklog.length === 0 ? (
                      <div className="text-slate-500">No failures tracked.</div>
                    ) : (
                      failureBacklog.map(({ run, attempt }, index) => (
                        <div
                          key={`${run.id}-${attempt.iteration}-${index}`}
                          className="rounded border border-slate-800/60 bg-slate-900/60 p-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-400">#{run.seq}</span>
                            <span className="text-rose-300">iter {attempt.iteration}</span>
                            <span className="text-slate-500">{formatTimestamp(run.ts)}</span>
                            <span className="text-slate-500">gate {attempt.gateStatus}</span>
                          </div>
                          <div className="text-slate-400">
                            H_rms {formatResidualValue(attempt.residuals?.H_rms)} | M_rms{" "}
                            {formatResidualValue(attempt.residuals?.M_rms)}
                          </div>
                          <div className="text-slate-500">
                            {formatParamsSummary(attempt.params)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Patch ladder
                  </div>
                  <div className="mt-2 space-y-2 font-mono text-[10px] text-slate-300">
                    {patchHistory.length === 0 ? (
                      <div className="text-slate-500">No patch history yet.</div>
                    ) : (
                      patchHistory.map(({ run, patch }, index) => (
                        <div
                          key={`${run.id}-${patch.fromIteration}-${patch.toIteration}-${index}`}
                          className="rounded border border-slate-800/60 bg-slate-900/60 p-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-400">#{run.seq}</span>
                            <span className="text-slate-500">
                              iter {patch.fromIteration} {"->"} {patch.toIteration}
                            </span>
                            <span className={patch.accepted ? "text-emerald-300" : "text-amber-300"}>
                              {patch.accepted ? "accepted" : "adjusted"}
                            </span>
                          </div>
                          <div className="mt-1 space-y-1 text-slate-400">
                            {patch.changes.slice(0, 3).map((change) => (
                              <div key={`${run.id}-${patch.fromIteration}-${change.key}`}>
                                {formatParamChange(change)}
                              </div>
                            ))}
                            {patch.changes.length > 3 ? (
                              <div className="text-slate-500">
                                +{patch.changes.length - 3} more changes
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Run comparison
                  </div>
                  <div className="mt-2 grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
                    <label className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">
                        From
                      </div>
                      <select
                        value={compareFromId}
                        onChange={(event) => setCompareFromId(event.target.value)}
                        className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                      >
                        {runs.map((run) => (
                          <option key={run.id} value={run.id}>
                            #{run.seq} {run.accepted ? "accepted" : "rejected"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">
                        To
                      </div>
                      <select
                        value={compareToId}
                        onChange={(event) => setCompareToId(event.target.value)}
                        className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                      >
                        {runs.map((run) => (
                          <option key={run.id} value={run.id}>
                            #{run.seq} {run.accepted ? "accepted" : "rejected"}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {compareRuns.from && compareRuns.to ? (
                    <div className="mt-3 space-y-2 font-mono text-[10px] text-slate-300">
                      <div className="flex flex-wrap items-center gap-2 text-slate-400">
                        <span>#{compareRuns.from.seq}</span>
                        <span>{compareRuns.from.accepted ? "accepted" : "rejected"}</span>
                        <span>{formatDurationMs(compareRuns.from.durationMs)}</span>
                        <span>{formatTimestamp(compareRuns.from.ts)}</span>
                        <span>{"->"}</span>
                        <span>#{compareRuns.to.seq}</span>
                        <span>{compareRuns.to.accepted ? "accepted" : "rejected"}</span>
                        <span>{formatDurationMs(compareRuns.to.durationMs)}</span>
                        <span>{formatTimestamp(compareRuns.to.ts)}</span>
                      </div>
                      <div className="rounded border border-slate-800/60 bg-slate-900/60 p-2">
                        <div className="text-[10px] uppercase tracking-wide text-slate-500">
                          Residual delta
                        </div>
                        <div className="mt-1 space-y-1 text-slate-400">
                          {compareRuns.residualChanges.map((entry) => (
                            <div key={entry.key}>
                              {entry.key}: {formatResidualValue(entry.fromVal)} {"->"}{" "}
                              {formatResidualValue(entry.toVal)}
                              {typeof entry.delta === "number"
                                ? ` (${entry.delta >= 0 ? "+" : ""}${entry.delta.toFixed(4)})`
                                : ""}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded border border-slate-800/60 bg-slate-900/60 p-2">
                        <div className="text-[10px] uppercase tracking-wide text-slate-500">
                          Param changes
                        </div>
                        {compareRuns.paramChanges.length === 0 ? (
                          <div className="mt-1 text-slate-500">No param changes.</div>
                        ) : (
                          <div className="mt-1 space-y-1 text-slate-400">
                            {compareRuns.paramChanges.slice(0, 6).map((change) => (
                              <div key={change.key}>{formatParamChange(change)}</div>
                            ))}
                            {compareRuns.paramChanges.length > 6 ? (
                              <div className="text-slate-500">
                                +{compareRuns.paramChanges.length - 6} more changes
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-[11px] text-slate-500">
                      Select runs to compare.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
