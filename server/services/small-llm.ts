import type { EssenceProfileSummaryResult } from "@shared/inferenceProfile";
import type { ProposalPromptPreset } from "@shared/proposals";

const SMALL_MODEL = () => (process.env.SMALL_LLM_MODEL ?? "llama3.2:3b").trim();
const SMALL_BASE = () => (process.env.SMALL_LLM_URL ?? "http://127.0.0.1:11434").replace(/\/+$/, "");

const getFetch = async (): Promise<typeof fetch> => {
  if (typeof fetch === "function") {
    return fetch;
  }
  const mod = await import("node-fetch");
  return (mod.default ?? mod) as unknown as typeof fetch;
};

const requireConfig = () => {
  const base = SMALL_BASE();
  const model = SMALL_MODEL();
  if (!base || !model) {
    throw new Error("small_llm_unconfigured");
  }
  return { base, model };
};

const parseJson = <T>(text: string): T => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const slice = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  return JSON.parse(slice) as T;
};

async function callSmallLlm<T>(system: string, user: string): Promise<T> {
  const { base, model } = requireConfig();
  const fetch = await getFetch();
  const endpoint = base.includes("/api/") ? base : `${base}/api/chat`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      options: { temperature: 0.15 },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`small_llm_failed:${response.status}`);
  }
  const payload = (await response.json()) as any;
  const text = payload?.message?.content ?? payload?.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new Error("small_llm_empty");
  }
  return parseJson<T>(text.trim());
}

export interface CallSpecTriageInput {
  currentChat: string;
  currentPageContext?: string;
  existingResourceHints?: string[];
}

export interface CallSpecTriageOutput {
  intentTags: string[];
  resourceHints: string[];
  confidence: number;
}

export async function smallLlmCallSpecTriage(input: CallSpecTriageInput): Promise<CallSpecTriageOutput> {
  const system = [
    "You are a fast triage assistant for a call_spec builder.",
    "Label the user's intent and suggest resource hints ordered by relevance.",
    "Return JSON: { intentTags: string[], resourceHints: string[], confidence: number }.",
  ].join(" ");
  const user = [
    `chat: ${input.currentChat}`,
    input.currentPageContext ? `page: ${input.currentPageContext}` : "",
    input.existingResourceHints && input.existingResourceHints.length
      ? `existing_hints: ${input.existingResourceHints.join(", ")}`
      : "",
    "Answer with compact tags (plan, panel, knowledge, repo_deep, warp_physics, debugging, telemetry).",
  ]
    .filter(Boolean)
    .join("\n");
  return callSmallLlm<CallSpecTriageOutput>(system, user);
}

export interface CollapseCandidate {
  id: string;
  summary: string;
}

export interface CollapseChooserResult {
  chosenId: string;
  scores: { id: string; score: number; reason: string }[];
}

export async function smallLlmCollapseChooser(
  goalDescription: string,
  candidates: CollapseCandidate[],
): Promise<CollapseChooserResult> {
  const system = [
    "You choose the best collapse candidate for a planner.",
    "Score each candidate 0-1 and pick the highest for the goal.",
    'Return JSON: { chosenId, scores: [{ id, score, reason }] }.',
  ].join(" ");
  const user = [`goal: ${goalDescription}`, "candidates:", ...candidates.map((c, idx) => `${idx + 1}. ${c.id}: ${c.summary}`)].join(
    "\n",
  );
  return callSmallLlm<CollapseChooserResult>(system, user);
}

export interface EvidenceItem {
  id: string;
  snippet: string;
  path?: string;
}

export interface EvidenceRankingResult {
  ranked: { id: string; score: number; reason: string }[];
}

export async function smallLlmRankEvidence(
  goalDescription: string,
  items: EvidenceItem[],
): Promise<EvidenceRankingResult> {
  const system = [
    "Rank evidence snippets for usefulness toward the goal.",
    "Prefer precise, grounded snippets and repo/doc paths.",
    'Return JSON: { ranked: [{ id, score, reason }] } with score 0-1.',
  ].join(" ");
  const user = [`goal: ${goalDescription}`, "evidence:", ...items.map((i) => `- ${i.id} (${i.path ?? "n/a"}): ${i.snippet}`)].join(
    "\n",
  );
  return callSmallLlm<EvidenceRankingResult>(system, user);
}

