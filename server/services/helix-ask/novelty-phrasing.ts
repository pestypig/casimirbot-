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
  const hash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        slot,
        family: ctx.family,
        prompt: ctx.prompt,
        seed: Number.isFinite(ctx.seed as number) ? ctx.seed : null,
        temperature: Number.isFinite(ctx.temperature as number) ? ctx.temperature : null,
        promptFingerprint: ctx.promptFingerprint ?? null,
        intentStrategy: ctx.family === "relation" ? ctx.intentStrategy ?? null : null,
        topCitationTokenHash: ctx.family === "relation" ? ctx.topCitationTokenHash ?? null : null,
        answerPathKey: ctx.family === "relation" ? ctx.answerPathKey ?? null : null,
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
    ], args.context, "relation_mechanism");
  }
  if (args.context.family === "repo_technical") {
    return choose([
      `Mechanism: ${args.claimA} -> file-level control flow and validators constrain execution paths -> ${args.claimB}, because module boundaries and contracts in ${args.evidenceTarget} govern runtime behavior.`,
      `Mechanism: ${args.claimA} -> repository wiring (routes, services, and gates) propagates state transitions -> ${args.claimB}, because path-scoped checks in ${args.evidenceTarget} enforce the observed outcome.`,
      `Mechanism: ${args.claimA} -> call-chain handoff across cited files applies deterministic guards -> ${args.claimB}, because implementation contracts in ${args.evidenceTarget} bound what the system can emit.`,
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
    ],
    args.context,
    "relation_detail_variant",
  );
  return { placement, line };
};
