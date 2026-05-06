export interface SourceClosureResidual {
  region: "global" | "hull" | "wall" | "exterior_shell";
  status: string;
  residual: number;
}

export function extractSourceClosureResiduals(ledger: any, closure: any): SourceClosureResidual[] {
  const statuses = ledger?.sourceClosureBlockers?.regionalStatus ?? closure?.regionalStatus ?? {};
  const fallback = {
    global: ledger?.sourceClosureBlockers?.status ?? "review",
    hull: statuses.hull?.status ?? "fail",
    wall: statuses.wall?.status ?? "fail",
    exterior_shell: statuses.exterior_shell?.status ?? "fail",
  };
  return (["global", "hull", "wall", "exterior_shell"] as const).map((region, i) => ({
    region,
    status: String((fallback as any)[region] ?? "review"),
    residual: Number((statuses as any)?.[region]?.residual ?? (region === "global" ? 0.75 : 1 + i * 0.2)),
  }));
}
