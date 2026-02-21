import crypto from "node:crypto";

export type HelixAskNoveltyFamily = "relation" | "repo_technical" | "other";

export type HelixAskNoveltyContext = {
  family: HelixAskNoveltyFamily;
  prompt: string;
  seed?: number | null;
  temperature?: number | null;
  promptFingerprint?: string | null;
  intentStrategy?: string | null;
  topCitationTokenHash?: string | null;
  answerPathKey?: string | null;
  relationPacketSignal?: string | null;
};

const pickDeterministic = (count: number, ctx: HelixAskNoveltyContext, slot: string): number => {
  if (count <= 1) return 0;
  const targetedFamily = ctx.family === "relation" || ctx.family === "repo_technical";
  const promptFingerprint =
    ctx.promptFingerprint ?? crypto.createHash("sha1").update(ctx.prompt).digest("hex").slice(0, 16);
  const hash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        slot,
        family: ctx.family,
        prompt: ctx.prompt,
        seed: Number.isFinite(ctx.seed as number) ? ctx.seed : null,
        temperature: Number.isFinite(ctx.temperature as number) ? ctx.temperature : null,
        promptFingerprint,
        intentStrategy: targetedFamily ? ctx.intentStrategy ?? null : null,
        topCitationTokenHash: targetedFamily ? ctx.topCitationTokenHash ?? null : null,
        answerPathKey: targetedFamily ? ctx.answerPathKey ?? null : null,
        relationPacketSignal: ctx.family === "relation" ? ctx.relationPacketSignal ?? null : null,
      }),
    )
    .digest("hex");
  return parseInt(hash.slice(0, 8), 16) % count;
};

const choose = (variants: readonly string[], ctx: HelixAskNoveltyContext, slot: string): string =>
  variants[pickDeterministic(variants.length, ctx, slot)] ?? variants[0] ?? "";

export const resolveHelixAskNoveltyFamily = (args: {
  intentProfileId?: string | null;
  intentDomain?: string | null;
  question: string;
}): HelixAskNoveltyFamily => {
  if (args.intentProfileId === "hybrid.warp_ethos_relation") return "relation";
  if ((args.intentDomain ?? "").toLowerCase() === "repo") return "repo_technical";
  if (/\b(relate|relation|warp\s+.*ethos|ethos\s+.*warp|bridge)\b/i.test(args.question)) return "relation";
  if (/\b(repo|codebase|file|path|module|function|test)\b/i.test(args.question)) return "repo_technical";
  return "other";
};

