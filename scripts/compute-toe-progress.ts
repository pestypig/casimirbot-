import fs from "node:fs";
import path from "node:path";

type BacklogTicket = {
  id?: string;
};

type Backlog = {
  schema_version?: string;
  tickets?: BacklogTicket[];
};

type TicketResult = {
  schema_version?: string;
  ticket_id?: string;
  claim_tier?: string;
  casimir?: {
    verdict?: string;
    integrity_ok?: boolean;
  };
};

type TierKey = "diagnostic" | "reduced-order" | "certified";

const BACKLOG_PATH = path.resolve(
  "docs",
  "audits",
  "toe-cloud-agent-ticket-backlog-2026-02-17.json",
);
const RESULTS_DIR = path.resolve("docs", "audits", "ticket-results");
const SNAPSHOT_PATH = path.resolve("docs", "audits", "toe-progress-snapshot.json");

const TIER_WEIGHTS: Record<TierKey, number> = {
  diagnostic: 0.25,
  "reduced-order": 0.6,
  certified: 1.0,
};

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function listTicketResultJsonFiles(): string[] {
  if (!fs.existsSync(RESULTS_DIR)) return [];
  return fs
    .readdirSync(RESULTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => path.join(RESULTS_DIR, entry.name))
    .sort();
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function toTier(value?: string): TierKey | null {
  if (value === "diagnostic" || value === "reduced-order" || value === "certified") {
    return value;
  }
  return null;
}

function toProgressPercent(value: number): number {
  return Math.round(value * 1000) / 10;
}

function main() {
  if (!fs.existsSync(BACKLOG_PATH)) {
    throw new Error(`Backlog file missing: ${BACKLOG_PATH}`);
  }

  const backlog = readJson<Backlog>(BACKLOG_PATH);
  if (backlog.schema_version !== "toe_cloud_ticket_backlog/1") {
    throw new Error(
      `Unexpected backlog schema_version: ${String(backlog.schema_version)}`,
    );
  }

  const ticketIds = (backlog.tickets ?? [])
    .map((ticket) => ticket.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (ticketIds.length === 0) {
    throw new Error("No tickets found in backlog.");
  }

  const latestByTicket = new Map<
    string,
    {
      filePath: string;
      mtimeMs: number;
      result: TicketResult;
    }
  >();

  for (const filePath of listTicketResultJsonFiles()) {
    let parsed: TicketResult;
    try {
      parsed = readJson<TicketResult>(filePath);
    } catch {
      continue;
    }
    if (parsed.schema_version !== "toe_agent_ticket_result/1") continue;
    if (typeof parsed.ticket_id !== "string" || parsed.ticket_id.length === 0) continue;
    const stat = fs.statSync(filePath);
    const current = latestByTicket.get(parsed.ticket_id);
    if (!current || stat.mtimeMs > current.mtimeMs) {
      latestByTicket.set(parsed.ticket_id, {
        filePath,
        mtimeMs: stat.mtimeMs,
        result: parsed,
      });
    }
  }

  const claimTierCounts: Record<TierKey, number> = {
    diagnostic: 0,
    "reduced-order": 0,
    certified: 0,
  };

  let weightedScoreSum = 0;
  let ticketsWithEvidence = 0;
  let strictReadyCount = 0;

  const tickets = ticketIds.map((ticketId) => {
    const latest = latestByTicket.get(ticketId);
    if (!latest) {
      return {
        ticket_id: ticketId,
        claim_tier: null,
        verification_ok: false,
        score: 0,
        result_file: null,
      };
    }

    const claimTier = toTier(latest.result.claim_tier);
    const verificationOk =
      latest.result.casimir?.verdict === "PASS" &&
      latest.result.casimir?.integrity_ok === true;
    const score = claimTier && verificationOk ? TIER_WEIGHTS[claimTier] : 0;

    if (claimTier) {
      claimTierCounts[claimTier] += 1;
    }
    if (score > 0) {
      ticketsWithEvidence += 1;
    }
    if (
      verificationOk &&
      (claimTier === "reduced-order" || claimTier === "certified")
    ) {
      strictReadyCount += 1;
    }

    weightedScoreSum += score;
    return {
      ticket_id: ticketId,
      claim_tier: claimTier,
      verification_ok: verificationOk,
      score,
      result_file: normalizePath(path.relative(process.cwd(), latest.filePath)),
    };
  });

  const totalTickets = ticketIds.length;
  const normalizedProgress = weightedScoreSum / totalTickets;
  const strictReadyProgress = strictReadyCount / totalTickets;

  const snapshot = {
    schema_version: "toe_progress_snapshot/1",
    generated_at: new Date().toISOString(),
    source: {
      backlog: normalizePath(path.relative(process.cwd(), BACKLOG_PATH)),
      results_dir: normalizePath(path.relative(process.cwd(), RESULTS_DIR)),
    },
    weights: TIER_WEIGHTS,
    totals: {
      tickets_total: totalTickets,
      tickets_with_evidence: ticketsWithEvidence,
      claim_tier_counts: claimTierCounts,
      weighted_score_sum: Math.round(weightedScoreSum * 1000) / 1000,
      toe_progress_pct: toProgressPercent(normalizedProgress),
      strict_ready_progress_pct: toProgressPercent(strictReadyProgress),
    },
    tickets,
  };

  fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  console.log(
    `toe-progress snapshot written: ${normalizePath(path.relative(process.cwd(), SNAPSHOT_PATH))} toe_progress_pct=${snapshot.totals.toe_progress_pct}`,
  );
}

main();