export interface ProposalLite {
  id: string;
  title: string;
  summary?: string;
  kind: string;
}

export interface ProposalSortingResult {
  ranked: { id: string; score: number; reason: string }[];
}

export async function smallLlmSortProposalsForGoal(
  goalDescription: string,
  profileSummary: EssenceProfileSummaryResult | null,
  proposals: ProposalLite[],
): Promise<ProposalSortingResult> {
  const system = [
    "Sort proposals by relevance to the current goal and profile signals.",
    "Reward alignment with focus_areas, aspirations, and rhythm/sustainability hints.",
    'Return JSON: { ranked: [{ id, score, reason }] } with score 0-1.',
  ].join(" ");
  const profileText = profileSummary ? JSON.stringify(profileSummary).slice(0, 800) : "none";
  const user = [
    `goal: ${goalDescription}`,
    `profile_summary: ${profileText}`,
    "proposals:",
    ...proposals.map((p) => `- ${p.id} [${p.kind}] ${p.title} :: ${p.summary ?? ""}`),
  ].join("\n");
  return callSmallLlm<ProposalSortingResult>(system, user);
}

export interface TelemetryHint {
  id: string;
  text: string;
  path?: string;
}

export interface TelemetryHintResult {
  ranked: { id: string; score: number; reason: string }[];
}

export async function smallLlmHintTelemetry(
  goalDescription: string,
  telemetry: TelemetryHint[],
): Promise<TelemetryHintResult> {
  const system = [
    "Pick telemetry/doc snippets that best support the goal.",
    "Reward concrete metrics or paths; penalize vague strings.",
    'Return JSON: { ranked: [{ id, score, reason }] }.',
  ].join(" ");
  const user = [
    `goal: ${goalDescription}`,
    "telemetry:",
    ...telemetry.map((t) => `- ${t.id} (${t.path ?? "n/a"}): ${t.text}`),
  ].join("\n");
  return callSmallLlm<TelemetryHintResult>(system, user);
}

export interface ProfileSignalExtractionResult {
  aspirationTags: string[];
  focusTags: string[];
  toneTags: string[];
}

export async function smallLlmExtractProfileSignals(
  chatSnippets: string[],
): Promise<ProfileSignalExtractionResult> {
  const system = [
    "Extract lightweight profile tags from chat snippets.",
    "Prefer actionable tags over emotions.",
    'Return JSON: { aspirationTags: string[], focusTags: string[], toneTags: string[] }.',
  ].join(" ");
  const user = chatSnippets.slice(0, 12).join("\n---\n");
  return callSmallLlm<ProfileSignalExtractionResult>(system, user);
}

export interface PatchPromptPresetResult {
  presets: ProposalPromptPreset[];
  note?: string;
}

export async function smallLlmPatchPromptPresets(input: {
  basePrompt: string;
  proposalTitle?: string;
  repoContext: string;
  targetPaths?: string[];
  limit?: number;
}): Promise<PatchPromptPresetResult> {
  const system = [
    "You craft a handful of preset prompts for patch proposals.",
    "Preserve the base framework while weaving in the repo call points.",
    "Return JSON: { presets: [{ id, label, prompt, context, updatedAt }], note? }.",
    "Avoid inventing file paths; keep prompts concise and actionable.",
  ].join(" ");
  const user = [
    `proposal: ${input.proposalTitle ?? "unknown"}`,
    `target_paths: ${(input.targetPaths ?? []).join(", ") || "n/a"}`,
    `base_prompt: """${input.basePrompt}"""`,
    "repo_context:",
    input.repoContext || "no_recent_context",
    `limit: ${input.limit ?? 3}`,
    "Tailor the presets to drive warp/physics patch work (MD/pipeline/telemetry).",
  ].join("\n");
  const result = await callSmallLlm<PatchPromptPresetResult>(system, user);
  const limit = input.limit ?? 3;
  const now = new Date().toISOString();
  const presets = Array.isArray(result?.presets) ? result.presets : [];
  const normalized = presets.slice(0, limit).map((preset, idx) => ({
    id: preset.id && preset.id.trim() ? preset.id : `preset-${idx + 1}`,
    label: preset.label && preset.label.trim() ? preset.label : `Preset ${idx + 1}`,
    prompt: preset.prompt,
    context: preset.context ?? "",
    updatedAt: preset.updatedAt ?? now,
  }));
  return { presets: normalized, note: result?.note };
}