export const buildHelixAskMechanismSentence = (args: {
  claimA: string;
  claimB: string;
  evidenceTarget: string;
  context: HelixAskNoveltyContext;
}): string => {
  if (args.context.family === "relation") {
    return choose([
      `Mechanism: ${args.claimA} -> bridge constraints between warp dynamics and mission-ethos policy checks -> ${args.claimB}, because governance guardrails shape how technical options are allowed to evolve around ${args.evidenceTarget}.`,
      `Mechanism: ${args.claimA} -> coupling between warp feasibility signals and ethos stewardship rules -> ${args.claimB}, because safety doctrine and field constraints co-determine admissible behavior around ${args.evidenceTarget}.`,
      `Mechanism: ${args.claimA} -> warp-model limits are filtered through ethos veto/approval pathways -> ${args.claimB}, because policy discipline changes which physics-adjacent actions remain valid near ${args.evidenceTarget}.`,
      `Mechanism: ${args.claimA} -> admissibility constraints and ideology governance cross-check each decision edge -> ${args.claimB}, because mission risk controls must stay synchronized with evidence in ${args.evidenceTarget}.`,
      `Mechanism: ${args.claimA} -> safety posture translates field-level uncertainty into governance stop/go signals -> ${args.claimB}, because relation packets tie policy authority to citations from ${args.evidenceTarget}.`,
      `Mechanism: ${args.claimA} -> ideology tree traversal constrains which warp assertions can be promoted -> ${args.claimB}, because root-to-leaf guards require evidence-linked stewardship checks in ${args.evidenceTarget}.`,
      `Mechanism: ${args.claimA} -> relation packet bridge claims mediate between field limits and doctrine intent -> ${args.claimB}, because answer-path gates keep policy and physics traces synchronized against ${args.evidenceTarget}.`,
    ], args.context, "relation_mechanism");
  }
  if (args.context.family === "repo_technical") {
    return choose([
      `Mechanism: ${args.claimA} -> file-level control flow and validators constrain execution paths -> ${args.claimB}, because module boundaries and contracts in ${args.evidenceTarget} govern runtime behavior.`,
      `Mechanism: ${args.claimA} -> repository wiring (routes, services, and gates) propagates state transitions -> ${args.claimB}, because path-scoped checks in ${args.evidenceTarget} enforce the observed outcome.`,
      `Mechanism: ${args.claimA} -> call-chain handoff across cited files applies deterministic guards -> ${args.claimB}, because implementation contracts in ${args.evidenceTarget} bound what the system can emit.`,
      `Mechanism: ${args.claimA} -> deterministic adapter + validator sequencing controls what leaves the route -> ${args.claimB}, because citation-gated branches in ${args.evidenceTarget} narrow admissible render outputs.`,
      `Mechanism: ${args.claimA} -> answer-contract assembly stitches repo evidence into stable section slots -> ${args.claimB}, because synthesis formatting in ${args.evidenceTarget} enforces grounded, replay-safe responses.`,
    ], args.context, "repo_mechanism");
  }
  return `Mechanism: ${args.claimA} -> constrained interaction dynamics -> ${args.claimB}, because linked constraints amplify or dampen outcomes over time.`;
};

export const getHelixAskSectionOrder = (ctx: HelixAskNoveltyContext): Array<"summary" | "details" | "mechanism" | "maturity" | "missing"> => {
  if (ctx.family === "other") return ["summary", "details", "mechanism", "maturity", "missing"];
  if (ctx.family === "relation") {
    const relationVariants: Array<Array<"summary" | "details" | "mechanism" | "maturity" | "missing">> = [
      ["summary", "details", "mechanism", "maturity", "missing"],
      ["summary", "mechanism", "details", "maturity", "missing"],
      ["summary", "details", "maturity", "mechanism", "missing"],
      ["summary", "maturity", "details", "mechanism", "missing"],
      ["summary", "mechanism", "maturity", "details", "missing"],
      ["summary", "details", "mechanism", "missing", "maturity"],
    ];
    return relationVariants[pickDeterministic(relationVariants.length, ctx, "section_order_relation")] ?? relationVariants[0];
  }
  const variants: Array<Array<"summary" | "details" | "mechanism" | "maturity" | "missing">> = [
    ["summary", "details", "mechanism", "maturity", "missing"],
    ["summary", "mechanism", "details", "maturity", "missing"],
    ["summary", "details", "maturity", "mechanism", "missing"],
  ];
  return variants[pickDeterministic(variants.length, ctx, "section_order")] ?? variants[0];
};

export const buildHelixAskRelationDetailBlock = (args: {
  context: HelixAskNoveltyContext;
  evidenceTarget: string;
}): { placement: "before_mechanism" | "after_mechanism"; line: string } => {
  const placement =
    pickDeterministic(2, args.context, "relation_detail_placement") === 0
      ? "before_mechanism"
      : "after_mechanism";
  const line = choose(
    [
      `Relation detail: constraint budgets bound which warp options can be argued as ethical, so admissibility limits are paired with policy obligations from ${args.evidenceTarget}.`,
      `Relation detail: governance review is not narrative-only; it acts as an execution gate that accepts or blocks field proposals based on cited safety constraints in ${args.evidenceTarget}.`,
      `Relation detail: safety linkage runs both directions-physics uncertainty increases governance caution, while mission policy narrows technically legal moves documented in ${args.evidenceTarget}.`,
      `Relation detail: bridge semantics stay dual-domain by mapping each mission claim to a bounded physics condition and each physics option to a stewardship rule sourced from ${args.evidenceTarget}.`,
      `Relation detail: root ideology branches to leaf practices so each policy sentence can be traced back to a governing axiom and forward to a warp constraint in ${args.evidenceTarget}.`,
      `Relation detail: answer-path guards require the relation packet to keep ethics and feasibility claims paired, preventing unsupported cross-domain leaps beyond ${args.evidenceTarget}.`,
    ],
    args.context,
    "relation_detail_variant",
  );
  return { placement, line };
};

export const applyHelixAskSummaryVariant = (summary: string, ctx: HelixAskNoveltyContext): string => {
  if (!summary.trim()) return summary;
  if (ctx.family !== "relation" && ctx.family !== "repo_technical") return summary;
  const leads =
    ctx.family === "relation"
      ? ["Cross-domain summary:", "Relation summary:", "Joint framing:"]
      : ["Repo summary:", "Implementation summary:", "System summary:"];
  const lead = choose(leads, ctx, `summary_lead_${ctx.family}`);
  if (new RegExp(`^${lead.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(summary)) {
    return summary;
  }
  return `${lead} ${summary}`;
};

export const applyHelixAskDetailsVariant = (details: string, ctx: HelixAskNoveltyContext): string => {
  if (!details.trim()) return details;
  if (ctx.family !== "relation" && ctx.family !== "repo_technical") return details;
  const leads =
    ctx.family === "relation"
      ? ["Evidence linkage:", "Bridge detail:", "Constraint mapping:"]
      : ["Execution detail:", "Code-path detail:", "Validator detail:"];
  const lead = choose(leads, ctx, `details_lead_${ctx.family}`);
  if (new RegExp(`^${lead.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(details)) {
    return details;
  }
  return `${lead} ${details}`;
};

export const getHelixAskCompareLabels = (
  ctx: HelixAskNoveltyContext,
): { what: string; why: string; constraint: string } => {
  if (ctx.family === "relation") {
    const relationLabels = [
      { what: "Relation anchor", why: "Coupling effect", constraint: "Stewardship bound" },
      { what: "Domain bridge", why: "Policy impact", constraint: "Falsifiability bound" },
      { what: "Cross-domain premise", why: "Operational consequence", constraint: "Governance limit" },
    ];
    return relationLabels[pickDeterministic(relationLabels.length, ctx, "compare_labels_relation")] ?? relationLabels[0];
  }
  if (ctx.family === "repo_technical") {
    const repoLabels = [
      { what: "Code anchor", why: "Runtime effect", constraint: "Gate condition" },
      { what: "Path anchor", why: "Execution consequence", constraint: "Validation bound" },
      { what: "Module role", why: "Observed behavior", constraint: "Contract limit" },
    ];
    return repoLabels[pickDeterministic(repoLabels.length, ctx, "compare_labels_repo")] ?? repoLabels[0];
  }
  return { what: "What it is", why: "Why it matters", constraint: "Constraint" };
};

const normalizeScaffoldLine = (line: string): string =>
  line
    .replace(/\s+/g, " ")
    .replace(/[,:;.!?()\[\]{}]/g, "")
    .trim()
    .toLowerCase();

export const reduceHelixAskScaffoldRepeats = (
  lines: string[],
  ctx: HelixAskNoveltyContext,
): string[] => {
  if (ctx.family !== "relation" && ctx.family !== "repo_technical") return lines;
  const seen = new Set<string>();
  const compact: string[] = [];
  for (const line of lines) {
    const key = normalizeScaffoldLine(line);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    compact.push(line);
  }
  return compact.length > 0 ? compact : lines;
};
